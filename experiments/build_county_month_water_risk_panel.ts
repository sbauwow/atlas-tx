import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { normalizeCountyName } from "@/lib/counties";
import { loadCountyMonthDroughtFromSnapshot } from "@/lib/datasets/drought";
import { loadCountyMonthNwsFloodAlertsFromSnapshot } from "@/lib/datasets/nws-flood-alerts";
import { loadCountyMonthPrecipitationFromSnapshot } from "@/lib/datasets/precipitation";
import { loadCountyMonthStreamflowFromSnapshot } from "@/lib/datasets/streamflow";
import { loadCountyMonthTemperatureFromSnapshot } from "@/lib/datasets/temperature";
import { loadSurfaceWaterQualityFromSnapshot, type SurfaceWaterQualityRow } from "@/lib/datasets/surface-water-quality";
import { loadTwdbHydrologyFromSnapshot, type TwdbHydrologyRow } from "@/lib/datasets/twdb-hydrology";
import type { SdwisRow } from "@/lib/datasets/sdwis";
import { TEXAS_COUNTY_CENTROIDS, type CountyCentroid } from "@/lib/texas-county-centroids";

export const PANEL_OUTPUT_PATH = "data/panels/county_month_water_risk.csv";
export const PANEL_SCHEMA_OUTPUT_PATH = "data/panels/county_month_water_risk.schema.json";
export const PANEL_COVERAGE_OUTPUT_PATH = "outputs/panel-summary/county-month-water-risk-coverage.md";
export const PANEL_MISSINGNESS_OUTPUT_PATH = "outputs/panel-summary/county-month-water-risk-missingness.csv";

const SDWIS_HISTORICAL_PATH = "data/sdwis-healthbased-2020.json";
const SDWIS_SNAPSHOT_PATH = "public/cache/sdwis-tx.json";
const SDWIS_HISTORICAL_SOURCE_VERSION = "data/sdwis-healthbased-2020.json";
const SOCRATA_BASE = "https://data.texas.gov/resource";
const OVERFLOW_DATASET_ID = "8kc5-95uk";
const PERMIT_DATASET_ID = "7fq8-wig2";
const DEFAULT_START_MONTH = "2020-01";

type CountyInfo = {
  county_fips: string;
  county_name: string;
  county_slug: string;
  centroid: CountyCentroid;
};

export type CountyMonthLookupKey = `${string}__${string}`;

type CountyMonthKey = {
  county_fips: string;
  county_name: string;
  year: number;
  month: number;
  year_month: string;
};

type SdwisMonthlyOutcome = {
  sdwis_event_any: 0 | 1;
  sdwis_event_count: number;
};

type OverflowMonthlyFeature = {
  overflow_any: 0 | 1;
  overflow_count: number;
  overflow_gallons_sum: number;
  overflow_log_gallons_sum: number;
  overflow_severe_any: 0 | 1;
  overflow_reaches_water_count: number;
};

type StructuralFeatureMap = Map<string, number>;

type CanonicalPanelRow = CountyMonthKey & {
  sdwis_event_any: 0 | 1;
  sdwis_event_count: number;
  sdwis_event_weighted: number | null;
  sdwis_prior_1m_any: 0 | 1;
  sdwis_prior_3m_count: number;
  sdwis_prior_6m_count: number;
  sdwis_prior_12m_count: number;
  sdwis_cumulative_prior_count: number;
  overflow_any: 0 | 1;
  overflow_count: number;
  overflow_gallons_sum: number;
  overflow_log_gallons_sum: number;
  overflow_severe_any: 0 | 1 | null;
  overflow_reaches_water_count: number | null;
  overflow_count_3m: number;
  overflow_gallons_sum_3m: number;
  overflow_repeat_3m_any: 0 | 1;
  overflow_months_since_last: number | null;
  permit_count_current: number | null;
  impaired_segments_current: number | null;
  hydrology_context_score_current: number | null;
  precip_total_mm: number | null;
  precip_anomaly_z: number | null;
  heavy_rain_days: number | null;
  precip_max_1d_mm: number | null;
  temp_mean_anomaly_z: number | null;
  heat_days: number | null;
  freeze_days: number | null;
  drought_fraction_d1plus: number | null;
  drought_fraction_d3plus: number | null;
  flood_warning_any: 0 | 1 | null;
  flood_warning_count: number | null;
  flash_flood_warning_any: 0 | 1 | null;
  streamflow_high_count: number | null;
  streamflow_low_count: number | null;
  streamflow_extreme_high_any: 0 | 1 | null;
  streamflow_extreme_low_any: 0 | 1 | null;
  overflow_x_precip_anomaly: number | null;
  overflow_x_flood_warning: number | null;
  overflow_x_drought: number | null;
  overflow_x_heat: number | null;
  overflow_x_streamflow_high: number | null;
  overflow_x_streamflow_low: number | null;
  panel_built_at: string;
  sdwis_source_version: string | null;
  overflow_source_version: string | null;
  structural_source_version: string | null;
  weather_source_version: string | null;
  sdwis_data_complete_flag: 0 | 1;
  overflow_data_complete_flag: 0 | 1;
  structural_data_complete_flag: 0 | 1;
  weather_data_complete_flag: 0 | 1;
  row_usable_for_trigger_models: 0 | 1;
  row_usable_for_structural_models: 0 | 1;
  missingness_note: string | null;
};

