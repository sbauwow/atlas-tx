import { describe, expect, it } from "vitest";
import {
  buildNfhlLayerQueryUrl,
  buildTexasPoliticalJurisdictionsQueryUrl,
  extractCountyRelevantNfhlLayers,
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
});
