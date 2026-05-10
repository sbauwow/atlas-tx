import { describe, expect, it } from "vitest";
import { createAtlasWaterSummaryService } from "@/lib/water/water-summary-service";

describe("water summary service", () => {
  it("merges alerts, gauges, and sewer overflows into county water summaries and details", async () => {
    const service = createAtlasWaterSummaryService({
      fetchAlerts: async () => [
        {
          sourceId: "nws-alerts",
          alertId: "alert-1",
          event: "Flood Warning",
          countyNames: ["Travis County"],
          geometryType: "none",
          raw: {},
        },
      ],
      fetchGauges: async () => [
        {
          sourceId: "usgs-stream-sites",
          siteNumber: "08158000",
          stationName: "Colorado River at Austin",
          countyName: "Travis County",
          countyFips: "48453",
          latitude: 30.25,
          longitude: -97.75,
          siteType: "ST",
          status: "active",
          raw: {},
        },
      ],
      fetchSewerOverflows: async () => [
        {
          sourceId: "tceq-sewer-overflows",
          incidentNumber: "1",
          countyName: "Travis County",
          entityName: "Utility A",
          materialType: "Sewage",
          amountGallons: 200,
          raw: {},
        },
      ],
      fetchPermits: async () => [
        {
          sourceId: "tceq-general-water-permits",
          permitNumber: "TXG123",
          countyName: "Travis County",
          permitStatus: "ACTIVE",
          permitType: "GENERAL PERMIT AUTHORIZATION",
          siteName: "Alpha Ranch",
          latitude: 30.25,
          longitude: -97.75,
          raw: {},
        },
        {
          sourceId: "tceq-general-water-permits",
          permitNumber: "TXG456",
          countyName: "Travis County",
          permitStatus: "PENDING",
          permitType: "GENERAL PERMIT AUTHORIZATION",
          siteName: "Beta Ranch",
          latitude: 30.2,
          longitude: -97.7,
          raw: {},
        },
        {
          sourceId: "tceq-general-water-permits",
          permitNumber: "TXG310111",
          countyName: "Travis County",
          permitStatus: "ACTIVE",
          permitType: "GENERAL PERMIT AUTHORIZATION",
          siteName: "Oil Pad Gamma",
          latitude: 30.1,
          longitude: -97.6,
          raw: {},
        },
      ],
      fetchGovernance: async () => [],
      fetchSurfaceWaterQuality: async () => [
        {
          layerId: 8,
          layerName: "Stream Segments",
          countyName: "Travis County",
          segmentId: "0304",
          segmentName: "Days Creek",
          basinName: "Sulphur River Basin",
          segmentClass: "Classified",
          segmentType: "Freshwater Stream",
          size: 5.0175,
          sizeUnit: "Miles",
          assessmentYear: 2024,
          isImpaired: true,
          impairmentFlags: {
            aquaticLife: false,
            contactRecreation: true,
            generalUse: false,
            fishConsumption: false,
            publicWaterSupply: false,
            oysterWaters: false,
          },
          sourceUrl: "https://example.test/swq/8",
        },
        {
          layerId: 7,
          layerName: "Reservoir Segments",
          countyName: "Harris County",
          segmentId: "0102",
          segmentName: "Lake Example",
          basinName: "Example Basin",
          segmentClass: "Classified",
          segmentType: "Reservoir",
          size: 10,
          sizeUnit: "Acres",
          assessmentYear: 2024,
          isImpaired: false,
          impairmentFlags: {
            aquaticLife: false,
            contactRecreation: false,
            generalUse: false,
            fishConsumption: false,
            publicWaterSupply: false,
            oysterWaters: false,
          },
          sourceUrl: "https://example.test/swq/7",
        },
      ],
      fetchFloodplainCountyCoverage: async () => ({
        sourceId: "fema-nfhl",
        layerId: 22,
        layerName: "Political Jurisdictions",
        countyCount: 1,
        counties: [
          {
            county: { name: "Travis County", slug: "travis-county", fips: "48453" },
            jurisdictionCount: 2,
            jurisdictionNames: ["CITY OF AUSTIN", "CITY OF WEST LAKE HILLS"],
            dfirmIds: ["48453C"],
            communityIds: ["480624", "481876"],
          },
        ],
      }),
      fetchLcraArrpOutfalls: async () => [],
      fetchLcraArrpLandPermits: async () => [],
    });

    const overview = await service.getWaterOverview();
    const travis = overview.counties.find((county) => county.county.slug === "travis-county");
    expect(travis).toMatchObject({
      county: { name: "Travis County", slug: "travis-county" },
      metrics: {
        floodplainFeatureCount: 2,
        streamGaugeCount: 1,
        activeWaterAlertCount: 1,
        sewerOverflowCount30d: 1,
        sewerOverflowGallons30d: 200,
        generalPermitCount: 3,
        oilAndGasExtractionPermitCount: 1,
        surfaceWaterSegmentCount: 1,
        impairedSurfaceWaterSegmentCount: 1,
      },
      overlays: {
        hasFloodplainLayer: true,
        hasGaugeLayer: true,
        hasAlertLayer: true,
        hasSewerOverflowLayer: true,
        hasSurfaceWaterImpairmentLayer: true,
      },
      mismatch: {
        score: 75,
        flags: [
          "surface-water impairment overlaps recent sewer overflow activity",
          "surface-water impairment is present with only light active alert coverage",
        ],
      },
    });
    expect(travis?.annotations).toContain(
      "Nearby surface-water impairment context is additive only; it is not a standalone verdict on county-wide harm.",
    );

    const detail = await service.getCountyWaterBreakdown("travis");
    expect(detail.county.metrics.floodplainFeatureCount).toBe(2);
    expect(detail.county.metrics.impairedSurfaceWaterSegmentCount).toBe(1);
    expect(detail.county.overlays.hasFloodplainLayer).toBe(true);
    expect(detail.county.overlays.hasSurfaceWaterImpairmentLayer).toBe(true);
    expect(detail.county.mismatch).toEqual({
      score: 75,
      flags: [
        "surface-water impairment overlaps recent sewer overflow activity",
        "surface-water impairment is present with only light active alert coverage",
      ],
    });
    expect(detail.county.annotations).toContain(
      "Nearby surface-water impairment context is additive only; it is not a standalone verdict on county-wide harm.",
    );
    expect(detail.layers.alerts).toHaveLength(1);
    expect(detail.layers.gauges).toHaveLength(1);
    expect(detail.layers.sewerOverflows).toHaveLength(1);
  });
});
