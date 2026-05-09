import { describe, expect, it, vi } from "vitest";

const fetchGbraHydrologyMajorRivers = vi.fn();
const fetchGbraHydrologyLakes = vi.fn();
const buildWaterFreshness = vi.fn((sourceIds: string[]) => ({
  generatedAt: "2026-05-09T00:00:00.000Z",
  sources: Object.fromEntries(sourceIds.map((sourceId) => [sourceId, { cached: true, cachedAt: "2026-05-09T00:00:00.000Z", expiresAt: "2026-05-10T00:00:00.000Z", ttlMs: 86400000 }])),
}));

vi.mock("@/lib/water/gbra-hydrology", () => ({
  fetchGbraHydrologyMajorRivers,
  fetchGbraHydrologyLakes,
  filterGbraHydrologyMajorRiversByName: vi.fn((rows, name: string) => rows.filter((row: { name: string }) => row.name.toLowerCase().includes(name.toLowerCase()))),
  filterGbraHydrologyLakesByName: vi.fn((rows, name: string) => rows.filter((row: { name: string }) => row.name.toLowerCase().includes(name.toLowerCase()))),
}));

vi.mock("@/lib/water/freshness", () => ({ buildWaterFreshness }));

describe("GBRA hydrology routes", () => {
  it("returns major rivers with optional name filter and freshness", async () => {
    fetchGbraHydrologyMajorRivers.mockResolvedValue([
      { sourceId: "gbra-hydrology-major-rivers", objectId: 2, name: "Guadalupe River", miles: 422.67, shapeLength: 680225.1, raw: {} },
      { sourceId: "gbra-hydrology-major-rivers", objectId: 5, name: "San Marcos River", miles: 85.72, shapeLength: 137967.0, raw: {} },
    ]);

    const { GET } = await import("@/app/api/water/gbra/hydrology/major-rivers/route");
    const response = await GET(new Request("http://localhost/api/water/gbra/hydrology/major-rivers?name=guadalupe"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.rivers).toHaveLength(1);
    expect(payload.rivers[0].name).toBe("Guadalupe River");
    expect(payload.freshness.sources["gbra-hydrology-major-rivers"].cached).toBe(true);
  });

  it("returns GVHS lakes with optional name filter and freshness", async () => {
    fetchGbraHydrologyLakes.mockResolvedValue([
      { sourceId: "gbra-hydrology-gvhs-lakes", objectId: 1, name: "Lake Dunlap", areaAcres: 358.7, shapeArea: 1451752.6, shapeLength: 24737.9, raw: {} },
      { sourceId: "gbra-hydrology-gvhs-lakes", objectId: 7, name: "Canyon Lake", areaAcres: 8259.6, shapeArea: 33425609.9, shapeLength: 144671.5, raw: {} },
    ]);

    const { GET } = await import("@/app/api/water/gbra/hydrology/gvhs-lakes/route");
    const response = await GET(new Request("http://localhost/api/water/gbra/hydrology/gvhs-lakes?name=canyon"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.lakes).toHaveLength(1);
    expect(payload.lakes[0].name).toBe("Canyon Lake");
    expect(payload.freshness.sources["gbra-hydrology-gvhs-lakes"].ttlMs).toBe(86400000);
  });
});
