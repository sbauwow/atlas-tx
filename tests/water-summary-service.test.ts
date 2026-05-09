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
      ],
      fetchGovernance: async () => [],
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
    });

    const overview = await service.getWaterOverview();
    expect(overview.counties[0]).toMatchObject({
      county: { name: "Travis County", slug: "travis-county" },
      metrics: {
        floodplainFeatureCount: 2,
        streamGaugeCount: 1,
        activeWaterAlertCount: 1,
        sewerOverflowCount30d: 1,
        sewerOverflowGallons30d: 200,
        generalPermitCount: 2,
      },
      overlays: {
        hasFloodplainLayer: true,
        hasGaugeLayer: true,
        hasAlertLayer: true,
        hasSewerOverflowLayer: true,
      },
    });

    const detail = await service.getCountyWaterBreakdown("travis");
    expect(detail.county.metrics.floodplainFeatureCount).toBe(2);
    expect(detail.county.overlays.hasFloodplainLayer).toBe(true);
    expect(detail.layers.alerts).toHaveLength(1);
    expect(detail.layers.gauges).toHaveLength(1);
    expect(detail.layers.sewerOverflows).toHaveLength(1);
  });
});