type OverflowRawRow = {
  incident_number?: string;
  county?: string | null;
  amount?: string | number | null;
  amount_unit?: string | null;
  start_date?: string | null;
  receiving_water_body?: string | null;
};

type PermitCountRow = {
  facility_county?: string | null;
  permit_count?: string | number | null;
};

type SocrataQueryOptions = {
  select?: string;
  where?: string;
  group?: string;
  order?: string;
  limit?: number;
  offset?: number;
};

type PanelBuildResult = {
  builtAt: string;
  panelPath: string;
  schemaPath: string;
  coveragePath: string;
  missingnessPath: string;
  rowCount: number;
  countyCount: number;
  monthCount: number;
  minYearMonth: string;
  maxYearMonth: string;
};

function buildSocrataUrl(datasetId: string, options: SocrataQueryOptions = {}): string {
  const url = new URL(`${SOCRATA_BASE}/${datasetId}.json`);
  if (options.select) url.searchParams.set("$select", options.select);
  if (options.where) url.searchParams.set("$where", options.where);
  if (options.group) url.searchParams.set("$group", options.group);
  if (options.order) url.searchParams.set("$order", options.order);
  if (typeof options.limit === "number") url.searchParams.set("$limit", String(options.limit));
  if (typeof options.offset === "number") url.searchParams.set("$offset", String(options.offset));
  return url.toString();
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return await response.json() as T;
}

async function fetchSocrataRowsPaginated<T>(datasetId: string, options: SocrataQueryOptions = {}): Promise<T[]> {
  const limit = options.limit ?? 50_000;
  const out: T[] = [];
  for (let offset = 0; ; offset += limit) {
    const page = await fetchJson<T[]>(buildSocrataUrl(datasetId, { ...options, limit, offset }));
    out.push(...page);
    if (page.length < limit) {
      return out;
    }
  }
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toYearMonth(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = String(value).trim();
  const match = text.match(/^(\d{4}-\d{2})/);
  if (match) return match[1] ?? null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 7);
}

export function buildCountyMonthLookupKey(countyName: string, yearMonth: string): CountyMonthLookupKey {
  return `${countyName}__${yearMonth}`;
}

function monthToParts(yearMonth: string): { year: number; month: number } {
  return {
    year: Number(yearMonth.slice(0, 4)),
    month: Number(yearMonth.slice(5, 7)),
  };
}

