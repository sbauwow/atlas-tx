import { readFileSync } from "node:fs";
import path from "node:path";

export type AtlasExecutionWave = "wave-0" | "wave-1" | "wave-2" | "wave-3" | "wave-4";
export type AtlasRoadmapPhase = "now" | "next" | "later" | "future-community";
export type AtlasEvidenceClass = "authoritative" | "explanatory" | "derived" | "community";
export type AtlasExecutionStatus = "active" | "partial" | "planned" | "research" | "legacy" | "blocked";
export type AtlasExecutionMaturity = "production" | "productizing" | "research-panel" | "discovery-only" | "research";
export type AtlasStrategicPriority = "very-high" | "high" | "medium" | "low";

export type AtlasExecutionSourceRef = {
  registry: string;
  sourceId: string;
};

export type AtlasExecutionUnit = {
  id: string;
  name: string;
  thesisLane: string;
  evidenceClass: AtlasEvidenceClass;
  status: AtlasExecutionStatus;
  maturity: AtlasExecutionMaturity;
  roadmapWave: AtlasExecutionWave;
  roadmapPhaseLabel: AtlasRoadmapPhase;
  priorityRank: number;
  strategicPriority: AtlasStrategicPriority;
  sourceRefs: AtlasExecutionSourceRef[];
  upstreamType: string;
  grain: string;
  geographicJoinStrategy: string;
  temporalResolution: string;
  outputs: string[];
  downstreamConsumers: string[];
  activationCriteria: string[];
  caveats: string[];
};

export type AtlasExecutionRegistry = {
  registryVersion: string;
  scope: string;
  generatedFrom: string[];
  defaultGeography: string;
  executionUnits: AtlasExecutionUnit[];
};

function registryPath() {
  return path.join(process.cwd(), "config", "execution-registry.county.json");
}

export function loadAtlasExecutionRegistry(): AtlasExecutionRegistry {
  return JSON.parse(readFileSync(registryPath(), "utf8")) as AtlasExecutionRegistry;
}

export function listAtlasExecutionUnits(): AtlasExecutionUnit[] {
  return [...loadAtlasExecutionRegistry().executionUnits].sort((left, right) => left.priorityRank - right.priorityRank);
}

export function getAtlasExecutionUnit(executionId: string): AtlasExecutionUnit | undefined {
  return listAtlasExecutionUnits().find((unit) => unit.id === executionId);
}

export function listAtlasExecutionUnitsByWave(wave: AtlasExecutionWave): AtlasExecutionUnit[] {
  return listAtlasExecutionUnits().filter((unit) => unit.roadmapWave === wave);
}

export function listFutureRoadmapExecutionUnits(): AtlasExecutionUnit[] {
  return listAtlasExecutionUnits().filter((unit) =>
    unit.status === "planned" || unit.maturity === "discovery-only" || unit.roadmapWave === "wave-3" || unit.roadmapWave === "wave-4",
  );
}
