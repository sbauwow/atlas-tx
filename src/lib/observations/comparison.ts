import "server-only";

import { prisma } from "@/lib/db";
import type { LlmReading, ReferenceChart } from "./types";

/**
 * Per-analyte comparison of "your" submission against the historical
 * distribution of prior LLM-graded submissions for the same chart.
 *
 * Strictly non-regulatory. The aim is "is your reading typical for this
 * county / state?" — not "is your water safe?". Callers must keep that
 * distinction in user-facing copy.
 */

export type AnalyteComparison = {
  analyteId: string;
  analyteName: string;
  bandLabels: string[];
  yourBandIndex: number;
  yourBandLabel: string;
  /** Count per band index, parallel to `bandLabels`. */
  distribution: number[];
  /** Percent of submissions in each band (0..100, one decimal). */
  distributionPercent: number[];
  /** Total prior submissions in this scope that included this analyte. */
  totalCount: number;
  /**
   * Cumulative percent ≤ your band. Loose "your-or-lower" rank in the
   * sorted-band sense; only meaningful when `totalCount` is reasonable.
   */
  yourPercentile: number;
  /** Most common band index in this scope; null when scope is empty. */
  modeBandIndex: number | null;
  /** Whether the scope is too small to draw conclusions from. */
  smallSample: boolean;
};

export type ComparisonScope = {
  /** Total prior submissions in this scope (any analyte). */
  observationCount: number;
  perAnalyte: AnalyteComparison[];
};

export type ObservationComparison = {
  countySlug: string | null;
  /** County-only scope. Null when the observation has no county. */
  countyScope: ComparisonScope | null;
  /** Statewide scope across all counties (and observations with no county). */
  stateScope: ComparisonScope;
  /** Single threshold used to mark a scope as too small to be meaningful. */
  smallSampleThreshold: number;
};

const SMALL_SAMPLE_THRESHOLD = 5;

export interface ComputeComparisonParams {
  readonly observationId: string;
  readonly chart: ReferenceChart;
  readonly llmReading: LlmReading;
  readonly countySlug: string | null;
}

export async function computeObservationComparison(
  params: ComputeComparisonParams,
): Promise<ObservationComparison | null> {
  const { observationId, chart, llmReading, countySlug } = params;
  if (llmReading.perAnalyte.length === 0) return null;

  const rows = await prisma.waterObservation.findMany({
    where: {
      NOT: { id: observationId },
      llmReading: { not: null },
    },
    select: { countySlug: true, llmReading: true },
  });

  type DecodedRow = { countySlug: string | null; reading: LlmReading };
  const decoded: DecodedRow[] = [];
  for (const row of rows) {
    if (!row.llmReading) continue;
    let reading: LlmReading;
    try {
      reading = JSON.parse(row.llmReading) as LlmReading;
    } catch {
      continue;
    }
    if (reading.chartId !== chart.id) continue;
    decoded.push({ countySlug: row.countySlug, reading });
  }

  const stateScope = buildScope(decoded, chart, llmReading);
  const countyScope = countySlug
    ? buildScope(
        decoded.filter((entry) => entry.countySlug === countySlug),
        chart,
        llmReading,
      )
    : null;

  return {
    countySlug,
    countyScope,
    stateScope,
    smallSampleThreshold: SMALL_SAMPLE_THRESHOLD,
  };
}

function buildScope(
  rows: Array<{ countySlug: string | null; reading: LlmReading }>,
  chart: ReferenceChart,
  yourReading: LlmReading,
): ComparisonScope {
  const perAnalyte: AnalyteComparison[] = [];

  for (const yourEntry of yourReading.perAnalyte) {
    const analyte = chart.analytes.find((a) => a.id === yourEntry.analyteId);
    if (!analyte) continue;
    const bandLabels = analyte.bands.map((band) => band.label);
    const distribution = new Array(bandLabels.length).fill(0) as number[];
    let total = 0;

    for (const row of rows) {
      const match = row.reading.perAnalyte.find((entry) => entry.analyteId === yourEntry.analyteId);
      if (!match) continue;
      const idx = Math.floor(match.bandIndex);
      if (idx < 0 || idx >= distribution.length) continue;
      distribution[idx] += 1;
      total += 1;
    }

    const distributionPercent = distribution.map((count) =>
      total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    );

    let cumulative = 0;
    for (let i = 0; i <= yourEntry.bandIndex && i < distribution.length; i++) {
      cumulative += distribution[i];
    }
    const yourPercentile = total > 0 ? Math.round((cumulative / total) * 100) : 0;

    let modeBandIndex: number | null = null;
    if (total > 0) {
      let bestIdx = 0;
      for (let i = 1; i < distribution.length; i++) {
        if (distribution[i] > distribution[bestIdx]) bestIdx = i;
      }
      modeBandIndex = bestIdx;
    }

    const yourBandIndex = clamp(yourEntry.bandIndex, 0, bandLabels.length - 1);

    perAnalyte.push({
      analyteId: yourEntry.analyteId,
      analyteName: analyte.name,
      bandLabels,
      yourBandIndex,
      yourBandLabel: bandLabels[yourBandIndex] ?? `band ${yourBandIndex}`,
      distribution,
      distributionPercent,
      totalCount: total,
      yourPercentile,
      modeBandIndex,
      smallSample: total < SMALL_SAMPLE_THRESHOLD,
    });
  }

  return {
    observationCount: rows.length,
    perAnalyte,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export const __TEST_ONLY__ = { buildScope };
