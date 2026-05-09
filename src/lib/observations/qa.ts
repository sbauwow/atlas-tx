import "server-only";

import sharp from "sharp";

import type { QaFlag } from "./types";

/**
 * Server-side image QA. Cheap, deterministic checks before we waste an LLM
 * call. See docs/research/smartphone-colorimetry.md §5.5 — every observation
 * must end in accepted / accepted-with-warning / rejected; QA flags drive
 * that decision in `decideStatus`.
 *
 * Heuristics (tunable):
 *   - blur:           variance of the Laplacian of luminance, < threshold ⇒ blurry
 *   - low-light:      mean luminance below threshold
 *   - saturation-clip: > 5% of pixels at 255 in any channel (specular highlights)
 *
 * "no-chart-detected" is intentionally NOT inferred at this stage — only the
 * LLM has the visual reasoning to verify a chart is in frame. We surface that
 * flag from the vision pass.
 */

export interface QaResult {
  readonly flags: readonly QaFlag[];
  readonly metrics: {
    readonly meanLuminance: number;
    readonly laplacianVariance: number;
    readonly saturationClipRatio: number;
  };
}

const BLUR_THRESHOLD = 100; // empirically: <100 looks blurry; tune with fixtures
const LOW_LIGHT_THRESHOLD = 40; // 0..255 mean luminance
const SATURATION_CLIP_RATIO_THRESHOLD = 0.05;

export async function runImageQa(buffer: Buffer): Promise<QaResult> {
  // Downscale to a fixed working size so the QA cost is bounded regardless of
  // upload resolution.
  const work = sharp(buffer).rotate().resize({ width: 512, withoutEnlargement: true });

  const { data: rgb, info } = await work
    .clone()
    .raw()
    .toColorspace("srgb")
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pxCount = width * height;

  let lumSum = 0;
  let satClipCount = 0;
  const lum = new Float32Array(pxCount);
  for (let i = 0, p = 0; i < rgb.length; i += channels, p++) {
    const r = rgb[i];
    const g = rgb[i + 1];
    const b = rgb[i + 2];
    // Rec. 709 luminance, fast and good enough.
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lum[p] = y;
    lumSum += y;
    if (r >= 254 || g >= 254 || b >= 254) satClipCount++;
  }
  const meanLuminance = lumSum / pxCount;
  const saturationClipRatio = satClipCount / pxCount;

  // Variance of a 3x3 Laplacian on the luminance plane.
  const lap = new Float32Array(pxCount);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const v =
        -lum[idx - width - 1] -
        lum[idx - width] -
        lum[idx - width + 1] -
        lum[idx - 1] +
        8 * lum[idx] -
        lum[idx + 1] -
        lum[idx + width - 1] -
        lum[idx + width] -
        lum[idx + width + 1];
      lap[idx] = v;
    }
  }
  let lapMean = 0;
  for (let i = 0; i < lap.length; i++) lapMean += lap[i];
  lapMean /= pxCount;
  let lapVar = 0;
  for (let i = 0; i < lap.length; i++) {
    const d = lap[i] - lapMean;
    lapVar += d * d;
  }
  lapVar /= pxCount;

  const flags: QaFlag[] = [];
  if (lapVar < BLUR_THRESHOLD) flags.push("blur");
  if (meanLuminance < LOW_LIGHT_THRESHOLD) flags.push("low-light");
  if (saturationClipRatio > SATURATION_CLIP_RATIO_THRESHOLD) flags.push("saturation-clip");

  return {
    flags,
    metrics: {
      meanLuminance,
      laplacianVariance: lapVar,
      saturationClipRatio,
    },
  };
}
