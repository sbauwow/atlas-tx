import { countySlug, normalizeCountyName } from "@/lib/counties";
import { getGlobalWaterDataCache } from "@/lib/water/cache";
import type { LcraArrpLandPermit, LcraArrpOutfall } from "@/lib/water/types";

const LCRA_ARRP_TTL_MS = 12 * 60 * 60 * 1000;

type LcraTaskEnvelope<T> = {
  result?: T[];
};

type LcraArrpOutfallApiRow = {
  objectid?: number | string;
  permitNum?: string;
  outfall?: string;
  permittee?: string;
  status?: string;
  county?: string;
  latDd?: number | string;
  longDd?: number | string;
  segment?: string;
  basin?: string;
};

type LcraArrpLandPermitApiRow = {
  recordId?: number | string;
  permitNum?: string;
  permittee?: string;
  status?: string;
  county?: string;
  latDd?: number | string;
  longDd?: number | string;
  segment?: string;
  basin?: string;
  permittype?: string;
  revtype?: string;
};

function toNumber(value: number | string | undefined): number | null {
  const numeric = typeof value === "number" ? value : Number(value ?? "");
  return Number.isFinite(numeric) ? numeric : null;
}

function extractTaskResult<T>(payload: LcraTaskEnvelope<T>): T[] {
  return Array.isArray(payload.result) ? payload.result : [];
}

export function normalizeLcraArrpOutfallRecord(row: LcraArrpOutfallApiRow): LcraArrpOutfall {
  return {
    sourceId: "lcra-arrp-outfalls",
    recordId: String(row.objectid ?? "unknown-outfall"),
    permitNumber: String(row.permitNum ?? "unknown-permit"),
    countyName: row.county ? normalizeCountyName(row.county) : null,
    permitteeName: row.permittee ?? null,
    status: row.status ?? null,
    segmentId: row.segment ?? null,
    basinId: row.basin ?? null,
    outfallNumber: row.outfall ?? null,
    latitude: toNumber(row.latDd),
    longitude: toNumber(row.longDd),
    raw: row as Record<string, unknown>,
  };
}

export function normalizeLcraArrpLandPermitRecord(row: LcraArrpLandPermitApiRow): LcraArrpLandPermit {
  return {
    sourceId: "lcra-arrp-land-permits",
    recordId: String(row.recordId ?? "unknown-land-permit"),
    permitNumber: String(row.permitNum ?? "unknown-permit"),
    countyName: row.county ? normalizeCountyName(row.county) : null,
    permitteeName: row.permittee ?? null,
    status: row.status ?? null,
    segmentId: row.segment ?? null,
    basinId: row.basin ?? null,
    permitType: row.permittype ?? null,
    reviewType: row.revtype ?? null,
    latitude: toNumber(row.latDd),
    longitude: toNumber(row.longDd),
    raw: row as Record<string, unknown>,
  };
}

export function filterLcraArrpOutfallsByCounty(records: LcraArrpOutfall[], county: string): LcraArrpOutfall[] {
  const target = countySlug(county);
  return records.filter((record) => countySlug(record.countyName ?? "") === target);
}

export function filterLcraArrpLandPermitsByCounty(records: LcraArrpLandPermit[], county: string): LcraArrpLandPermit[] {
  const target = countySlug(county);
  return records.filter((record) => countySlug(record.countyName ?? "") === target);
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`LCRA ARRP request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function fetchLcraArrpOutfallsUncached(signal?: AbortSignal): Promise<LcraArrpOutfall[]> {
  const payload = await fetchJson<LcraTaskEnvelope<LcraArrpOutfallApiRow>>("https://waterquality.lcra.org/arrp/api/Outfall", signal);
  return extractTaskResult(payload).map(normalizeLcraArrpOutfallRecord);
}

async function fetchLcraArrpLandPermitsUncached(signal?: AbortSignal): Promise<LcraArrpLandPermit[]> {
  const payload = await fetchJson<LcraTaskEnvelope<LcraArrpLandPermitApiRow>>("https://waterquality.lcra.org/arrp/api/LandPermit", signal);
  return extractTaskResult(payload).map(normalizeLcraArrpLandPermitRecord);
}

export async function fetchLcraArrpOutfalls(signal?: AbortSignal): Promise<LcraArrpOutfall[]> {
  if (signal) {
    return fetchLcraArrpOutfallsUncached(signal);
  }
  return getGlobalWaterDataCache().getOrLoad("lcra-arrp-outfalls", LCRA_ARRP_TTL_MS, () => fetchLcraArrpOutfallsUncached());
}

export async function fetchLcraArrpLandPermits(signal?: AbortSignal): Promise<LcraArrpLandPermit[]> {
  if (signal) {
    return fetchLcraArrpLandPermitsUncached(signal);
  }
  return getGlobalWaterDataCache().getOrLoad("lcra-arrp-land-permits", LCRA_ARRP_TTL_MS, () => fetchLcraArrpLandPermitsUncached());
}
