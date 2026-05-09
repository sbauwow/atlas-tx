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
            generalPermitCount: 2,
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
          generalPermitCount: 2,
          waterDistrictCount: 3,
          waterUtilityCount: 4,
        },
        overlays: { hasFloodplainLayer: false, hasGaugeLayer: true, hasAlertLayer: true, hasSewerOverflowLayer: true },
        annotations: [],
      },
      layers: { alerts: [], gauges: [], sewerOverflows: [], permits: [{ permitNumber: "TXG123" }], governance: [], lcraArrpOutfalls: [], lcraArrpLandPermits: [] },
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
    expect(text).toContain("Travis County");
    expect(text).toContain("General permits");
    expect(text).toContain("Pending permits");
  });
});
