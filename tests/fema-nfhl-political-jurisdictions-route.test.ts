import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/water/fema-nfhl", () => ({
  fetchTexasNfhlPoliticalJurisdictions: vi.fn().mockResolvedValue({
    sourceId: "fema-nfhl",
    layerId: 22,
    layerName: "Political Jurisdictions",
    where: "ST_FIPS='48'",
    featureCount: 1,
    exceededTransferLimit: false,
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
          POL_NAME1: "CITY OF THREE RIVERS",
        },
      },
    ],
  }),
}));

describe("FEMA NFHL political jurisdictions route", () => {
  it("returns the first live Texas political jurisdictions slice", async () => {
    const { GET } = await import("@/app/api/water/fema/nfhl/political-jurisdictions/route");
    const response = await GET(new Request("http://localhost/api/water/fema/nfhl/political-jurisdictions?limit=1"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.layerId).toBe(22);
    expect(payload.features[0].jurisdictionName).toBe("CITY OF THREE RIVERS");
  });
});
