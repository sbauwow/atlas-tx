import { promises as fs } from "node:fs";
import path from "node:path";
import { exec as execCallback } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execCallback);

export type RefreshAllStep = {
  stepId:
    | "refresh-twdb-hydrology"
    | "refresh-surface-water-quality"
    | "refresh-city-open-data"
    | "refresh-city-open-data-curated"
    | "refresh-city-open-data-ranked"
    | "refresh-cid";
  command: string;
  critical: boolean;
};

export type RefreshAllStepResult = {
  stepId: RefreshAllStep["stepId"];
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
  return [
    { stepId: "refresh-twdb-hydrology", command: "npm run refresh:twdb-hydrology", critical: false },
    { stepId: "refresh-surface-water-quality", command: "npm run refresh:surface-water-quality", critical: false },
    { stepId: "refresh-city-open-data", command: "npm run refresh:city-open-data", critical: false },
    { stepId: "refresh-city-open-data-curated", command: "npm run refresh:city-open-data-curated", critical: false },
    { stepId: "refresh-city-open-data-ranked", command: "npm run refresh:city-open-data-ranked", critical: false },
    { stepId: "refresh-cid", command: "npm run refresh:cid", critical: true },
  ];
}

function computeOverallStatus(steps: RefreshAllStepResult[]): PipelineHealthReport["overallStatus"] {
  const failed = steps.filter((step) => step.status === "failed");
  if (!failed.length) return "ok";
  return failed.some((step) => step.stepId === "refresh-cid") ? "degraded" : "failed";
}

export async function runRefreshAll(options?: {
  generatedAt?: string;
  runCommand?: (step: RefreshAllStep) => Promise<{ status: "ok" | "failed"; notes?: string[]; outputPath?: string | null }>;
}): Promise<PipelineHealthReport> {
  const generatedAt = options?.generatedAt ?? new Date().toISOString();
  const plan = buildRefreshAllPlan();
  const runCommand = options?.runCommand ?? defaultRunCommand;
  const steps: RefreshAllStepResult[] = [];

  for (const step of plan) {
    const startedAt = new Date().toISOString();
    const startMs = Date.now();
    const result = await runCommand(step);
    const endedAt = new Date().toISOString();
    steps.push({
      stepId: step.stepId,
      status: result.status,
      startedAt,
      endedAt,
      durationMs: Math.max(0, Date.now() - startMs),
      outputPath: result.outputPath ?? null,
      notes: result.notes ?? [],
    });
  }

  return {
    generatedAt,
    overallStatus: computeOverallStatus(steps),
    steps,
  };
}

async function defaultRunCommand(step: RefreshAllStep): Promise<{ status: "ok" | "failed"; notes?: string[]; outputPath?: string | null }> {
  try {
    const { stdout, stderr } = await exec(step.command, { cwd: process.cwd() });
    const notes = [stdout.trim(), stderr.trim()].filter(Boolean);
    return { status: "ok", notes };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: "failed", notes: [message] };
  }
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
