import { fetchDatasetRows } from "@/lib/texas-open-data";
import { normalizeCountyName, countySlug } from "@/lib/counties";
import { getGlobalWaterDataCache } from "@/lib/water/cache";
import type { SewerOverflowEvent } from "@/lib/water/types";

const SEWER_OVERFLOWS_TTL_MS = 6 * 60 * 60 * 1000;

type SewerOverflowRow = {
  incident_number?: string;
  regulated_entity_name?: string;
  incident_location_county?: string;
  material_type?: string;
  amount?: string | number;
  amount_unit?: string;
  start_date?: string;
  end_date?: string;
  cause?: string;
  status_code?: string;
};

function toGallons(amount: string | number | undefined, unit: string | undefined): number | null {
  const numeric = typeof amount === "number" ? amount : Number(amount ?? "");
  if (!Number.isFinite(numeric)) return null;
  if (!unit || unit.toUpperCase() === "GALLONS") return numeric;
  if (unit.toUpperCase() === "MGD") return numeric * 1_000_000;
  return numeric;
}

export function normalizeSewerOverflowEvent(row: SewerOverflowRow): SewerOverflowEvent {
  return {
    sourceId: "tceq-sewer-overflows",
    incidentNumber: String(row.incident_number ?? "unknown-incident"),
    countyName: row.incident_location_county ? normalizeCountyName(row.incident_location_county) : null,
    entityName: row.regulated_entity_name ?? null,
    materialType: row.material_type ?? null,
    amountGallons: toGallons(row.amount, row.amount_unit),
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    cause: row.cause ?? null,
    status: row.status_code ?? null,
    raw: row as Record<string, unknown>,
  };
}

export function summarizeSewerOverflowsByCounty(events: SewerOverflowEvent[]): Map<string, { count: number; gallons: number; countyName: string }> {
  const summary = new Map<string, { count: number; gallons: number; countyName: string }>();
  for (const event of events) {
    if (!event.countyName) continue;
    const slug = countySlug(event.countyName);
    const existing = summary.get(slug) ?? { count: 0, gallons: 0, countyName: event.countyName };
    existing.count += 1;
    existing.gallons += event.amountGallons ?? 0;
    summary.set(slug, existing);
  }
  return summary;
}

async function fetchRecentSewerOverflowsUncached(days = 30, signal?: AbortSignal): Promise<SewerOverflowEvent[]> {
  const today = new Date();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - days);
  const where = `start_date >= '${start.toISOString()}'`;
  const rows = await fetchDatasetRows<SewerOverflowRow>("8kc5-95uk", { where, limit: 5000, order: "start_date DESC" }, signal);
  return rows.map(normalizeSewerOverflowEvent);
}

export async function fetchRecentSewerOverflows(days = 30, signal?: AbortSignal): Promise<SewerOverflowEvent[]> {
  if (signal) {
    return fetchRecentSewerOverflowsUncached(days, signal);
  }
  return getGlobalWaterDataCache().getOrLoad(`tceq-sewer-overflows:${days}`, SEWER_OVERFLOWS_TTL_MS, () => fetchRecentSewerOverflowsUncached(days));
}
