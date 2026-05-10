import { getAtlasExecutionUnit } from "@/lib/execution/execution-registry";

export type AtlasIngestFamily =
  | "water-core"
  | "weather"
  | "catalog"
  | "analytics"
  | "compliance"
  | "roadmap-open-data"
  | "community";

export type AtlasIngestTaskStatus = "ok" | "failed" | "skipped";

export type AtlasIngestTask = {
  taskId: string;
  executionUnitId?: string;
  family: AtlasIngestFamily;
  command: string;
  critical: boolean;
  dependsOn: string[];
  maxParallelRequests: number;
  retryCount: number;
  expectedOutputPath: string | null;
  notes: string[];
};

export type AtlasIngestTaskResult = {
  taskId: string;
  status: AtlasIngestTaskStatus;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  outputPath: string | null;
  notes: string[];
  attempts: number;
};

export type AtlasIngestPlan = {
  generatedAt: string;
  mode: "conservative" | "balanced" | "aggressive";
  maxConcurrency: number;
  tasks: AtlasIngestTask[];
};

const MODE_CONCURRENCY = {
  conservative: 2,
  balanced: 4,
  aggressive: 6,
} as const;

function task(
  taskId: string,
  family: AtlasIngestFamily,
  command: string,
  options?: Partial<Omit<AtlasIngestTask, "taskId" | "family" | "command">>,
): AtlasIngestTask {
  return {
    taskId,
    family,
    command,
    critical: options?.critical ?? false,
    dependsOn: options?.dependsOn ?? [],
    maxParallelRequests: options?.maxParallelRequests ?? 1,
    retryCount: options?.retryCount ?? 0,
    expectedOutputPath: options?.expectedOutputPath ?? null,
    notes: options?.notes ?? [],
    executionUnitId: options?.executionUnitId,
  };
}

export function buildAtlasIngestTaskCatalog(): AtlasIngestTask[] {
  return [
    task("refresh-twdb-hydrology", "water-core", "npm run refresh:twdb-hydrology", {
      executionUnitId: "twdb-hydrology-context",
      expectedOutputPath: "public/cache/twdb-hydrology.json",
      maxParallelRequests: 1,
    }),
    task("refresh-surface-water-quality", "water-core", "npm run refresh:surface-water-quality", {
      executionUnitId: "tceq-surface-water-quality",
      expectedOutputPath: "public/cache/surface-water-quality.json",
      maxParallelRequests: 1,
    }),
    task("refresh-city-open-data", "catalog", "npm run refresh:city-open-data", {
      expectedOutputPath: "public/cache/city-open-data-tx.json",
      maxParallelRequests: 1,
    }),
    task("refresh-city-open-data-curated", "catalog", "npm run refresh:city-open-data-curated", {
      dependsOn: ["refresh-city-open-data"],
      expectedOutputPath: "public/cache/city-open-data-curated-tx.json",
      maxParallelRequests: 1,
    }),
    task("refresh-city-open-data-ranked", "catalog", "npm run refresh:city-open-data-ranked", {
      dependsOn: ["refresh-city-open-data-curated"],
      expectedOutputPath: "public/cache/city-open-data-ranked-tx.json",
      maxParallelRequests: 1,
    }),
    task("refresh-analytics-history", "analytics", "tsx scripts/refresh-analytics-history.ts", {
      dependsOn: ["refresh-twdb-hydrology", "refresh-surface-water-quality"],
      expectedOutputPath: "public/cache/analytics-history.json",
      maxParallelRequests: 1,
    }),
    task("refresh-county-month-precipitation", "weather", "npm run refresh:county-month-precipitation", {
      executionUnitId: "county-month-precipitation",
      expectedOutputPath: outputPathForExecutionUnit("county-month-precipitation"),
      dependsOn: ["refresh-twdb-hydrology"],
      maxParallelRequests: 2,
      retryCount: 1,
    }),
    task("refresh-county-month-streamflow", "weather", "npm run refresh:county-month-streamflow", {
      executionUnitId: "county-month-streamflow",
      expectedOutputPath: outputPathForExecutionUnit("county-month-streamflow"),
      dependsOn: ["refresh-twdb-hydrology"],
      maxParallelRequests: 2,
      retryCount: 1,
    }),
    task("refresh-county-month-drought", "weather", "npm run refresh:county-month-drought", {
      executionUnitId: "county-month-drought",
      expectedOutputPath: outputPathForExecutionUnit("county-month-drought"),
      maxParallelRequests: 2,
      retryCount: 1,
    }),
    task("refresh-county-month-temperature", "weather", "npm run refresh:county-month-temperature", {
      executionUnitId: "county-month-temperature",
      expectedOutputPath: outputPathForExecutionUnit("county-month-temperature"),
      maxParallelRequests: 2,
      retryCount: 1,
    }),
    task("refresh-county-month-nws-flood-alerts", "weather", "npm run refresh:county-month-nws-flood-alerts", {
      executionUnitId: "county-month-nws-flood-alerts",
      expectedOutputPath: outputPathForExecutionUnit("county-month-nws-flood-alerts"),
      maxParallelRequests: 2,
      retryCount: 1,
    }),
    task("refresh-roadmap-open-data", "roadmap-open-data", "npm run refresh:roadmap-open-data", {
      dependsOn: [
        "refresh-county-month-precipitation",
        "refresh-county-month-streamflow",
        "refresh-county-month-drought",
        "refresh-county-month-temperature",
        "refresh-county-month-nws-flood-alerts",
        "refresh-city-open-data-ranked",
      ],
      expectedOutputPath: "public/cache/roadmap-open-data-botnet.json",
      maxParallelRequests: 1,
    }),
    task("refresh-cid", "compliance", "npm run refresh:cid", {
      executionUnitId: "cid-procedural-signals",
      dependsOn: ["refresh-roadmap-open-data", "refresh-analytics-history"],
      critical: true,
      expectedOutputPath: "public/cache/pipeline-health.json",
      maxParallelRequests: 1,
      retryCount: 1,
    }),
  ];
}

