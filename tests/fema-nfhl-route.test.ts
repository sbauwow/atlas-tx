import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/water/fema-nfhl", () => ({
  fetchNfhlDiscoveryBundle: vi.fn().mockResolvedValue({
    metadata: {
      sourceId: "fema-nfhl",
      mapName: "NFHL",
      currentVersion: 11.1,
      layerCount: 3,
      layers: [
        { id: 20, name: "Water Lines", geometryType: "esriGeometryPolyline" },
        { id: 22, name: "Political Jurisdictions", geometryType: "esriGeometryPolygon" },
        { id: 23, name: "Levees", geometryType: "esriGeometryPolyline" },
      ],
    },
    relevantLayers: [
      { id: 22, name: "Political Jurisdictions", geometryType: "esriGeometryPolygon" },
      { id: 23, name: "Levees", geometryType: "esriGeometryPolyline" },
    ],
  }),
}));

describe("FEMA NFHL discovery route", () => {
  it("returns normalized metadata and county-relevant layers", async () => {
    const { GET } = await import("@/app/api/water/fema/nfhl/route");
    const response = await GET(new Request("http://localhost/api/water/fema/nfhl"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.metadata.sourceId).toBe("fema-nfhl");
    expect(payload.relevantLayers.map((layer: { name: string }) => layer.name)).toEqual([
      "Political Jurisdictions",
      "Levees",
    ]);
  });
});
