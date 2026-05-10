import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/atlas-botnet-state", () => ({
  getAtlasBotnetState: async () => ({
    pipelineHealth: {
      generatedAt: "2026-05-10T00:00:00.000Z",
      overallStatus: "degraded",
      steps: [
        {
          stepId: "refresh-twdb-hydrology",
          status: "ok",
          startedAt: "2026-05-10T00:00:00.000Z",
          endedAt: "2026-05-10T00:01:00.000Z",
          durationMs: 60000,
          outputPath: "public/cache/twdb-hydrology.json",
          notes: [],
        },
        {
          stepId: "refresh-cid",
          status: "failed",
          startedAt: "2026-05-10T00:10:00.000Z",
          endedAt: "2026-05-10T00:11:00.000Z",
          durationMs: 60000,
          outputPath: "public/cache/pipeline-health.json",
          notes: ["CID Search One returned the upstream error page"],
        },
      ],
    },
    roadmapQueue: {
      generatedAt: "2026-05-10T01:00:00.000Z",
      scope: "atlas-tx-roadmap-open-data-botnet",
      candidateCount: 2,
      waves: { "wave-3": 1, "wave-4": 1 },
      candidates: [
        {
          executionUnitId: "boil-water-notices",
          name: "Boil-water notices",
          roadmapWave: "wave-3",
          roadmapPhaseLabel: "later",
          strategicPriority: "very-high",
          evidenceClass: "authoritative",
          thesisLane: "contradiction-detection",
          upstreamType: "manual-discovery",
          grain: "pws-event",
          geographicJoinStrategy: "pws-to-county",
          downstreamConsumers: ["water-ui"],
          activationCriteria: ["upstream_source_verified"],
          nextAction: "verify-upstream-source",
          executionUnit: { id: "boil-water-notices", status: "planned" },
        },
        {
          executionUnitId: "citizen-water-observations",
          name: "Citizen water observations",
          roadmapWave: "wave-4",
          roadmapPhaseLabel: "future-community",
          strategicPriority: "high",
          evidenceClass: "community",
          thesisLane: "community-verification",
          upstreamType: "app-capture",
          grain: "site-observation",
          geographicJoinStrategy: "point-in-county",
          downstreamConsumers: ["citizen-ui"],
          activationCriteria: ["community_data_isolated"],
          nextAction: "verify-upstream-source",
          executionUnit: { id: "citizen-water-observations", status: "planned" },
        },
      ],
    },
    executionRegistrySummary: {
      totalUnits: 22,
      byWave: { "wave-0": 8, "wave-1": 5, "wave-2": 5, "wave-3": 3, "wave-4": 1 },
      plannedUnitCount: 4,
      activeUnitCount: 13,
    },
    queueCandidates: [
      {
        executionUnitId: "boil-water-notices",
        name: "Boil-water notices",
        roadmapWave: "wave-3",
        roadmapPhaseLabel: "later",
        strategicPriority: "very-high",
        evidenceClass: "authoritative",
        thesisLane: "contradiction-detection",
        upstreamType: "manual-discovery",
        grain: "pws-event",
        geographicJoinStrategy: "pws-to-county",
        downstreamConsumers: ["water-ui"],
        activationCriteria: ["upstream_source_verified"],
        nextAction: "verify-upstream-source",
        executionUnit: { id: "boil-water-notices", status: "planned" },
      },
      {
        executionUnitId: "citizen-water-observations",
        name: "Citizen water observations",
        roadmapWave: "wave-4",
        roadmapPhaseLabel: "future-community",
        strategicPriority: "high",
        evidenceClass: "community",
        thesisLane: "community-verification",
        upstreamType: "app-capture",
        grain: "site-observation",
        geographicJoinStrategy: "point-in-county",
        downstreamConsumers: ["citizen-ui"],
        activationCriteria: ["community_data_isolated"],
        nextAction: "verify-upstream-source",
        executionUnit: { id: "citizen-water-observations", status: "planned" },
      },
    ],
  }),
}));

describe("data botnet page", () => {
  it("renders operator-facing ingest status and roadmap queue state", async () => {
    const pageModule = await import("@/app/data/botnet/page");
    const html = renderToStaticMarkup(await pageModule.default());

    expect(html).toContain("Atlas ingest botnet status");
    expect(html).toContain("Internal operator view");
    expect(html).toContain("Pipeline status");
    expect(html).toContain("degraded");
    expect(html).toContain("Execution units");
    expect(html).toContain("Roadmap queue");
    expect(html).toContain("refresh-cid");
    expect(html).toContain("Boil-water notices");
    expect(html).toContain("Citizen water observations");
    expect(html).toContain("npm run mcp -- get_roadmap_open_data_queue");
    expect(html).toContain('href="/data"');
  });
});
