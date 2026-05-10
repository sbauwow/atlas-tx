import { pathToFileURL } from "node:url";

import { buildCountyInfoIndex } from "../experiments/build_county_month_water_risk_panel";
import {
  aggregateCountyMonthFloodAlerts,
  buildOpenFemaIpawsUrl,
  extractCountyMonthFloodAlertRows,
  OPENFEMA_IPAWS_ENDPOINT,
  writeCountyMonthNwsFloodAlertsSnapshot,
  type CountyMonthNwsFloodAlertSnapshot,
  type IpawsAlertRecord,
} from "@/lib/datasets/nws-flood-alerts";

export type NineteenMonthRefreshResult = {
  snapshot: CountyMonthNwsFloodAlertSnapshot;
  rawAlertCount: number;
  countyMonthRowCount: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`OpenFEMA IPAWS request failed (${response.status}) for ${url}`);
  }
  return await response.json() as T;
}

async function fetchJsonWithRetries<T>(url: string, maxAttempts = 5): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetchJson<T>(url);
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      await sleep(800 * attempt);
    }
  }
  throw lastError;
}

function monthStarts(startYearMonth: string, endYearMonth: string): string[] {
  const out: string[] = [];
  let year = Number(startYearMonth.slice(0, 4));
  let month = Number(startYearMonth.slice(5, 7));
  const endYear = Number(endYearMonth.slice(0, 4));
  const endMonth = Number(endYearMonth.slice(5, 7));
  while (year < endYear || (year === endYear && month <= endMonth)) {
    out.push(`${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return out;
}

function nextMonthStart(startIso: string): string {
  const year = Number(startIso.slice(0, 4));
  const month = Number(startIso.slice(5, 7));
  const date = new Date(Date.UTC(year, month - 1, 1));
  date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString().slice(0, 10) + "T00:00:00.000Z";
}

async function fetchMonthlyAlerts(startIso: string, endIso: string): Promise<IpawsAlertRecord[]> {
  const out: IpawsAlertRecord[] = [];
  const top = 500;
  for (let skip = 0; ; skip += top) {
    const url = buildOpenFemaIpawsUrl({ startIso, endIso, top, skip });
    const response = await fetchJsonWithRetries<{ IpawsArchivedAlerts?: IpawsAlertRecord[] }>(url);
    const rows = response.IpawsArchivedAlerts ?? [];
    out.push(...rows);
    if (rows.length < top) break;
  }
  return out;
}

export async function buildCountyMonthNwsFloodAlertsSnapshot(options?: {
  startYearMonth?: string;
  endYearMonth?: string;
  generatedAt?: string;
  fetchMonthly?: (startIso: string, endIso: string) => Promise<IpawsAlertRecord[]>;
}): Promise<NineteenMonthRefreshResult> {
  const generatedAt = options?.generatedAt ?? new Date().toISOString();
  const startYearMonth = options?.startYearMonth ?? "2020-01";
  const endYearMonth = options?.endYearMonth ?? "2025-12";
  const fetchMonthly = options?.fetchMonthly ?? fetchMonthlyAlerts;

  const countyNameByFips = new Map(buildCountyInfoIndex().map((row) => [row.county_fips, row.county_name] as const));
  const monthStartsList = monthStarts(startYearMonth, endYearMonth);
  const rawRows = [] as ReturnType<typeof extractCountyMonthFloodAlertRows>[number][];
  let rawAlertCount = 0;

  for (const startIso of monthStartsList) {
    const endIso = nextMonthStart(startIso);
    const alerts = await fetchMonthly(startIso, endIso);
    rawAlertCount += alerts.length;
    for (const alert of alerts) {
      rawRows.push(...extractCountyMonthFloodAlertRows(alert, countyNameByFips));
    }
  }

  const snapshot: CountyMonthNwsFloodAlertSnapshot = {
    generatedAt,
    source: OPENFEMA_IPAWS_ENDPOINT,
    methodology: "Monthly Texas county flood and flash-flood warning counts derived from OpenFEMA IPAWS archived alerts, filtered to NWS sender and TX county SAME codes.",
    rows: aggregateCountyMonthFloodAlerts(rawRows),
  };

  return {
    snapshot,
    rawAlertCount,
    countyMonthRowCount: snapshot.rows.length,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildCountyMonthNwsFloodAlertsSnapshot()
    .then(async (result) => {
      await writeCountyMonthNwsFloodAlertsSnapshot(result.snapshot);
      console.log(JSON.stringify({
        rawAlertCount: result.rawAlertCount,
        countyMonthRowCount: result.countyMonthRowCount,
      }, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
