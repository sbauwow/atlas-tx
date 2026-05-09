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
          },
          overlays: { hasFloodplainLayer: true, hasGaugeLayer: true, hasAlertLayer: true, hasSewerOverflowLayer: true },
          annotations: [],
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
          },
          overlays: { hasFloodplainLayer: false, hasGaugeLayer: false, hasAlertLayer: false, hasSewerOverflowLayer: false },
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
        },
        overlays: { hasFloodplainLayer: true, hasGaugeLayer: true, hasAlertLayer: true, hasSewerOverflowLayer: true },
        annotations: [],
      },
      layers: {
        alerts: [],
        gauges: [{ siteNumber: "08158000", stationName: "Colorado River at Austin", latitude: 30.25, longitude: -97.75 }],
        sewerOverflows: [],
        permits: [],
        governance: [],
        lcraArrpOutfalls: [],
        lcraArrpLandPermits: [],
      },
      notes: ["NFHL political jurisdictions mapped: 2"],
    }),
  })),
}));

describe("water page map", () => {
  it("renders the county risk map with FEMA and gauge signals", async () => {
    const pageModule = await import("@/app/water/page");
    const page = await pageModule.default({ searchParams: Promise.resolve({ county: "travis-county" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("County risk map");
    expect(text).toContain("NFHL footprint");
    expect(text).toContain("Selected county gauges");
    expect(text).toContain("data-county-slug=\"travis-county\"");
    expect(text).toContain("data-gauge-site=\"08158000\"");
  });
});
