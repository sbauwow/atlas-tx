import { describe, expect, it } from "vitest";
import { createAtlasWaterSummaryService } from "@/lib/water/water-summary-service";

describe("water summary service governance integration", () => {
  it("adds district and utility metrics plus governance layers to county breakdown", async () => {
    const service = createAtlasWaterSummaryService({
      fetchAlerts: async () => [],
      fetchGauges: async () => [],
      fetchSewerOverflows: async () => [],
      fetchPermits: async () => [],
      fetchGovernance: async () => [
        {
          sourceId: "tceq-water-districts",
          entityId: "227001",
          countyName: "Travis County",
          entityName: "TRAVIS WCID 1",
          entityType: "Water District",
          activityStatus: "Active",
          city: "AUSTIN",
          raw: {},
        },
        {
          sourceId: "puct-water-iou",
          entityId: "10118",
          countyName: "Travis County",
          entityName: "YAUPON COVE WATER",
          entityType: "Investor-Owned Utility",
          activityStatus: null,
          city: "AUSTIN",
          raw: {},
        },
      ],
      fetchFloodplainCountyCoverage: async () => ({ sourceId: "fema-nfhl", layerId: 22, layerName: "Political Jurisdictions", countyCount: 0, counties: [] }),
      fetchLcraArrpOutfalls: async () => [],
      fetchLcraArrpLandPermits: async () => [],
    });

    const overview = await service.getWaterOverview();
    const travis = overview.counties.find((county) => county.county.slug === "travis-county");
    expect(travis?.metrics.waterDistrictCount).toBe(1);
    expect(travis?.metrics.waterUtilityCount).toBe(1);

    const detail = await service.getCountyWaterBreakdown("travis");
    expect(detail.layers.governance).toHaveLength(2);
  });
});
