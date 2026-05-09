import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/water/usgs", () => ({
  fetchTexasStreamGauges: vi.fn().mockResolvedValue([
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
  ]),
  filterGaugesForCounty: vi.fn((gauges: Array<{ countyName?: string }>, county: string) => gauges.filter((gauge) => gauge.countyName === "Travis County" && county.includes("travis"))),
}));

describe("water gauges API route", () => {
  it("returns all Texas stream gauges", async () => {
    const { GET } = await import("@/app/api/water/gauges/route");
    const response = await GET(new Request("http://localhost/api/water/gauges"));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.gauges[0].siteNumber).toBe("08158000");
  });

  it("filters gauges by county query param", async () => {
    const { GET } = await import("@/app/api/water/gauges/route");
    const response = await GET(new Request("http://localhost/api/water/gauges?county=travis-county"));
    const payload = await response.json();
    expect(payload.gauges).toHaveLength(1);
  });
});
