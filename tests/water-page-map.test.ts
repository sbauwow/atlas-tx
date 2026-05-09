import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/water/water-summary-service", () => ({
  getDefaultAtlasWaterSummaryService: vi.fn(() => ({
    getWaterOverview: vi.fn().mockResolvedValue({
      generatedAt: "2026-05-09T00:00:00.000Z",
      sourceIds: ["fema-nfhl", "nws-alerts", "usgs-stream-sites"],
      freshness: { generatedAt: "2026-05-09T00:00:00.000Z", sources: {} },
      counties: [
        {
          county: { name: "Travis County", slug: "travis-county", fips: "48453" },
          metrics: {
            floodplainFeatureCount: 2,
            streamGaugeCount: 1,
            activeWaterAlertCount: 1,
            sewerOverflowCount30d: 1,
            sewerOverflowGallons30d: 200,
            generalPermitCount: 2,
            waterDistrictCount: 3,
            waterUtilityCount: 4,
            surfaceWaterSegmentCount: 5,
            impairedSurfaceWaterSegmentCount: 2,
          },
          overlays: { hasFloodplainLayer: true, hasGaugeLayer: true, hasAlertLayer: true, hasSewerOverflowLayer: true, hasSurfaceWaterImpairmentLayer: true },
          mismatch: {
            score: 75,
            flags: [
              "surface-water impairment overlaps recent sewer overflow activity",
              "surface-water impairment is present with only light active alert coverage",
            ],
          },
          annotations: ["Nearby surface-water impairment context is additive only; it is not a standalone verdict on county-wide harm."],
        },
        {
          county: { name: "Bexar County", slug: "bexar-county", fips: "48029" },
          metrics: {
            floodplainFeatureCount: 0,
            streamGaugeCount: 0,
            activeWaterAlertCount: 0,
            sewerOverflowCount30d: 0,
            sewerOverflowGallons30d: 0,
            generalPermitCount: 0,
            waterDistrictCount: 1,
            waterUtilityCount: 1,
            surfaceWaterSegmentCount: 1,
            impairedSurfaceWaterSegmentCount: 1,
          },
          overlays: { hasFloodplainLayer: false, hasGaugeLayer: false, hasAlertLayer: false, hasSewerOverflowLayer: false, hasSurfaceWaterImpairmentLayer: true },
          mismatch: {
            score: 50,
            flags: ["surface-water impairment is present with only light active alert coverage"],
          },
          annotations: [],
        },
      ],
    }),
    getCountyWaterBreakdown: vi.fn().mockResolvedValue({
      county: {
        county: { name: "Travis County", slug: "travis-county", fips: "48453" },
        metrics: {
          floodplainFeatureCount: 2,
          streamGaugeCount: 1,
          activeWaterAlertCount: 1,
          sewerOverflowCount30d: 1,
          sewerOverflowGallons30d: 200,
          generalPermitCount: 2,
          waterDistrictCount: 3,
          waterUtilityCount: 4,
          surfaceWaterSegmentCount: 5,
          impairedSurfaceWaterSegmentCount: 2,
        },
        overlays: { hasFloodplainLayer: true, hasGaugeLayer: true, hasAlertLayer: true, hasSewerOverflowLayer: true, hasSurfaceWaterImpairmentLayer: true },
        mismatch: {
          score: 75,
          flags: [
            "surface-water impairment overlaps recent sewer overflow activity",
            "surface-water impairment is present with only light active alert coverage",
          ],
        },
        annotations: ["Nearby surface-water impairment context is additive only; it is not a standalone verdict on county-wide harm."],
      },
      layers: {
        alerts: [],
        gauges: [{ siteNumber: "08158000", stationName: "Colorado River at Austin", latitude: 30.25, longitude: -97.75 }],
        sewerOverflows: [],
        permits: [],
        governance: [],
        surfaceWaterQuality: [],
      },
      notes: ["NFHL political jurisdictions mapped: 2"],
    }),
  })),
}));

describe("water page map", () => {
  it("renders the county risk map with mismatch and impairment signals in the detail view", async () => {
    const pageModule = await import("@/app/water/page");
    const page = await pageModule.default({ searchParams: Promise.resolve({ county: "travis-county" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("County risk map");
    expect(text).toContain("Operational risk mode");
    expect(text).toContain("NFHL footprint");
    expect(text).toContain("Selected county gauges");
    expect(text).toContain("data-county-slug=\"travis-county\"");
    expect(text).toContain("data-gauge-site=\"08158000\"");
    expect(text).toContain("Impaired surface-water segments");
    expect(text).toContain("Mismatch score");
    expect(text).toContain("75");
    expect(text).toContain("surface-water impairment overlaps recent sewer overflow activity");
    expect(text).toContain("Mismatch");
    expect(text).toContain("mismatch 75");
    expect(text).toContain("mismatch 50");
    expect(text).toContain("fill=\"#f97316\"");
    expect(text).toContain("Top mismatch counties");
    expect(text).toContain("Travis County");
    expect(text).toContain("Bexar County");
  });

  it("supports an explicit mismatch map mode via search params", async () => {
    const pageModule = await import("@/app/water/page");
    const page = await pageModule.default({
      searchParams: Promise.resolve({ county: "travis-county", mode: "mismatch" }),
    });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("Map mode");
    expect(text).toContain("Operational risk");
    expect(text).toContain("Mismatch severity");
    expect(text).toContain("Current mode: mismatch severity");
    expect(text).toContain("Mismatch mode");
    expect(text).toContain("75+ severe contradiction");
    expect(text).toContain("40–74 moderate contradiction");
    expect(text).toContain("Counties are colored by contradiction severity rather than operational load.");
    expect(text).toContain("href=\"/water?county=travis-county&amp;mode=risk\"");
    expect(text).toContain("href=\"/water?county=travis-county&amp;mode=mismatch\"");
  });
});
