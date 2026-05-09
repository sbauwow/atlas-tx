import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/water/water-summary-service", () => ({
  getDefaultAtlasWaterSummaryService: vi.fn(() => ({
    getWaterOverview: vi.fn().mockResolvedValue({
      generatedAt: "2026-05-09T00:00:00.000Z",
      sourceIds: ["lcra-hydromet-stageflow", "lcra-arrp-outfalls", "lcra-arrp-land-permits"],
      freshness: { generatedAt: "2026-05-09T00:00:00.000Z", sources: {} },
      counties: [
        {
          county: { name: "Travis County", slug: "travis-county" },
          metrics: {
            streamGaugeCount: 1,
            activeWaterAlertCount: 1,
            sewerOverflowCount30d: 1,
            sewerOverflowGallons30d: 200,
            generalPermitCount: 2,
            waterDistrictCount: 3,
            waterUtilityCount: 4,
            lcraArrpOutfallCount: 5,
            lcraArrpLandPermitCount: 2,
            activeLcraQualitySiteCount: 6,
            impairedLcraMonitoringSiteCount: 2,
            availableLcraParameterCount: 9,
            latestLcraObservationAt: "2026-05-09T12:00:00Z",
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
          generalPermitCount: 2,
          waterDistrictCount: 3,
          waterUtilityCount: 4,
          lcraArrpOutfallCount: 5,
          lcraArrpLandPermitCount: 2,
          activeLcraQualitySiteCount: 6,
          impairedLcraMonitoringSiteCount: 2,
          availableLcraParameterCount: 9,
          latestLcraObservationAt: "2026-05-09T12:00:00Z",
        },
        overlays: { hasFloodplainLayer: false, hasGaugeLayer: true, hasAlertLayer: true, hasSewerOverflowLayer: true },
        annotations: [],
      },
      layers: {
        alerts: [], gauges: [], sewerOverflows: [], permits: [], governance: [],
        lcraArrpOutfalls: [{ recordId: "1", permitNumber: "OUT-1" }],
        lcraArrpLandPermits: [{ recordId: "10", permitNumber: "LAND-1" }],
      },
      notes: ["LCRA ARRP outfalls: 5 · LCRA ARRP land permits: 2"],
    }),
  })),
}));

describe("water page LCRA integration", () => {
  it("renders LCRA ARRP metrics, links, and county detail notes", async () => {
    const pageModule = await import("@/app/water/page");
    const page = await pageModule.default({ searchParams: Promise.resolve({ county: "travis-county" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("LCRA Hydromet stage-flow API");
    expect(text).toContain("LCRA ARRP outfalls API");
    expect(text).toContain("GBRA GVHS lakes API");
    expect(text).toContain("LCRA ARRP outfalls");
    expect(text).toContain("LCRA ARRP land permits");
    expect(text).toContain("LCRA ARRP outfalls: 5");
    expect(text).toContain("Active LCRA quality sites");
    expect(text).toContain("Available LCRA parameters");
    expect(text).toContain("Latest LCRA observation");
  });
});
