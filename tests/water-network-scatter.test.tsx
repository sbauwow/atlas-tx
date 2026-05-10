import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const buildGraph = vi.fn();

vi.mock("@/lib/water/hydrology-dependencies", () => ({
  getDefaultHydrologyDependencyService: () => ({ buildGraph }),
}));

describe("/water/network scatter", () => {
  it("renders scatter plot axes, county points, and linked brushing state", async () => {
    buildGraph.mockResolvedValueOnce({
      flowDirectionMethod: "seeded-river-network-v1",
      nodes: [
        {
          countySlug: "travis-county",
          countyName: "Travis County",
          lat: 30.3,
          lon: -97.7,
          upstreamContributionScore: 2,
          downstreamDependencyScore: 4,
          contagionScore: 3.4,
        },
        {
          countySlug: "bastrop-county",
          countyName: "Bastrop County",
          lat: 30.1,
          lon: -97.3,
          upstreamContributionScore: 1,
          downstreamDependencyScore: 2,
          contagionScore: 1.7,
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
    const element = await pageModule.default({ searchParams: Promise.resolve({ county: "travis-county", scope: "top10" }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Dependency scatter");
    expect(html).toContain("x-axis: upstream contribution");
    expect(html).toContain("y-axis: downstream dependency");
    expect(html).toContain('data-scatter-county="travis-county"');
    expect(html).toContain('href="/water/network?county=travis-county&amp;scope=top10#network-workspace"');
    expect(html).toContain('data-selected-scatter="travis-county"');
    expect(html).toContain("Currently brushing Travis County");
    expect(html).toContain("Top 10 only");
  });
});
