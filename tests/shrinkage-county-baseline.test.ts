import { describe, expect, it } from "vitest";

import { estimateBetaPriorByMoments } from "../experiments/shrinkage_county_baseline";

describe("shrinkage_county_baseline helpers", () => {
  it("estimates a sensible beta prior from county summaries", () => {
    const prior = estimateBetaPriorByMoments([
      { n: 48, successes: 0 },
      { n: 48, successes: 12 },
      { n: 48, successes: 24 },
      { n: 48, successes: 36 },
    ]);

    expect(prior.alpha).toBeGreaterThan(0);
    expect(prior.beta).toBeGreaterThan(0);
    expect(prior.mean).toBeGreaterThan(0);
    expect(prior.mean).toBeLessThan(1);
    expect(prior.strength).toBeGreaterThan(0);
  });
});
