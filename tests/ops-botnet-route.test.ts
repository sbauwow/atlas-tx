import { describe, expect, it, vi } from "vitest";

describe("GET /api/ops/botnet", () => {
  it("returns botnet state as JSON", async () => {
    vi.doMock("@/lib/atlas-botnet-state", () => ({
      getAtlasBotnetState: async () => ({
        pipelineHealth: { generatedAt: "2026-05-10T00:00:00.000Z", overallStatus: "ok", steps: [] },
        roadmapQueue: { generatedAt: "2026-05-10T01:00:00.000Z", scope: "atlas-tx-roadmap-open-data-botnet", candidateCount: 1, waves: { "wave-3": 1 }, candidates: [] },
        executionRegistrySummary: { totalUnits: 22, byWave: { "wave-0": 8 }, plannedUnitCount: 4, activeUnitCount: 13 },
      }),
    }));

    const routeModule = await import("@/app/api/ops/botnet/route");
    const response = await routeModule.GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.pipelineHealth.overallStatus).toBe("ok");
    expect(json.roadmapQueue.scope).toBe("atlas-tx-roadmap-open-data-botnet");
    expect(json.executionRegistrySummary.totalUnits).toBe(22);
  });
});
