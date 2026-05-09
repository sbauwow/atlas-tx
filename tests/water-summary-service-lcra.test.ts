import { describe, expect, it } from "vitest";
import { createAtlasWaterSummaryService } from "@/lib/water/water-summary-service";

describe("water summary service LCRA integration", () => {
  it("adds LCRA ARRP county metrics and layers to county breakdowns", async () => {
    const service = createAtlasWaterSummaryService({
      fetchAlerts: async () => [],
      fetchGauges: async () => [],
      fetchSewerOverflows: async () => [],
      fetchPermits: async () => [],
      fetchGovernance: async () => [],
      fetchSurfaceWaterQuality: async () => [],
      fetchFloodplainCountyCoverage: async () => ({ sourceId: "fema-nfhl", layerId: 22, layerName: "Political Jurisdictions", countyCount: 0, counties: [] }),
      fetchLcraArrpOutfalls: async () => [
        {
          sourceId: "lcra-arrp-outfalls",
          recordId: "1",
          permitNumber: "OUT-1",
          countyName: "Travis County",
          permitteeName: "Austin Utility",
          status: "Current",
          segmentId: "1403",
          basinId: "14",
          outfallNumber: "001",
          latitude: 30.3,
          longitude: -97.8,
          raw: {},
        },
      ],
      fetchLcraArrpLandPermits: async () => [
        {
          sourceId: "lcra-arrp-land-permits",
          recordId: "10",
          permitNumber: "LAND-1",
          countyName: "Travis County",
          permitteeName: "Land Operator",
          status: "Current",
          segmentId: "1403",
          basinId: "14",
          permitType: "SP",
          reviewType: "WWTP",
          latitude: 30.31,
          longitude: -97.81,
          raw: {},
        },
      ],
    });

    const overview = await service.getWaterOverview();
    const travis = overview.counties.find((county) => county.county.slug === "travis-county");
    expect(travis).toMatchObject({
      county: { name: "Travis County", slug: "travis-county" },
      metrics: {
        lcraArrpOutfallCount: 1,
        lcraArrpLandPermitCount: 1,
      },
    });

    const detail = await service.getCountyWaterBreakdown("travis-county");
    expect(detail.county.metrics.lcraArrpOutfallCount).toBe(1);
    expect(detail.county.metrics.lcraArrpLandPermitCount).toBe(1);
    expect(detail.layers.lcraArrpOutfalls).toHaveLength(1);
    expect(detail.layers.lcraArrpLandPermits).toHaveLength(1);
    expect(detail.notes.join(" ")).toContain("LCRA ARRP outfalls: 1");
  });
});
