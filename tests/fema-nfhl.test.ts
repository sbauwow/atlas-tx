import { describe, expect, it } from "vitest";
import { buildNfhlLayerQueryUrl, extractCountyRelevantNfhlLayers, normalizeNfhlServiceMetadata } from "@/lib/water/fema-nfhl";

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
});
