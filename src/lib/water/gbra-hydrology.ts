import { getCountyByFips, getCountyBySlugOrName } from "@/lib/water/county-lookup";
import { getGlobalWaterDataCache } from "@/lib/water/cache";
import type {
  GbraHydrologyLake,
  GbraHydrologyLakeCountyCoverage,
  GbraHydrologyMajorRiver,
  GbraHydrologySubwatershed,
  GbraHydrologyWatershed,
  GbraWaterQualityObservation,
  GbraWaterQualitySite,
} from "@/lib/water/types";

const GBRA_HYDROLOGY_SERVICE_URL = "https://services7.arcgis.com/Q6vsXnxTnYcWB7qg/arcgis/rest/services/GBRA_Hydrology/FeatureServer";
const TIGERWEB_COUNTY_QUERY_URL = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query";
const GBRA_WATER_QUALITY_PAGE_ROOT = "https://www.gbra.org/environmental/water-quality/sites";
const TEXAS_STATE_FIPS = "48";
const GBRA_HYDROLOGY_TTL_MS = 24 * 60 * 60 * 1000;
const GBRA_WATER_QUALITY_TTL_MS = 24 * 60 * 60 * 1000;
const MAJOR_RIVERS_LAYER_ID = 1;
const GVHS_LAKES_LAYER_ID = 2;
const SUBWATERSHEDS_LAYER_ID = 3;
const WATERSHEDS_LAYER_ID = 4;
const GBRA_LAYER_SPATIAL_REFERENCE = 26914;
const DEFAULT_GBRA_WATER_QUALITY_COUNTIES = ["blanco", "caldwell", "calhoun", "comal", "dewitt", "goliad", "gonzales", "guadalupe", "hays", "jackson", "kendall", "kerr", "victoria"] as const;

type ArcgisGeometry = {
  rings?: number[][][];
  spatialReference?: { wkid?: number; latestWkid?: number };
};

type ArcgisFeature<T> = { attributes?: T; geometry?: ArcgisGeometry };
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

type GbraWatershedAttributes = {
  OBJECTID?: number;
  Name?: string | null;
  HUC10?: string | null;
  AreaSqKm?: number | null;
  AreaAcres?: number | null;
  Shape__Area?: number | null;
  Shape__Length?: number | null;
};

type GbraSubwatershedAttributes = {
  OBJECTID?: number;
  Name?: string | null;
  HUC12?: string | null;
  AreaSqKm?: number | null;
  AreaAcres?: number | null;
  Shape__Area?: number | null;
  Shape__Length?: number | null;
};

type CountyOverlayAttributes = {
  NAME?: string | null;
  GEOID?: string | null;
};

type GbraWaterQualitySiteRow = {
  countySlug: string;
  countyName: string;
  sourcePageUrl: string;
  stationId: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  parameters: string | null;
  monitoringType: string | null;
  historicalXlsUrl: string | null;
  currentCsvUrl: string | null;
};

type GbraWaterQualityObservationRow = {
  stationName: string | null;
  collectedAt: string;
  parameter: string;
  reportedResult: string | null;
  units: string | null;
  parameterCode: string | null;
};

function normalizeString(value: unknown, fallback = "Unknown"): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/county$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function buildQueryUrl(layerId: number, returnGeometry = false): string {
  const url = new URL(`${GBRA_HYDROLOGY_SERVICE_URL}/${layerId}/query`);
  url.searchParams.set("where", "1=1");
  url.searchParams.set("outFields", "*");
  url.searchParams.set("returnGeometry", String(returnGeometry));
  url.searchParams.set("f", "json");
  return url.toString();
}

