import { promises as fs } from "node:fs";
import path from "node:path";

export const COUNTY_MONTH_TEMPERATURE_SNAPSHOT_PATH = "data/county-month-temperature-open-meteo.json";
export const OPEN_METEO_ARCHIVE_BASE_URL = "https://archive-api.open-meteo.com/v1/archive";
export const HEAT_DAY_THRESHOLD_C = 35;
export const FREEZE_DAY_THRESHOLD_C = 0;

export type OpenMeteoDailyTemperatureArchiveResponse = {
  latitude?: number;
  longitude?: number;
  timezone?: string;
  daily?: {
    time?: string[];
    temperature_2m_mean?: Array<number | null>;
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
  };
};

export type DailyTemperatureSample = {
  date: string;
  temperatureMeanC: number;
  temperatureMaxC: number;
  temperatureMinC: number;
};

export type CountyMonthTemperatureRow = {
  countyFips: string;
  countyName: string;
  yearMonth: string;
  tempMeanC: number;
  tempMeanAnomalyZ: number | null;
  heatDays: number;
  freezeDays: number;
  sourceUrl: string;
};

export type CountyMonthTemperatureSnapshot = {
  generatedAt: string;
  source: string;
  methodology: string;
  heatDayThresholdC: number;
  freezeDayThresholdC: number;
  rows: CountyMonthTemperatureRow[];
};

function snapshotPath(): string {
  return path.resolve(process.cwd(), COUNTY_MONTH_TEMPERATURE_SNAPSHOT_PATH);
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function buildOpenMeteoTemperatureArchiveUrl(params: {
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
  url.searchParams.set("daily", "temperature_2m_mean,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("timezone", "GMT");
  return url.toString();
}

export function normalizeOpenMeteoDailyTemperature(
  response: OpenMeteoDailyTemperatureArchiveResponse,
): DailyTemperatureSample[] {
  const dates = response.daily?.time ?? [];
  const means = response.daily?.temperature_2m_mean ?? [];
  const maxes = response.daily?.temperature_2m_max ?? [];
  const mins = response.daily?.temperature_2m_min ?? [];
  const out: DailyTemperatureSample[] = [];

  for (let index = 0; index < Math.min(dates.length, means.length, maxes.length, mins.length); index += 1) {
    const date = dates[index];
    const mean = means[index];
    const max = maxes[index];
    const min = mins[index];
    if (!date) continue;
    if (typeof mean !== "number" || !Number.isFinite(mean)) continue;
    if (typeof max !== "number" || !Number.isFinite(max)) continue;
    if (typeof min !== "number" || !Number.isFinite(min)) continue;
    out.push({
      date,
      temperatureMeanC: mean,
      temperatureMaxC: max,
      temperatureMinC: min,
    });
  }

  return out;
}

export function summarizeDailyTemperatureToMonthly(
  samples: DailyTemperatureSample[],
  heatDayThresholdC = HEAT_DAY_THRESHOLD_C,
  freezeDayThresholdC = FREEZE_DAY_THRESHOLD_C,
): Array<Omit<CountyMonthTemperatureRow, "countyFips" | "countyName" | "tempMeanAnomalyZ" | "sourceUrl">> {
  const byMonth = new Map<string, { meanValues: number[]; heatDays: number; freezeDays: number }>();

  for (const sample of samples) {
    const yearMonth = sample.date.slice(0, 7);
    const existing = byMonth.get(yearMonth) ?? {
      meanValues: [],
      heatDays: 0,
      freezeDays: 0,
    };
    existing.meanValues.push(sample.temperatureMeanC);
    if (sample.temperatureMaxC >= heatDayThresholdC) existing.heatDays += 1;
    if (sample.temperatureMinC <= freezeDayThresholdC) existing.freezeDays += 1;
    byMonth.set(yearMonth, existing);
  }

  return [...byMonth.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([yearMonth, value]) => ({
      yearMonth,
      tempMeanC: round3(value.meanValues.reduce((sum, v) => sum + v, 0) / Math.max(value.meanValues.length, 1)),
      heatDays: value.heatDays,
      freezeDays: value.freezeDays,
    }));
}

export function attachMonthlyTemperatureAnomalies(
  rows: Array<Omit<CountyMonthTemperatureRow, "tempMeanAnomalyZ">>,
): CountyMonthTemperatureRow[] {
  const meansByCalendarMonth = new Map<string, number[]>();

  for (const row of rows) {
    const calendarMonth = row.yearMonth.slice(5, 7);
    const values = meansByCalendarMonth.get(calendarMonth) ?? [];
    values.push(row.tempMeanC);
    meansByCalendarMonth.set(calendarMonth, values);
  }

  return rows.map((row) => {
    const calendarMonth = row.yearMonth.slice(5, 7);
    const values = meansByCalendarMonth.get(calendarMonth) ?? [];
    const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
    const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / Math.max(values.length, 1);
    const stdev = Math.sqrt(variance);
    const tempMeanAnomalyZ = stdev > 0 ? round3((row.tempMeanC - mean) / stdev) : null;
    return {
      ...row,
      tempMeanAnomalyZ,
    };
  });
}

export async function loadCountyMonthTemperatureFromSnapshot(): Promise<CountyMonthTemperatureSnapshot | null> {
  try {
    const raw = await fs.readFile(snapshotPath(), "utf8");
    return JSON.parse(raw) as CountyMonthTemperatureSnapshot;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : null;
    if (code === "ENOENT") return null;
    throw error;
  }
}

export async function writeCountyMonthTemperatureSnapshot(snapshot: CountyMonthTemperatureSnapshot): Promise<void> {
  await fs.mkdir(path.dirname(snapshotPath()), { recursive: true });
  await fs.writeFile(snapshotPath(), JSON.stringify(snapshot, null, 2), "utf8");
}
