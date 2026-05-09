"use client";

/**
 * Browser-side strip sampler. Wraps a `<canvas>` and runs the pure math from
 * sampling-shared.ts against an arbitrary user-drawn ROI.
 *
 * Lighting normalization is deliberately minimal here — robustness comes from
 * the LLM second-pass on the server, not from clever client preprocessing.
 */

import type { ReferenceChart, RgbColor } from "../types";
import { buildClientReading, medianRgb } from "./sampling-shared";

export interface PadRoi {
  /** Fractional [0,1] coords inside the strip ROI (top→bottom). */
  readonly cy: number;
}

export interface StripRoi {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Sample one rectangular block centered on (cx, cy) of size (sw, sh) and
 * return the median RGB.
 */
export function sampleBlock(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sw: number,
  sh: number,
): RgbColor {
  const sx = Math.max(0, Math.round(cx - sw / 2));
  const sy = Math.max(0, Math.round(cy - sh / 2));
  const w = Math.max(1, Math.round(sw));
  const h = Math.max(1, Math.round(sh));
  const { data } = ctx.getImageData(sx, sy, w, h);
  return medianRgb(data);
}

/**
 * Sample an evenly-spaced column of pads down the vertical axis of a strip ROI.
 * Returns one RGB per analyte, in chart order (top of strip first).
 */
export function sampleStripPads(
  ctx: CanvasRenderingContext2D,
  roi: StripRoi,
  padCount: number,
  /** Sample window relative to the pad pitch, 0..1. 0.5 = middle half of each pad. */
  sampleWindow = 0.5,
): RgbColor[] {
  const pitch = roi.height / padCount;
  const sw = Math.max(4, Math.floor(roi.width * 0.6));
  const sh = Math.max(4, Math.floor(pitch * sampleWindow));
  const out: RgbColor[] = [];
  for (let i = 0; i < padCount; i++) {
    const cy = roi.y + (i + 0.5) * pitch;
    const cx = roi.x + roi.width / 2;
    out.push(sampleBlock(ctx, cx, cy, sw, sh));
  }
  return out;
}

export function sampleAndBuildReading(
  ctx: CanvasRenderingContext2D,
  roi: StripRoi,
  chart: ReferenceChart,
) {
  const padRgbs = sampleStripPads(ctx, roi, chart.analytes.length);
  return buildClientReading(chart, padRgbs);
}
