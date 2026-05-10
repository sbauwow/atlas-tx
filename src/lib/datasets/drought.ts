import { promises as fs } from "node:fs";
import path from "node:path";

export const COUNTY_MONTH_DROUGHT_SNAPSHOT_PATH = "data/county-month-drought-usdm.json";
export const USDM_COUNTY_STATS_BASE_URL = "https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByArea";

export type CountyMonthDroughtRow = {
  countyFips: string;
  countyName: string;
  yearMonth: string;
  droughtFractionD1plus: number;
  droughtFractionD3plus: number;
  source: string;
};

export type CountyMonthDroughtSnapshot = {
  generatedAt: string;
  source: string;
  methodology: string;
  rows: CountyMonthDroughtRow[];
};

function snapshotPath(): string {
  return path.resolve(process.cwd(), COUNTY_MONTH_DROUGHT_SNAPSHOT_PATH);
}

export function buildUsdmCountyUrl(params: { countyFips: string; startDate: string; endDate: string; statisticsType?: number }): string {
  const url = new URL(USDM_COUNTY_STATS_BASE_URL);
  url.searchParams.set("aoi", params.countyFips);
  url.searchParams.set("startdate", params.startDate);
  url.searchParams.set("enddate", params.endDate);
  url.searchParams.set("statisticsType", String(params.statisticsType ?? 1));
  return url.toString();
}

function parseNumber(value: string): number {
  const cleaned = String(value ?? "").replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function parseUsdmCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(",");
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i]!;
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else current += ch;
    }
    values.push(current);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

export function summarizeUsdmWeeklyRowsToMonthly(rows: Array<Record<string, string>>, countyFips: string, countyName: string): CountyMonthDroughtRow[] {
  const byMonth = new Map<string, { d1plus: number[]; d3plus: number[] }>();
  for (const row of rows) {
    const yearMonth = String(row.ValidStart ?? row.MapDate ?? "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) continue;
    const none = parseNumber(row.None);
    const d0 = parseNumber(row.D0);
    const d1 = parseNumber(row.D1);
    const d2 = parseNumber(row.D2);
    const d3 = parseNumber(row.D3);
    const d4 = parseNumber(row.D4);
    const total = none + d0 + d1 + d2 + d3 + d4;
    if (total <= 0) continue;
    const existing = byMonth.get(yearMonth) ?? { d1plus: [], d3plus: [] };
    existing.d1plus.push((d1 + d2 + d3 + d4) / total);
    existing.d3plus.push((d3 + d4) / total);
    byMonth.set(yearMonth, existing);
  }
  return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([yearMonth, value]) => ({
    countyFips,
    countyName,
    yearMonth,
    droughtFractionD1plus: round3(value.d1plus.reduce((s, v) => s + v, 0) / Math.max(value.d1plus.length, 1)),
    droughtFractionD3plus: round3(value.d3plus.reduce((s, v) => s + v, 0) / Math.max(value.d3plus.length, 1)),
    source: USDM_COUNTY_STATS_BASE_URL,
  }));
}

export async function loadCountyMonthDroughtFromSnapshot(): Promise<CountyMonthDroughtSnapshot | null> {
  try {
    const raw = await fs.readFile(snapshotPath(), "utf8");
    return JSON.parse(raw) as CountyMonthDroughtSnapshot;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : null;
    if (code === "ENOENT") return null;
    throw error;
  }
}

export async function writeCountyMonthDroughtSnapshot(snapshot: CountyMonthDroughtSnapshot): Promise<void> {
  await fs.mkdir(path.dirname(snapshotPath()), { recursive: true });
  await fs.writeFile(snapshotPath(), JSON.stringify(snapshot, null, 2), "utf8");
}
