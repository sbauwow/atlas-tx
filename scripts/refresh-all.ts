import { promises as fs } from "node:fs";
import path from "node:path";

import { buildAtlasIngestPlan, runAtlasIngestPlan, type AtlasIngestTask } from "@/lib/atlas-ingest-orchestrator";

export type RefreshAllStepId =
  | "refresh-twdb-hydrology"
  | "refresh-surface-water-quality"
  | "refresh-city-open-data"
  | "refresh-city-open-data-curated"
  | "refresh-city-open-data-ranked"
  | "refresh-analytics-history"
  | "refresh-county-month-precipitation"
  | "refresh-county-month-streamflow"
  | "refresh-county-month-drought"
  | "refresh-county-month-temperature"
  | "refresh-county-month-nws-flood-alerts"
  | "refresh-roadmap-open-data"
  | "refresh-cid";

export type RefreshAllStep = {
  stepId: RefreshAllStepId;
  command: string;
  critical: boolean;
  dependsOn: string[];
  family: string;
  maxParallelRequests: number;
  retryCount: number;
  expectedOutputPath: string | null;
};

export type RefreshAllStepResult = {
  stepId: RefreshAllStepId;
  status: "ok" | "failed" | "skipped";
  startedAt: string;
  endedAt: string;
  durationMs: number;
  outputPath: string | null;
  notes: string[];
};

export type PipelineHealthReport = {
  generatedAt: string;
  overallStatus: "ok" | "degraded" | "failed";
  steps: RefreshAllStepResult[];
};

export function buildRefreshAllPlan(): RefreshAllStep[] {
  const plan = buildAtlasIngestPlan({ mode: "balanced" });
  return plan.tasks.map((task) => ({
    stepId: task.taskId as RefreshAllStepId,
    command: task.command,
    critical: task.critical,
    dependsOn: task.dependsOn,
    family: task.family,
    maxParallelRequests: task.maxParallelRequests,
    retryCount: task.retryCount,
    expectedOutputPath: task.expectedOutputPath,
  }));
}

function computeOverallStatus(steps: RefreshAllStepResult[]): PipelineHealthReport["overallStatus"] {
  const failed = steps.filter((step) => step.status === "failed");
  if (!failed.length) return "ok";
  return failed.some((step) => step.stepId === "refresh-cid") ? "degraded" : "failed";
}

export async function runRefreshAll(options?: {
  generatedAt?: string;
  runCommand?: (step: RefreshAllStep) => Promise<{ status: "ok" | "failed" | "skipped"; notes?: string[]; outputPath?: string | null }>;
}): Promise<PipelineHealthReport> {
  const generatedAt = options?.generatedAt ?? new Date().toISOString();
  const result = await runAtlasIngestPlan({
    generatedAt,
    mode: "balanced",
    runCommand: options?.runCommand
      ? async (task: AtlasIngestTask) => {
          const response = await options.runCommand?.({
            stepId: task.taskId as RefreshAllStepId,
            command: task.command,
            critical: task.critical,
            dependsOn: task.dependsOn,
            family: task.family,
            maxParallelRequests: task.maxParallelRequests,
            retryCount: task.retryCount,
            expectedOutputPath: task.expectedOutputPath,
          });
          return {
            status: response?.status ?? "failed",
            notes: response?.notes,
          };
        }
      : undefined,
  });

  const steps = result.tasks.map((task) => ({
    stepId: task.taskId as RefreshAllStepId,
    status: task.status,
    startedAt: task.startedAt,
    endedAt: task.endedAt,
    durationMs: task.durationMs,
    outputPath: task.outputPath,
    notes: task.notes,
  }));

  return {
    generatedAt,
    overallStatus: computeOverallStatus(steps),
    steps,
  };
}

export async function writePipelineHealthReport(report: PipelineHealthReport, outputPath?: string) {
  const target = outputPath ?? path.join(process.cwd(), "public", "cache", "pipeline-health.json");
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(report, null, 2), "utf8");
  return target;
}

export async function main() {
  const report = await runRefreshAll();
  const outputPath = await writePipelineHealthReport(report);
  console.log(JSON.stringify({ outputPath, overallStatus: report.overallStatus, steps: report.steps }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
