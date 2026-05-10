import { pathToFileURL } from "node:url";

import { buildCountyInfoIndex } from "../experiments/build_county_month_water_risk_panel";
import {
  haversineMiles,
  parseUsgsRdb,
  summarizeDailyDischargeToMonthly,
  USGS_DAILY_VALUES_URL,
  USGS_SITE_SERVICE_URL,
  writeCountyMonthStreamflowSnapshot,
  type CountyMonthStreamflowSnapshot,
  type DailyDischargeSample,
  type UsgsSite,
} from "@/lib/datasets/streamflow";

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { Accept: "text/plain" } });
  if (!response.ok) {
    throw new Error(`USGS request failed (${response.status}) for ${url}`);
  }
  return await response.text();
}

function buildUsgsSiteUrl(): string {
  const url = new URL(USGS_SITE_SERVICE_URL);
  url.searchParams.set("format", "rdb");
  url.searchParams.set("stateCd", "tx");
  url.searchParams.set("parameterCd", "00060");
  url.searchParams.set("siteType", "ST");
  url.searchParams.set("siteStatus", "active");
  return url.toString();
}

function buildUsgsDailyUrl(siteNumber: string, startDate: string, endDate: string): string {
  const url = new URL(USGS_DAILY_VALUES_URL);
  url.searchParams.set("format", "rdb");
  url.searchParams.set("sites", siteNumber);
  url.searchParams.set("startDT", startDate);
  url.searchParams.set("endDT", endDate);
  url.searchParams.set("parameterCd", "00060");
  url.searchParams.set("statCd", "00003");
  return url.toString();
}

export function normalizeUsgsSitesFromRdb(text: string): UsgsSite[] {
  return parseUsgsRdb(text)
    .map((row) => ({
      siteNumber: row.site_no,
      stationName: row.station_nm,
      latitude: Number(row.dec_lat_va),
      longitude: Number(row.dec_long_va),
    }))
    .filter((row) => row.siteNumber && Number.isFinite(row.latitude) && Number.isFinite(row.longitude));
}

export function normalizeUsgsDailyDischargeFromRdb(text: string, siteNumber: string): DailyDischargeSample[] {
  const rows = parseUsgsRdb(text);
  const valueColumn = Object.keys(rows[0] ?? {}).find((key) => /^\d+_00060_00003$/.test(key));
  if (!valueColumn) return [];
  return rows
    .map((row) => ({
      siteNumber,
      date: row.datetime,
      dischargeCfs: Number(row[valueColumn] ?? "NaN"),
    }))
    .filter((row) => row.date && Number.isFinite(row.dischargeCfs));
}

export function assignNearestSites(counties: ReturnType<typeof buildCountyInfoIndex>, sites: UsgsSite[]): Map<string, UsgsSite> {
  const out = new Map<string, UsgsSite>();
  for (const county of counties) {
    let best: UsgsSite | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const site of sites) {
      const distance = haversineMiles(county.centroid.lat, county.centroid.lon, site.latitude, site.longitude);
      if (distance < bestDistance) {
        best = site;
        bestDistance = distance;
      }
    }
    if (best) out.set(county.county_fips, best);
  }
  return out;
}

export async function buildCountyMonthStreamflowSnapshot(options?: {
  startDate?: string;
  endDate?: string;
  generatedAt?: string;
  fetchSitesText?: () => Promise<string>;
  fetchDailyText?: (siteNumber: string, startDate: string, endDate: string) => Promise<string>;
}) {
  const counties = buildCountyInfoIndex();
  const startDate = options?.startDate ?? "2020-01-01";
  const endDate = options?.endDate ?? "2025-12-31";
  const generatedAt = options?.generatedAt ?? new Date().toISOString();
  const fetchSitesText = options?.fetchSitesText ?? (() => fetchText(buildUsgsSiteUrl()));
  const fetchDailyText = options?.fetchDailyText ?? ((siteNumber: string, s: string, e: string) => fetchText(buildUsgsDailyUrl(siteNumber, s, e)));

  const sites = normalizeUsgsSitesFromRdb(await fetchSitesText());
  const nearestSiteByCounty = assignNearestSites(counties, sites);
  const uniqueSites = new Map<string, UsgsSite>();
  for (const site of nearestSiteByCounty.values()) uniqueSites.set(site.siteNumber, site);

  const dischargeBySite = new Map<string, DailyDischargeSample[]>();
  for (const site of uniqueSites.values()) {
    dischargeBySite.set(site.siteNumber, normalizeUsgsDailyDischargeFromRdb(await fetchDailyText(site.siteNumber, startDate, endDate), site.siteNumber));
  }

  const rows = counties.flatMap((county) => {
    const site = nearestSiteByCounty.get(county.county_fips);
    if (!site) return [];
    const daily = dischargeBySite.get(site.siteNumber) ?? [];
    return summarizeDailyDischargeToMonthly(site.siteNumber, site.stationName, daily, county.county_fips, county.county_name);
  });

  const snapshot: CountyMonthStreamflowSnapshot = {
    generatedAt,
    source: `${USGS_SITE_SERVICE_URL} + ${USGS_DAILY_VALUES_URL}`,
    methodology: "County-centroid nearest active USGS streamflow gauge with daily mean discharge (parameter 00060, statistic 00003) aggregated to county-month mean discharge and same-calendar-month z-score anomaly flags.",
    rows,
  };

  return { snapshot, siteCount: uniqueSites.size, countyCount: counties.length, rowCount: rows.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildCountyMonthStreamflowSnapshot()
    .then(async (result) => {
      await writeCountyMonthStreamflowSnapshot(result.snapshot);
      console.log(JSON.stringify({ siteCount: result.siteCount, countyCount: result.countyCount, rowCount: result.rowCount }, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