function monthRange(startYearMonth: string, endYearMonth: string): string[] {
  const out: string[] = [];
  let year = Number(startYearMonth.slice(0, 4));
  let month = Number(startYearMonth.slice(5, 7));
  const endYear = Number(endYearMonth.slice(0, 4));
  const endMonth = Number(endYearMonth.slice(5, 7));

  while (year < endYear || (year === endYear && month <= endMonth)) {
    out.push(`${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      year += 1;
      month = 1;
    }
  }

  return out;
}

function latestCompleteMonth(referenceDate = new Date()): string {
  const date = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 7);
}

export function buildCountyInfoIndex(
  centroids: Record<string, CountyCentroid> = TEXAS_COUNTY_CENTROIDS,
): CountyInfo[] {
  return Object.entries(centroids)
    .map(([county_slug, centroid]) => ({
      county_slug,
      centroid,
      county_fips: centroid.fips ?? "",
      county_name: normalizeCountyName(county_slug.replace(/-/g, " ")),
    }))
    .filter((row) => row.county_fips)
    .sort((left, right) => left.county_fips.localeCompare(right.county_fips));
}

export function buildCountyMonthSkeleton(counties: CountyInfo[], startYearMonth: string, endYearMonth: string): CountyMonthKey[] {
  const months = monthRange(startYearMonth, endYearMonth);
  return counties.flatMap((county) =>
    months.map((year_month) => {
      const { year, month } = monthToParts(year_month);
      return {
        county_fips: county.county_fips,
        county_name: county.county_name,
        year,
        month,
        year_month,
      } satisfies CountyMonthKey;
    }),
  );
}

async function readJsonIfExists<T>(relativePath: string): Promise<T | null> {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  try {
    const raw = await fs.readFile(absolutePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : null;
    if (code === "ENOENT") return null;
    throw error;
  }
}

async function loadHistoricalSdwisRows(): Promise<{ rows: SdwisRow[]; sourceVersion: string }> {
  const historical = await readJsonIfExists<SdwisRow[]>(SDWIS_HISTORICAL_PATH);
  if (historical) {
    return { rows: historical, sourceVersion: SDWIS_HISTORICAL_SOURCE_VERSION };
  }

  const snapshot = await readJsonIfExists<{ generatedAt: string; rows: SdwisRow[] }>(SDWIS_SNAPSHOT_PATH);
  if (!snapshot) {
    throw new Error("No SDWIS historical file or snapshot found for county-month panel build");
  }

  return {
    rows: snapshot.rows,
    sourceVersion: snapshot.generatedAt,
  };
}

function sdwisEventKey(row: SdwisRow): string | null {
  const beginDate = row.complPerBeginDate ?? null;
  if (!row.pwsid || !beginDate) return null;
  return [row.pwsid, row.violationId ?? row.violationCode ?? "unknown", beginDate].join("|");
}

export function aggregateSdwisMonthlyOutcomes(rows: SdwisRow[]): Map<string, SdwisMonthlyOutcome> {
  const eventsByCountyMonth = new Map<string, Set<string>>();

  for (const row of rows) {
    const countyName = row.county ? normalizeCountyName(row.county) : null;
    const yearMonth = toYearMonth(row.complPerBeginDate);
    const eventKey = sdwisEventKey(row);
    if (!countyName || !yearMonth || !eventKey) continue;

    const key = buildCountyMonthLookupKey(countyName, yearMonth);
    const events = eventsByCountyMonth.get(key) ?? new Set<string>();
    events.add(eventKey);
    eventsByCountyMonth.set(key, events);
  }

  return new Map(
    [...eventsByCountyMonth.entries()].map(([key, value]) => [
      key,
      {
        sdwis_event_any: value.size > 0 ? 1 : 0,
        sdwis_event_count: value.size,
      } satisfies SdwisMonthlyOutcome,
    ]),
  );
}

function toGallons(amount: string | number | null | undefined, unit: string | null | undefined): number {
  const numeric = asNumber(amount) ?? 0;
  const normalizedUnit = String(unit ?? "").trim().toUpperCase();
  if (!normalizedUnit || normalizedUnit === "GALLONS") return numeric;
  if (normalizedUnit === "MGD") return numeric * 1_000_000;
  return numeric;
}

function reachesWaterBody(row: OverflowRawRow): boolean {
  const waterBody = String(row.receiving_water_body ?? "").trim().toUpperCase();
  return Boolean(waterBody && waterBody !== "NO WATER BODY PROVIDED");
}

export function summarizeOverflowRows(rows: OverflowRawRow[]): {
  monthly: Map<string, OverflowMonthlyFeature>;
  sourceVersion: string;
  severeThresholdGallons: number;
  droppedRowsWithoutCounty: number;
  droppedRowsWithoutDate: number;
} {
  const incidentRows: Array<{ key: string; gallons: number }> = [];
  let droppedRowsWithoutCounty = 0;
  let droppedRowsWithoutDate = 0;

  const normalizedRows = rows.flatMap((row) => {
    const countyName = row.county ? normalizeCountyName(row.county) : null;
    const yearMonth = toYearMonth(row.start_date);
    if (!countyName) {
      droppedRowsWithoutCounty += 1;
      return [];
    }
    if (!yearMonth) {
      droppedRowsWithoutDate += 1;
      return [];
    }
    const gallons = toGallons(row.amount, row.amount_unit);
    const key = buildCountyMonthLookupKey(countyName, yearMonth);
    incidentRows.push({ key, gallons });
    return [{ row, key, gallons }];
  });

  const sortedGallons = incidentRows.map((entry) => entry.gallons).sort((a, b) => a - b);
  const severeThresholdGallons = sortedGallons.length
    ? sortedGallons[Math.max(0, Math.floor(sortedGallons.length * 0.75) - 1)] ?? 0
    : 0;

  const monthly = new Map<string, OverflowMonthlyFeature>();
  for (const entry of normalizedRows) {
    const existing = monthly.get(entry.key) ?? {
      overflow_any: 0,
      overflow_count: 0,
      overflow_gallons_sum: 0,
      overflow_log_gallons_sum: 0,
      overflow_severe_any: 0,
      overflow_reaches_water_count: 0,
    };
    existing.overflow_any = 1;
    existing.overflow_count += 1;
    existing.overflow_gallons_sum += entry.gallons;
    existing.overflow_severe_any = entry.gallons >= severeThresholdGallons ? 1 : existing.overflow_severe_any;
    existing.overflow_reaches_water_count += reachesWaterBody(entry.row) ? 1 : 0;
    monthly.set(entry.key, existing);
  }

  for (const value of monthly.values()) {
    value.overflow_log_gallons_sum = Number(Math.log1p(value.overflow_gallons_sum).toFixed(6));
  }

  return {
    monthly,
    sourceVersion: new Date().toISOString(),
    severeThresholdGallons,
    droppedRowsWithoutCounty,
    droppedRowsWithoutDate,
  };
}

async function fetchHistoricalOverflowRows(startYearMonth: string): Promise<OverflowRawRow[]> {
  return await fetchSocrataRowsPaginated<OverflowRawRow>(OVERFLOW_DATASET_ID, {
    select: "incident_number,county,amount,amount_unit,start_date,receiving_water_body",
    where: `start_date >= '${startYearMonth}-01T00:00:00.000'`,
    order: "start_date ASC",
    limit: 50_000,
  });
}

export async function fetchCurrentPermitCounts(): Promise<{ counts: StructuralFeatureMap; sourceVersion: string }> {
  const rows = await fetchJson<PermitCountRow[]>(buildSocrataUrl(PERMIT_DATASET_ID, {
    select: "facility_county, count(*) as permit_count",
    group: "facility_county",
    order: "permit_count DESC",
    limit: 400,
  }));

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.facility_county) continue;
    counts.set(normalizeCountyName(row.facility_county), asNumber(row.permit_count) ?? 0);
  }

  return {
    counts,
    sourceVersion: new Date().toISOString(),
  };
}

export function summarizeImpairedSegmentsByCounty(rows: SurfaceWaterQualityRow[]): StructuralFeatureMap {
  const segmentsByCounty = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.isImpaired || !row.countyName || !row.segmentId) continue;
    const countyName = normalizeCountyName(row.countyName);
    const set = segmentsByCounty.get(countyName) ?? new Set<string>();
    set.add(row.segmentId);
    segmentsByCounty.set(countyName, set);
  }

  return new Map([...segmentsByCounty.entries()].map(([countyName, segmentIds]) => [countyName, segmentIds.size]));
}

function bboxContainsCentroid(row: TwdbHydrologyRow, centroid: CountyCentroid): boolean {
  return (
    centroid.lon >= row.bbox[0] &&
    centroid.lat >= row.bbox[1] &&
    centroid.lon <= row.bbox[2] &&
    centroid.lat <= row.bbox[3]
  );
}

export function summarizeHydrologyContextScores(rows: TwdbHydrologyRow[], counties: CountyInfo[]): StructuralFeatureMap {
  const scores = new Map<string, number>();
  for (const county of counties) {
    const score = rows.reduce((count, row) => count + (bboxContainsCentroid(row, county.centroid) ? 1 : 0), 0);
    scores.set(county.county_name, score);
  }
  return scores;
}

function csvEscape(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
  if (!rows.length) return "";
  const columns = Object.keys(rows[0]!);
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function rollingSum(values: number[], endExclusive: number, window: number): number {
  const start = Math.max(0, endExclusive - window);
  let sum = 0;
  for (let index = start; index < endExclusive; index += 1) {
    sum += values[index] ?? 0;
  }
  return sum;
}

function buildMissingnessNote(parts: string[]): string | null {
  const unique = [...new Set(parts.filter(Boolean))];
  return unique.length ? unique.join("; ") : null;
}

export async function buildCountyMonthWaterRiskPanel(options?: {
  startYearMonth?: string;
  endYearMonth?: string;
}) : Promise<PanelBuildResult> {
  const builtAt = new Date().toISOString();
  const startYearMonth = options?.startYearMonth ?? DEFAULT_START_MONTH;

  const counties = buildCountyInfoIndex();

  const [{ rows: sdwisRows, sourceVersion: sdwisSourceVersion }, surfaceRows, hydrologyRows, permitCounts, overflowRows, precipitationSnapshot, nwsFloodSnapshot, streamflowSnapshot, droughtSnapshot, temperatureSnapshot] = await Promise.all([
    loadHistoricalSdwisRows(),
    loadSurfaceWaterQualityFromSnapshot(),
    loadTwdbHydrologyFromSnapshot(),
    fetchCurrentPermitCounts(),
    fetchHistoricalOverflowRows(startYearMonth),
    loadCountyMonthPrecipitationFromSnapshot(),
    loadCountyMonthNwsFloodAlertsFromSnapshot(),
    loadCountyMonthStreamflowFromSnapshot(),
    loadCountyMonthDroughtFromSnapshot(),
    loadCountyMonthTemperatureFromSnapshot(),
  ]);

  const inferredSdwisEndYearMonth = sdwisRows
    .map((row) => toYearMonth(row.complPerBeginDate))
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? startYearMonth;
  const inferredOverflowEndYearMonth = overflowRows
    .map((row) => toYearMonth(row.start_date))
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? startYearMonth;
  const endYearMonth = options?.endYearMonth ?? [latestCompleteMonth(), inferredSdwisEndYearMonth, inferredOverflowEndYearMonth].sort()[0]!;
  const skeleton = buildCountyMonthSkeleton(counties, startYearMonth, endYearMonth);

  const sdwisMonthly = aggregateSdwisMonthlyOutcomes(sdwisRows);
  const impairedSegmentsCurrent = summarizeImpairedSegmentsByCounty(surfaceRows);
  const hydrologyContextScores = summarizeHydrologyContextScores(hydrologyRows, counties);
  const overflowSummary = summarizeOverflowRows(overflowRows);
  const precipitationByCountyMonth = new Map(
    (precipitationSnapshot?.rows ?? []).map((row) => [buildCountyMonthLookupKey(row.countyName, row.yearMonth), row] as const),
  );
  const nwsFloodByCountyMonth = new Map(
    (nwsFloodSnapshot?.rows ?? []).map((row) => [buildCountyMonthLookupKey(row.countyName, row.yearMonth), row] as const),
  );
  const streamflowByCountyMonth = new Map(
    (streamflowSnapshot?.rows ?? []).map((row) => [buildCountyMonthLookupKey(row.countyName, row.yearMonth), row] as const),
  );
  const droughtByCountyMonth = new Map(
    (droughtSnapshot?.rows ?? []).map((row) => [buildCountyMonthLookupKey(row.countyName, row.yearMonth), row] as const),
  );
  const temperatureByCountyMonth = new Map(
    (temperatureSnapshot?.rows ?? []).map((row) => [buildCountyMonthLookupKey(row.countyName, row.yearMonth), row] as const),
  );

  const surfaceSnapshot = await readJsonIfExists<{ generatedAt: string }>("public/cache/surface-water-quality-tx.json");
  const hydrologySnapshot = await readJsonIfExists<{ generatedAt: string }>("public/cache/twdb-hydrology-tx.json");
  const structuralSourceVersion = [
    `permits:${permitCounts.sourceVersion}`,
    `surface:${surfaceSnapshot?.generatedAt ?? "unknown"}`,
    `hydrology:${hydrologySnapshot?.generatedAt ?? "unknown"}`,
  ].join("|");

  const rows = skeleton.map((baseRow) => {
    const countyMonthKey = buildCountyMonthLookupKey(baseRow.county_name, baseRow.year_month);
    const sdwis = sdwisMonthly.get(countyMonthKey) ?? { sdwis_event_any: 0, sdwis_event_count: 0 };
    const overflow = overflowSummary.monthly.get(countyMonthKey) ?? {
      overflow_any: 0,
      overflow_count: 0,
      overflow_gallons_sum: 0,
      overflow_log_gallons_sum: 0,
      overflow_severe_any: 0,
      overflow_reaches_water_count: 0,
    };
    const precipitation = precipitationByCountyMonth.get(countyMonthKey) ?? null;
    const nwsFlood = nwsFloodByCountyMonth.get(countyMonthKey) ?? null;
    const streamflow = streamflowByCountyMonth.get(countyMonthKey) ?? null;
    const drought = droughtByCountyMonth.get(countyMonthKey) ?? null;
    const temperature = temperatureByCountyMonth.get(countyMonthKey) ?? null;
    const floodDefaults = nwsFloodSnapshot ? { floodWarningAny: 0 as const, floodWarningCount: 0, flashFloodWarningAny: 0 as const } : null;

    return {
      ...baseRow,
      sdwis_event_any: sdwis.sdwis_event_any,
      sdwis_event_count: sdwis.sdwis_event_count,
      sdwis_event_weighted: null,
      sdwis_prior_1m_any: 0,
      sdwis_prior_3m_count: 0,
      sdwis_prior_6m_count: 0,
      sdwis_prior_12m_count: 0,
      sdwis_cumulative_prior_count: 0,
      overflow_any: overflow.overflow_any,
      overflow_count: overflow.overflow_count,
      overflow_gallons_sum: overflow.overflow_gallons_sum,
      overflow_log_gallons_sum: overflow.overflow_log_gallons_sum,
      overflow_severe_any: overflow.overflow_severe_any,
      overflow_reaches_water_count: overflow.overflow_reaches_water_count,
      overflow_count_3m: 0,
      overflow_gallons_sum_3m: 0,
      overflow_repeat_3m_any: 0,
      overflow_months_since_last: null,
      permit_count_current: permitCounts.counts.get(baseRow.county_name) ?? 0,
      impaired_segments_current: impairedSegmentsCurrent.get(baseRow.county_name) ?? 0,
      hydrology_context_score_current: hydrologyContextScores.get(baseRow.county_name) ?? 0,
      precip_total_mm: precipitation?.precipTotalMm ?? null,
      precip_anomaly_z: precipitation?.precipAnomalyZ ?? null,
      heavy_rain_days: precipitation?.heavyRainDays ?? null,
      precip_max_1d_mm: precipitation?.precipMax1dMm ?? null,
      temp_mean_anomaly_z: temperature?.tempMeanAnomalyZ ?? null,
      heat_days: temperature?.heatDays ?? null,
      freeze_days: temperature?.freezeDays ?? null,
      drought_fraction_d1plus: drought?.droughtFractionD1plus ?? null,
      drought_fraction_d3plus: drought?.droughtFractionD3plus ?? null,
      flood_warning_any: nwsFlood?.floodWarningAny ?? floodDefaults?.floodWarningAny ?? null,
      flood_warning_count: nwsFlood?.floodWarningCount ?? floodDefaults?.floodWarningCount ?? null,
      flash_flood_warning_any: nwsFlood?.flashFloodWarningAny ?? floodDefaults?.flashFloodWarningAny ?? null,
      streamflow_high_count: streamflow?.streamflowHighCount ?? null,
      streamflow_low_count: streamflow?.streamflowLowCount ?? null,
      streamflow_extreme_high_any: streamflow?.streamflowExtremeHighAny ?? null,
      streamflow_extreme_low_any: streamflow?.streamflowExtremeLowAny ?? null,
      overflow_x_precip_anomaly: null,
      overflow_x_flood_warning: null,
      overflow_x_drought: null,
      overflow_x_heat: null,
      overflow_x_streamflow_high: null,
      overflow_x_streamflow_low: null,
      panel_built_at: builtAt,
      sdwis_source_version: sdwisSourceVersion,
      overflow_source_version: overflowSummary.sourceVersion,
      structural_source_version: structuralSourceVersion,
      weather_source_version: [precipitationSnapshot?.generatedAt ?? null, nwsFloodSnapshot?.generatedAt ?? null, streamflowSnapshot?.generatedAt ?? null, droughtSnapshot?.generatedAt ?? null, temperatureSnapshot?.generatedAt ?? null].filter(Boolean).join("|") || null,
      sdwis_data_complete_flag: 1,
      overflow_data_complete_flag: 1,
      structural_data_complete_flag: 1,
      weather_data_complete_flag: precipitation && nwsFloodSnapshot && streamflow && drought && temperature ? 1 : 0,
      row_usable_for_trigger_models: precipitation && nwsFloodSnapshot && streamflow && drought && temperature ? 1 : 0,
      row_usable_for_structural_models: 1,
      missingness_note: null,
    } satisfies CanonicalPanelRow;
  });

  const rowsByCounty = new Map<string, CanonicalPanelRow[]>();
  for (const row of rows) {
    const list = rowsByCounty.get(row.county_fips) ?? [];
    list.push(row);
    rowsByCounty.set(row.county_fips, list);
  }

  for (const countyRows of rowsByCounty.values()) {
    countyRows.sort((left, right) => left.year_month.localeCompare(right.year_month));
    const sdwisCounts = countyRows.map((row) => row.sdwis_event_count);
    const overflowCounts = countyRows.map((row) => row.overflow_count);
    const overflowGallons = countyRows.map((row) => row.overflow_gallons_sum);
    let cumulativeSdwis = 0;
    let lastOverflowIndex: number | null = null;

    countyRows.forEach((row, index) => {
      row.sdwis_prior_1m_any = (index > 0 && (sdwisCounts[index - 1] ?? 0) > 0) ? 1 : 0;
      row.sdwis_prior_3m_count = rollingSum(sdwisCounts, index, 3);
      row.sdwis_prior_6m_count = rollingSum(sdwisCounts, index, 6);
      row.sdwis_prior_12m_count = rollingSum(sdwisCounts, index, 12);
      row.sdwis_cumulative_prior_count = cumulativeSdwis;
      cumulativeSdwis += row.sdwis_event_count;

      row.overflow_count_3m = rollingSum(overflowCounts, index, 3);
      row.overflow_gallons_sum_3m = rollingSum(overflowGallons, index, 3);
      const priorThreeMonthsPositive = Array.from({ length: 3 }, (_, delta) => overflowCounts[index - 1 - delta] ?? 0)
        .filter((value) => value > 0).length;
      row.overflow_repeat_3m_any = priorThreeMonthsPositive >= 2 ? 1 : 0;
      row.overflow_x_precip_anomaly = row.precip_anomaly_z == null ? null : Number((row.overflow_count * row.precip_anomaly_z).toFixed(3));
      row.overflow_x_flood_warning = row.flood_warning_any == null ? null : row.overflow_count * row.flood_warning_any;
      row.overflow_x_drought = row.drought_fraction_d1plus == null ? null : Number((row.overflow_count * row.drought_fraction_d1plus).toFixed(3));
      row.overflow_x_heat = row.heat_days == null ? null : row.overflow_count * row.heat_days;
      row.overflow_x_streamflow_high = row.streamflow_high_count == null ? null : row.overflow_count * row.streamflow_high_count;
      row.overflow_x_streamflow_low = row.streamflow_low_count == null ? null : row.overflow_count * row.streamflow_low_count;

      if (lastOverflowIndex === null) {
        row.overflow_months_since_last = null;
      } else {
        row.overflow_months_since_last = index - lastOverflowIndex;
      }
      if (row.overflow_count > 0) {
        lastOverflowIndex = index;
      }

      row.missingness_note = buildMissingnessNote([
        row.precip_total_mm == null ? "historical precipitation not attached for this county-month" : "",
        !nwsFloodSnapshot ? "nws flood-warning join not attached for this county-month" : "",
        row.streamflow_high_count == null ? "streamflow join not attached for this county-month" : "",
        row.drought_fraction_d1plus == null ? "drought join not attached for this county-month" : "",
        row.heat_days == null ? "temperature join not attached for this county-month" : "",
      ]);
    });
  }

  await fs.mkdir(path.dirname(PANEL_OUTPUT_PATH), { recursive: true });
  await fs.mkdir(path.dirname(PANEL_SCHEMA_OUTPUT_PATH), { recursive: true });
  await fs.mkdir(path.dirname(PANEL_COVERAGE_OUTPUT_PATH), { recursive: true });
  await fs.mkdir(path.dirname(PANEL_MISSINGNESS_OUTPUT_PATH), { recursive: true });

  await fs.writeFile(PANEL_OUTPUT_PATH, toCsv(rows), "utf8");

  const schema = {
    generatedAt: builtAt,
    rowCount: rows.length,
    countyCount: counties.length,
    startYearMonth,
    endYearMonth,
    columns: Object.keys(rows[0] ?? {}).map((name) => ({
      name,
      exampleValue: rows[0]?.[name as keyof CanonicalPanelRow] ?? null,
    })),
  };
  await fs.writeFile(PANEL_SCHEMA_OUTPUT_PATH, JSON.stringify(schema, null, 2), "utf8");

  const requiredMissingnessColumns: Array<keyof CanonicalPanelRow> = [
    "sdwis_event_any",
    "sdwis_event_count",
    "overflow_count",
    "permit_count_current",
    "impaired_segments_current",
    "hydrology_context_score_current",
    "precip_total_mm",
    "temp_mean_anomaly_z",
  ];

  const missingnessRows = requiredMissingnessColumns.map((column) => {
    const missing = rows.filter((row) => row[column] == null).length;
    return {
      column,
      missing_count: missing,
      missing_share: Number((missing / rows.length).toFixed(6)),
    };
  });
  await fs.writeFile(PANEL_MISSINGNESS_OUTPUT_PATH, toCsv(missingnessRows), "utf8");

  const sdwisPositiveRows = rows.filter((row) => row.sdwis_event_any === 1).length;
  const precipitationRows = rows.filter((row) => row.precip_total_mm != null).length;
  const nwsFloodRows = rows.filter((row) => row.flood_warning_any != null).length;
  const streamflowRows = rows.filter((row) => row.streamflow_high_count != null).length;
  const droughtRows = rows.filter((row) => row.drought_fraction_d1plus != null).length;
  const temperatureRows = rows.filter((row) => row.heat_days != null).length;
  const triggerUsableRows = rows.filter((row) => row.row_usable_for_trigger_models === 1).length;
  const coverageMarkdown = `# County-month water-risk panel coverage\n\n- Built at: ${builtAt}\n- Row count: ${rows.length}\n- County count: ${counties.length}\n- Month count: ${monthRange(startYearMonth, endYearMonth).length}\n- Coverage window: ${startYearMonth} through ${endYearMonth}\n- County-months with any SDWIS health-based event: ${sdwisPositiveRows}\n- County-months with historical precipitation attached: ${precipitationRows}\n- County-months with NWS flood/flash-flood warning context attached: ${nwsFloodRows}\n- County-months with streamflow context attached: ${streamflowRows}\n- County-months with drought context attached: ${droughtRows}\n- County-months with temperature/heat context attached: ${temperatureRows}\n- County-months usable for current trigger models: ${triggerUsableRows}\n- Overflow severe threshold (gallons, first-pass 75th percentile incident size): ${overflowSummary.severeThresholdGallons}\n- Dropped overflow rows without county: ${overflowSummary.droppedRowsWithoutCounty}\n- Dropped overflow rows without month: ${overflowSummary.droppedRowsWithoutDate}\n\n## Source versions\n\n- SDWIS: ${sdwisSourceVersion}\n- Overflow: ${overflowSummary.sourceVersion}\n- Structural: ${structuralSourceVersion}\n- Weather: ${[precipitationSnapshot?.generatedAt ?? null, nwsFloodSnapshot?.generatedAt ?? null, streamflowSnapshot?.generatedAt ?? null, droughtSnapshot?.generatedAt ?? null, temperatureSnapshot?.generatedAt ?? null].filter(Boolean).join("|") || "not yet attached"}\n\n## Notes\n\n- Historical precipitation is sourced from county-centroid Open-Meteo archive daily \`precipitation_sum\` and aggregated to monthly totals, heavy-rain-day counts, max-1d precipitation, and same-calendar-month z-score anomalies.\n- NWS flood/flash-flood warning context is derived from OpenFEMA IPAWS archived alerts filtered to NWS sender rows and Texas county SAME codes.\n- Streamflow context is based on the nearest active USGS streamflow gauge to each county centroid and monthly mean discharge z-score anomalies.\n- Drought context is based on weekly U.S. Drought Monitor county statistics aggregated to monthly mean D1+ and D3+ fractions.\n- Temperature/heat context is sourced from county-centroid Open-Meteo archive daily air temperature and aggregated to monthly mean-temperature anomalies, heat-day counts, and freeze-day counts.\n- \`permit_count_current\`, \`impaired_segments_current\`, and \`hydrology_context_score_current\` are treated as current structural context, not historical monthly measures.\n- The panel currently prefers \`data/sdwis-healthbased-2020.json\` when present, then falls back to the committed SDWIS snapshot.\n`;
  await fs.writeFile(PANEL_COVERAGE_OUTPUT_PATH, coverageMarkdown, "utf8");

  return {
    builtAt,
    panelPath: PANEL_OUTPUT_PATH,
    schemaPath: PANEL_SCHEMA_OUTPUT_PATH,
    coveragePath: PANEL_COVERAGE_OUTPUT_PATH,
    missingnessPath: PANEL_MISSINGNESS_OUTPUT_PATH,
    rowCount: rows.length,
    countyCount: counties.length,
    monthCount: monthRange(startYearMonth, endYearMonth).length,
    minYearMonth: startYearMonth,
    maxYearMonth: endYearMonth,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildCountyMonthWaterRiskPanel()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
