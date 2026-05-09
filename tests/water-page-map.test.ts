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
          lcraArrpOutfallCount: 0,
          lcraArrpLandPermitCount: 0,
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
          lcraArrpOutfallCount: 1,
          lcraArrpLandPermitCount: 2,
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
        surfaceWaterQuality: [
          { segmentId: "0802D", countyName: "Travis County", isImpaired: true },
        ],
        lcraArrpOutfalls: [],
        lcraArrpLandPermits: [],
      },
      notes: ["NFHL political jurisdictions mapped: 2"],
    }),
  })),
}));

describe("water page map", () => {
  it("renders the county risk map with mode-aware mismatch map chrome", async () => {
    const pageModule = await import("@/app/water/page");
    const page = await pageModule.default({ searchParams: Promise.resolve({ county: "travis-county" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("County risk map");
    expect(text).toContain("Map mode");
    expect(text).toContain("Operational risk");
    expect(text).toContain("Current mode: operational risk");
    expect(text).toContain("Top mismatch counties");
    expect(text).toContain("Mismatch legend");
    expect(text).toContain("mismatch 75");
    expect(text).toContain("mismatch 50");
    expect(text).toContain("fill=\"#f97316\"");
    expect(text).toContain("href=\"/water?county=travis-county&amp;mode=risk\"");
    expect(text).toContain("href=\"/water?county=bexar-county&amp;mode=risk\"");
  });

  it("preserves mismatch mode in internal county links", async () => {
    const pageModule = await import("@/app/water/page");
    const page = await pageModule.default({
      searchParams: Promise.resolve({ county: "travis-county", mode: "mismatch" }),
    });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("Current mode: mismatch severity");
    expect(text).toContain("Mismatch mode");
    expect(text).toContain("Counties are colored by contradiction severity rather than operational load.");
    expect(text).toContain("href=\"/water?county=travis-county&amp;mode=risk\"");
    expect(text).toContain("href=\"/water?county=travis-county&amp;mode=mismatch\"");
    expect(text).toContain("href=\"/water?county=bexar-county&amp;mode=mismatch\"");
  });
});
