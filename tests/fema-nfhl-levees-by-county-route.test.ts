import { describe, expect, it, vi } from "vitest";

const fetchTexasNfhlLeveesByCounty = vi.fn().mockResolvedValue({
  sourceId: "fema-nfhl",
  layerId: 23,
  layerName: "Levees",
  countyCount: 2,
  counties: [
    {
      county: { name: "Aransas County", slug: "aransas-county", fips: "48007" },
      leveeCount: 3,
      leveeNames: ["Aransas Pass Levee and Floodwall"],
      leveeIds: ["48007C_500", "48007C_501"],
    },
    {
      county: { name: "Brazoria County", slug: "brazoria-county", fips: "48039" },
      leveeCount: 1,
      leveeNames: ["Brazoria Flood Barrier"],
      leveeIds: ["48039C_100"],
    },
  ],
});

vi.mock("@/lib/water/fema-nfhl", () => ({
  fetchTexasNfhlLeveesByCounty,
}));

describe("FEMA NFHL levees-by-county route", () => {
  it("returns county-level levee summary", async () => {
    const { GET } = await import("@/app/api/water/fema/nfhl/levees-by-county/route");
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.countyCount).toBe(2);
    expect(payload.counties[0].county.slug).toBe("aransas-county");
    expect(payload.freshness.sources["fema-nfhl-levees"].cached).toBeDefined();
  });
});
