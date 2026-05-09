import { describe, expect, it, vi } from "vitest";

const fetchLcraArrpOutfalls = vi.fn();
const fetchLcraArrpLandPermits = vi.fn();
const buildWaterFreshness = vi.fn((sourceIds: string[]) => ({
  generatedAt: "2026-05-09T00:00:00.000Z",
  sources: Object.fromEntries(sourceIds.map((sourceId) => [sourceId, { cached: true, cachedAt: "2026-05-09T00:00:00.000Z", expiresAt: "2026-05-09T12:00:00.000Z", ttlMs: 43200000 }])),
}));

vi.mock("@/lib/water/lcra-arrp", () => ({
  fetchLcraArrpOutfalls,
  fetchLcraArrpLandPermits,
  filterLcraArrpOutfallsByCounty: vi.fn((rows, county: string) => rows.filter((row: { countyName?: string }) => row.countyName === "Travis County" && county.includes("travis"))),
  filterLcraArrpLandPermitsByCounty: vi.fn((rows, county: string) => rows.filter((row: { countyName?: string }) => row.countyName === "Burnet County" && county.includes("burnet"))),
}));

vi.mock("@/lib/water/freshness", () => ({
  buildWaterFreshness,
}));

describe("LCRA ARRP routes", () => {
  it("returns outfalls with optional county filter and freshness", async () => {
    fetchLcraArrpOutfalls.mockResolvedValue([
      { sourceId: "lcra-arrp-outfalls", recordId: "1", permitNumber: "A", permitteeName: "Alpha", status: "Current", countyName: "Travis County", latitude: 30.3, longitude: -97.8, raw: {} },
      { sourceId: "lcra-arrp-outfalls", recordId: "2", permitNumber: "B", permitteeName: "Beta", status: "Current", countyName: "Burnet County", latitude: 30.6, longitude: -98.2, raw: {} },
    ]);

    const { GET } = await import("@/app/api/water/lcra/arrp/outfalls/route");
    const response = await GET(new Request("http://localhost/api/water/lcra/arrp/outfalls?county=travis-county"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.outfalls).toHaveLength(1);
    expect(payload.outfalls[0].permitNumber).toBe("A");
    expect(payload.freshness.sources["lcra-arrp-outfalls"].cached).toBe(true);
  });

  it("returns land permits with optional county filter and freshness", async () => {
    fetchLcraArrpLandPermits.mockResolvedValue([
      { sourceId: "lcra-arrp-land-permits", recordId: "10", permitNumber: "L1", permitteeName: "Gamma", status: "Current", countyName: "Burnet County", latitude: 30.5, longitude: -98.1, raw: {} },
      { sourceId: "lcra-arrp-land-permits", recordId: "11", permitNumber: "L2", permitteeName: "Delta", status: "Pending", countyName: "Travis County", latitude: 30.3, longitude: -97.9, raw: {} },
    ]);

    const { GET } = await import("@/app/api/water/lcra/arrp/land-permits/route");
    const response = await GET(new Request("http://localhost/api/water/lcra/arrp/land-permits?county=burnet-county"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.permits).toHaveLength(1);
    expect(payload.permits[0].recordId).toBe("10");
    expect(payload.freshness.sources["lcra-arrp-land-permits"].ttlMs).toBe(43200000);
  });
});
