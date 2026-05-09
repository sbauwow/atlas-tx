import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/water/water-summary-service", () => ({
  getDefaultAtlasWaterSummaryService: () => ({
    getCountyWaterBreakdown: vi.fn(async (slug: string) => ({
      county: {
        county: { name: "Travis County", slug, fips: "48453" },
        metrics: {
          activeWaterAlertCount: 2,
          streamGaugeCount: 4,
          sewerOverflowCount30d: 1,
          generalPermitCount: 7,
        },
        overlays: {
          hasFloodplainLayer: true,
          hasGaugeLayer: true,
          hasAlertLayer: true,
          hasSewerOverflowLayer: true,
          hasSurfaceWaterImpairmentLayer: true,
        },
        mismatch: { score: 50, flags: ["surface-water impairment overlaps recent sewer overflow activity"] },
        annotations: ["County-level context only."],
      },
      layers: {
        alerts: [{ sourceId: "nws-alerts", alertId: "a1", event: "Flood Warning", raw: {} }],
        gauges: [{ sourceId: "usgs-stream-sites", siteNumber: "08158000", stationName: "Colorado River", latitude: 30.2, longitude: -97.7, raw: {} }],
        sewerOverflows: [{ sourceId: "tceq-sewer-overflows", incidentId: "s1", countyName: "Travis County", occurredAt: "2026-05-01", estimatedGallons: 1000, raw: {} }],
        permits: [{ sourceId: "tceq-general-permits", permitNumber: "TXG123", permitType: "Construction Stormwater", permitteeName: "Alpha", countyName: "Travis County", raw: {} }],
        governance: [],
        surfaceWaterQuality: [],
        lcraArrpOutfalls: [],
        lcraArrpLandPermits: [],
        lcraWaterQualitySites: [],
      },
      notes: ["Best-effort county summary."],
    })),
  }),
}));

describe("water county page", () => {
  it("renders county breakdown and links back to permits", async () => {
    const pageModule = await import("@/app/water/counties/[slug]/page");
    const page = await pageModule.default({ params: Promise.resolve({ slug: "travis-county" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("Travis County water profile");
    expect(text).toContain("href=\"/permits?county=travis-county\"");
    expect(text).toContain("Flood Warning");
    expect(text).toContain("Colorado River");
    expect(text).toContain("surface-water impairment overlaps recent sewer overflow activity");
    expect(text).toContain("Best-effort county summary.");
  });
});
