import { describe, expect, it } from "vitest";

import { buildRefreshAllPlan, runRefreshAll } from "../scripts/refresh-all";

describe("refresh-all pipeline", () => {
  it("defines the staged refresh order with CID last", () => {
    const plan = buildRefreshAllPlan();

    expect(plan.map((step) => step.stepId)).toEqual([
      "refresh-twdb-hydrology",
      "refresh-surface-water-quality",
      "refresh-city-open-data",
      "refresh-city-open-data-curated",
      "refresh-city-open-data-ranked",
      "refresh-cid",
    ]);
    expect(plan.at(-1)?.critical).toBe(true);
  });

  it("produces a degraded health report when a critical step fails", async () => {
    const report = await runRefreshAll({
      generatedAt: "2026-05-10T00:00:00.000Z",
      runCommand: async (step) => {
        if (step.stepId === "refresh-cid") {
          return {
            status: "failed",
            notes: ["CID Search One returned the upstream error page"],
          };
        }
        return {
          status: "ok",
          notes: [`completed ${step.stepId}`],
        };
      },
    });

    expect(report.generatedAt).toBe("2026-05-10T00:00:00.000Z");
    expect(report.overallStatus).toBe("degraded");
    expect(report.steps).toHaveLength(6);
    expect(report.steps.at(-1)?.status).toBe("failed");
    expect(report.steps.at(-1)?.notes).toContain("CID Search One returned the upstream error page");
  });
});
