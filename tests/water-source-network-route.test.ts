import { describe, expect, it, vi } from "vitest";

const buildNetwork = vi.fn();

vi.mock("@/lib/water/source-network", () => ({
  getDefaultCountyDependencyNetworkService: () => ({ buildNetwork }),
}));

describe("GET /api/water/sources/network", () => {
  it("returns county dependency network payload", async () => {
    buildNetwork.mockResolvedValueOnce({ schemaVersion: 1, nodes: [], edges: [] });

    const routeModule = await import("@/app/api/water/sources/network/route");
    const response = await routeModule.GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ schemaVersion: 1, nodes: [], edges: [] });
  });
});
