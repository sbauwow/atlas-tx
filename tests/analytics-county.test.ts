import { describe, expect, it } from "vitest";
import { buildCountyAnalyticsSnapshot, decomposeCountyDrivers, normalizeMetricMap } from "@/lib/analytics";

describe("county analytics helpers", () => {
  it("decomposes county drivers into chart-safe contribution records", () => {
    const drivers = decomposeCountyDrivers({
      compositeScore: 50,
      ranks: {
        permits: 2,
        "cpi-investigations": 1,
      },
      sourceValues: {
        permits: 4,
        "cpi-investigations": 81,
      },
      metrics: {
        permits: { permitCount: 4 },
        "cpi-investigations": { totalCompletedInvestigations: 81 },
      },
      highlights: [
        {
          sourceId: "cpi-investigations",
          label: "CPI investigations",
          rank: 1,
          value: 81,
        },
        {
          sourceId: "permits",
          label: "Permits",
          rank: 2,
          value: 4,
        },
      ],
      sourceMetadata: [
        { sourceId: "permits", label: "Permits", category: "environment" },
        { sourceId: "cpi-investigations", label: "CPI investigations", category: "social" },
      ],
      rankDenominators: {
        permits: 2,
        "cpi-investigations": 2,
      },
    });

    expect(drivers).toEqual([
      {
        sourceId: "cpi-investigations",
        label: "CPI investigations",
        category: "social",
        rank: 1,
        totalCount: 2,
        percentile: 100,
        rawValue: 81,
        scoreContribution: 50,
        shareOfComposite: 100,
        highlight: true,
        metrics: { totalCompletedInvestigations: 81 },
      },
      {
        sourceId: "permits",
        label: "Permits",
        category: "environment",
        rank: 2,
        totalCount: 2,
        percentile: 0,
        rawValue: 4,
        scoreContribution: 0,
        shareOfComposite: 0,
        highlight: true,
        metrics: { permitCount: 4 },
      },
    ]);
  });

  it("builds a normalized analytics snapshot from county-style breakdown inputs", () => {
    const snapshot = buildCountyAnalyticsSnapshot({
      generatedAt: "2026-05-09T16:52:00.000Z",
      overview: {
        county: { name: "Travis County", slug: "travis-county" },
        compositeScore: 50,
        ranks: {
          composite: 2,
          permits: 2,
          "cpi-investigations": 1,
        },
        sourceValues: {
          permits: 4,
          "cpi-investigations": 81,
        },
        metrics: {
          permits: { permitCount: 4, bad: { nested: true } },
          "cpi-investigations": { totalCompletedInvestigations: 81, latestFiscalYear: "2025" },
        },
      },
      profile: {
        collectedAt: "2026-05-09T16:00:00.000Z",
        metrics: {
          permits: { permitCount: 4, activeCount: 3, unsupported: [1, 2, 3] },
        },
        annotations: ["Uses cached TWDB hydrology snapshot."],
        errors: [{ sourceId: "water-districts", message: "Timed out" }],
        slices: [
          { sourceId: "permits", name: "Permits", category: "environment" },
          { sourceId: "cpi-investigations", name: "CPI investigations", category: "social" },
        ],
      },
      highlights: [
        {
          sourceId: "cpi-investigations",
          label: "CPI investigations",
          rank: 1,
          value: 81,
        },
        {
          sourceId: "permits",
          label: "Permits",
          rank: 2,
          value: 4,
        },
      ],
      hydrologyContext: {
        layerHits: {
          "twdb-major-aquifers": 1,
          "twdb-huc8": 1,
        },
        matches: [{ id: 1 }, { id: 2 }],
        caveat: "Centroid overlap only.",
      },
      rankDenominators: {
        permits: 2,
        "cpi-investigations": 2,
      },
      freshness: [
        {
          sourceId: "permits",
          collectedAt: "2026-05-08T00:00:00.000Z",
          metadata: { stale: false, checkedAt: new Date("2026-05-09T16:52:00.000Z") },
        },
      ],
    });

    expect(snapshot).toMatchObject({
      county: { name: "Travis County", slug: "travis-county" },
      generatedAt: "2026-05-09T16:52:00.000Z",
      compositeScore: 50,
      compositeRank: 2,
      sourceCount: 2,
      sourceValues: {
        permits: 4,
        "cpi-investigations": 81,
      },
      overviewMetrics: {
        permits: { permitCount: 4, bad: null },
        "cpi-investigations": { totalCompletedInvestigations: 81, latestFiscalYear: "2025" },
      },
      profileMetrics: {
        permits: { permitCount: 4, activeCount: 3, unsupported: null },
      },
      annotations: ["Uses cached TWDB hydrology snapshot."],
      errorCount: 1,
      hydrology: {
        matchCount: 2,
        layerHits: {
          "twdb-major-aquifers": 1,
          "twdb-huc8": 1,
        },
        caveat: "Centroid overlap only.",
      },
    });
    expect(snapshot.drivers.map((driver) => ({
      sourceId: driver.sourceId,
      scoreContribution: driver.scoreContribution,
      shareOfComposite: driver.shareOfComposite,
    }))).toEqual([
      { sourceId: "cpi-investigations", scoreContribution: 50, shareOfComposite: 100 },
      { sourceId: "permits", scoreContribution: 0, shareOfComposite: 0 },
    ]);
    expect(snapshot.freshness).toEqual([
      {
        sourceId: "permits",
        collectedAt: "2026-05-08T00:00:00.000Z",
        metadata: {
          stale: false,
          checkedAt: "2026-05-09T16:52:00.000Z",
        },
      },
    ]);
  });

  it("normalizes unsupported metric values to null", () => {
    expect(normalizeMetricMap({ a: 1, b: "ok", c: true, d: { nested: true }, e: [1, 2] })).toEqual({
      a: 1,
      b: "ok",
      c: true,
      d: null,
      e: null,
    });
  });
});
