import { describe, expect, it } from "vitest";
import { pearsonCorrelation, buildNetworkCorrelationSummary } from "@/lib/water/network-analytics";

describe("water network analytics", () => {
  it("computes pearson correlation", () => {
    const result = pearsonCorrelation([1, 2, 3], [2, 4, 6]);
    expect(result).toBeCloseTo(1, 6);
  });

  it("builds correlation summary from nodes", () => {
    const summary = buildNetworkCorrelationSummary([
      { countySlug: "a", upstreamContributionScore: 1, downstreamDependencyScore: 3, contagionScore: 2.4 },
      { countySlug: "b", upstreamContributionScore: 2, downstreamDependencyScore: 2, contagionScore: 2.0 },
      { countySlug: "c", upstreamContributionScore: 3, downstreamDependencyScore: 1, contagionScore: 1.6 },
    ]);

    expect(summary.count).toBe(3);
    expect(summary.upstreamVsDownstream).toBeLessThan(0);
    expect(summary.downstreamVsContagion).toBeGreaterThan(0);
  });
});
