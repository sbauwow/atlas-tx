import { describe, expect, it } from "vitest";
import { createHydrologyDependencyService } from "@/lib/water/hydrology-dependencies";

describe("createHydrologyDependencyService", () => {
  it("builds directed downstream dependency graph with county scores", async () => {
    const service = createHydrologyDependencyService({
      loadSeedEdges: async () => [
        { upstreamCountySlug: "travis-county", downstreamCountySlug: "bastrop-county", weight: 1, evidence: "river" },
        { upstreamCountySlug: "hays-county", downstreamCountySlug: "caldwell-county", weight: 1, evidence: "river" },
        { upstreamCountySlug: "caldwell-county", downstreamCountySlug: "bastrop-county", weight: 1, evidence: "river" },
      ],
    });

    const graph = await service.buildGraph();

    expect(graph.flowDirectionMethod).toBe("seeded-river-network-v1");
    expect(graph.edges).toHaveLength(3);
    expect(graph.nodes.find((n) => n.countySlug === "bastrop-county")?.downstreamDependencyScore).toBe(2);
    expect(graph.nodes.find((n) => n.countySlug === "travis-county")?.upstreamContributionScore).toBe(1);
  });
});
