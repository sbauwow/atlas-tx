import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/water/fema-nfhl", () => ({
  fetchTexasNfhlCountyCoverage: vi.fn().mockResolvedValue({
    sourceId: "fema-nfhl",
    layerId: 22,
    layerName: "Political Jurisdictions",
    countyCount: 1,
    counties: [
      {
        county: { name: "Travis County", slug: "travis-county", fips: "48453" },
        jurisdictionCount: 2,
        jurisdictionNames: ["CITY OF AUSTIN", "CITY OF WEST LAKE HILLS"],
        dfirmIds: ["48453C", "48453D"],
        communityIds: ["480624", "481876"],
      },
    ],
  }),
}));

describe("FEMA NFHL counties route", () => {
  it("returns joined Atlas county coverage from political jurisdictions", async () => {
    const { GET } = await import("@/app/api/water/fema/nfhl/counties/route");
    const response = await GET(new Request("http://localhost/api/water/fema/nfhl/counties"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.countyCount).toBe(1);
    expect(payload.counties[0].county.slug).toBe("travis-county");
    expect(payload.counties[0].jurisdictionCount).toBe(2);
  });
});
