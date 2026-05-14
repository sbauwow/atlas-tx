import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const buildGraph = vi.fn();

vi.mock("@/lib/water/hydrology-dependencies", () => ({
  getDefaultHydrologyDependencyService: () => ({ buildGraph }),
}));

describe("/water/network page", () => {
  it("renders dependency map links, brushing detail, and ranked county table", async () => {
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
    const element = await pageModule.default({ searchParams: Promise.resolve({ county: "travis-county" }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("County dependency flow map");
    expect(html).toContain("Flow method: seeded-river-network-v1");
    expect(html).toContain("Map reading notes");
    expect(html).toContain("Data quality");
    expect(html).toContain("Seeded");
    expect(html).toContain("Modeled");
    expect(html).toContain("Travis County");
    expect(html).toContain("Linked brushing");
    expect(html).toContain("Open county water page");
    expect(html).toContain("Open county source page");
    expect(html).toContain('href="/water/network?county=travis-county&amp;scope=all#network-workspace"');
    expect(html).toContain('href="/water/counties/travis-county"');
    expect(html).toContain('href="/water/sources/travis-county"');
    expect(html).toContain('data-selected-county="travis-county"');
    expect(html).toContain("Top downstream dependency counties");
    expect(html).toContain("Upstream ↔ Downstream");
    expect(html).toContain("Downstream ↔ Contagion");
  });
});
