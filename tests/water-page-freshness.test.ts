import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/water/water-summary-service", () => ({
  getDefaultAtlasWaterSummaryService: vi.fn(() => ({
    getWaterOverview: vi.fn().mockResolvedValue({
      generatedAt: "2026-05-09T00:00:00.000Z",
      sourceIds: ["nws-alerts", "usgs-stream-sites", "fema-nfhl"],
      freshness: {
        generatedAt: "2026-05-09T00:00:00.000Z",
        sources: {
          "nws-alerts": { cached: true, cachedAt: "2026-05-09T00:00:00.000Z", expiresAt: "2026-05-09T00:15:00.000Z", ttlMs: 900000 },
          "usgs-stream-sites": { cached: true, cachedAt: "2026-05-09T00:00:00.000Z", expiresAt: "2026-05-09T06:00:00.000Z", ttlMs: 21600000 },
          "fema-nfhl": { cached: true, cachedAt: "2026-05-09T00:00:00.000Z", expiresAt: "2026-05-10T00:00:00.000Z", ttlMs: 86400000 },
        },
      },
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
      layers: { alerts: [], gauges: [], sewerOverflows: [], permits: [], governance: [] },
      notes: [],
    }),
  })),
}));

describe("water page freshness badges", () => {
  it("renders freshness badges for live sources", async () => {
    const pageModule = await import("@/app/water/page");
    const page = await pageModule.default({ searchParams: Promise.resolve({ county: "travis-county" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("Source freshness");
    expect(text).toContain("nws-alerts");
    expect(text).toContain("Cached until");
    expect(text).toContain("2026-05-09T00:15:00.000Z");
  });
});