function buildGbraWaterQualityCountyUrl(countySlug: string): string {
  return `${GBRA_WATER_QUALITY_PAGE_ROOT}/${normalizeSlug(countySlug)}/`;
}

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    rsquo: "’",
    lsquo: "‘",
    rdquo: "”",
    ldquo: "“",
    ndash: "–",
    mdash: "—",
    deg: "°",
  };

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function stripTags(value: string): string {
  return decodeHtmlEntities(value.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function parseDmsCoordinate(part: string): number | null {
  const cleaned = decodeHtmlEntities(part).replace(/\s+/g, " ").trim();
  const match = cleaned.match(/(-?\d+)°\s*(\d+)[’']\s*(\d+)(?:[”"])?/);
  if (!match) return null;
  const degrees = Number.parseInt(match[1] ?? "", 10);
  const minutes = Number.parseInt(match[2] ?? "", 10);
  const seconds = Number.parseInt(match[3] ?? "", 10);
  if (!Number.isFinite(degrees) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
  const sign = degrees < 0 ? -1 : 1;
  return sign * (Math.abs(degrees) + (minutes / 60) + (seconds / 3600));
}

function parseCoordinateCell(text: string): { latitude: number | null; longitude: number | null } {
  const [latText = "", lonText = ""] = text.split("/").map((part) => part.trim());
  return {
    latitude: parseDmsCoordinate(latText),
    longitude: parseDmsCoordinate(lonText),
  };
}

function parseHtmlTableCells(rowHtml: string): string[] {
  return Array.from(rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi), (match) => match[1] ?? "");
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseObservationTimestamp(dateText: string, timeText: string): string {
  const [monthText = "1", dayText = "1", yearText = "1970"] = dateText.trim().split("/");
  const [hourText = "0", minuteText = "0"] = timeText.trim().split(":");
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);
  const year = Number.parseInt(yearText, 10);
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);

  if ([month, day, year, hour, minute].every(Number.isFinite)) {
    return new Date(Date.UTC(year, month - 1, day, hour, minute)).toISOString();
  }

  return new Date(0).toISOString();
}

function normalizeLake(row: GbraLakeAttributes): GbraHydrologyLake {
  return {
    sourceId: "gbra-hydrology-gvhs-lakes",
    objectId: row.OBJECTID ?? -1,
    name: normalizeString(row.NAME, "Unknown lake"),
    areaAcres: normalizeNumber(row.AREA),
    shapeArea: normalizeNumber(row.Shape__Area),
    shapeLength: normalizeNumber(row.Shape__Length),
    raw: row as Record<string, unknown>,
  };
}

function normalizeCountyAttributes(row: CountyOverlayAttributes) {
  const byFips = row.GEOID ? getCountyByFips(row.GEOID) : undefined;
  const byName = row.NAME ? getCountyBySlugOrName(row.NAME) : undefined;
  const county = byFips ?? byName;

  return county
    ? { name: county.name, slug: county.slug, fips: county.fips }
    : { name: normalizeString(row.NAME, "Unknown County"), slug: normalizeString(row.NAME, "unknown-county").toLowerCase().replace(/\s+/g, "-"), fips: row.GEOID ?? undefined };
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
  return rows.map(normalizeLake);
}

export function normalizeGbraHydrologyWatersheds(rows: GbraWatershedAttributes[]): GbraHydrologyWatershed[] {
  return rows.map((row) => ({
    sourceId: "gbra-hydrology-watersheds",
    objectId: row.OBJECTID ?? -1,
    name: normalizeString(row.Name, "Unknown watershed"),
    huc10: normalizeString(row.HUC10, "unknown-huc10"),
    areaSqKm: normalizeNumber(row.AreaSqKm),
    areaAcres: normalizeNumber(row.AreaAcres),
    shapeArea: normalizeNumber(row.Shape__Area),
    shapeLength: normalizeNumber(row.Shape__Length),
    raw: row as Record<string, unknown>,
  }));
}

export function normalizeGbraHydrologySubwatersheds(rows: GbraSubwatershedAttributes[]): GbraHydrologySubwatershed[] {
  return rows.map((row) => ({
    sourceId: "gbra-hydrology-subwatersheds",
    objectId: row.OBJECTID ?? -1,
    name: normalizeString(row.Name, "Unknown subwatershed"),
    huc12: normalizeString(row.HUC12, "unknown-huc12"),
    areaSqKm: normalizeNumber(row.AreaSqKm),
    areaAcres: normalizeNumber(row.AreaAcres),
    shapeArea: normalizeNumber(row.Shape__Area),
    shapeLength: normalizeNumber(row.Shape__Length),
    raw: row as Record<string, unknown>,
  }));
}

export function normalizeGbraWaterQualitySites(rows: GbraWaterQualitySiteRow[]): GbraWaterQualitySite[] {
  return rows.map((row) => ({
    sourceId: "gbra-water-quality-sites",
    stationId: row.stationId,
    countySlug: row.countySlug,
    countyName: row.countyName,
    sourcePageUrl: row.sourcePageUrl,
    description: row.description,
    latitude: row.latitude,
    longitude: row.longitude,
    parameterFrequency: row.parameters,
    monitoringType: row.monitoringType,
    historicalXlsUrl: row.historicalXlsUrl,
    currentCsvUrl: row.currentCsvUrl,
    raw: row as Record<string, unknown>,
  }));
}

export function normalizeGbraWaterQualityObservations(stationId: string, rows: GbraWaterQualityObservationRow[]): GbraWaterQualityObservation[] {
  return rows.map((row) => ({
    sourceId: "gbra-water-quality-observations",
    stationId,
    stationName: row.stationName,
    collectedAt: row.collectedAt,
    parameter: row.parameter,
    reportedResult: row.reportedResult,
    units: row.units,
    parameterCode: row.parameterCode,
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

export function filterGbraHydrologyLakeCountyCoverageByName(coverage: GbraHydrologyLakeCountyCoverage[], name: string): GbraHydrologyLakeCountyCoverage[] {
  const needle = name.trim().toLowerCase();
  return needle ? coverage.filter((row) => row.lake.name.toLowerCase().includes(needle)) : coverage;
}

export function filterGbraHydrologyWatershedsByName(watersheds: GbraHydrologyWatershed[], name: string): GbraHydrologyWatershed[] {
  const needle = name.trim().toLowerCase();
  return needle ? watersheds.filter((row) => row.name.toLowerCase().includes(needle)) : watersheds;
}

export function filterGbraHydrologySubwatershedsByName(subwatersheds: GbraHydrologySubwatershed[], name: string): GbraHydrologySubwatershed[] {
  const needle = name.trim().toLowerCase();
  return needle ? subwatersheds.filter((row) => row.name.toLowerCase().includes(needle)) : subwatersheds;
}

export function filterGbraWaterQualitySitesByName(sites: GbraWaterQualitySite[], name: string): GbraWaterQualitySite[] {
  const needle = name.trim().toLowerCase();
  return needle ? sites.filter((site) => site.description.toLowerCase().includes(needle) || site.stationId.toLowerCase().includes(needle)) : sites;
}

export function filterGbraWaterQualitySitesByCounty(sites: GbraWaterQualitySite[], county: string): GbraWaterQualitySite[] {
  const needle = normalizeSlug(county);
  return needle ? sites.filter((site) => normalizeSlug(site.countySlug) === needle || normalizeSlug(site.countyName) === needle) : sites;
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`GBRA hydrology request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function fetchText(url: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch(url, {
    signal,
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/csv;q=0.8,*/*;q=0.7",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!response.ok) {
    throw new Error(`GBRA water quality request failed: ${response.status}`);
  }
  return response.text();
}

async function postCountyOverlayQuery(geometry: ArcgisGeometry, signal?: AbortSignal): Promise<Array<{ name: string; slug: string; fips?: string }>> {
  const body = new URLSearchParams({
    geometry: JSON.stringify(geometry),
    geometryType: "esriGeometryPolygon",
    spatialRel: "esriSpatialRelIntersects",
    inSR: String(geometry.spatialReference?.latestWkid ?? geometry.spatialReference?.wkid ?? GBRA_LAYER_SPATIAL_REFERENCE),
    where: `STATE='${TEXAS_STATE_FIPS}'`,
    outFields: "NAME,GEOID",
    returnGeometry: "false",
    f: "json",
  });

  const response = await fetch(TIGERWEB_COUNTY_QUERY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
    signal,
  });

  if (!response.ok) {
    throw new Error(`County overlay request failed: ${response.status}`);
  }

  const payload = await response.json() as ArcgisQueryResponse<CountyOverlayAttributes>;
  const deduped = new Map<string, { name: string; slug: string; fips?: string }>();
  for (const feature of payload.features ?? []) {
    const county = normalizeCountyAttributes(feature.attributes ?? {});
    deduped.set(county.slug, county);
  }
  return Array.from(deduped.values());
}

function extractGbraMonitoringBlock(html: string): string {
  const startMarker = "Guadalupe River Basin Surface Water Quality Monitoring Program GBRA Monitoring Locations";
  const endMarker = "Guadalupe River Basin Surface Water Quality Monitoring Program TCEQ Monitoring Locations";
  const start = html.indexOf(startMarker);
  if (start < 0) return html;
  const sliced = html.slice(start);
  const end = sliced.indexOf(endMarker);
  return end >= 0 ? sliced.slice(0, end) : sliced;
}

function parseGbraWaterQualityCountyPage(html: string, countySlug: string): GbraWaterQualitySiteRow[] {
  const county = getCountyBySlugOrName(countySlug);
  const sourcePageUrl = buildGbraWaterQualityCountyUrl(countySlug);
  const block = extractGbraMonitoringBlock(html);
  const rows = Array.from(block.matchAll(/<tr\b[^>]*id=["'](\d+)["'][^>]*>([\s\S]*?)<\/tr>/gi));

  return rows.map((match) => {
    const stationId = match[1] ?? "";
    const cells = parseHtmlTableCells(match[2] ?? "");
    const description = stripTags(cells[1] ?? "");
    const coordinateText = stripTags(cells[2] ?? "");
    const { latitude, longitude } = parseCoordinateCell(coordinateText);
    const historicalMatches = Array.from((cells[5] ?? "").matchAll(/href=["']([^"']+)["']/gi), (hrefMatch) => hrefMatch[1] ?? null).filter(Boolean) as string[];
    const currentMatches = Array.from((cells[6] ?? "").matchAll(/href=["']([^"']+)["']/gi), (hrefMatch) => hrefMatch[1] ?? null).filter(Boolean) as string[];

    return {
      countySlug: normalizeSlug(county?.slug ?? countySlug),
      countyName: county?.name?.replace(/ County$/, "") ?? normalizeString(countySlug),
      sourcePageUrl,
      stationId,
      description,
      latitude,
      longitude,
      parameters: normalizeOptionalString(stripTags(cells[3] ?? "")),
      monitoringType: normalizeOptionalString(stripTags(cells[4] ?? "")),
      historicalXlsUrl: historicalMatches[0] ?? null,
      currentCsvUrl: currentMatches[0] ?? null,
    } satisfies GbraWaterQualitySiteRow;
  }).filter((row) => row.stationId && row.description);
}

function parseGbraWaterQualityObservationCsv(stationId: string, csvText: string): GbraWaterQualityObservation[] {
  const normalizedText = csvText.replace(/^\uFEFF/, "");
  const lines = normalizedText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const stationLine = parseCsvLine(lines[0] ?? "");
  const stationName = stationLine.length > 1 ? stationLine.slice(1).join(", ").trim() : null;
  const headerIndex = lines.findIndex((line) => line.toLowerCase().startsWith("collect date,"));
  if (headerIndex < 0) return [];

  const rows: GbraWaterQualityObservationRow[] = [];
  for (const line of lines.slice(headerIndex + 1)) {
    const [collectDate, collectTime, parameter, reportedResult, units, parameterCode] = parseCsvLine(line);
    if (!collectDate || !parameter) continue;
    rows.push({
      stationName,
      collectedAt: parseObservationTimestamp(collectDate, collectTime ?? "00:00"),
      parameter,
      reportedResult: normalizeOptionalString(reportedResult),
      units: normalizeOptionalString(units),
      parameterCode: normalizeOptionalString(parameterCode),
    });
  }

  return normalizeGbraWaterQualityObservations(stationId, rows);
}

async function fetchMajorRiversUncached(signal?: AbortSignal): Promise<GbraHydrologyMajorRiver[]> {
  const response = await fetchJson<ArcgisQueryResponse<GbraMajorRiverAttributes>>(buildQueryUrl(MAJOR_RIVERS_LAYER_ID), signal);
  return normalizeGbraHydrologyMajorRivers((response.features ?? []).map((feature) => feature.attributes ?? {}));
}

async function fetchLakesUncached(signal?: AbortSignal): Promise<GbraHydrologyLake[]> {
  const response = await fetchJson<ArcgisQueryResponse<GbraLakeAttributes>>(buildQueryUrl(GVHS_LAKES_LAYER_ID), signal);
  return normalizeGbraHydrologyLakes((response.features ?? []).map((feature) => feature.attributes ?? {}));
}

async function fetchWatershedsUncached(signal?: AbortSignal): Promise<GbraHydrologyWatershed[]> {
  const response = await fetchJson<ArcgisQueryResponse<GbraWatershedAttributes>>(buildQueryUrl(WATERSHEDS_LAYER_ID), signal);
  return normalizeGbraHydrologyWatersheds((response.features ?? []).map((feature) => feature.attributes ?? {}));
}

async function fetchSubwatershedsUncached(signal?: AbortSignal): Promise<GbraHydrologySubwatershed[]> {
  const response = await fetchJson<ArcgisQueryResponse<GbraSubwatershedAttributes>>(buildQueryUrl(SUBWATERSHEDS_LAYER_ID), signal);
  return normalizeGbraHydrologySubwatersheds((response.features ?? []).map((feature) => feature.attributes ?? {}));
}

async function fetchLakeCountyCoverageUncached(signal?: AbortSignal): Promise<GbraHydrologyLakeCountyCoverage[]> {
  const response = await fetchJson<ArcgisQueryResponse<GbraLakeAttributes>>(buildQueryUrl(GVHS_LAKES_LAYER_ID, true), signal);
  const coverage = await Promise.all((response.features ?? []).map(async (feature) => {
    const lake = normalizeLake(feature.attributes ?? {});
    const geometry = feature.geometry ?? { rings: [] };
    const counties = geometry.rings?.length ? await postCountyOverlayQuery({ ...geometry, spatialReference: geometry.spatialReference ?? { wkid: GBRA_LAYER_SPATIAL_REFERENCE } }, signal) : [];
    return {
      sourceId: "gbra-hydrology-gvhs-lakes",
      lake,
      countyCount: counties.length,
      counties,
    } satisfies GbraHydrologyLakeCountyCoverage;
  }));

  return coverage;
}

async function fetchWaterQualitySitesUncached(countySlugs: readonly string[], signal?: AbortSignal): Promise<GbraWaterQualitySite[]> {
  const pages = await Promise.all(countySlugs.map(async (countySlug) => {
    const html = await fetchText(buildGbraWaterQualityCountyUrl(countySlug), signal);
    return parseGbraWaterQualityCountyPage(html, countySlug);
  }));

  const deduped = new Map<string, GbraWaterQualitySite>();
  for (const site of normalizeGbraWaterQualitySites(pages.flat())) {
    if (!deduped.has(site.stationId)) {
      deduped.set(site.stationId, site);
    }
  }
  return Array.from(deduped.values()).sort((left, right) => left.stationId.localeCompare(right.stationId));
}

async function fetchWaterQualityObservationsUncached(stationId: string, currentCsvUrl: string, signal?: AbortSignal): Promise<GbraWaterQualityObservation[]> {
  const csvText = await fetchText(currentCsvUrl, signal);
  return parseGbraWaterQualityObservationCsv(stationId, csvText);
}

export async function fetchGbraHydrologyMajorRivers(signal?: AbortSignal): Promise<GbraHydrologyMajorRiver[]> {
  if (signal) return fetchMajorRiversUncached(signal);
  return getGlobalWaterDataCache().getOrLoad("gbra-hydrology-major-rivers", GBRA_HYDROLOGY_TTL_MS, () => fetchMajorRiversUncached());
}

export async function fetchGbraHydrologyLakes(signal?: AbortSignal): Promise<GbraHydrologyLake[]> {
  if (signal) return fetchLakesUncached(signal);
  return getGlobalWaterDataCache().getOrLoad("gbra-hydrology-gvhs-lakes", GBRA_HYDROLOGY_TTL_MS, () => fetchLakesUncached());
}

export async function fetchGbraHydrologyWatersheds(signal?: AbortSignal): Promise<GbraHydrologyWatershed[]> {
  if (signal) return fetchWatershedsUncached(signal);
  return getGlobalWaterDataCache().getOrLoad("gbra-hydrology-watersheds", GBRA_HYDROLOGY_TTL_MS, () => fetchWatershedsUncached());
}

export async function fetchGbraHydrologySubwatersheds(signal?: AbortSignal): Promise<GbraHydrologySubwatershed[]> {
  if (signal) return fetchSubwatershedsUncached(signal);
  return getGlobalWaterDataCache().getOrLoad("gbra-hydrology-subwatersheds", GBRA_HYDROLOGY_TTL_MS, () => fetchSubwatershedsUncached());
}

export async function fetchGbraHydrologyLakeCountyCoverage(signal?: AbortSignal): Promise<GbraHydrologyLakeCountyCoverage[]> {
  return fetchLakeCountyCoverageUncached(signal);
}

export async function fetchGbraWaterQualitySites(signal?: AbortSignal, countySlugs: readonly string[] = DEFAULT_GBRA_WATER_QUALITY_COUNTIES): Promise<GbraWaterQualitySite[]> {
  if (signal) return fetchWaterQualitySitesUncached(countySlugs, signal);
  const normalizedCounties = countySlugs.map(normalizeSlug);
  const isDefault = normalizedCounties.length === DEFAULT_GBRA_WATER_QUALITY_COUNTIES.length
    && normalizedCounties.every((countySlug, index) => countySlug === DEFAULT_GBRA_WATER_QUALITY_COUNTIES[index]);
  if (isDefault) {
    return getGlobalWaterDataCache().getOrLoad("gbra-water-quality-sites", GBRA_WATER_QUALITY_TTL_MS, () => fetchWaterQualitySitesUncached(DEFAULT_GBRA_WATER_QUALITY_COUNTIES));
  }
  return fetchWaterQualitySitesUncached(normalizedCounties, signal);
}

export async function fetchGbraWaterQualitySite(stationId: string, signal?: AbortSignal, countySlugs?: readonly string[]): Promise<GbraWaterQualitySite | null> {
  const sites = await fetchGbraWaterQualitySites(signal, countySlugs);
  return sites.find((site) => site.stationId === stationId.trim()) ?? null;
}

export async function fetchGbraWaterQualityObservations(stationId: string, currentCsvUrl: string, signal?: AbortSignal): Promise<GbraWaterQualityObservation[]> {
  if (signal) return fetchWaterQualityObservationsUncached(stationId, currentCsvUrl, signal);
  return getGlobalWaterDataCache().getOrLoad(`gbra-water-quality-observations:${stationId}`, GBRA_WATER_QUALITY_TTL_MS, () => fetchWaterQualityObservationsUncached(stationId, currentCsvUrl));
}
