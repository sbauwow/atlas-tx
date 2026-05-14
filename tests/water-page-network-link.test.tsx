import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const getWaterOverview = vi.fn();
const getCountyWaterBreakdown = vi.fn();

vi.mock("@/lib/water/water-summary-service", () => ({
  getDefaultAtlasWaterSummaryService: () => ({ getWaterOverview, getCountyWaterBreakdown }),
}));

describe("/water page", () => {
  it("renders county dependency map shortcut", async () => {
    getWaterOverview.mockResolvedValueOnce({
      counties: [
        {
          county: { slug: "travis-county", name: "Travis County", fips: "48453" },
          metrics: {
            floodplainFeatureCount: 0,
            activeWaterAlertCount: 0,
            streamGaugeCount: 0,
            sewerOverflowCount30d: 0,
            generalPermitCount: 0,
            waterDistrictCount: 0,
            waterUtilityCount: 0,
            lcraArrpOutfallCount: 0,
            lcraArrpLandPermitCount: 0,
            activeLcraQualitySiteCount: 0,
            availableLcraParameterCount: 0,
            impairedLcraMonitoringSiteCount: 0,
          },
          mismatch: { score: 0 },
        },
      ],
      freshness: { generatedAt: "2026-01-01T00:00:00.000Z", sources: {} },
    });

    getCountyWaterBreakdown.mockResolvedValueOnce({
      county: {
        county: { slug: "travis-county", name: "Travis County" },
        metrics: {
          floodplainFeatureCount: 0,
          activeWaterAlertCount: 0,
          streamGaugeCount: 0,
          sewerOverflowCount30d: 0,
          generalPermitCount: 0,
          waterDistrictCount: 0,
          waterUtilityCount: 0,
          lcraArrpOutfallCount: 0,
          lcraArrpLandPermitCount: 0,
          activeLcraQualitySiteCount: 0,
          availableLcraParameterCount: 0,
          impairedLcraMonitoringSiteCount: 0,
        },
        mismatch: { score: 0 },
      },
      layers: {
        governance: [],
        alerts: [],
        gauges: [],
        sewerOverflows: [],
        permits: [],
        lcraArrpOutfalls: [],
        lcraArrpLandPermits: [],
      },
      notes: [],
    });

    const pageModule = await import("@/app/water/page");
    const element = await pageModule.default({});
    const html = renderToStaticMarkup(element);

    expect(html).toContain("County dependency map");
    expect(html).toContain("/water/network");
    expect(html).toContain("Confidence");
    expect(html).toContain("Sparse");
  });
});
