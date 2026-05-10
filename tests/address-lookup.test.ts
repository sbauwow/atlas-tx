import { describe, expect, it } from "vitest";

import { lookupAddress, haversineMiles } from "@/lib/address-lookup";
import type { GeocoderResult } from "@/lib/geocoding/census";

const TRAVIS_GEOCODE: GeocoderResult = {
  ok: true,
  address: {
    matchedAddress: "1100 CONGRESS AVE, AUSTIN, TX, 78701",
    latitude: 30.2747,
    longitude: -97.7404,
    countyFips: "48453",
    countyName: "Travis County",
    stateFips: "48",
    blockGroupGeoid: "484530011001",
    tractGeoid: "48453001100",
  },
};

function stubGeocoder(result: GeocoderResult) {
  return async () => result;
}

describe("haversineMiles", () => {
  it("returns ~0 miles for the same point", () => {
    expect(
      haversineMiles({ latitude: 30, longitude: -97 }, { latitude: 30, longitude: -97 }),
    ).toBeCloseTo(0, 5);
  });

  it("returns roughly 69 miles for one degree of latitude", () => {
    const distance = haversineMiles(
      { latitude: 30, longitude: -97 },
      { latitude: 31, longitude: -97 },
    );
    expect(distance).toBeGreaterThan(68);
    expect(distance).toBeLessThan(70);
  });
});

