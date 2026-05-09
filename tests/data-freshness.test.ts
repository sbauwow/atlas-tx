import { describe, expect, it } from "vitest";

import {
  buildAnalyticsFreshnessLane,
  buildAnalyticsFreshnessRecord,
  classifyFreshness,
  type AnalyticsFreshnessSourceDefinition,
  type PipelineHealthReportRecord,
} from "@/lib/data-freshness";

const PIPELINE_REPORT: PipelineHealthReportRecord = {
  generatedAt: "2026-05-10T03:00:00.000Z",
  overallStatus: "degraded",
  steps: [
    {
      stepId: "refresh-twdb-hydrology",
      status: "ok",
      startedAt: "2026-05-10T03:00:00.000Z",
      endedAt: "2026-05-10T03:00:05.000Z",
      durationMs: 5000,
      outputPath: "public/cache/twdb-hydrology.json",
      notes: ["completed refresh-twdb-hydrology"],
    },
    {
      stepId: "refresh-city-open-data",
      status: "ok",
      startedAt: "2026-05-10T03:00:08.000Z",
      endedAt: "2026-05-10T03:00:12.000Z",
      durationMs: 4000,
      outputPath: "public/cache/city-open-data-tx.json",
      notes: ["completed refresh-city-open-data"],
    },
    {
      stepId: "refresh-cid",
      status: "failed",
      startedAt: "2026-05-10T03:00:18.000Z",
      endedAt: "2026-05-10T03:00:28.000Z",
      durationMs: 10000,
      outputPath: null,
      notes: ["CID Search One returned the upstream error page"],
    },
    {
      stepId: "refresh-city-open-data-ranked",
      status: "skipped",
      startedAt: "2026-05-10T03:00:15.000Z",
      endedAt: "2026-05-10T03:00:15.000Z",
      durationMs: 0,
      outputPath: "public/cache/city-open-data-ranked-tx.json",
      notes: ["operator skipped ranked refresh"],
    },
  ],
};

const DEFINITIONS: AnalyticsFreshnessSourceDefinition[] = [
  {
    sourceId: "twdb-hydrology",
    label: "TWDB hydrology",
    stepId: "refresh-twdb-hydrology",
    category: "hydrology",
    provenance: "Texas Water Development Board snapshot",
    outputKind: "snapshot",
    thresholds: {
      warnAfterMs: 60 * 60 * 1000,
      staleAfterMs: 6 * 60 * 60 * 1000,
    },
  },
  {
    sourceId: "city-open-data",
    label: "City open data catalog",
    stepId: "refresh-city-open-data",
    category: "catalog",
    provenance: "Committed city catalog snapshot",
    outputKind: "cache",
    thresholds: {
      warnAfterMs: 12 * 60 * 60 * 1000,
      staleAfterMs: 24 * 60 * 60 * 1000,
    },
  },
  {
    sourceId: "cid-cases",
    label: "CID permit cases",
    stepId: "refresh-cid",
    category: "permits",
    provenance: "TCEQ CID refresh pipeline",
    outputKind: "derived",
    thresholds: {
      warnAfterMs: 24 * 60 * 60 * 1000,
      staleAfterMs: 72 * 60 * 60 * 1000,
    },
  },
  {
    sourceId: "city-open-data-ranked",
    label: "Ranked city data lanes",
    stepId: "refresh-city-open-data-ranked",
    category: "catalog",
    provenance: "Derived ranking artifact",
    outputKind: "derived",
    thresholds: {
      warnAfterMs: 60 * 60 * 1000,
      staleAfterMs: 3 * 60 * 60 * 1000,
    },
  },
];

