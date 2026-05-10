import { describe, expect, it, vi } from "vitest";

const buildGraph = vi.fn();

vi.mock("@/lib/water/hydrology-dependencies", () => ({
  getDefaultHydrologyDependencyService: () => ({ buildGraph }),
}));

describe("GET /api/water/sources/network/hydrology", () => {
  it("returns hydrology dependency graph", async () => {
    buildGraph.mockResolvedValueOnce({ flowDirectionMethod: "seeded-river-network-v1", nodes: [], edges: [] });

    const routeModule = await import("@/app/api/water/sources/network/hydrology/route");
    const response = await routeModule.GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ flowDirectionMethod: "seeded-river-network-v1", nodes: [], edges: [] });
  });
});
