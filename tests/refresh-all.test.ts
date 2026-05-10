import { describe, expect, it } from "vitest";

import { buildRefreshAllPlan, runRefreshAll } from "../scripts/refresh-all";

describe("refresh-all pipeline", () => {
  it("defines the staged refresh order with weather and roadmap tasks before CID", () => {
    const plan = buildRefreshAllPlan();

    expect(plan.map((step) => step.stepId)).toEqual([
      "refresh-twdb-hydrology",
      "refresh-surface-water-quality",
      "refresh-city-open-data",
      "refresh-city-open-data-curated",
      "refresh-city-open-data-ranked",
      "refresh-analytics-history",
      "refresh-county-month-precipitation",
      "refresh-county-month-streamflow",
      "refresh-county-month-drought",
      "refresh-county-month-temperature",
      "refresh-county-month-nws-flood-alerts",
      "refresh-roadmap-open-data",
      "refresh-cid",
    ]);
    expect(plan.at(-1)?.critical).toBe(true);
    expect(plan.find((step) => step.stepId === "refresh-roadmap-open-data")?.dependsOn).toContain(
      "refresh-county-month-precipitation",
    );
  });

  it("produces a degraded health report when CID fails after weather tasks succeed", async () => {
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
          outputPath: step.expectedOutputPath,
        };
      },
    });

    expect(report.generatedAt).toBe("2026-05-10T00:00:00.000Z");
    expect(report.overallStatus).toBe("degraded");
    expect(report.steps).toHaveLength(13);
    expect(report.steps.find((step) => step.stepId === "refresh-county-month-precipitation")?.status).toBe("ok");
    expect(report.steps.find((step) => step.stepId === "refresh-roadmap-open-data")?.status).toBe("ok");
    expect(report.steps.at(-1)?.status).toBe("failed");
    expect(report.steps.at(-1)?.notes).toContain("CID Search One returned the upstream error page");
  });
});
