import { describe, expect, it } from "vitest";

import { __TEST_ONLY__ } from "@/lib/observations/comparison";
import { GENERIC_9PAD_CHART } from "@/lib/observations/strips/reference-chart-9pad";
import type { LlmReading } from "@/lib/observations/types";
import { OBSERVATION_SCHEMA_VERSION } from "@/lib/observations/types";

const { buildScope } = __TEST_ONLY__;

function reading(perAnalyte: Array<{ analyteId: string; bandIndex: number; confidence?: number }>): LlmReading {
  return {
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    chartId: GENERIC_9PAD_CHART.id,
    perAnalyte: perAnalyte.map((entry) => ({
      analyteId: entry.analyteId,
      bandIndex: entry.bandIndex,
      confidence: entry.confidence ?? 0.8,
    })),
    qaFlags: [],
  };
}

function row(slug: string | null, perAnalyte: Array<{ analyteId: string; bandIndex: number }>) {
  return { countySlug: slug, reading: reading(perAnalyte) };
}

describe("buildScope", () => {
  it("returns zero-distribution and empty mode when no other rows exist", () => {
    const yourReading = reading([{ analyteId: "ph", bandIndex: 2 }]);
    const scope = buildScope([], GENERIC_9PAD_CHART, yourReading);

    expect(scope.observationCount).toBe(0);
    expect(scope.perAnalyte).toHaveLength(1);
    const ph = scope.perAnalyte[0];
    expect(ph.totalCount).toBe(0);
    expect(ph.distribution.every((c) => c === 0)).toBe(true);
    expect(ph.distributionPercent.every((p) => p === 0)).toBe(true);
    expect(ph.modeBandIndex).toBeNull();
    expect(ph.smallSample).toBe(true);
    expect(ph.yourBandIndex).toBe(2);
    expect(ph.yourBandLabel).toBe(GENERIC_9PAD_CHART.analytes[0].bands[2].label);
  });

  it("computes percent distribution and mode for a populated scope", () => {
    const others = [
      row("travis-county", [{ analyteId: "ph", bandIndex: 2 }]),
      row("travis-county", [{ analyteId: "ph", bandIndex: 2 }]),
      row("travis-county", [{ analyteId: "ph", bandIndex: 3 }]),
      row("travis-county", [{ analyteId: "ph", bandIndex: 3 }]),
      row("travis-county", [{ analyteId: "ph", bandIndex: 3 }]),
      row("travis-county", [{ analyteId: "ph", bandIndex: 4 }]),
    ];
    const yourReading = reading([{ analyteId: "ph", bandIndex: 2 }]);
    const scope = buildScope(others, GENERIC_9PAD_CHART, yourReading);

    const ph = scope.perAnalyte[0];
    expect(ph.totalCount).toBe(6);
    expect(ph.distribution).toEqual([0, 0, 2, 3, 1]);
    expect(ph.distributionPercent[2]).toBeCloseTo(33.3, 1);
    expect(ph.distributionPercent[3]).toBeCloseTo(50, 1);
    expect(ph.modeBandIndex).toBe(3);
    expect(ph.yourPercentile).toBe(33); // bands 0..2 → 2 of 6 ≈ 33%
    expect(ph.smallSample).toBe(false);
  });

  it("ignores rows whose readings are for a different analyte", () => {
    const others = [
      row(null, [{ analyteId: "free_chlorine", bandIndex: 1 }]),
      row(null, [{ analyteId: "ph", bandIndex: 1 }]),
    ];
    const yourReading = reading([{ analyteId: "ph", bandIndex: 1 }]);
    const scope = buildScope(others, GENERIC_9PAD_CHART, yourReading);

    const ph = scope.perAnalyte[0];
    expect(ph.totalCount).toBe(1);
    expect(ph.distribution[1]).toBe(1);
  });

  it("clamps your band index to a valid label when out of range", () => {
    const yourReading = reading([{ analyteId: "ph", bandIndex: 99 }]);
    const scope = buildScope([], GENERIC_9PAD_CHART, yourReading);
    const ph = scope.perAnalyte[0];
    const lastIdx = GENERIC_9PAD_CHART.analytes[0].bands.length - 1;
    expect(ph.yourBandIndex).toBe(lastIdx);
    expect(ph.yourBandLabel).toBe(GENERIC_9PAD_CHART.analytes[0].bands[lastIdx].label);
  });

  it("flags small-sample even when prior rows are present but under threshold", () => {
    const others = [
      row(null, [{ analyteId: "ph", bandIndex: 0 }]),
      row(null, [{ analyteId: "ph", bandIndex: 1 }]),
    ];
    const yourReading = reading([{ analyteId: "ph", bandIndex: 0 }]);
    const scope = buildScope(others, GENERIC_9PAD_CHART, yourReading);
    expect(scope.perAnalyte[0].smallSample).toBe(true);
    expect(scope.perAnalyte[0].totalCount).toBe(2);
  });
});
