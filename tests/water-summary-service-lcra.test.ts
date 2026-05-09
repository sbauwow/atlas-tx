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
      fetchLcraWaterQualitySites: async () => [
        {
          sourceId: "lcra-water-quality-sites",
          siteId: "12281",
          siteName: "Travis monitor 1",
          segmentId: "1403",
          segmentName: "Segment 1403",
          rootSegmentId: "14",
          rootSegmentName: "Colorado",
          latitude: 30.3,
          longitude: -97.7,
          lastObservedAt: "2026-05-09T12:00:00Z",
          agency: "LCRA",
          isActive: true,
          impairedSegment: true,
          surfaceDataOverride: false,
          raw: {},
        },
        {
          sourceId: "lcra-water-quality-sites",
          siteId: "12282",
          siteName: "Travis monitor 2",
          segmentId: "1404",
          segmentName: "Segment 1404",
          rootSegmentId: "14",
          rootSegmentName: "Colorado",
          latitude: 30.31,
          longitude: -97.71,
          lastObservedAt: "2026-05-08T12:00:00Z",
          agency: "LCRA",
          isActive: false,
          impairedSegment: false,
          surfaceDataOverride: false,
          raw: {},
        },
        {
          sourceId: "lcra-water-quality-sites",
          siteId: "13000",
          siteName: "Hays monitor",
          segmentId: "1500",
          segmentName: "Segment 1500",
          rootSegmentId: "15",
          rootSegmentName: "Colorado",
          latitude: 29.9,
          longitude: -97.9,
          lastObservedAt: "2026-05-07T12:00:00Z",
          agency: "LCRA",
          isActive: true,
          impairedSegment: true,
          surfaceDataOverride: false,
          raw: {},
        },
      ],
      fetchLcraWaterQualitySiteParameters: async (siteId: string) => {
        if (siteId === "12281") {
          return [
            { sourceId: "lcra-water-quality-parameters", siteId, segmentId: "1403", storetCode: "00010", storetName: "Temperature", storetCategory: "Field", hasSurfaceData: true, raw: {} },
            { sourceId: "lcra-water-quality-parameters", siteId, segmentId: "1403", storetCode: "00300", storetName: "DO", storetCategory: "Chemistry", hasSurfaceData: true, raw: {} },
          ];
        }
        if (siteId === "12282") {
          return [
            { sourceId: "lcra-water-quality-parameters", siteId, segmentId: "1404", storetCode: "00300", storetName: "DO", storetCategory: "Chemistry", hasSurfaceData: true, raw: {} },
            { sourceId: "lcra-water-quality-parameters", siteId, segmentId: "1404", storetCode: "00665", storetName: "Phosphorus", storetCategory: "Nutrients", hasSurfaceData: true, raw: {} },
          ];
        }
        return [
          { sourceId: "lcra-water-quality-parameters", siteId, segmentId: "1500", storetCode: "00010", storetName: "Temperature", storetCategory: "Field", hasSurfaceData: true, raw: {} },
        ];
      },
      fetchLcraWaterQualitySiteObservations: async (siteId: string) => {
        if (siteId === "12281") {
          return [
            { sourceId: "lcra-water-quality-observations", siteId, segmentId: "1403", storetCode: "00300", storetName: "DO", storetCategory: "Chemistry", depth: null, agency: "LCRA", symbol: null, value: 8.1, observedAt: "2026-05-09T12:00:00Z", raw: {} },
            { sourceId: "lcra-water-quality-observations", siteId, segmentId: "1403", storetCode: "00300", storetName: "DO", storetCategory: "Chemistry", depth: null, agency: "LCRA", symbol: null, value: 8.0, observedAt: "2026-05-08T12:00:00Z", raw: {} },
            { sourceId: "lcra-water-quality-observations", siteId, segmentId: "1403", storetCode: "00010", storetName: "Temperature", storetCategory: "Field", depth: null, agency: "LCRA", symbol: null, value: 20.4, observedAt: "2026-05-07T12:00:00Z", raw: {} },
          ];
        }
        if (siteId === "12282") {
          return [
            { sourceId: "lcra-water-quality-observations", siteId, segmentId: "1404", storetCode: "00665", storetName: "Phosphorus", storetCategory: "Nutrients", depth: null, agency: "LCRA", symbol: null, value: 0.03, observedAt: "2026-05-08T12:00:00Z", raw: {} },
          ];
        }
        return [
          { sourceId: "lcra-water-quality-observations", siteId, segmentId: "1500", storetCode: "00010", storetName: "Temperature", storetCategory: "Field", depth: null, agency: "LCRA", symbol: null, value: 21.0, observedAt: "2026-05-07T12:00:00Z", raw: {} },
        ];
      },
    });

    const overview = await service.getWaterOverview();
    const travis = overview.counties.find((county) => county.county.slug === "travis-county");
    expect(travis).toMatchObject({
      county: { name: "Travis County", slug: "travis-county" },
      metrics: {
        lcraArrpOutfallCount: 1,
        lcraArrpLandPermitCount: 1,
        activeLcraQualitySiteCount: 1,
        impairedLcraMonitoringSiteCount: 1,
        latestLcraObservationAt: "2026-05-09T12:00:00Z",
      },
    });

    const detail = await service.getCountyWaterBreakdown("travis-county");
    expect(detail.county.metrics.lcraArrpOutfallCount).toBe(1);
    expect(detail.county.metrics.lcraArrpLandPermitCount).toBe(1);
    expect(detail.county.metrics.activeLcraQualitySiteCount).toBe(1);
    expect(detail.county.metrics.impairedLcraMonitoringSiteCount).toBe(1);
    expect(detail.county.metrics.availableLcraParameterCount).toBe(3);
    expect(detail.county.metrics.latestLcraObservationAt).toBe("2026-05-09T12:00:00Z");
    expect(detail.layers.lcraArrpOutfalls).toHaveLength(1);
    expect(detail.layers.lcraArrpLandPermits).toHaveLength(1);
    expect(detail.layers.lcraWaterQualitySites).toHaveLength(2);
    expect(detail.notes.join(" ")).toContain("LCRA quality sites: 2 total / 1 active / 1 impaired");
    expect(detail.notes.join(" ")).toContain("Top STORET: DO (2), Temperature (1), Phosphorus (1)");
  });
});
