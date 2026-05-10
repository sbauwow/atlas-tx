import { promises as fs } from "node:fs";
import path from "node:path";

import {
  listAtlasExecutionUnits,
  listAtlasExecutionUnitsByWave,
  type AtlasExecutionUnit,
} from "@/lib/execution/execution-registry";

export type PipelineHealthStep = {
  stepId: string;
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
  steps: PipelineHealthStep[];
};

export type RoadmapOpenDataCandidate = {
  executionUnitId: string;
  name: string;
  roadmapWave: string;
  roadmapPhaseLabel: string;
  strategicPriority: string;
  evidenceClass: string;
  thesisLane: string;
  upstreamType: string;
  grain: string;
  geographicJoinStrategy: string;
  downstreamConsumers: string[];
  activationCriteria: string[];
  nextAction: "verify-upstream-source" | "define-county-join" | "productize-existing-module";
};

export type RoadmapOpenDataBotnetSnapshot = {
  generatedAt: string;
  scope: "atlas-tx-roadmap-open-data-botnet";
  candidateCount: number;
  waves: Record<string, number>;
  candidates: RoadmapOpenDataCandidate[];
};

export type AtlasBotnetState = {
  pipelineHealth: PipelineHealthReport | null;
  roadmapQueue: RoadmapOpenDataBotnetSnapshot | null;
  executionRegistrySummary: {
    totalUnits: number;
    byWave: Record<string, number>;
    plannedUnitCount: number;
    activeUnitCount: number;
  };
  queueCandidates: Array<RoadmapOpenDataCandidate & { executionUnit: AtlasExecutionUnit | null }>;
};

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function loadPipelineHealthReportFromSnapshot(): Promise<PipelineHealthReport | null> {
  return readJsonFile<PipelineHealthReport>(path.join(process.cwd(), "public", "cache", "pipeline-health.json"));
}

export async function loadRoadmapOpenDataBotnetSnapshotFromCache(): Promise<RoadmapOpenDataBotnetSnapshot | null> {
  return readJsonFile<RoadmapOpenDataBotnetSnapshot>(path.join(process.cwd(), "public", "cache", "roadmap-open-data-botnet.json"));
}

export async function getAtlasBotnetState(): Promise<AtlasBotnetState> {
  const [pipelineHealth, roadmapQueue] = await Promise.all([
    loadPipelineHealthReportFromSnapshot(),
    loadRoadmapOpenDataBotnetSnapshotFromCache(),
  ]);

  const executionUnits = listAtlasExecutionUnits();
  const executionRegistrySummary = {
    totalUnits: executionUnits.length,
    byWave: {
      "wave-0": listAtlasExecutionUnitsByWave("wave-0").length,
      "wave-1": listAtlasExecutionUnitsByWave("wave-1").length,
      "wave-2": listAtlasExecutionUnitsByWave("wave-2").length,
      "wave-3": listAtlasExecutionUnitsByWave("wave-3").length,
      "wave-4": listAtlasExecutionUnitsByWave("wave-4").length,
    },
    plannedUnitCount: executionUnits.filter((unit) => unit.status === "planned").length,
    activeUnitCount: executionUnits.filter((unit) => unit.status === "active").length,
  };

  const queueCandidates = (roadmapQueue?.candidates ?? []).map((candidate) => ({
    ...candidate,
    executionUnit: executionUnits.find((unit) => unit.id === candidate.executionUnitId) ?? null,
  }));

  return {
    pipelineHealth,
    roadmapQueue,
    executionRegistrySummary,
    queueCandidates,
  };
}
