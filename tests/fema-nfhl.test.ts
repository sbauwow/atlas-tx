import { describe, expect, it } from "vitest";
import {
  buildNfhlLayerQueryUrl,
  buildTexasLeveesQueryUrl,
  buildTexasPoliticalJurisdictionsQueryUrl,
  extractCountyRelevantNfhlLayers,
  mapNfhlPoliticalJurisdictionsToAtlasCounties,
  normalizeNfhlLeveesResponse,
  normalizeNfhlPoliticalJurisdictionsResponse,
  normalizeNfhlServiceMetadata,
} from "@/lib/water/fema-nfhl";

const sampleMetadata = {
  currentVersion: 11.1,
  mapName: "NFHL",
  layers: [
    { id: 0, name: "NFHL Availability", geometryType: "esriGeometryPolygon" },
    { id: 22, name: "Political Jurisdictions", geometryType: "esriGeometryPolygon" },
    { id: 23, name: "Levees", geometryType: "esriGeometryPolyline" },
    { id: 20, name: "Water Lines", geometryType: "esriGeometryPolyline" },
  ],
};

describe("FEMA NFHL discovery adapter", () => {
  it("normalizes service metadata into a compact discovery shape", () => {
    expect(normalizeNfhlServiceMetadata(sampleMetadata)).toEqual({
      sourceId: "fema-nfhl",
      mapName: "NFHL",
      currentVersion: 11.1,
      layerCount: 4,
      layers: [
        { id: 0, name: "NFHL Availability", geometryType: "esriGeometryPolygon" },
        { id: 22, name: "Political Jurisdictions", geometryType: "esriGeometryPolygon" },
        { id: 23, name: "Levees", geometryType: "esriGeometryPolyline" },
        { id: 20, name: "Water Lines", geometryType: "esriGeometryPolyline" },
      ],
    });
  });

  it("extracts county-relevant discovery layers from NFHL metadata", () => {
    expect(extractCountyRelevantNfhlLayers(sampleMetadata)).toEqual([
      { id: 22, name: "Political Jurisdictions", geometryType: "esriGeometryPolygon" },
      { id: 23, name: "Levees", geometryType: "esriGeometryPolyline" },
      { id: 20, name: "Water Lines", geometryType: "esriGeometryPolyline" },
    ]);
  });

  it("builds a bounded ArcGIS query URL for a layer", () => {
    expect(
      buildNfhlLayerQueryUrl(22, {
        where: "STATE='TX'",
        outFields: ["DFIRM_ID", "JURISDICTION"],
        returnGeometry: false,
      }),
    ).toBe(
      "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/22/query?where=STATE%3D%27TX%27&outFields=DFIRM_ID%2CJURISDICTION&returnGeometry=false&f=pjson",
    );
  });

  it("builds the Texas political jurisdictions query URL", () => {
    expect(buildTexasPoliticalJurisdictionsQueryUrl(2)).toBe(
      "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/22/query?where=ST_FIPS%3D%2748%27&outFields=OBJECTID%2CDFIRM_ID%2CPOL_NAME1%2CPOL_NAME2%2CPOL_NAME3%2CCO_FIPS%2CST_FIPS%2CCOMM_NO%2CCID&returnGeometry=false&f=pjson&resultRecordCount=2",
    );
  });

  it("normalizes Texas political jurisdictions query results", () => {
    expect(
      normalizeNfhlPoliticalJurisdictionsResponse({
        features: [
          {
            attributes: {
              OBJECTID: 883,
              DFIRM_ID: "481179",
              POL_NAME1: "CITY OF THREE RIVERS",
              POL_NAME2: null,
              POL_NAME3: null,
              CO_FIPS: "297",
              ST_FIPS: "48",
              COMM_NO: "5515",
              CID: "485515",
            },
          },
        ],
        exceededTransferLimit: true,
      }),
    ).toEqual({
      sourceId: "fema-nfhl",
      layerId: 22,
      layerName: "Political Jurisdictions",
      where: "ST_FIPS='48'",
      featureCount: 1,
      exceededTransferLimit: true,
      features: [
        {
          objectId: 883,
          dfirmId: "481179",
          jurisdictionName: "CITY OF THREE RIVERS",
          countyFips: "297",
          stateFips: "48",
          communityNumber: "5515",
          communityId: "485515",
          raw: {
            OBJECTID: 883,
            DFIRM_ID: "481179",
            POL_NAME1: "CITY OF THREE RIVERS",
            POL_NAME2: null,
            POL_NAME3: null,
            CO_FIPS: "297",
            ST_FIPS: "48",
            COMM_NO: "5515",
            CID: "485515",
          },
        },
      ],
    });
  });

  it("normalizes Texas levees query results", () => {
    expect(
      normalizeNfhlLeveesResponse({
        features: [
          {
            attributes: {
              OBJECTID: 15182,
              DFIRM_ID: "48007C",
              LEVEE_ID: "48007C_500",
              LEVEE_NM: "Aransas Pass Levee and Floodwall",
              LEVEE_TYP: "Coastal Levee Centerline",
              WTR_NM: "Redfish Bay",
              LEVEE_STAT: "De-Accredited",
              OWNER: "City of Aransas Pass",
              DISTRICT: "",
            },
          },
        ],
        exceededTransferLimit: true,
      }),
    ).toEqual({
      sourceId: "fema-nfhl",
      layerId: 23,
      layerName: "Levees",
      where: "DFIRM_ID LIKE '48%'",
      featureCount: 1,
      exceededTransferLimit: true,
      features: [
        {
          objectId: 15182,
          dfirmId: "48007C",
          leveeId: "48007C_500",
          leveeName: "Aransas Pass Levee and Floodwall",
          leveeType: "Coastal Levee Centerline",
          waterName: "Redfish Bay",
          leveeStatus: "De-Accredited",
          owner: "City of Aransas Pass",
          district: null,
          raw: {
            OBJECTID: 15182,
            DFIRM_ID: "48007C",
            LEVEE_ID: "48007C_500",
            LEVEE_NM: "Aransas Pass Levee and Floodwall",
            LEVEE_TYP: "Coastal Levee Centerline",
            WTR_NM: "Redfish Bay",
            LEVEE_STAT: "De-Accredited",
            OWNER: "City of Aransas Pass",
            DISTRICT: "",
          },
        },
      ],
    });
  });

  it("builds the Texas levees query URL", () => {
    expect(buildTexasLeveesQueryUrl(2)).toBe(
      "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/23/query?where=DFIRM_ID+LIKE+%2748%25%27&outFields=OBJECTID%2CDFIRM_ID%2CLEVEE_ID%2CLEVEE_NM%2CLEVEE_TYP%2CWTR_NM%2CLEVEE_STAT%2COWNER%2CDISTRICT&returnGeometry=false&f=pjson&resultRecordCount=2",
    );
  });

  it("maps political jurisdictions onto Atlas counties by FIPS", () => {
    expect(
      mapNfhlPoliticalJurisdictionsToAtlasCounties({
        sourceId: "fema-nfhl",
        layerId: 22,
        layerName: "Political Jurisdictions",
        where: "ST_FIPS='48'",
        featureCount: 3,
        exceededTransferLimit: false,
        features: [
          {
            objectId: 1,
            dfirmId: "48453A",
            jurisdictionName: "CITY OF AUSTIN",
            countyFips: "453",
            stateFips: "48",
            communityNumber: "0624",
            communityId: "480624",
            raw: {},
          },
          {
            objectId: 2,
            dfirmId: "48453B",
            jurisdictionName: "CITY OF WEST LAKE HILLS",
            countyFips: "453",
            stateFips: "48",
            communityNumber: "1876",
            communityId: "481876",
            raw: {},
          },
          {
            objectId: 3,
            dfirmId: "48029A",
            jurisdictionName: "CITY OF SAN ANTONIO",
            countyFips: "029",
            stateFips: "48",
            communityNumber: "0713",
            communityId: "480713",
            raw: {},
          },
        ],
      }),
    ).toEqual({
      sourceId: "fema-nfhl",
      layerId: 22,
      layerName: "Political Jurisdictions",
      countyCount: 2,
      counties: [
        {
          county: { name: "Bexar County", slug: "bexar-county", fips: "48029" },
          jurisdictionCount: 1,
          jurisdictionNames: ["CITY OF SAN ANTONIO"],
          dfirmIds: ["48029A"],
          communityIds: ["480713"],
        },
        {
          county: { name: "Travis County", slug: "travis-county", fips: "48453" },
          jurisdictionCount: 2,
          jurisdictionNames: ["CITY OF AUSTIN", "CITY OF WEST LAKE HILLS"],
          dfirmIds: ["48453A", "48453B"],
          communityIds: ["480624", "481876"],
        },
      ],
    });
  });
});
