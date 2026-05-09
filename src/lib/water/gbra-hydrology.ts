import { getGlobalWaterDataCache } from "@/lib/water/cache";
import type { GbraHydrologyLake, GbraHydrologyMajorRiver } from "@/lib/water/types";

const GBRA_HYDROLOGY_SERVICE_URL = "https://services7.arcgis.com/Q6vsXnxTnYcWB7qg/arcgis/rest/services/GBRA_Hydrology/FeatureServer";
const GBRA_HYDROLOGY_TTL_MS = 24 * 60 * 60 * 1000;
const MAJOR_RIVERS_LAYER_ID = 1;
const GVHS_LAKES_LAYER_ID = 2;

type ArcgisFeature<T> = { attributes?: T };
type ArcgisQueryResponse<T> = { features?: Array<ArcgisFeature<T>> };

type GbraMajorRiverAttributes = {
  OBJECTID?: number;
  GNIS_Name?: string | null;
  Miles?: number | null;
  Shape__Length?: number | null;
};

type GbraLakeAttributes = {
  OBJECTID?: number;
  NAME?: string | null;
  AREA?: number | null;
  Shape__Area?: number | null;
  Shape__Length?: number | null;
};

function normalizeString(value: unknown, fallback = "Unknown"): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function buildQueryUrl(layerId: number): string {
  const url = new URL(`${GBRA_HYDROLOGY_SERVICE_URL}/${layerId}/query`);
  url.searchParams.set("where", "1=1");
  url.searchParams.set("outFields", "*");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("f", "json");
  return url.toString();
}

export function normalizeGbraHydrologyMajorRivers(rows: GbraMajorRiverAttributes[]): GbraHydrologyMajorRiver[] {
  return rows.map((row) => ({
    sourceId: "gbra-hydrology-major-rivers",
    objectId: row.OBJECTID ?? -1,
    name: normalizeString(row.GNIS_Name, "Unknown river"),
    miles: normalizeNumber(row.Miles),
    shapeLength: normalizeNumber(row.Shape__Length),
    raw: row as Record<string, unknown>,
  }));
}

export function normalizeGbraHydrologyLakes(rows: GbraLakeAttributes[]): GbraHydrologyLake[] {
  return rows.map((row) => ({
    sourceId: "gbra-hydrology-gvhs-lakes",
    objectId: row.OBJECTID ?? -1,
    name: normalizeString(row.NAME, "Unknown lake"),
    areaAcres: normalizeNumber(row.AREA),
    shapeArea: normalizeNumber(row.Shape__Area),
    shapeLength: normalizeNumber(row.Shape__Length),
    raw: row as Record<string, unknown>,
  }));
}

export function filterGbraHydrologyMajorRiversByName(rivers: GbraHydrologyMajorRiver[], name: string): GbraHydrologyMajorRiver[] {
  const needle = name.trim().toLowerCase();
  return needle ? rivers.filter((river) => river.name.toLowerCase().includes(needle)) : rivers;
}

export function filterGbraHydrologyLakesByName(lakes: GbraHydrologyLake[], name: string): GbraHydrologyLake[] {
  const needle = name.trim().toLowerCase();
  return needle ? lakes.filter((lake) => lake.name.toLowerCase().includes(needle)) : lakes;
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`GBRA hydrology request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function fetchMajorRiversUncached(signal?: AbortSignal): Promise<GbraHydrologyMajorRiver[]> {
  const response = await fetchJson<ArcgisQueryResponse<GbraMajorRiverAttributes>>(buildQueryUrl(MAJOR_RIVERS_LAYER_ID), signal);
  return normalizeGbraHydrologyMajorRivers((response.features ?? []).map((feature) => feature.attributes ?? {}));
}

async function fetchLakesUncached(signal?: AbortSignal): Promise<GbraHydrologyLake[]> {
  const response = await fetchJson<ArcgisQueryResponse<GbraLakeAttributes>>(buildQueryUrl(GVHS_LAKES_LAYER_ID), signal);
  return normalizeGbraHydrologyLakes((response.features ?? []).map((feature) => feature.attributes ?? {}));
}

export async function fetchGbraHydrologyMajorRivers(signal?: AbortSignal): Promise<GbraHydrologyMajorRiver[]> {
  if (signal) {
    return fetchMajorRiversUncached(signal);
  }
  return getGlobalWaterDataCache().getOrLoad("gbra-hydrology-major-rivers", GBRA_HYDROLOGY_TTL_MS, () => fetchMajorRiversUncached());
}

export async function fetchGbraHydrologyLakes(signal?: AbortSignal): Promise<GbraHydrologyLake[]> {
  if (signal) {
    return fetchLakesUncached(signal);
  }
  return getGlobalWaterDataCache().getOrLoad("gbra-hydrology-gvhs-lakes", GBRA_HYDROLOGY_TTL_MS, () => fetchLakesUncached());
}
