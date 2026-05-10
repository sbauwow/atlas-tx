import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/water/water-summary-service", () => ({
  getDefaultAtlasWaterSummaryService: vi.fn(() => ({
    getWaterOverview: vi.fn().mockResolvedValue({
      generatedAt: "2026-05-09T00:00:00.000Z",
      sourceIds: ["nws-alerts", "usgs-stream-sites", "tceq-sewer-overflows", "tceq-general-water-permits", "tceq-water-districts", "puct-water-iou"],
      freshness: { generatedAt: "2026-05-09T00:00:00.000Z", sources: {} },
      counties: [
        {
          county: { name: "Travis County", slug: "travis-county" },
          metrics: {
            streamGaugeCount: 1,
            activeWaterAlertCount: 1,
            sewerOverflowCount30d: 1,
            sewerOverflowGallons30d: 200,
            generalPermitCount: 4,
            oilAndGasExtractionPermitCount: 2,
            petroleumBulkStationPermitCount: 1,
            otherGeneralPermitCount: 1,
            waterDistrictCount: 3,
            waterUtilityCount: 4,
          },
          overlays: { hasFloodplainLayer: false, hasGaugeLayer: true, hasAlertLayer: true, hasSewerOverflowLayer: true },
          annotations: [],
        },
      ],
    }),
    getCountyWaterBreakdown: vi.fn().mockResolvedValue({
      county: {
        county: { name: "Travis County", slug: "travis-county" },
        metrics: {
          streamGaugeCount: 1,
          activeWaterAlertCount: 1,
          sewerOverflowCount30d: 1,
          sewerOverflowGallons30d: 200,
          generalPermitCount: 4,
          oilAndGasExtractionPermitCount: 2,
          petroleumBulkStationPermitCount: 1,
          otherGeneralPermitCount: 1,
          waterDistrictCount: 3,
          waterUtilityCount: 4,
        },
        overlays: { hasFloodplainLayer: false, hasGaugeLayer: true, hasAlertLayer: true, hasSewerOverflowLayer: true },
        annotations: [],
      },
      layers: {
        alerts: [],
        gauges: [],
        sewerOverflows: [],
        permits: [
          { permitNumber: "TXG310001", permitLane: "oil-gas-extraction", permitStatus: "ACTIVE", siteName: "Pad A" },
          { permitNumber: "TXG310002", permitLane: "oil-gas-extraction", permitStatus: "PENDING", siteName: "Pad B" },
          { permitNumber: "TXG340100", permitLane: "petroleum-bulk-stations", permitStatus: "ACTIVE", siteName: "Terminal" },
          { permitNumber: "TXG560100", permitLane: "other-general-permit", permitStatus: "ACTIVE", siteName: "Outfall" },
        ],
        governance: [],
        lcraArrpOutfalls: [],
        lcraArrpLandPermits: [],
      },
      notes: [],
    }),
  })),
}));

describe("water page", () => {
  it("renders the water explorer summary and selected county metrics", async () => {
    const pageModule = await import("@/app/water/page");
    const page = await pageModule.default({ searchParams: Promise.resolve({ county: "travis-county" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("Texas water explorer");
    expect(text).toContain("National Flood Hazard Layer");
    expect(text).toContain("Lower Colorado River Authority");
    expect(text).toContain("Guadalupe-Blanco River Authority");
    expect(text).toContain("Map-first county workflow");
    expect(text).toContain("Start on the county map, switch between operational risk and mismatch severity");
    expect(text).toContain("1. Start on the map");
    expect(text).toContain("2. Inspect county detail");
    expect(text).toContain("3. Compare in county table");
    expect(text).toContain("Map-driven county detail for the current water slice.");
    expect(text).toContain("Travis County");
    expect(text).toContain("General permits");
    expect(text).toContain("Oil &amp; gas extraction");
    expect(text).toContain("Oil and gas extraction footprint");
    expect(text).toContain("TXG31 county drilldown");
    expect(text).toContain("TXG31 active");
    expect(text).toContain("Petroleum bulk stations");
    expect(text).toContain("Selected county TXG31 API");
    expect(text).toContain("Pending permits");
    expect(text).toContain("title=\"National Flood Hazard Layer\"");
  });
});
