import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/water/water-summary-service", () => ({
  getDefaultAtlasWaterSummaryService: vi.fn(() => ({
    getWaterOverview: vi.fn().mockResolvedValue({
      generatedAt: "2026-05-09T00:00:00.000Z",
      sourceIds: ["nws-alerts", "usgs-stream-sites", "tceq-sewer-overflows"],
      counties: [
        {
          county: { name: "Travis County", slug: "travis-county" },
          metrics: { streamGaugeCount: 1, activeWaterAlertCount: 1, sewerOverflowCount30d: 1, sewerOverflowGallons30d: 200 },
          overlays: { hasFloodplainLayer: false, hasGaugeLayer: true, hasAlertLayer: true, hasSewerOverflowLayer: true },
          annotations: [],
        },
      ],
    }),
    getCountyWaterBreakdown: vi.fn().mockResolvedValue({
      county: {
        county: { name: "Travis County", slug: "travis-county" },
        metrics: { streamGaugeCount: 1, activeWaterAlertCount: 1, sewerOverflowCount30d: 1, sewerOverflowGallons30d: 200, generalPermitCount: 2 },
        overlays: { hasFloodplainLayer: false, hasGaugeLayer: true, hasAlertLayer: true, hasSewerOverflowLayer: true },
        annotations: [],
      },
      layers: { alerts: [{ alertId: "a1" }], gauges: [{ siteNumber: "08158000" }], sewerOverflows: [{ incidentNumber: "1" }], permits: [{ permitNumber: "TXG123" }] },
      notes: [],
    }),
  })),
}));

describe("water API routes", () => {
  it("returns statewide water overview JSON", async () => {
    const { GET } = await import("@/app/api/water/overview/route");
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.counties[0].county.slug).toBe("travis-county");
  });

  it("returns a county water breakdown JSON", async () => {
    const { GET } = await import("@/app/api/water/counties/[slug]/route");
    const response = await GET(new Request("http://localhost/api/water/counties/travis-county"), {
      params: Promise.resolve({ slug: "travis-county" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.layers.gauges[0].siteNumber).toBe("08158000");
  });
});
