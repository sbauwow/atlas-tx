import { describe, expect, it } from "vitest";
import { createCountyDependencyNetworkService } from "@/lib/water/source-network";

describe("createCountyDependencyNetworkService", () => {
  it("builds county dependency edges and contagion scores from shared providers", async () => {
    const service = createCountyDependencyNetworkService({
      fetchGovernance: async () => [
        {
          sourceId: "puct-water-iou",
          entityId: "U-1",
          countyName: "Travis County",
          entityName: "Shared Utility",
          entityType: "Investor-Owned Utility",
          activityStatus: "Active",
          city: null,
          raw: {},
        },
        {
          sourceId: "puct-water-iou",
          entityId: "U-2",
          countyName: "Hays County",
          entityName: "Shared Utility",
          entityType: "Investor-Owned Utility",
          activityStatus: "Active",
          city: null,
          raw: {},
        },
      ],
      fetchPermits: async () => [
        {
          sourceId: "tceq-general-water-permits",
          permitNumber: "P-1",
          countyName: "Travis County",
          permitStatus: "Active",
          permitType: "General",
          siteName: "Regional Plant",
          raw: {},
        },
        {
          sourceId: "tceq-general-water-permits",
          permitNumber: "P-2",
          countyName: "Bastrop County",
          permitStatus: "Active",
          permitType: "General",
          siteName: "Regional Plant",
          raw: {},
        },
      ],
    });

    const network = await service.buildNetwork();

    const travis = network.nodes.find((n) => n.countySlug === "travis-county");
    expect(travis?.multiCountySourceCount).toBe(2);
    expect(travis?.contagionScore).toBeGreaterThan(0);

    expect(network.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fromCountySlug: "hays-county", toCountySlug: "travis-county", sharedSourceCount: 1 }),
        expect.objectContaining({ fromCountySlug: "bastrop-county", toCountySlug: "travis-county", sharedSourceCount: 1 }),
      ]),
    );

    expect(network.flowDirectionMethod).toBe("centroid-gulf-proxy-v1");
    expect(network.directedEdges.length).toBeGreaterThan(0);
    expect(network.directedEdges[0]).toEqual(
      expect.objectContaining({
        upstreamCountySlug: expect.any(String),
        downstreamCountySlug: expect.any(String),
        sharedSourceCount: expect.any(Number),
      }),
    );
  });
});
