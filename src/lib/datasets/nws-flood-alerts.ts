import { promises as fs } from "node:fs";
import path from "node:path";

export const COUNTY_MONTH_NWS_FLOOD_ALERTS_SNAPSHOT_PATH = "data/county-month-nws-flood-alerts.json";
export const OPENFEMA_IPAWS_ENDPOINT = "https://www.fema.gov/api/open/v1/IpawsArchivedAlerts";

export type IpawsAlertRecord = {
  identifier?: string;
  sender?: string | null;
  sent?: string | null;
  msgType?: string | null;
  info?: Array<{
    event?: string | null;
    severity?: string | null;
    certainty?: string | null;
    urgency?: string | null;
    effective?: string | null;
    onset?: string | null;
    expires?: string | null;
    headline?: string | null;
    area?: Array<{
      areaDesc?: string | null;
      geocode?: Array<{
        name?: string | null;
        value?: string | null;
      }>;
    }>;
  }>;
};

export type CountyMonthNwsFloodAlertRow = {
  countyFips: string;
  countyName: string;
  yearMonth: string;
  floodWarningAny: 0 | 1;
  floodWarningCount: number;
  flashFloodWarningAny: 0 | 1;
  flashFloodWarningCount: number;
  source: string;
};

export type CountyMonthNwsFloodAlertSnapshot = {
  generatedAt: string;
  source: string;
  methodology: string;
  rows: CountyMonthNwsFloodAlertRow[];
};

function snapshotPath(): string {
  return path.resolve(process.cwd(), COUNTY_MONTH_NWS_FLOOD_ALERTS_SNAPSHOT_PATH);
}

export function buildOpenFemaIpawsUrl(params: {
  startIso: string;
  endIso: string;
  skip?: number;
  top?: number;
}): string {
  const filter = [
    "sender eq 'w-nws.webmaster@noaa.gov'",
    `sent ge '${params.startIso}'`,
    `sent lt '${params.endIso}'`,
    "(contains(originalMessage,'Flash Flood Warning') or contains(originalMessage,'Flood Warning'))",
    "contains(originalMessage,'TXC')",
  ].join(" and ");
  const url = new URL(OPENFEMA_IPAWS_ENDPOINT);
  url.searchParams.set("$filter", filter);
  url.searchParams.set("$top", String(params.top ?? 1000));
  if (typeof params.skip === "number") {
    url.searchParams.set("$skip", String(params.skip));
  }
  return url.toString();
}

function normalizeCountyFipsFromSame(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = String(value).trim();
  if (!/^0?48\d{3}$/.test(text)) return null;
  return text.slice(-5);
}

function toYearMonth(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = String(value).match(/^(\d{4}-\d{2})/);
  if (match) return match[1] ?? null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 7);
}

export function extractCountyMonthFloodAlertRows(record: IpawsAlertRecord, countyNameByFips: Map<string, string>): CountyMonthNwsFloodAlertRow[] {
  const info = record.info?.[0];
  const event = String(info?.event ?? "").trim();
  const yearMonth = toYearMonth(record.sent ?? info?.effective ?? info?.onset ?? info?.expires);
  if (!yearMonth) return [];
  const isFlash = event === "Flash Flood Warning";
  const isFlood = event === "Flood Warning";
  if (!isFlash && !isFlood) return [];

  const countyFipsSet = new Set<string>();
  for (const area of info?.area ?? []) {
    for (const geocode of area.geocode ?? []) {
      if (geocode.name === "SAME") {
        const countyFips = normalizeCountyFipsFromSame(geocode.value);
        if (countyFips) countyFipsSet.add(countyFips);
      }
    }
  }

  return [...countyFipsSet].map((countyFips) => ({
    countyFips,
    countyName: countyNameByFips.get(countyFips) ?? countyFips,
    yearMonth,
    floodWarningAny: isFlood ? 1 : 0,
    floodWarningCount: isFlood ? 1 : 0,
    flashFloodWarningAny: isFlash ? 1 : 0,
    flashFloodWarningCount: isFlash ? 1 : 0,
    source: OPENFEMA_IPAWS_ENDPOINT,
  }));
}

export function aggregateCountyMonthFloodAlerts(rows: CountyMonthNwsFloodAlertRow[]): CountyMonthNwsFloodAlertRow[] {
  const byKey = new Map<string, CountyMonthNwsFloodAlertRow>();
  for (const row of rows) {
    const key = `${row.countyFips}__${row.yearMonth}`;
    const existing = byKey.get(key) ?? {
      countyFips: row.countyFips,
      countyName: row.countyName,
      yearMonth: row.yearMonth,
      floodWarningAny: 0,
      floodWarningCount: 0,
      flashFloodWarningAny: 0,
      flashFloodWarningCount: 0,
      source: row.source,
    };
    existing.floodWarningAny = (existing.floodWarningAny || row.floodWarningAny) ? 1 : 0;
    existing.floodWarningCount += row.floodWarningCount;
    existing.flashFloodWarningAny = (existing.flashFloodWarningAny || row.flashFloodWarningAny) ? 1 : 0;
    existing.flashFloodWarningCount += row.flashFloodWarningCount;
    byKey.set(key, existing);
  }
  return [...byKey.values()].sort((a, b) => {
    if (a.countyFips !== b.countyFips) return a.countyFips.localeCompare(b.countyFips);
    return a.yearMonth.localeCompare(b.yearMonth);
  });
}

export async function loadCountyMonthNwsFloodAlertsFromSnapshot(): Promise<CountyMonthNwsFloodAlertSnapshot | null> {
  try {
    const raw = await fs.readFile(snapshotPath(), "utf8");
    return JSON.parse(raw) as CountyMonthNwsFloodAlertSnapshot;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : null;
    if (code === "ENOENT") return null;
    throw error;
  }
}

export async function writeCountyMonthNwsFloodAlertsSnapshot(snapshot: CountyMonthNwsFloodAlertSnapshot): Promise<void> {
  await fs.mkdir(path.dirname(snapshotPath()), { recursive: true });
  await fs.writeFile(snapshotPath(), JSON.stringify(snapshot, null, 2), "utf8");
}
