import { describe, expect, it } from "vitest";

import { buildAtlasIngestPlan, runAtlasIngestPlan } from "@/lib/atlas-ingest-orchestrator";

describe("atlas ingest orchestrator", () => {
  it("builds a plan that includes weather and roadmap-open-data families", () => {
    const plan = buildAtlasIngestPlan();

    expect(plan.maxConcurrency).toBe(4);
    expect(plan.tasks.some((task) => task.family === "weather")).toBe(true);
    expect(plan.tasks.some((task) => task.taskId === "refresh-roadmap-open-data")).toBe(true);
    expect(plan.tasks.find((task) => task.taskId === "refresh-roadmap-open-data")?.dependsOn).toContain(
      "refresh-county-month-precipitation",
    );
  });

  it("can run a weather-only family plan", async () => {
    const report = await runAtlasIngestPlan({
      families: ["weather"],
      generatedAt: "2026-05-10T07:00:00.000Z",
      runCommand: async () => ({ status: "ok", notes: ["done"] }),
    });

    expect(report.generatedAt).toBe("2026-05-10T07:00:00.000Z");
    expect(report.tasks).toHaveLength(5);
    expect(report.tasks.every((task) => task.taskId.startsWith("refresh-county-month-"))).toBe(true);
  });

  it("retries failed tasks up to retryCount", async () => {
    const attempts = new Map<string, number>();
    const report = await runAtlasIngestPlan({
      families: ["roadmap-open-data", "compliance"],
      runCommand: async (task) => {
        const count = (attempts.get(task.taskId) ?? 0) + 1;
        attempts.set(task.taskId, count);
        if (task.taskId === "refresh-cid" && count === 1) {
          return { status: "failed", notes: ["transient"] };
        }
        return { status: "ok", notes: [`attempt ${count}`] };
      },
    });

    const cid = report.tasks.find((task) => task.taskId === "refresh-cid");
    expect(cid?.status).toBe("ok");
    expect(cid?.attempts).toBe(2);
  });
});
