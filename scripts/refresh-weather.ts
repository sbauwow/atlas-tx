import { runAtlasIngestPlan, type AtlasIngestTask } from "@/lib/atlas-ingest-orchestrator";

export type RefreshWeatherReport = {
  generatedAt: string;
  taskCount: number;
  okCount: number;
  failedTaskIds: string[];
  outputPaths: string[];
};

export async function runRefreshWeather(options?: {
  generatedAt?: string;
  runCommand?: (task: AtlasIngestTask) => Promise<{ status: "ok" | "failed" | "skipped"; notes?: string[] }>;
}): Promise<RefreshWeatherReport> {
  const report = await runAtlasIngestPlan({
    generatedAt: options?.generatedAt,
    families: ["weather"],
    mode: "balanced",
    runCommand: options?.runCommand,
  });

  const failedTaskIds = report.tasks.filter((task) => task.status !== "ok").map((task) => task.taskId);

  return {
    generatedAt: report.generatedAt,
    taskCount: report.tasks.length,
    okCount: report.tasks.filter((task) => task.status === "ok").length,
    failedTaskIds,
    outputPaths: report.tasks.map((task) => task.outputPath).filter((path): path is string => Boolean(path)),
  };
}

async function main() {
  const report = await runRefreshWeather();
  console.log(JSON.stringify(report, null, 2));
  if (report.failedTaskIds.length) {
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
