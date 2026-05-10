import { promises as fs } from "node:fs";
import path from "node:path";

export const COUNTY_MONTH_STREAMFLOW_SNAPSHOT_PATH = "data/county-month-streamflow-usgs.json";
export const USGS_SITE_SERVICE_URL = "https://waterservices.usgs.gov/nwis/site/";
export const USGS_DAILY_VALUES_URL = "https://waterservices.usgs.gov/nwis/dv/";

export type UsgsSite = {
  siteNumber: string;
  stationName: string;
  latitude: number;
  longitude: number;
};

export type DailyDischargeSample = {
  siteNumber: string;
  date: string;
  dischargeCfs: number;
};

export type CountyMonthStreamflowRow = {
  countyFips: string;
  countyName: string;
  yearMonth: string;
  siteNumber: string;
  stationName: string;
  streamflowMeanCfs: number;
  streamflowAnomalyZ: number | null;
  streamflowHighCount: number;
  streamflowLowCount: number;
  streamflowExtremeHighAny: 0 | 1;
  streamflowExtremeLowAny: 0 | 1;
  source: string;
};

export type CountyMonthStreamflowSnapshot = {
  generatedAt: string;
  source: string;
  methodology: string;
  rows: CountyMonthStreamflowRow[];
};

function snapshotPath(): string {
  return path.resolve(process.cwd(), COUNTY_MONTH_STREAMFLOW_SNAPSHOT_PATH);
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const R = 3958.7613;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function parseUsgsRdb(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0 && !line.startsWith("#"));
  if (lines.length < 2) return [];
  const headers = lines[0]!.split("\t");
  const dataLines = lines.slice(2);
  return dataLines.map((line) => {
    const values = line.split("\t");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

export function summarizeDailyDischargeToMonthly(
  siteNumber: string,
  stationName: string,
  samples: DailyDischargeSample[],
  countyFips: string,
  countyName: string,
): CountyMonthStreamflowRow[] {
  const byMonth = new Map<string, { values: number[] }>();
  for (const sample of samples) {
    const yearMonth = sample.date.slice(0, 7);
    const existing = byMonth.get(yearMonth) ?? { values: [] };
    existing.values.push(sample.dischargeCfs);
    byMonth.set(yearMonth, existing);
  }

  const monthlyBase = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([yearMonth, entry]) => ({
    countyFips,
    countyName,
    yearMonth,
    siteNumber,
    stationName,
    streamflowMeanCfs: round3(entry.values.reduce((sum, value) => sum + value, 0) / Math.max(entry.values.length, 1)),
    streamflowAnomalyZ: null,
    streamflowHighCount: 0,
    streamflowLowCount: 0,
    streamflowExtremeHighAny: 0 as const,
    streamflowExtremeLowAny: 0 as const,
    source: USGS_DAILY_VALUES_URL,
  }));

  const byCalendarMonth = new Map<string, number[]>();
  for (const row of monthlyBase) {
    const key = row.yearMonth.slice(5, 7);
    const values = byCalendarMonth.get(key) ?? [];
    values.push(row.streamflowMeanCfs);
    byCalendarMonth.set(key, values);
  }

  return monthlyBase.map((row) => {
    const calendar = row.yearMonth.slice(5, 7);
    const values = byCalendarMonth.get(calendar) ?? [];
    const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
    const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / Math.max(values.length, 1);
    const stdev = Math.sqrt(variance);
    const z = stdev > 0 ? (row.streamflowMeanCfs - mean) / stdev : null;
    return {
      ...row,
      streamflowAnomalyZ: z == null ? null : round3(z),
      streamflowHighCount: z != null && z >= 1 ? 1 : 0,
      streamflowLowCount: z != null && z <= -1 ? 1 : 0,
      streamflowExtremeHighAny: z != null && z >= 1.5 ? 1 : 0,
      streamflowExtremeLowAny: z != null && z <= -1.5 ? 1 : 0,
    };
  });
}

export async function loadCountyMonthStreamflowFromSnapshot(): Promise<CountyMonthStreamflowSnapshot | null> {
  try {
    const raw = await fs.readFile(snapshotPath(), "utf8");
    return JSON.parse(raw) as CountyMonthStreamflowSnapshot;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : null;
    if (code === "ENOENT") return null;
    throw error;
  }
}

export async function writeCountyMonthStreamflowSnapshot(snapshot: CountyMonthStreamflowSnapshot): Promise<void> {
  await fs.mkdir(path.dirname(snapshotPath()), { recursive: true });
  await fs.writeFile(snapshotPath(), JSON.stringify(snapshot, null, 2), "utf8");
}
