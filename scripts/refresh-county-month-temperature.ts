import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  attachMonthlyTemperatureAnomalies,
  buildOpenMeteoTemperatureArchiveUrl,
  FREEZE_DAY_THRESHOLD_C,
  HEAT_DAY_THRESHOLD_C,
  normalizeOpenMeteoDailyTemperature,
  summarizeDailyTemperatureToMonthly,
  writeCountyMonthTemperatureSnapshot,
  type CountyMonthTemperatureRow,
  type CountyMonthTemperatureSnapshot,
  type OpenMeteoDailyTemperatureArchiveResponse,
} from "@/lib/datasets/temperature";
import { buildCountyInfoIndex } from "../experiments/build_county_month_water_risk_panel";

export type CountyMonthTemperatureRefreshResult = {
  snapshot: CountyMonthTemperatureSnapshot;
  rowCount: number;
  countyCount: number;
  startYearMonth: string;
  endYearMonth: string;
};

type PartialCheckpoint = {
  generatedAt: string;
  startDate: string;
  endDate: string;
  rows: CountyMonthTemperatureRow[];
  completedCountyFips: string[];
};

const PARTIAL_CHECKPOINT_PATH = "data/county-month-temperature-open-meteo.partial.json";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOpenMeteoArchive(url: string): Promise<OpenMeteoDailyTemperatureArchiveResponse> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    throw new Error(`Open-Meteo temperature archive request failed (${response.status})${retryAfter ? ` retry-after=${retryAfter}` : ""} for ${url}`);
  }
  return await response.json() as OpenMeteoDailyTemperatureArchiveResponse;
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
  fetchArchive: (url: string) => Promise<OpenMeteoDailyTemperatureArchiveResponse>,
  maxAttempts = 6,
): Promise<OpenMeteoDailyTemperatureArchiveResponse> {
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
      await sleep(1500 * attempt);
    }
  }
  throw lastError;
}

export async function buildCountyMonthTemperatureSnapshot(options?: {
  startDate?: string;
  endDate?: string;
  generatedAt?: string;
  throttleMs?: number;
  fetchArchive?: (url: string) => Promise<OpenMeteoDailyTemperatureArchiveResponse>;
  resume?: boolean;
}): Promise<CountyMonthTemperatureRefreshResult> {
  const counties = buildCountyInfoIndex();
  const startDate = options?.startDate ?? "2020-01-01";
  const endDate = options?.endDate ?? "2025-12-31";
  const generatedAt = options?.generatedAt ?? new Date().toISOString();
  const throttleMs = options?.throttleMs ?? 1200;
  const fetchArchive = options?.fetchArchive ?? fetchOpenMeteoArchive;
  const checkpoint = options?.resume === false ? null : await loadCheckpoint();

  const rows: CountyMonthTemperatureRow[] = checkpoint?.startDate === startDate && checkpoint?.endDate === endDate
    ? checkpoint.rows
    : [];
  const completedCountyFips = new Set<string>(
    checkpoint?.startDate === startDate && checkpoint?.endDate === endDate ? checkpoint.completedCountyFips : [],
  );

  for (const county of counties) {
    if (completedCountyFips.has(county.county_fips)) continue;

    const sourceUrl = buildOpenMeteoTemperatureArchiveUrl({
      latitude: county.centroid.lat,
      longitude: county.centroid.lon,
      startDate,
      endDate,
    });
    const archive = await fetchArchiveWithRetries(sourceUrl, fetchArchive);
    const daily = normalizeOpenMeteoDailyTemperature(archive);
    const monthlyBase = summarizeDailyTemperatureToMonthly(daily, HEAT_DAY_THRESHOLD_C, FREEZE_DAY_THRESHOLD_C).map((row) => ({
      countyFips: county.county_fips,
      countyName: county.county_name,
      yearMonth: row.yearMonth,
      tempMeanC: row.tempMeanC,
      heatDays: row.heatDays,
      freezeDays: row.freezeDays,
      sourceUrl,
    }));
    rows.push(...attachMonthlyTemperatureAnomalies(monthlyBase));
    completedCountyFips.add(county.county_fips);
    await writeCheckpoint({
      generatedAt,
      startDate,
      endDate,
      rows,
      completedCountyFips: [...completedCountyFips],
    });
    if (throttleMs > 0) await sleep(throttleMs);
  }

  const sortedRows = rows.sort((left, right) => {
    if (left.countyFips !== right.countyFips) return left.countyFips.localeCompare(right.countyFips);
    return left.yearMonth.localeCompare(right.yearMonth);
  });

  const snapshot: CountyMonthTemperatureSnapshot = {
    generatedAt,
    source: "Open-Meteo Historical Weather API",
    methodology: "County-centroid daily archive air temperature aggregated to county-month mean temperature, same-calendar-month z-score anomalies, heat-day counts, and freeze-day counts.",
    heatDayThresholdC: HEAT_DAY_THRESHOLD_C,
    freezeDayThresholdC: FREEZE_DAY_THRESHOLD_C,
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
  buildCountyMonthTemperatureSnapshot()
    .then(async (result) => {
      await writeCountyMonthTemperatureSnapshot(result.snapshot);
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
