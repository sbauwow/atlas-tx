/**
 * Pure color math for the strip-photo prototype.
 *
 * Browser-safe — no Node imports, no DOM. Both the client (canvas pixel sampler)
 * and the server (test fixtures, future server-side sampling) consume this module.
 *
 * Distance metric: ΔE76 (Euclidean Lab). Adequate to distinguish coarse bands
 * across the 9-pad chart. ΔE2000 is the obvious upgrade if matching falls down
 * in the green/cyan region — defer until empirical evidence shows it's needed.
 */

import type {
  AnalyteDefinition,
  ClientReading,
  LabColor,
  PerAnalyteClientReading,
  ReferenceChart,
  RgbColor,
} from "../types";
import { OBSERVATION_SCHEMA_VERSION } from "../types";

// sRGB → linear RGB → CIE XYZ (D65) → CIE Lab (D65/2°)
// Reference whites for D65/2° per CIE.
const REF_X = 95.047;
const REF_Y = 100.0;
const REF_Z = 108.883;

function srgbToLinear(c: number): number {
  const cn = c / 255;
  return cn <= 0.04045 ? cn / 12.92 : ((cn + 0.055) / 1.055) ** 2.4;
}

function pivot(t: number): number {
  return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
}

export function rgbToLab([r, g, b]: RgbColor): LabColor {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  // sRGB → XYZ (D65)
  const x = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) * 100;
  const y = (lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175) * 100;
  const z = (lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041) * 100;

  const fx = pivot(x / REF_X);
  const fy = pivot(y / REF_Y);
  const fz = pivot(z / REF_Z);

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function deltaE76(a: LabColor, b: LabColor): number {
  const dl = a[0] - b[0];
  const da = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dl * dl + da * da + db * db);
}

/**
 * Channel-wise median of an RGBA pixel block (alpha ignored).
 * Median is more robust than mean against single specular pixels / dust.
 */
export function medianRgb(pixels: Uint8ClampedArray | number[]): RgbColor {
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  // Pixels arrive as a flat RGBA stream from CanvasRenderingContext2D.getImageData.
  for (let i = 0; i < pixels.length; i += 4) {
    rs.push(pixels[i]);
    gs.push(pixels[i + 1]);
    bs.push(pixels[i + 2]);
  }
  return [median(rs), median(gs), median(bs)];
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export interface BandMatch {
  readonly bandIndex: number;
  readonly distance: number;
  readonly distanceToRunnerUp: number;
}

/** Snap a sampled Lab triplet to the nearest band on a single analyte. */
export function matchBand(sampled: LabColor, analyte: AnalyteDefinition): BandMatch {
  if (analyte.bands.length === 0) {
    throw new Error(`Analyte ${analyte.id} has no bands`);
  }
  let best = 0;
  let bestDist = Infinity;
  let runnerUp = Infinity;
  for (let i = 0; i < analyte.bands.length; i++) {
    const d = deltaE76(sampled, analyte.bands[i].lab);
    if (d < bestDist) {
      runnerUp = bestDist;
      bestDist = d;
      best = i;
    } else if (d < runnerUp) {
      runnerUp = d;
    }
  }
  return {
    bandIndex: best,
    distance: bestDist,
    distanceToRunnerUp: runnerUp === Infinity ? bestDist : runnerUp,
  };
}

/**
 * Build a full client reading from per-pad sampled RGB triples (one per analyte).
 *
 * The caller is responsible for ordering `padRgbs` to match `chart.analytes`
 * and for any blank/reference normalization (subtracting in-frame reference
 * patches before calling — implementer's choice; the prototype uses the raw
 * sampled colors and falls back to LLM sanity-check for lighting drift).
 */
export function buildClientReading(
  chart: ReferenceChart,
  padRgbs: readonly RgbColor[],
): ClientReading {
  if (padRgbs.length !== chart.analytes.length) {
    throw new Error(
      `Pad count mismatch: chart expects ${chart.analytes.length}, got ${padRgbs.length}`,
    );
  }
  const perAnalyte: PerAnalyteClientReading[] = chart.analytes.map((analyte, i) => {
    const sampledLab = rgbToLab(padRgbs[i]);
    const match = matchBand(sampledLab, analyte);
    return {
      analyteId: analyte.id,
      bandIndex: match.bandIndex,
      distance: match.distance,
      distanceToRunnerUp: match.distanceToRunnerUp,
      sampledLab,
      sampledRgb: padRgbs[i],
    };
  });
  return {
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    chartId: chart.id,
    perAnalyte,
  };
}
