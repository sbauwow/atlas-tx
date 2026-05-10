import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const buildGraph = vi.fn();

vi.mock("@/lib/water/hydrology-dependencies", () => ({
  getDefaultHydrologyDependencyService: () => ({ buildGraph }),
}));

describe("/water/network page", () => {
  it("renders dependency map and ranked county table", async () => {
    buildGraph.mockResolvedValueOnce({
      flowDirectionMethod: "seeded-river-network-v1",
      nodes: [
        {
          countySlug: "travis-county",
          countyName: "Travis County",
          lat: 30.3,
          lon: -97.7,
          upstreamContributionScore: 2,
          downstreamDependencyScore: 1,
          contagionScore: 1.3,
        },
      ],
      edges: [
        {
          upstreamCountySlug: "travis-county",
          downstreamCountySlug: "bastrop-county",
          weight: 1,
          evidence: "colorado-river",
        },
      ],
    });

    const pageModule = await import("@/app/water/network/page");
    const element = await pageModule.default();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("County dependency flow map");
    expect(html).toContain("Flow method: seeded-river-network-v1");
    expect(html).toContain("Travis County");
    expect(html).toContain("Top downstream dependency counties");
    expect(html).toContain("Upstream ↔ Downstream");
    expect(html).toContain("Downstream ↔ Contagion");
  });
});
