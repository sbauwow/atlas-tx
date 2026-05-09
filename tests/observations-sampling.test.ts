import { describe, expect, it } from "vitest";

import {
  buildClientReading,
  deltaE76,
  matchBand,
  medianRgb,
  rgbToLab,
} from "@/lib/observations/strips/sampling-shared";
import { GENERIC_9PAD_CHART } from "@/lib/observations/strips/reference-chart-9pad";
import type { LabColor, RgbColor } from "@/lib/observations/types";

describe("rgbToLab", () => {
  it("maps pure white to L≈100, a≈0, b≈0", () => {
    const [L, a, b] = rgbToLab([255, 255, 255]);
    expect(L).toBeCloseTo(100, 0);
    expect(a).toBeCloseTo(0, 0);
    expect(b).toBeCloseTo(0, 0);
  });

  it("maps pure black to L≈0", () => {
    const [L] = rgbToLab([0, 0, 0]);
    expect(L).toBeCloseTo(0, 1);
  });

  it("returns positive a* for red, negative a* for green", () => {
    const red = rgbToLab([220, 30, 30]);
    const green = rgbToLab([30, 200, 30]);
    expect(red[1]).toBeGreaterThan(20);
    expect(green[1]).toBeLessThan(-20);
  });
});

describe("deltaE76", () => {
  it("is 0 for identical colors and grows with separation", () => {
    const a: LabColor = [50, 0, 0];
    expect(deltaE76(a, a)).toBe(0);
    expect(deltaE76(a, [50, 10, 0])).toBeCloseTo(10);
    expect(deltaE76(a, [50, 0, 10])).toBeCloseTo(10);
  });
});

describe("medianRgb", () => {
  it("returns channel-wise median ignoring alpha", () => {
    // 3 RGBA pixels: red, mid-red, dark-red
    const data = new Uint8ClampedArray([
      255, 0, 0, 255,
      128, 0, 0, 255,
      0, 0, 0, 255,
    ]);
    expect(medianRgb(data)).toEqual([128, 0, 0]);
  });
});

describe("matchBand", () => {
  const ph = GENERIC_9PAD_CHART.analytes.find((a) => a.id === "ph")!;

  it("snaps a sampled Lab triple to the closest band", () => {
    // Use the exact Lab of band 2 (pH 7.2): expect a perfect match.
    const target = ph.bands[2].lab as LabColor;
    const m = matchBand(target, ph);
    expect(m.bandIndex).toBe(2);
    expect(m.distance).toBeCloseTo(0, 5);
    expect(m.distanceToRunnerUp).toBeGreaterThan(0);
  });

  it("picks a neighboring band when sample drifts toward it", () => {
    // Halfway between bands 0 and 1.
    const a = ph.bands[0].lab;
    const b = ph.bands[1].lab;
    const mid: LabColor = [
      (a[0] + b[0]) / 2 + 1,
      (a[1] + b[1]) / 2 + 1,
      (a[2] + b[2]) / 2 + 1,
    ];
    const m = matchBand(mid, ph);
    expect([0, 1]).toContain(m.bandIndex);
  });
});

describe("buildClientReading", () => {
  it("returns one perAnalyte entry per chart pad", () => {
    const padRgbs: RgbColor[] = GENERIC_9PAD_CHART.analytes.map((a) => {
      // Approximate Lab→RGB by going through a known band; we use the chart's
      // first band's Lab as if it were the sampled color, but we don't have a
      // Lab→RGB inverter here, so instead just feed [128,128,128] for each pad
      // and verify the structural shape. (Match correctness is covered above.)
      void a;
      return [128, 128, 128];
    });
    const reading = buildClientReading(GENERIC_9PAD_CHART, padRgbs);
    expect(reading.perAnalyte).toHaveLength(GENERIC_9PAD_CHART.analytes.length);
    expect(reading.chartId).toBe(GENERIC_9PAD_CHART.id);
    expect(reading.schemaVersion).toBe(1);
    for (const p of reading.perAnalyte) {
      expect(p.bandIndex).toBeGreaterThanOrEqual(0);
      expect(p.distance).toBeGreaterThanOrEqual(0);
    }
  });

  it("rejects mismatched pad counts", () => {
    expect(() => buildClientReading(GENERIC_9PAD_CHART, [[0, 0, 0]])).toThrow();
  });
});