describe("lookupAddress", () => {
  it("returns a composite envelope keyed off the resolved county", async () => {
    const envelope = await lookupAddress(
      { address: "1100 Congress Ave, Austin, TX" },
      {
        geocoder: stubGeocoder(TRAVIS_GEOCODE),
        loaders: {
          waterBreakdown: async (slug) => ({
            county: {
              county: { name: "Travis County", slug, fips: "48453" },
              metrics: {
                streamGaugeCount: 4,
                activeWaterAlertCount: 1,
                sewerOverflowCount30d: 2,
                generalPermitCount: 7,
              },
              overlays: {
                hasFloodplainLayer: true,
                hasGaugeLayer: true,
                hasAlertLayer: true,
                hasSewerOverflowLayer: true,
                hasSurfaceWaterImpairmentLayer: false,
              },
              annotations: [],
            },
            layers: {
              alerts: [
                {
                  sourceId: "nws-alerts",
                  alertId: "nws-1",
                  event: "Flood Warning",
                  severity: "Severe",
                  geometryType: "polygon",
                  raw: {},
                },
              ],
              gauges: [
                {
                  sourceId: "usgs-stream-sites",
                  siteNumber: "08158000",
                  stationName: "Colorado Rv at Austin",
                  countyName: "Travis County",
                  countyFips: "48453",
                  latitude: 30.245,
                  longitude: -97.7,
                  raw: {},
                },
                {
                  sourceId: "usgs-stream-sites",
                  siteNumber: "08158600",
                  stationName: "Walnut Ck at Webberville",
                  countyName: "Travis County",
                  countyFips: "48453",
                  latitude: 30.31,
                  longitude: -97.6,
                  raw: {},
                },
              ],
              sewerOverflows: [
                {
                  sourceId: "tceq-sewer-overflows",
                  incidentNumber: "OF-1",
                  countyName: "Travis County",
                  startDate: "2026-04-30",
                  raw: {},
                },
              ],
              permits: [],
              governance: [
                {
                  sourceId: "tceq-water-districts",
                  entityId: "DIST-1",
                  entityName: "Travis County MUD No. 1",
                  countyName: "Travis County",
                  entityType: "Municipal Utility District",
                  activityStatus: "Active",
                  city: "Austin",
                  raw: {},
                },
                {
                  sourceId: "tceq-water-districts",
                  entityId: "DIST-2",
                  entityName: "Northwest Travis SUD",
                  countyName: "Travis County",
                  entityType: "Special Utility District",
                  activityStatus: "Active",
                  city: null,
                  raw: {},
                },
                {
                  sourceId: "puct-water-iou",
                  entityId: "CCN-1234",
                  entityName: "Aqua Texas",
                  countyName: "Travis County",
                  entityType: "Investor-Owned Utility",
                  activityStatus: null,
                  city: "Austin",
                  raw: {},
                },
              ],
              surfaceWaterQuality: [
                {
                  layerId: 7,
                  layerName: "Segments",
                  countyName: "Travis County",
                  segmentId: "1428",
                  segmentName: "Lady Bird Lake",
                  basinName: "Colorado",
                  segmentClass: null,
                  segmentType: null,
                  size: null,
                  sizeUnit: null,
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
                  sourceUrl: "https://example.test/segment/1428",
                },
              ],
              lcraArrpOutfalls: [],
              lcraArrpLandPermits: [],
              lcraWaterQualitySites: [],
            },
            notes: [],
          }),
          countyBreakdown: async () => null,
          sdwis: async () => [
            {
              pwsid: "TX2270001",
              pwsName: "City of Austin",
              county: "Travis County",
              populationServed: 1000000,
              violationId: "v1",
              violationCode: null,
              violationCategory: null,
              isHealthBased: true,
              contaminantCode: null,
              complianceStatusCode: null,
              complPerBeginDate: null,
              complPerEndDate: "2025-09-30",
              pwsTypeCode: null,
              ruleCode: null,
              ruleGroupCode: null,
              publicNotificationTier: null,
            },
            {
              pwsid: "TX2270001",
              pwsName: "City of Austin",
              county: "Travis County",
              populationServed: 1000000,
              violationId: "v2",
              violationCode: null,
              violationCategory: null,
              isHealthBased: false,
              contaminantCode: null,
              complianceStatusCode: null,
              complPerBeginDate: null,
              complPerEndDate: "2025-12-31",
              pwsTypeCode: null,
              ruleCode: null,
              ruleGroupCode: null,
              publicNotificationTier: null,
            },
            {
              pwsid: "TX2270002",
              pwsName: "Wells Branch MUD",
              county: "Travis County",
              populationServed: 12000,
              violationId: "v3",
              violationCode: null,
              violationCategory: null,
              isHealthBased: true,
              contaminantCode: null,
              complianceStatusCode: null,
              complPerBeginDate: null,
              complPerEndDate: "2025-06-30",
              pwsTypeCode: null,
              ruleCode: null,
              ruleGroupCode: null,
              publicNotificationTier: null,
            },
            {
              pwsid: "TX0570001",
              pwsName: "Other County PWS",
              county: "Dallas County",
              populationServed: 50000,
              violationId: "v4",
              violationCode: null,
              violationCategory: null,
              isHealthBased: true,
              contaminantCode: null,
              complianceStatusCode: null,
              complPerBeginDate: null,
              complPerEndDate: "2025-04-30",
              pwsTypeCode: null,
              ruleCode: null,
              ruleGroupCode: null,
              publicNotificationTier: null,
            },
          ],
          permits: async () => [
            {
              permitNumber: "WQ0001",
              authorizationType: "Discharge",
              authorizationStatus: "PENDING",
              permitteeName: "Austin Industrial",
              county: "Travis County",
              nearestCity: "Austin",
              latitude: 30.27,
              longitude: -97.74,
            },
            {
              permitNumber: "WQ0002",
              authorizationType: "Discharge",
              authorizationStatus: "PENDING",
              permitteeName: "Pflugerville Plant",
              county: "Travis County",
              nearestCity: "Pflugerville",
              latitude: 30.45,
              longitude: -97.6,
            },
            {
              permitNumber: "WQ9999",
              authorizationType: "Discharge",
              authorizationStatus: "PENDING",
              permitteeName: "Dallas Co Plant",
              county: "Dallas County",
              nearestCity: "Dallas",
              latitude: 32.78,
              longitude: -96.8,
            },
          ],
          acsPopulation: async () => ({
            "Travis County": 1300000,
            "Dallas County": 2600000,
          }),
        },
      },
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;

    expect(envelope.data.county?.slug).toBe("travis-county");
    expect(envelope.data.county?.fips).toBe("48453");
    expect(envelope.data.demographics.countyPopulation).toBe(1300000);

    // PWS list should rank in-county systems only, by health-based count then population.
    expect(envelope.data.pws.map((p) => p.pwsid)).toEqual(["TX2270001", "TX2270002"]);
    expect(envelope.data.pws[0].healthBasedViolationCount).toBe(1);

    // Permits should be filtered to Travis County and sorted by distance from the geocoded point.
    expect(envelope.data.permits.pendingInCounty).toBe(2);
    expect(envelope.data.permits.nearest[0].permitNumber).toBe("WQ0001");
    expect(envelope.data.permits.nearest[0].distanceMiles).toBeLessThan(2);

    // Gauges sorted by distance.
    expect(envelope.data.water.nearestGauges[0].siteNumber).toBe("08158000");
    expect(envelope.data.water.surfaceWaterSegments[0].isImpaired).toBe(true);
    expect(envelope.data.water.activeAlerts).toHaveLength(1);
    expect(envelope.data.water.nearbySewerOverflows).toHaveLength(1);

    // Governance: classified into MUD/SUD/IOU buckets.
    expect(envelope.data.governance.totalCount).toBe(3);
    expect(envelope.data.governance.byCode.MUD).toBe(1);
    expect(envelope.data.governance.byCode.SUD).toBe(1);
    expect(envelope.data.governance.byCode.IOU).toBe(1);
    const codes = envelope.data.governance.entities.map((e) => e.code);
    expect(codes).toContain("MUD");
    expect(codes).toContain("SUD");

    expect(envelope.sources).toContain("us-census-geocoder");
    expect(envelope.sources).toContain("tceq-water-districts");
    expect(envelope.caveats.length).toBeGreaterThan(0);
  });

  it("groups SDWIS storage facilities under the in-county PWS list", async () => {
    const envelope = await lookupAddress(
      { address: "1100 Congress Ave, Austin, TX" },
      {
        geocoder: stubGeocoder(TRAVIS_GEOCODE),
        loaders: {
          waterBreakdown: async () => null,
          countyBreakdown: async () => null,
          sdwis: async () => [
            {
              pwsid: "TX2270001",
              pwsName: "City of Austin",
              county: "Travis County",
              populationServed: 1000000,
              violationId: null,
              violationCode: null,
              violationCategory: null,
              isHealthBased: true,
              contaminantCode: null,
              complianceStatusCode: null,
              complPerBeginDate: null,
              complPerEndDate: "2025-09-30",
              pwsTypeCode: null,
              ruleCode: null,
              ruleGroupCode: null,
              publicNotificationTier: null,
            },
          ],
          sdwisFacilities: async () => [
            {
              pwsid: "TX2270001",
              facilityId: "1",
              facilityName: "AUSTIN GST 0.5 MG",
              stateFacilityId: "ST1",
              facilityTypeCode: "ST",
              isActive: true,
            },
            {
              pwsid: "TX2270001",
              facilityId: "2",
              facilityName: "AUSTIN ELEVATED 1 MG",
              stateFacilityId: "ST2",
              facilityTypeCode: "ST",
              isActive: true,
            },
            {
              pwsid: "TX2270001",
              facilityId: "3",
              facilityName: "AUSTIN INACTIVE",
              stateFacilityId: "ST3",
              facilityTypeCode: "ST",
              isActive: false,
            },
            {
              pwsid: "TX2270001",
              facilityId: "4",
              facilityName: "AUSTIN WELL 1",
              stateFacilityId: "WL1",
              facilityTypeCode: "WL",
              isActive: true,
            },
            {
              pwsid: "TX0570001",
              facilityId: "5",
              facilityName: "DALLAS TANK (off-county)",
              stateFacilityId: "ST99",
              facilityTypeCode: "ST",
              isActive: true,
            },
          ],
          permits: async () => [],
          acsPopulation: async () => ({}),
        },
      },
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;

    expect(envelope.data.storage.totalCount).toBe(2);
    expect(envelope.data.storage.pwsCount).toBe(1);
    expect(envelope.data.storage.groups[0].pwsid).toBe("TX2270001");
    expect(
      envelope.data.storage.groups[0].facilities.map((f) => f.facilityId),
    ).toEqual(["2", "1"]);
    expect(envelope.sources).toContain("epa-sdwis-water-system-facilities");
  });

  it("returns the geocoder error envelope when the address does not match", async () => {
    const envelope = await lookupAddress(
      { address: "Nowhere" },
      {
        geocoder: stubGeocoder({
          ok: false,
          error: { kind: "no-match", message: "no match" },
        }),
      },
    );

    expect(envelope.ok).toBe(false);
    if (envelope.ok) return;
    expect(envelope.error.kind).toBe("no-match");
  });

  it("rejects out-of-state geocodes from the upstream geocoder", async () => {
    const envelope = await lookupAddress(
      { address: "1600 Pennsylvania Ave NW, Washington, DC" },
      {
        geocoder: stubGeocoder({
          ok: false,
          error: { kind: "out-of-state", message: "DC is FIPS 11" },
        }),
      },
    );

    expect(envelope.ok).toBe(false);
    if (envelope.ok) return;
    expect(envelope.error.kind).toBe("out-of-state");
  });
});
