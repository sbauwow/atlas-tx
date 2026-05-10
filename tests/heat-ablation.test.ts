import { describe, expect, it } from "vitest";

import { runHeatAblation } from "../experiments/heat_ablation";

describe("heat_ablation", () => {
  it("exports the heat ablation runner", () => {
    expect(typeof runHeatAblation).toBe("function");
  });
});
