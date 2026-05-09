import { describe, expect, it, vi } from "vitest";

const fetchLcraStageFlowReadings = vi.fn();
const fetchLcraLakeLevelReadings = vi.fn();
const buildWaterFreshness = vi.fn((sourceIds: string[]) => ({
  generatedAt: "2026-05-09T00:00:00.000Z",
  sources: Object.fromEntries(sourceIds.map((sourceId) => [sourceId, { cached: true, cachedAt: "2026-05-09T00:00:00.000Z", expiresAt: "2026-05-09T00:05:00.000Z", ttlMs: 300000 }])),
}));

vi.mock("@/lib/water/lcra-hydromet", () => ({
  fetchLcraStageFlowReadings,
  fetchLcraLakeLevelReadings,
  filterLcraStageFlowBySite: vi.fn((rows, siteNumber: string) => rows.filter((row: { siteNumber: string }) => row.siteNumber === siteNumber)),
  filterLcraLakeLevelsBySite: vi.fn((rows, siteNumber: string) => rows.filter((row: { siteNumber: string }) => row.siteNumber === siteNumber)),
}));

vi.mock("@/lib/water/freshness", () => ({
  buildWaterFreshness,
}));

describe("LCRA hydromet routes", () => {
  it("returns stage-flow readings with optional site filter and freshness", async () => {
    fetchLcraStageFlowReadings.mockResolvedValue([
      { sourceId: "lcra-hydromet-stageflow", siteNumber: "4558", stationName: "Colorado River at Austin", observedAt: "2026-05-09T04:40:11Z", stageFeet: 15.04, flowCfs: 1005, raw: {} },
      { sourceId: "lcra-hydromet-stageflow", siteNumber: "5499", stationName: "Colorado River at Bastrop", observedAt: "2026-05-09T04:40:23Z", stageFeet: 2.93, flowCfs: 606, raw: {} },
    ]);

    const { GET } = await import("@/app/api/water/lcra/hydromet/stage-flow/route");
    const response = await GET(new Request("http://localhost/api/water/lcra/hydromet/stage-flow?siteNumber=4558"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.readings).toHaveLength(1);
    expect(payload.readings[0].siteNumber).toBe("4558");
    expect(payload.freshness.sources["lcra-hydromet-stageflow"].cached).toBe(true);
  });

  it("returns lake-level readings with optional site filter and freshness", async () => {
    fetchLcraLakeLevelReadings.mockResolvedValue([
      { sourceId: "lcra-hydromet-lakelevels", siteNumber: "3963", stationName: "Mansfield Dam", observedAt: "2026-05-09T04:40:06Z", elevationFeet: 664.13, raw: {} },
      { sourceId: "lcra-hydromet-lakelevels", siteNumber: "3999", stationName: "Tom Miller Dam", observedAt: "2026-05-09T04:40:07Z", elevationFeet: 492.14, raw: {} },
    ]);

    const { GET } = await import("@/app/api/water/lcra/hydromet/lake-levels/route");
    const response = await GET(new Request("http://localhost/api/water/lcra/hydromet/lake-levels?siteNumber=3963"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.readings).toHaveLength(1);
    expect(payload.readings[0].stationName).toBe("Mansfield Dam");
    expect(payload.freshness.sources["lcra-hydromet-lakelevels"].ttlMs).toBe(300000);
  });
});
