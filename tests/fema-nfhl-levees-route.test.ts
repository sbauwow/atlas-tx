import { describe, expect, it, vi } from "vitest";

const fetchTexasNfhlLevees = vi.fn().mockResolvedValue({
  sourceId: "fema-nfhl",
  layerId: 23,
  layerName: "Levees",
  where: "DFIRM_ID LIKE '48%'",
  featureCount: 1,
  exceededTransferLimit: false,
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
      raw: { OBJECTID: 15182 },
    },
  ],
});

const fetchTexasNfhlCountyLevees = vi.fn().mockResolvedValue({
  sourceId: "fema-nfhl",
  layerId: 23,
  layerName: "Levees",
  where: "DFIRM_ID LIKE '48%'",
  featureCount: 1,
  exceededTransferLimit: false,
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
      raw: { OBJECTID: 15182 },
    },
  ],
});

vi.mock("@/lib/water/fema-nfhl", () => ({
  fetchTexasNfhlLevees,
  fetchTexasNfhlCountyLevees,
}));

describe("FEMA NFHL levees route", () => {
  it("returns the first live Texas levees slice", async () => {
    const { GET } = await import("@/app/api/water/fema/nfhl/levees/route");
    const response = await GET(new Request("http://localhost/api/water/fema/nfhl/levees?limit=1"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.layerId).toBe(23);
    expect(payload.features[0].leveeId).toBe("48007C_500");
  });

  it("filters levees by county query param", async () => {
    const { GET } = await import("@/app/api/water/fema/nfhl/levees/route");
    const response = await GET(new Request("http://localhost/api/water/fema/nfhl/levees?county=aransas-county"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetchTexasNfhlCountyLevees).toHaveBeenCalledWith("aransas-county", undefined);
    expect(payload.features[0].leveeId).toBe("48007C_500");
  });
});
