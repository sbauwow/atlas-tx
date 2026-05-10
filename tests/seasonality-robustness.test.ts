import { describe, expect, it } from "vitest";

import { MONTH_CONTROL_FEATURES, runSeasonalityRobustness } from "../experiments/seasonality_robustness";

describe("seasonality_robustness", () => {
  it("exports the seasonality robustness runner", () => {
    expect(typeof runSeasonalityRobustness).toBe("function");
  });

  it("defines 11 month-of-year control features with January as the reference month", () => {
    expect(MONTH_CONTROL_FEATURES).toHaveLength(11);
    expect(MONTH_CONTROL_FEATURES[0]).toBe("month_is_02");
    expect(MONTH_CONTROL_FEATURES[10]).toBe("month_is_12");
  });
});
