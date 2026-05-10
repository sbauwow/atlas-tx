import { promises as fs } from "node:fs";
import path from "node:path";

export const COUNTY_MONTH_PRECIPITATION_SNAPSHOT_PATH = "data/county-month-precipitation-open-meteo.json";
export const OPEN_METEO_ARCHIVE_BASE_URL = "https://archive-api.open-meteo.com/v1/archive";
export const HEAVY_RAIN_DAY_THRESHOLD_MM = 25;

export type OpenMeteoDailyArchiveResponse = {
  latitude?: number;
  longitude?: number;
  timezone?: string;
  daily?: {
    time?: string[];
    precipitation_sum?: Array<number | null>;
  };
};

export type CountyMonthPrecipitationRow = {
  countyFips: string;
  countyName: string;
  yearMonth: string;
  precipTotalMm: number;
  precipMax1dMm: number;
  heavyRainDays: number;
  precipAnomalyZ: number | null;
  sourceUrl: string;
};

export type CountyMonthPrecipitationSnapshot = {
  generatedAt: string;
  source: string;
  methodology: string;
  heavyRainDayThresholdMm: number;
  rows: CountyMonthPrecipitationRow[];
};

export type DailyPrecipitationSample = {
  date: string;
  precipitationMm: number;
};

function snapshotPath(): string {
  return path.resolve(process.cwd(), COUNTY_MONTH_PRECIPITATION_SNAPSHOT_PATH);
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function buildOpenMeteoArchiveUrl(params: {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
}): string {
  const url = new URL(OPEN_METEO_ARCHIVE_BASE_URL);
  url.searchParams.set("latitude", String(params.latitude));
  url.searchParams.set("longitude", String(params.longitude));
  url.searchParams.set("start_date", params.startDate);
  url.searchParams.set("end_date", params.endDate);
  url.searchParams.set("daily", "precipitation_sum");
  url.searchParams.set("timezone", "GMT");
  return url.toString();
}

export function normalizeOpenMeteoDailyPrecipitation(
  response: OpenMeteoDailyArchiveResponse,
): DailyPrecipitationSample[] {
  const dates = response.daily?.time ?? [];
  const totals = response.daily?.precipitation_sum ?? [];
  const out: DailyPrecipitationSample[] = [];

  for (let index = 0; index < Math.min(dates.length, totals.length); index += 1) {
    const date = dates[index];
    const precipitation = totals[index];
    if (!date || typeof precipitation !== "number" || !Number.isFinite(precipitation)) continue;
    out.push({
      date,
      precipitationMm: precipitation,
    });
  }

  return out;
}

export function summarizeDailyPrecipitationToMonthly(
  samples: DailyPrecipitationSample[],
  heavyRainDayThresholdMm = HEAVY_RAIN_DAY_THRESHOLD_MM,
): Array<Omit<CountyMonthPrecipitationRow, "countyFips" | "countyName" | "precipAnomalyZ" | "sourceUrl">> {
  const byMonth = new Map<string, { precipTotalMm: number; precipMax1dMm: number; heavyRainDays: number }>();

  for (const sample of samples) {
    const yearMonth = sample.date.slice(0, 7);
    const existing = byMonth.get(yearMonth) ?? {
      precipTotalMm: 0,
      precipMax1dMm: 0,
      heavyRainDays: 0,
    };
    existing.precipTotalMm += sample.precipitationMm;
    existing.precipMax1dMm = Math.max(existing.precipMax1dMm, sample.precipitationMm);
    if (sample.precipitationMm >= heavyRainDayThresholdMm) {
      existing.heavyRainDays += 1;
    }
    byMonth.set(yearMonth, existing);
  }

  return [...byMonth.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([yearMonth, value]) => ({
      yearMonth,
      precipTotalMm: round3(value.precipTotalMm),
      precipMax1dMm: round3(value.precipMax1dMm),
      heavyRainDays: value.heavyRainDays,
    }));
}

export function attachMonthlyPrecipitationAnomalies(
  rows: Array<Omit<CountyMonthPrecipitationRow, "precipAnomalyZ">>,
): CountyMonthPrecipitationRow[] {
  const totalsByCalendarMonth = new Map<string, number[]>();

  for (const row of rows) {
    const calendarMonth = row.yearMonth.slice(5, 7);
    const values = totalsByCalendarMonth.get(calendarMonth) ?? [];
    values.push(row.precipTotalMm);
    totalsByCalendarMonth.set(calendarMonth, values);
  }

  return rows.map((row) => {
    const calendarMonth = row.yearMonth.slice(5, 7);
    const values = totalsByCalendarMonth.get(calendarMonth) ?? [];
    const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
    const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / Math.max(values.length, 1);
    const stdev = Math.sqrt(variance);
    const precipAnomalyZ = stdev > 0 ? round3((row.precipTotalMm - mean) / stdev) : null;
    return {
      ...row,
      precipAnomalyZ,
    };
  });
}

export async function loadCountyMonthPrecipitationFromSnapshot(): Promise<CountyMonthPrecipitationSnapshot | null> {
  try {
    const raw = await fs.readFile(snapshotPath(), "utf8");
    return JSON.parse(raw) as CountyMonthPrecipitationSnapshot;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : null;
    if (code === "ENOENT") return null;
    throw error;
  }
}

export async function writeCountyMonthPrecipitationSnapshot(snapshot: CountyMonthPrecipitationSnapshot): Promise<void> {
  await fs.mkdir(path.dirname(snapshotPath()), { recursive: true });
  await fs.writeFile(snapshotPath(), JSON.stringify(snapshot, null, 2), "utf8");
}
