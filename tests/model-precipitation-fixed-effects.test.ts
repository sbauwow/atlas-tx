import { describe, expect, it } from "vitest";

import { runFixedEffectsPrecipitationBacktest } from "../experiments/model_precipitation_fixed_effects";

describe("model_precipitation_fixed_effects", () => {
  it("exports the fixed-effects backtest runner", () => {
    expect(typeof runFixedEffectsPrecipitationBacktest).toBe("function");
  });
});
