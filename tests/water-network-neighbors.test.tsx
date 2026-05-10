import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const buildGraph = vi.fn();

vi.mock("@/lib/water/hydrology-dependencies", () => ({
  getDefaultHydrologyDependencyService: () => ({ buildGraph }),
}));

describe("/water/network neighbors", () => {
  it("renders selected county upstream/downstream neighbors", async () => {
    buildGraph.mockResolvedValueOnce({
      flowDirectionMethod: "seeded-river-network-v1",
      nodes: [
        { countySlug: "travis-county", countyName: "Travis County", lat: 30.3, lon: -97.7, upstreamContributionScore: 2, downstreamDependencyScore: 1, contagionScore: 1.3 },
        { countySlug: "burnet-county", countyName: "Burnet County", lat: 30.7, lon: -98.2, upstreamContributionScore: 1, downstreamDependencyScore: 0, contagionScore: 0.3 },
        { countySlug: "bastrop-county", countyName: "Bastrop County", lat: 30.1, lon: -97.3, upstreamContributionScore: 0, downstreamDependencyScore: 1, contagionScore: 0.7 },
      ],
      edges: [
        { upstreamCountySlug: "burnet-county", downstreamCountySlug: "travis-county", weight: 1, evidence: "colorado-river" },
        { upstreamCountySlug: "travis-county", downstreamCountySlug: "bastrop-county", weight: 1, evidence: "colorado-river" },
      ],
    });

    const pageModule = await import("@/app/water/network/page");
    const element = await pageModule.default({ searchParams: Promise.resolve({ county: "travis-county" }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Selected county neighborhood");
    expect(html).toContain("Travis County");
    expect(html).toContain("Upstream counties");
    expect(html).toContain("Burnet County");
    expect(html).toContain("Downstream counties");
    expect(html).toContain("Bastrop County");
    expect(html).toContain("colorado-river");
  });
});
