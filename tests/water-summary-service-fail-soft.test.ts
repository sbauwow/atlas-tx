import { describe, expect, it } from "vitest";

import { createAtlasWaterSummaryService } from "@/lib/water/water-summary-service";

const emptyFloodplainCoverage = {
  sourceId: "fema-nfhl" as const,
  layerId: 22 as const,
  layerName: "Political Jurisdictions" as const,
  countyCount: 0,
  counties: [],
};

describe("water summary service fail-soft", () => {
  it("returns an overview even when the sewer-overflows fetcher rejects (e.g. live Socrata 8kc5-95uk down)", async () => {
    const service = createAtlasWaterSummaryService({
      fetchAlerts: async () => [],
      fetchGauges: async () => [],
      fetchSewerOverflows: async () => {
        throw new Error("Dataset 8kc5-95uk does not support resource API access");
      },
      fetchPermits: async () => [],
      fetchGovernance: async () => [],
      fetchSurfaceWaterQuality: async () => [],
      fetchFloodplainCountyCoverage: async () => emptyFloodplainCoverage,
      fetchLcraArrpOutfalls: async () => [],
      fetchLcraArrpLandPermits: async () => [],
      fetchLcraWaterQualitySites: async () => [],
      fetchLcraWaterQualitySiteParameters: async () => [],
      fetchLcraWaterQualitySiteObservations: async () => [],
    });

    const overview = await service.getWaterOverview();

    expect(overview.counties).toEqual([]);
    expect(overview.sourceIds.length).toBeGreaterThan(0);
    expect(overview.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns a county breakdown even when half the fetchers reject", async () => {
    const service = createAtlasWaterSummaryService({
      fetchAlerts: async () => {
        throw new Error("alerts API down");
      },
      fetchGauges: async () => {
        throw new Error("USGS site service unreachable");
      },
      fetchSewerOverflows: async () => {
        throw new Error("Dataset 8kc5-95uk does not support resource API access");
      },
      fetchPermits: async () => [],
      fetchGovernance: async () => [],
      fetchSurfaceWaterQuality: async () => [],
      fetchFloodplainCountyCoverage: async () => emptyFloodplainCoverage,
      fetchLcraArrpOutfalls: async () => [],
      fetchLcraArrpLandPermits: async () => [],
      fetchLcraWaterQualitySites: async () => [],
      fetchLcraWaterQualitySiteParameters: async () => [],
      fetchLcraWaterQualitySiteObservations: async () => [],
    });

    const breakdown = await service.getCountyWaterBreakdown("Travis County");

    expect(breakdown.county.county.name.toLowerCase()).toContain("travis");
    expect(breakdown.layers.alerts).toEqual([]);
    expect(breakdown.layers.gauges).toEqual([]);
    expect(breakdown.layers.sewerOverflows).toEqual([]);
  });
});