function outputPathForExecutionUnit(executionUnitId: string): string | null {
  const unit = getAtlasExecutionUnit(executionUnitId);
  return unit?.outputs[0] ?? null;
}

export function buildAtlasIngestPlan(options?: {
  mode?: AtlasIngestPlan["mode"];
  families?: AtlasIngestFamily[];
}): AtlasIngestPlan {
  const mode = options?.mode ?? "balanced";
  const familyFilter = options?.families ? new Set(options.families) : null;
  const catalog = buildAtlasIngestTaskCatalog();
  const filteredTasks = familyFilter
    ? catalog.filter((entry) => familyFilter.has(entry.family))
    : catalog;

  const filteredTaskIds = new Set(filteredTasks.map((entry) => entry.taskId));
  const tasks = filteredTasks.map((entry) => ({
    ...entry,
    dependsOn: entry.dependsOn.filter((dependency) => filteredTaskIds.has(dependency)),
  }));

  return {
    generatedAt: new Date().toISOString(),
    mode,
    maxConcurrency: MODE_CONCURRENCY[mode],
    tasks,
  };
}

export async function runAtlasIngestPlan(options?: {
  mode?: AtlasIngestPlan["mode"];
  families?: AtlasIngestFamily[];
  runCommand?: (task: AtlasIngestTask) => Promise<{ status: AtlasIngestTaskStatus; notes?: string[] }>;
  generatedAt?: string;
}): Promise<{ generatedAt: string; mode: AtlasIngestPlan["mode"]; maxConcurrency: number; tasks: AtlasIngestTaskResult[] }> {
  const plan = buildAtlasIngestPlan({ mode: options?.mode, families: options?.families });
  const runCommand = options?.runCommand ?? defaultRunCommand;
  const generatedAt = options?.generatedAt ?? plan.generatedAt;
  const taskById = new Map(plan.tasks.map((entry) => [entry.taskId, entry]));
  const results = new Map<string, AtlasIngestTaskResult>();
  const pending = new Set(plan.tasks.map((entry) => entry.taskId));

  while (pending.size) {
    const runnable = [...pending]
      .map((taskId) => taskById.get(taskId))
      .filter((task): task is AtlasIngestTask => Boolean(task))
      .filter((task) => task.dependsOn.every((dependency) => results.has(dependency)))
      .sort((left, right) => left.taskId.localeCompare(right.taskId));

    if (!runnable.length) {
      throw new Error(`Atlas ingest plan is blocked; unresolved dependencies remain for ${[...pending].join(", ")}`);
    }

    const batch = runnable.slice(0, plan.maxConcurrency);
    const batchResults = await Promise.all(batch.map((entry) => executeWithRetries(entry, runCommand)));

    for (const result of batchResults) {
      results.set(result.taskId, result);
      pending.delete(result.taskId);
    }
  }

  return {
    generatedAt,
    mode: plan.mode,
    maxConcurrency: plan.maxConcurrency,
    tasks: plan.tasks
      .map((task) => results.get(task.taskId))
      .filter((result): result is AtlasIngestTaskResult => Boolean(result)),
  };
}

async function executeWithRetries(
  task: AtlasIngestTask,
  runCommand: (task: AtlasIngestTask) => Promise<{ status: AtlasIngestTaskStatus; notes?: string[] }>,
): Promise<AtlasIngestTaskResult> {
  let attempts = 0;
  let finalStatus: AtlasIngestTaskStatus = "failed";
  let finalNotes: string[] = [];
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  while (attempts <= task.retryCount) {
    attempts += 1;
    const result = await runCommand(task);
    finalStatus = result.status;
    finalNotes = result.notes ?? [];
    if (result.status === "ok") {
      break;
    }
  }

  return {
    taskId: task.taskId,
    status: finalStatus,
    startedAt,
    endedAt: new Date().toISOString(),
    durationMs: Math.max(0, Date.now() - startMs),
    outputPath: task.expectedOutputPath,
    notes: finalNotes,
    attempts,
  };
}

async function defaultRunCommand(task: AtlasIngestTask): Promise<{ status: AtlasIngestTaskStatus; notes?: string[] }> {
  const { exec: execCallback } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const exec = promisify(execCallback);

  try {
    const { stdout, stderr } = await exec(task.command, { cwd: process.cwd() });
    const notes = [stdout.trim(), stderr.trim(), ...task.notes].filter(Boolean);
    return { status: "ok", notes };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: "failed", notes: [...task.notes, message] };
  }
}
