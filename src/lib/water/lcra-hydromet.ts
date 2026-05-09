import { getGlobalWaterDataCache } from "@/lib/water/cache";
import type { LcraLakeLevelReading, LcraStageFlowReading } from "@/lib/water/types";

const LCRA_HYDROMET_TTL_MS = 5 * 60 * 1000;

type LcraStageFlowApiRow = {
  siteNumber: number | string;
  location: string;
  dateTime: string;
  stage?: number | null;
  flow?: number | null;
  bankfull?: number | null;
  floodStage?: number | null;
};

type LcraLakeLevelApiRow = {
  siteNumber: number | string;
  location: string;
  dateTime: string;
  elevation?: number | null;
};

export function normalizeLcraStageFlowReadings(rows: LcraStageFlowApiRow[]): LcraStageFlowReading[] {
  return rows.map((row) => ({
    sourceId: "lcra-hydromet-stageflow",
    siteNumber: String(row.siteNumber),
    stationName: row.location,
    observedAt: row.dateTime,
    stageFeet: row.stage ?? null,
    flowCfs: row.flow ?? null,
    bankfullFeet: row.bankfull ?? null,
    floodStageFeet: row.floodStage ?? null,
    raw: row as unknown as Record<string, unknown>,
  }));
}

export function normalizeLcraLakeLevelReadings(rows: LcraLakeLevelApiRow[]): LcraLakeLevelReading[] {
  return rows.map((row) => ({
    sourceId: "lcra-hydromet-lakelevels",
    siteNumber: String(row.siteNumber),
    stationName: row.location,
    observedAt: row.dateTime,
    elevationFeet: row.elevation ?? null,
    raw: row as unknown as Record<string, unknown>,
  }));
}

export function filterLcraStageFlowBySite(readings: LcraStageFlowReading[], siteNumber: string): LcraStageFlowReading[] {
  return readings.filter((reading) => reading.siteNumber === String(siteNumber));
}

export function filterLcraLakeLevelsBySite(readings: LcraLakeLevelReading[], siteNumber: string): LcraLakeLevelReading[] {
  return readings.filter((reading) => reading.siteNumber === String(siteNumber));
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`LCRA Hydromet request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function fetchLcraStageFlowReadingsUncached(signal?: AbortSignal): Promise<LcraStageFlowReading[]> {
  const rows = await fetchJson<LcraStageFlowApiRow[]>("https://hydromet.lcra.org/api/GetStageFlowForAllSites/", signal);
  return normalizeLcraStageFlowReadings(rows);
}

async function fetchLcraLakeLevelReadingsUncached(signal?: AbortSignal): Promise<LcraLakeLevelReading[]> {
  const rows = await fetchJson<LcraLakeLevelApiRow[]>("https://hydromet.lcra.org/api/GetLakeLevelsForAllSites", signal);
  return normalizeLcraLakeLevelReadings(rows);
}

export async function fetchLcraStageFlowReadings(signal?: AbortSignal): Promise<LcraStageFlowReading[]> {
  if (signal) {
    return fetchLcraStageFlowReadingsUncached(signal);
  }
  return getGlobalWaterDataCache().getOrLoad("lcra-hydromet-stageflow", LCRA_HYDROMET_TTL_MS, () => fetchLcraStageFlowReadingsUncached());
}

export async function fetchLcraLakeLevelReadings(signal?: AbortSignal): Promise<LcraLakeLevelReading[]> {
  if (signal) {
    return fetchLcraLakeLevelReadingsUncached(signal);
  }
  return getGlobalWaterDataCache().getOrLoad("lcra-hydromet-lakelevels", LCRA_HYDROMET_TTL_MS, () => fetchLcraLakeLevelReadingsUncached());
}
