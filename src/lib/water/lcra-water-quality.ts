import type {
  LcraWaterQualityObservation,
  LcraWaterQualityParameter,
  LcraWaterQualitySegment,
  LcraWaterQualitySite,
} from "@/lib/water/types";
import { getGlobalWaterDataCache } from "@/lib/water/cache";

const LCRA_WATER_QUALITY_TTL_MS = 12 * 60 * 60 * 1000;

type LcraWaterQualitySiteApiRow = {
  SiteId?: string | number;
  SiteName?: string;
  SegmentId?: string | number | null;
  SegmentName?: string | null;
  RootSegmentId?: string | number | null;
  RootSegmentName?: string | null;
  Latitude?: string | number | null;
  Longitude?: string | number | null;
  LastDate?: string | null;
  Agency?: string | null;
  IsActive?: boolean | null;
  ImpairedSegment?: boolean | null;
  SurfaceDataOverride?: boolean | null;
};

type LcraWaterQualityParameterApiRow = {
  SiteId?: string | number;
  SegmentId?: string | number | null;
  StoretCode?: string | number;
  StoretName?: string | null;
  StoretCategory?: string | null;
  HasSurfaceData?: boolean | null;
};

type LcraWaterQualityObservationApiRow = {
  SiteId?: string | number;
  SegmentId?: string | number | null;
  StoretCode?: string | number;
  StoretName?: string | null;
  StoretCategory?: string | null;
  Depth?: string | null;
  Agency?: string | null;
  Symbol?: string | null;
  Value?: string | number | null;
  Date?: string;
};

type LcraWaterQualitySegmentApiRow = {
  SegmentId?: string | number;
  SegmentName?: string | null;
  RootSegmentId?: string | number | null;
  RootSegmentName?: string | null;
  SiteIds?: string | null;
  Agencies?: string | null;
  ImpairedSegment?: boolean | null;
  Sites?: Array<{ SiteId?: string | number; SiteName?: string | null }> | null;
};

function asString(value: string | number | null | undefined, fallback = ""): string {
  return value === null || value === undefined ? fallback : String(value);
}

function asNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function splitCsv(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeLcraWaterQualitySite(row: LcraWaterQualitySiteApiRow): LcraWaterQualitySite {
  return {
    sourceId: "lcra-water-quality-sites",
    siteId: asString(row.SiteId, "unknown-site"),
    siteName: asString(row.SiteName, "Unknown site"),
    segmentId: row.SegmentId === undefined ? null : asString(row.SegmentId),
    segmentName: row.SegmentName ?? null,
    rootSegmentId: row.RootSegmentId === undefined ? null : asString(row.RootSegmentId),
    rootSegmentName: row.RootSegmentName ?? null,
    latitude: asNumber(row.Latitude),
    longitude: asNumber(row.Longitude),
    lastObservedAt: row.LastDate ?? null,
    agency: row.Agency ?? null,
    isActive: row.IsActive ?? null,
    impairedSegment: row.ImpairedSegment ?? null,
    surfaceDataOverride: row.SurfaceDataOverride ?? null,
    raw: row as Record<string, unknown>,
  };
}

export function normalizeLcraWaterQualityParameter(row: LcraWaterQualityParameterApiRow): LcraWaterQualityParameter {
  return {
    sourceId: "lcra-water-quality-parameters",
    siteId: asString(row.SiteId, "unknown-site"),
    segmentId: row.SegmentId === undefined ? null : asString(row.SegmentId),
    storetCode: asString(row.StoretCode, "unknown-storet"),
    storetName: row.StoretName ?? null,
    storetCategory: row.StoretCategory ?? null,
    hasSurfaceData: row.HasSurfaceData ?? null,
    raw: row as Record<string, unknown>,
  };
}

export function normalizeLcraWaterQualityObservation(row: LcraWaterQualityObservationApiRow): LcraWaterQualityObservation {
  const numericValue = asNumber(row.Value);
  return {
    sourceId: "lcra-water-quality-observations",
    siteId: asString(row.SiteId, "unknown-site"),
    segmentId: row.SegmentId === undefined ? null : asString(row.SegmentId),
    storetCode: asString(row.StoretCode, "unknown-storet"),
    storetName: row.StoretName ?? null,
    storetCategory: row.StoretCategory ?? null,
    depth: row.Depth ?? null,
    agency: row.Agency ?? null,
    symbol: row.Symbol ?? null,
    value: numericValue ?? row.Value ?? null,
    observedAt: asString(row.Date, ""),
    raw: row as Record<string, unknown>,
  };
}

export function normalizeLcraWaterQualitySegment(row: LcraWaterQualitySegmentApiRow): LcraWaterQualitySegment {
  const siteIds = Array.from(new Set([
    ...splitCsv(row.SiteIds),
    ...((row.Sites ?? []).map((site) => asString(site.SiteId)).filter(Boolean)),
  ]));
  return {
    sourceId: "lcra-water-quality-segments",
    segmentId: asString(row.SegmentId, "unknown-segment"),
    segmentName: row.SegmentName ?? null,
    rootSegmentId: row.RootSegmentId === undefined ? null : asString(row.RootSegmentId),
    rootSegmentName: row.RootSegmentName ?? null,
    siteIds,
    agencies: splitCsv(row.Agencies),
    impairedSegment: row.ImpairedSegment ?? null,
    siteCount: siteIds.length,
    raw: row as Record<string, unknown>,
  };
}

export function filterLcraWaterQualityObservationsByStoretCode(
  observations: LcraWaterQualityObservation[],
  storetCode: string,
): LcraWaterQualityObservation[] {
  return observations.filter((observation) => observation.storetCode === storetCode);
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`LCRA water quality request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function fetchSitesUncached(signal?: AbortSignal): Promise<LcraWaterQualitySite[]> {
  const rows = await fetchJson<LcraWaterQualitySiteApiRow[]>("https://waterquality.lcra.org/api/Sites/GetSites", signal);
  return rows.map(normalizeLcraWaterQualitySite);
}

async function fetchSiteUncached(siteId: string, signal?: AbortSignal): Promise<LcraWaterQualitySite> {
  const row = await fetchJson<LcraWaterQualitySiteApiRow>(`https://waterquality.lcra.org/api/Sites/GetSite/${siteId}`, signal);
  return normalizeLcraWaterQualitySite(row);
}

async function fetchParametersUncached(siteId: string, signal?: AbortSignal): Promise<LcraWaterQualityParameter[]> {
  const rows = await fetchJson<LcraWaterQualityParameterApiRow[]>(`https://waterquality.lcra.org/api/Sites/GetSiteParameters/${siteId}`, signal);
  return rows.map(normalizeLcraWaterQualityParameter);
}

async function fetchObservationsUncached(siteId: string, includeProfile = false, signal?: AbortSignal): Promise<LcraWaterQualityObservation[]> {
  const suffix = includeProfile ? "?IncludeProfile=true" : "";
  const rows = await fetchJson<LcraWaterQualityObservationApiRow[]>(`https://waterquality.lcra.org/api/Sites/GetSiteData/${siteId}${suffix}`, signal);
  return rows.map(normalizeLcraWaterQualityObservation);
}

async function fetchSegmentUncached(segmentId: string, signal?: AbortSignal): Promise<LcraWaterQualitySegment> {
  const row = await fetchJson<LcraWaterQualitySegmentApiRow>(`https://waterquality.lcra.org/api/Segments/GetSegment/${segmentId}`, signal);
  return normalizeLcraWaterQualitySegment(row);
}

async function fetchSegmentParametersUncached(segmentId: string, signal?: AbortSignal): Promise<LcraWaterQualityParameter[]> {
  const rows = await fetchJson<LcraWaterQualityParameterApiRow[]>(`https://waterquality.lcra.org/api/Segments/GetSegmentParameters/${segmentId}`, signal);
  return rows.map(normalizeLcraWaterQualityParameter);
}

async function fetchSegmentObservationsUncached(segmentId: string, includeProfile = false, signal?: AbortSignal): Promise<LcraWaterQualityObservation[]> {
  const suffix = includeProfile ? "?IncludeProfile=true" : "";
  const rows = await fetchJson<LcraWaterQualityObservationApiRow[]>(`https://waterquality.lcra.org/api/Segments/GetSegmentData/${segmentId}${suffix}`, signal);
  return rows.map(normalizeLcraWaterQualityObservation);
}

export async function fetchLcraWaterQualitySites(signal?: AbortSignal): Promise<LcraWaterQualitySite[]> {
  if (signal) return fetchSitesUncached(signal);
  return getGlobalWaterDataCache().getOrLoad("lcra-water-quality-sites", LCRA_WATER_QUALITY_TTL_MS, () => fetchSitesUncached());
}

export async function fetchLcraWaterQualitySite(siteId: string, signal?: AbortSignal): Promise<LcraWaterQualitySite> {
  if (signal) return fetchSiteUncached(siteId, signal);
  return getGlobalWaterDataCache().getOrLoad(`lcra-water-quality-site:${siteId}`, LCRA_WATER_QUALITY_TTL_MS, () => fetchSiteUncached(siteId));
}

export async function fetchLcraWaterQualitySiteParameters(siteId: string, signal?: AbortSignal): Promise<LcraWaterQualityParameter[]> {
  if (signal) return fetchParametersUncached(siteId, signal);
  return getGlobalWaterDataCache().getOrLoad(`lcra-water-quality-parameters:${siteId}`, LCRA_WATER_QUALITY_TTL_MS, () => fetchParametersUncached(siteId));
}

export async function fetchLcraWaterQualitySiteObservations(
  siteId: string,
  options: { includeProfile?: boolean; signal?: AbortSignal } = {},
): Promise<LcraWaterQualityObservation[]> {
  const { includeProfile = false, signal } = options;
  if (signal) return fetchObservationsUncached(siteId, includeProfile, signal);
  return getGlobalWaterDataCache().getOrLoad(
    `lcra-water-quality-observations:${siteId}:${includeProfile ? "profile" : "surface"}`,
    LCRA_WATER_QUALITY_TTL_MS,
    () => fetchObservationsUncached(siteId, includeProfile),
  );
}

export async function fetchLcraWaterQualitySegment(segmentId: string, signal?: AbortSignal): Promise<LcraWaterQualitySegment> {
  if (signal) return fetchSegmentUncached(segmentId, signal);
  return getGlobalWaterDataCache().getOrLoad(`lcra-water-quality-segment:${segmentId}`, LCRA_WATER_QUALITY_TTL_MS, () => fetchSegmentUncached(segmentId));
}

export async function fetchLcraWaterQualitySegmentParameters(segmentId: string, signal?: AbortSignal): Promise<LcraWaterQualityParameter[]> {
  if (signal) return fetchSegmentParametersUncached(segmentId, signal);
  return getGlobalWaterDataCache().getOrLoad(`lcra-water-quality-segment-parameters:${segmentId}`, LCRA_WATER_QUALITY_TTL_MS, () => fetchSegmentParametersUncached(segmentId));
}

export async function fetchLcraWaterQualitySegmentObservations(
  segmentId: string,
  options: { includeProfile?: boolean; signal?: AbortSignal } = {},
): Promise<LcraWaterQualityObservation[]> {
  const { includeProfile = false, signal } = options;
  if (signal) return fetchSegmentObservationsUncached(segmentId, includeProfile, signal);
  return getGlobalWaterDataCache().getOrLoad(
    `lcra-water-quality-segment-observations:${segmentId}:${includeProfile ? "profile" : "surface"}`,
    LCRA_WATER_QUALITY_TTL_MS,
    () => fetchSegmentObservationsUncached(segmentId, includeProfile),
  );
}