describe("classifyFreshness", () => {
  it("classifies sources as fresh, warn, and stale by age thresholds", () => {
    expect(
      classifyFreshness({
        now: "2026-05-10T04:00:00.000Z",
        updatedAt: "2026-05-10T03:30:00.000Z",
        thresholds: { warnAfterMs: 60 * 60 * 1000, staleAfterMs: 6 * 60 * 60 * 1000 },
      }),
    ).toMatchObject({
      status: "fresh",
      reason: "within-threshold",
      isStale: false,
      ageMs: 30 * 60 * 1000,
    });

    expect(
      classifyFreshness({
        now: "2026-05-10T08:00:00.000Z",
        updatedAt: "2026-05-10T03:00:00.000Z",
        thresholds: { warnAfterMs: 60 * 60 * 1000, staleAfterMs: 6 * 60 * 60 * 1000 },
      }),
    ).toMatchObject({
      status: "warn",
      reason: "warn-threshold-exceeded",
      isStale: false,
      ageMs: 5 * 60 * 60 * 1000,
    });

    expect(
      classifyFreshness({
        now: "2026-05-10T10:00:00.000Z",
        updatedAt: "2026-05-10T03:00:00.000Z",
        thresholds: { warnAfterMs: 60 * 60 * 1000, staleAfterMs: 6 * 60 * 60 * 1000 },
      }),
    ).toMatchObject({
      status: "stale",
      reason: "stale-threshold-exceeded",
      isStale: true,
      ageMs: 7 * 60 * 60 * 1000,
    });
  });

  it("treats missing or failed pipeline provenance as stale", () => {
    expect(
      classifyFreshness({
        now: "2026-05-10T04:00:00.000Z",
        updatedAt: "2026-05-10T03:00:00.000Z",
        thresholds: { warnAfterMs: 60 * 60 * 1000, staleAfterMs: 6 * 60 * 60 * 1000 },
        pipelineStatus: "failed",
      }),
    ).toMatchObject({
      status: "stale",
      reason: "pipeline-failed",
      isStale: true,
      ageMs: null,
    });

    expect(
      classifyFreshness({
        now: "2026-05-10T04:00:00.000Z",
        updatedAt: null,
        thresholds: { warnAfterMs: 60 * 60 * 1000, staleAfterMs: 6 * 60 * 60 * 1000 },
        pipelineStatus: "missing",
      }),
    ).toMatchObject({
      status: "stale",
      reason: "missing-step",
      isStale: true,
      ageMs: null,
    });
  });
});

describe("buildAnalyticsFreshnessRecord", () => {
  it("shapes pipeline health into a chart-friendly trust record", () => {
    const record = buildAnalyticsFreshnessRecord(PIPELINE_REPORT, DEFINITIONS[0], {
      now: "2026-05-10T03:30:00.000Z",
    });

    expect(record).toMatchObject({
      sourceId: "twdb-hydrology",
      label: "TWDB hydrology",
      stepId: "refresh-twdb-hydrology",
      category: "hydrology",
      provenance: "Texas Water Development Board snapshot",
      pipelineStatus: "ok",
      pipelineOverallStatus: "degraded",
      freshnessStatus: "fresh",
      freshnessReason: "within-threshold",
      outputPath: "public/cache/twdb-hydrology.json",
      durationMs: 5000,
      notes: ["completed refresh-twdb-hydrology"],
      ageMs: 29 * 60 * 1000 + 55 * 1000,
      updatedAt: "2026-05-10T03:00:05.000Z",
    });
  });
});

describe("buildAnalyticsFreshnessLane", () => {
  it("builds a reusable trust lane with counts and stale source ids", () => {
    const lane = buildAnalyticsFreshnessLane(PIPELINE_REPORT, DEFINITIONS, {
      now: "2026-05-10T03:30:00.000Z",
    });

    expect(lane.generatedAt).toBe("2026-05-10T03:00:00.000Z");
    expect(lane.overallStatus).toBe("degraded");
    expect(lane.records.map((record) => [record.sourceId, record.freshnessStatus])).toEqual([
      ["twdb-hydrology", "fresh"],
      ["city-open-data", "fresh"],
      ["cid-cases", "stale"],
      ["city-open-data-ranked", "warn"],
    ]);
    expect(lane.counts).toEqual({ fresh: 2, warn: 1, stale: 1 });
    expect(lane.staleSourceIds).toEqual(["cid-cases"]);
  });
});
