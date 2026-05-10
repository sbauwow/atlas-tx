import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { listFutureRoadmapExecutionUnits } from "@/lib/execution/execution-registry";

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

export function buildRoadmapOpenDataBotnetSnapshot(options?: { generatedAt?: string }): RoadmapOpenDataBotnetSnapshot {
  const generatedAt = options?.generatedAt ?? new Date().toISOString();
  const candidates: RoadmapOpenDataCandidate[] = listFutureRoadmapExecutionUnits().map((unit) => ({
    executionUnitId: unit.id,
    name: unit.name,
    roadmapWave: unit.roadmapWave,
    roadmapPhaseLabel: unit.roadmapPhaseLabel,
    strategicPriority: unit.strategicPriority,
    evidenceClass: unit.evidenceClass,
    thesisLane: unit.thesisLane,
    upstreamType: unit.upstreamType,
    grain: unit.grain,
    geographicJoinStrategy: unit.geographicJoinStrategy,
    downstreamConsumers: unit.downstreamConsumers,
    activationCriteria: unit.activationCriteria,
    nextAction:
      unit.status === "planned"
        ? "verify-upstream-source"
        : unit.status === "partial"
          ? "productize-existing-module"
          : "define-county-join",
  }));

  const waves = candidates.reduce<Record<string, number>>((accumulator, candidate) => {
    accumulator[candidate.roadmapWave] = (accumulator[candidate.roadmapWave] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    generatedAt,
    scope: "atlas-tx-roadmap-open-data-botnet",
    candidateCount: candidates.length,
    waves,
    candidates,
  };
}

export async function writeRoadmapOpenDataBotnetSnapshot(snapshot: RoadmapOpenDataBotnetSnapshot, outputPath?: string) {
  const target = outputPath ?? path.join(process.cwd(), "public", "cache", "roadmap-open-data-botnet.json");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(snapshot, null, 2), "utf8");
  return target;
}

async function main() {
  const snapshot = buildRoadmapOpenDataBotnetSnapshot();
  const outputPath = await writeRoadmapOpenDataBotnetSnapshot(snapshot);
  console.log(JSON.stringify({ outputPath, candidateCount: snapshot.candidateCount, waves: snapshot.waves }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
