import { fetchDatasetRows } from "@/lib/texas-open-data";
import { countySlug, normalizeCountyName } from "@/lib/counties";
import { getGlobalWaterDataCache } from "@/lib/water/cache";
import type { WaterPermitRecord } from "@/lib/water/types";

const GENERAL_PERMITS_TTL_MS = 12 * 60 * 60 * 1000;
const OIL_AND_GAS_EXTRACTION_PREFIX = "TXG31";

type GeneralPermitRow = {
  permit_no?: string;
  permit_status?: string;
  permit_type?: string;
  site_name?: string;
  county_name?: string;
  latitude?: string | number;
  longitude?: string | number;
};

function numberValue(value: string | number | undefined): number | null {
  const numeric = typeof value === "number" ? value : Number(value ?? "");
  return Number.isFinite(numeric) ? numeric : null;
}

export function normalizeGeneralPermitRecord(row: GeneralPermitRow): WaterPermitRecord {
  return {
    sourceId: "tceq-general-water-permits",
    permitNumber: String(row.permit_no ?? "unknown-permit"),
    countyName: row.county_name ? normalizeCountyName(row.county_name) : null,
    permitStatus: row.permit_status ?? null,
    permitType: row.permit_type ?? null,
    siteName: row.site_name ?? null,
    latitude: numberValue(row.latitude),
    longitude: numberValue(row.longitude),
    raw: row as Record<string, unknown>,
  };
}

export function summarizeGeneralPermitsByCounty(records: WaterPermitRecord[]): Map<string, { count: number; countyName: string }> {
  const summary = new Map<string, { count: number; countyName: string }>();
  for (const record of records) {
    if (!record.countyName) continue;
    const slug = countySlug(record.countyName);
    const existing = summary.get(slug) ?? { count: 0, countyName: record.countyName };
    existing.count += 1;
    summary.set(slug, existing);
  }
  return summary;
}

export function filterOilAndGasExtractionPermits(records: WaterPermitRecord[]): WaterPermitRecord[] {
  return records.filter((record) => record.permitNumber.toUpperCase().startsWith(OIL_AND_GAS_EXTRACTION_PREFIX));
}

export function summarizeOilAndGasExtractionPermitsByCounty(records: WaterPermitRecord[]): Map<string, { count: number; countyName: string }> {
  return summarizeGeneralPermitsByCounty(filterOilAndGasExtractionPermits(records));
}

async function fetchGeneralWaterPermitsUncached(signal?: AbortSignal): Promise<WaterPermitRecord[]> {
  const rows = await fetchDatasetRows<GeneralPermitRow>("6pm5-am5m", { limit: 5000 }, signal);
  return rows.map(normalizeGeneralPermitRecord);
}

export async function fetchGeneralWaterPermits(signal?: AbortSignal): Promise<WaterPermitRecord[]> {
  if (signal) {
    return fetchGeneralWaterPermitsUncached(signal);
  }
  return getGlobalWaterDataCache().getOrLoad("tceq-general-water-permits", GENERAL_PERMITS_TTL_MS, () => fetchGeneralWaterPermitsUncached());
}
