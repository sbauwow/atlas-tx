import { countySlug, normalizeCountyName } from "@/lib/counties";
import type { WaterGovernanceEntity } from "@/lib/water/types";

const SOCRATA_BASE_URL = "https://data.texas.gov/resource";

type WaterDistrictRow = {
  county?: string;
  district_number?: string;
  distict_name?: string;
  district_type?: string;
  activity_status?: string;
  district_city?: string;
  city?: string;
};

type WaterUtilityRow = {
  ccn_no?: string;
  utility_name?: string;
  utility_type?: string;
  primary_county?: string;
  all_counties?: string;
  city?: string;
};

export function normalizeWaterDistrictRecord(row: WaterDistrictRow): WaterGovernanceEntity {
  return {
    sourceId: "tceq-water-districts",
    entityId: String(row.district_number ?? "unknown-district"),
    countyName: row.county ? normalizeCountyName(row.county) : null,
    entityName: String(row.distict_name ?? "Unknown district"),
    entityType: row.district_type ?? null,
    activityStatus: row.activity_status ?? null,
    city: row.district_city ?? row.city ?? null,
    raw: row as Record<string, unknown>,
  };
}

export function normalizeWaterUtilityRecord(
  row: WaterUtilityRow,
  sourceId: "puct-water-iou" | "puct-water-submeter",
): WaterGovernanceEntity {
  return {
    sourceId,
    entityId: String(row.ccn_no ?? "unknown-utility"),
    countyName: row.primary_county ? normalizeCountyName(row.primary_county) : null,
    entityName: String(row.utility_name ?? "Unknown utility"),
    entityType: sourceId === "puct-water-iou" ? "Investor-Owned Utility" : row.utility_type ?? "Submeter Utility",
    activityStatus: null,
    city: row.city ?? null,
    raw: row as Record<string, unknown>,
  };
}

export function summarizeGovernanceByCounty(records: WaterGovernanceEntity[]): Map<string, { countyName: string; districtCount: number; utilityCount: number }> {
  const summary = new Map<string, { countyName: string; districtCount: number; utilityCount: number }>();
  for (const record of records) {
    if (!record.countyName) continue;
    const slug = countySlug(record.countyName);
    const existing = summary.get(slug) ?? { countyName: record.countyName, districtCount: 0, utilityCount: 0 };
    if (record.sourceId === "tceq-water-districts") {
      existing.districtCount += 1;
    } else {
      existing.utilityCount += 1;
    }
    summary.set(slug, existing);
  }
  return summary;
}

export async function fetchWaterDistricts(signal?: AbortSignal): Promise<WaterGovernanceEntity[]> {
  const response = await fetch(`${SOCRATA_BASE_URL}/hr84-s96f.json?$limit=5000`, { signal });
  if (!response.ok) {
    throw new Error(`Water districts request failed: ${response.status}`);
  }
  const rows = (await response.json()) as WaterDistrictRow[];
  return rows.map(normalizeWaterDistrictRecord);
}

export async function fetchWaterUtilities(signal?: AbortSignal): Promise<WaterGovernanceEntity[]> {
  const [iouResponse, submeterResponse] = await Promise.all([
    fetch(`${SOCRATA_BASE_URL}/auk8-env9.json?$limit=5000`, { signal }),
    fetch(`${SOCRATA_BASE_URL}/iuez-sv34.json?$limit=5000`, { signal }),
  ]);
  if (!iouResponse.ok) {
    throw new Error(`Water IOU request failed: ${iouResponse.status}`);
  }
  if (!submeterResponse.ok) {
    throw new Error(`Water submeter request failed: ${submeterResponse.status}`);
  }
  const [ious, submeters] = (await Promise.all([iouResponse.json(), submeterResponse.json()])) as [WaterUtilityRow[], WaterUtilityRow[]];
  return [
    ...ious.map((row) => normalizeWaterUtilityRecord(row, "puct-water-iou")),
    ...submeters.map((row) => normalizeWaterUtilityRecord(row, "puct-water-submeter")),
  ];
}

export async function fetchWaterGovernance(signal?: AbortSignal): Promise<WaterGovernanceEntity[]> {
  const [districts, utilities] = await Promise.all([fetchWaterDistricts(signal), fetchWaterUtilities(signal)]);
  return [...districts, ...utilities];
}
