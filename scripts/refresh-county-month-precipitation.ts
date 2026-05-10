import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  attachMonthlyPrecipitationAnomalies,
  buildOpenMeteoArchiveUrl,
  HEAVY_RAIN_DAY_THRESHOLD_MM,
  normalizeOpenMeteoDailyPrecipitation,
  summarizeDailyPrecipitationToMonthly,
  writeCountyMonthPrecipitationSnapshot,
  type CountyMonthPrecipitationRow,
  type CountyMonthPrecipitationSnapshot,
  type OpenMeteoDailyArchiveResponse,
} from "@/lib/datasets/precipitation";
import { buildCountyInfoIndex } from "../experiments/build_county_month_water_risk_panel";

export type CountyMonthPrecipitationRefreshResult = {
  snapshot: CountyMonthPrecipitationSnapshot;
  rowCount: number;
  countyCount: number;
  startYearMonth: string;
  endYearMonth: string;
};

type PartialCheckpoint = {
  generatedAt: string;
  startDate: string;
  endDate: string;
  rows: CountyMonthPrecipitationRow[];
  completedCountyFips: string[];
};

const PARTIAL_CHECKPOINT_PATH = "data/county-month-precipitation-open-meteo.partial.json";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOpenMeteoArchive(url: string): Promise<OpenMeteoDailyArchiveResponse> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    throw new Error(`Open-Meteo archive request failed (${response.status})${retryAfter ? ` retry-after=${retryAfter}` : ""} for ${url}`);
  }
  return await response.json() as OpenMeteoDailyArchiveResponse;
}

function checkpointPath(): string {
  return path.resolve(process.cwd(), PARTIAL_CHECKPOINT_PATH);
}

async function loadCheckpoint(): Promise<PartialCheckpoint | null> {
  try {
    const raw = await fs.readFile(checkpointPath(), "utf8");
    return JSON.parse(raw) as PartialCheckpoint;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : null;
    if (code === "ENOENT") return null;
    throw error;
  }
}

async function writeCheckpoint(checkpoint: PartialCheckpoint): Promise<void> {
  await fs.mkdir(path.dirname(checkpointPath()), { recursive: true });
  await fs.writeFile(checkpointPath(), JSON.stringify(checkpoint, null, 2), "utf8");
}

async function clearCheckpoint(): Promise<void> {
  await fs.rm(checkpointPath(), { force: true });
}

async function fetchArchiveWithRetries(
  url: string,
  fetchArchive: (url: string) => Promise<OpenMeteoDailyArchiveResponse>,
  maxAttempts = 6,
): Promise<OpenMeteoDailyArchiveResponse> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetchArchive(url);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("(429)")) {
        throw error;
      }
      const backoffMs = 1500 * attempt;
      await sleep(backoffMs);
    }
  }
  throw lastError;
}

export async function buildCountyMonthPrecipitationSnapshot(options?: {
  startDate?: string;
  endDate?: string;
  generatedAt?: string;
  throttleMs?: number;
  fetchArchive?: (url: string) => Promise<OpenMeteoDailyArchiveResponse>;
  resume?: boolean;
}): Promise<CountyMonthPrecipitationRefreshResult> {
  const counties = buildCountyInfoIndex();
  const startDate = options?.startDate ?? "2020-01-01";
  const endDate = options?.endDate ?? "2025-12-31";
  const generatedAt = options?.generatedAt ?? new Date().toISOString();
  const throttleMs = options?.throttleMs ?? 1200;
  const fetchArchive = options?.fetchArchive ?? fetchOpenMeteoArchive;
  const checkpoint = options?.resume === false ? null : await loadCheckpoint();

  const rows: CountyMonthPrecipitationRow[] = checkpoint?.startDate === startDate && checkpoint?.endDate === endDate
    ? checkpoint.rows
    : [];
  const completedCountyFips = new Set<string>(
    checkpoint?.startDate === startDate && checkpoint?.endDate === endDate ? checkpoint.completedCountyFips : [],
  );

  for (const county of counties) {
    if (completedCountyFips.has(county.county_fips)) {
      continue;
    }

    const sourceUrl = buildOpenMeteoArchiveUrl({
      latitude: county.centroid.lat,
      longitude: county.centroid.lon,
      startDate,
      endDate,
    });
    const archive = await fetchArchiveWithRetries(sourceUrl, fetchArchive);
    const daily = normalizeOpenMeteoDailyPrecipitation(archive);
    const monthlyBase = summarizeDailyPrecipitationToMonthly(daily, HEAVY_RAIN_DAY_THRESHOLD_MM).map((row) => ({
      countyFips: county.county_fips,
      countyName: county.county_name,
      yearMonth: row.yearMonth,
      precipTotalMm: row.precipTotalMm,
      precipMax1dMm: row.precipMax1dMm,
      heavyRainDays: row.heavyRainDays,
      sourceUrl,
    }));
    rows.push(...attachMonthlyPrecipitationAnomalies(monthlyBase));
    completedCountyFips.add(county.county_fips);
    await writeCheckpoint({
      generatedAt,
      startDate,
      endDate,
      rows,
      completedCountyFips: [...completedCountyFips],
    });
    if (throttleMs > 0) {
      await sleep(throttleMs);
    }
  }

  const sortedRows = rows.sort((left, right) => {
    if (left.countyFips !== right.countyFips) return left.countyFips.localeCompare(right.countyFips);
    return left.yearMonth.localeCompare(right.yearMonth);
  });

  const snapshot: CountyMonthPrecipitationSnapshot = {
    generatedAt,
    source: "Open-Meteo Historical Weather API",
    methodology: "County-centroid daily archive precipitation_sum aggregated to county-month totals, heavy-rain-day counts, max-1d precipitation, and same-calendar-month z-score anomalies.",
    heavyRainDayThresholdMm: HEAVY_RAIN_DAY_THRESHOLD_MM,
    rows: sortedRows,
  };

  await clearCheckpoint();

  return {
    snapshot,
    rowCount: sortedRows.length,
    countyCount: counties.length,
    startYearMonth: startDate.slice(0, 7),
    endYearMonth: endDate.slice(0, 7),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildCountyMonthPrecipitationSnapshot()
    .then(async (result) => {
      await writeCountyMonthPrecipitationSnapshot(result.snapshot);
      console.log(JSON.stringify({
        rowCount: result.rowCount,
        countyCount: result.countyCount,
        startYearMonth: result.startYearMonth,
        endYearMonth: result.endYearMonth,
      }, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
