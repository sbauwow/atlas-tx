import { fetchDatasetRows } from "@/lib/texas-open-data";
import { countySlug, normalizeCountyName } from "@/lib/counties";
import { getGlobalWaterDataCache } from "@/lib/water/cache";
import type { WaterPermitRecord } from "@/lib/water/types";

const GENERAL_PERMITS_TTL_MS = 12 * 60 * 60 * 1000;
const OIL_AND_GAS_EXTRACTION_PREFIX = "TXG31";
const PETROLEUM_BULK_STATIONS_PREFIX = "TXG34";

export function classifyGeneralPermitLane(permitNumber: string): WaterPermitRecord["permitLane"] {
  const normalized = permitNumber.toUpperCase();
  if (normalized.startsWith(OIL_AND_GAS_EXTRACTION_PREFIX)) return "oil-gas-extraction";
  if (normalized.startsWith(PETROLEUM_BULK_STATIONS_PREFIX)) return "petroleum-bulk-stations";
  return "other-general-permit";
}

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
  const permitNumber = String(row.permit_no ?? "unknown-permit");
  return {
    sourceId: "tceq-general-water-permits",
    permitNumber,
    countyName: row.county_name ? normalizeCountyName(row.county_name) : null,
    permitStatus: row.permit_status ?? null,
    permitType: row.permit_type ?? null,
    permitLane: classifyGeneralPermitLane(permitNumber),
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
  return records.filter((record) => (record.permitLane ?? classifyGeneralPermitLane(record.permitNumber)) === "oil-gas-extraction");
}

export function summarizeOilAndGasExtractionPermitsByCounty(records: WaterPermitRecord[]): Map<string, { count: number; countyName: string }> {
  return summarizeGeneralPermitsByCounty(filterOilAndGasExtractionPermits(records));
}

export function filterPetroleumBulkStationPermits(records: WaterPermitRecord[]): WaterPermitRecord[] {
  return records.filter((record) => (record.permitLane ?? classifyGeneralPermitLane(record.permitNumber)) === "petroleum-bulk-stations");
}

export function summarizePetroleumBulkStationPermitsByCounty(records: WaterPermitRecord[]): Map<string, { count: number; countyName: string }> {
  return summarizeGeneralPermitsByCounty(filterPetroleumBulkStationPermits(records));
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
