import { normalizeCountyName, sameCounty } from "@/lib/counties";
import { fetchDatasetRows } from "@/lib/texas-open-data";

export type TceqWaterPermitRawRow = {
  permit_number?: string;
  authorization_type?: string;
  authorization_status?: string;
  permittee_name?: string;
  facility_county?: string;
  nearest_city?: string;
  latitude?: string | null;
  longitude?: string | null;
};

export type TceqWaterPermit = {
  permitNumber: string;
  authorizationType: string;
  authorizationStatus: string;
  permitteeName: string;
  county: string | null;
  nearestCity: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type TceqPermitStatusCount = {
  authorizationStatus: string;
  count: number;
};

export type PendingPermitSummary = {
  pendingPermitCount: number;
  activePermitCount: number;
  countyCount: number;
  authorizationTypeCount: number;
  topCounties: Array<{ county: string; count: number }>;
};

export type PendingPermitsPageData = {
  countyFilter: string | null;
  generatedAt: string;
  summary: PendingPermitSummary;
  permits: TceqWaterPermit[];
};

function normalizeOptionalTitle(value?: string | null): string | null {
  if (!value?.trim()) return null;
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeNumber(value?: string | null): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeTceqWaterPermits(rows: TceqWaterPermitRawRow[]): TceqWaterPermit[] {
  return rows
    .map((row) => ({
      permitNumber: row.permit_number?.trim() ?? "",
      authorizationType: row.authorization_type?.trim() ?? "Unknown",
      authorizationStatus: row.authorization_status?.trim() ?? "Unknown",
      permitteeName: row.permittee_name?.trim() ?? "Unknown permittee",
      county: row.facility_county?.trim() ? normalizeCountyName(row.facility_county) : null,
      nearestCity: normalizeOptionalTitle(row.nearest_city),
      latitude: normalizeNumber(row.latitude),
      longitude: normalizeNumber(row.longitude),
    }))
    .filter((row) => row.permitNumber.length > 0);
}

export function filterPendingPermitsByCounty(permits: TceqWaterPermit[], county?: string | null): TceqWaterPermit[] {
  if (!county?.trim()) return permits;
  return permits.filter((permit) => permit.county && sameCounty(permit.county, county));
}

export function summarizePendingPermits(
  permits: TceqWaterPermit[],
  statusCounts: TceqPermitStatusCount[],
): PendingPermitSummary {
  const countyCounts = new Map<string, number>();
  const authTypes = new Set<string>();
  for (const permit of permits) {
    if (permit.county) {
      countyCounts.set(permit.county, (countyCounts.get(permit.county) ?? 0) + 1);
    }
    authTypes.add(permit.authorizationType);
  }

  return {
    pendingPermitCount: permits.length,
    activePermitCount: statusCounts.find((row) => row.authorizationStatus === "ACTIVE")?.count ?? 0,
    countyCount: countyCounts.size,
    authorizationTypeCount: authTypes.size,
    topCounties: Array.from(countyCounts.entries())
      .map(([county, count]) => ({ county, count }))
      .sort((left, right) => right.count - left.count || left.county.localeCompare(right.county))
      .slice(0, 10),
  };
}

export async function fetchTceqPendingPermits(signal?: AbortSignal): Promise<TceqWaterPermit[]> {
  const rows = await fetchDatasetRows<TceqWaterPermitRawRow>(
    "7fq8-wig2",
    {
      where: "authorization_status='PENDING'",
      order: "facility_county ASC, permittee_name ASC",
      limit: 5000,
    },
    signal,
  );
  return normalizeTceqWaterPermits(rows);
}

export async function fetchTceqPermitStatusCounts(signal?: AbortSignal): Promise<TceqPermitStatusCount[]> {
  const rows = await fetchDatasetRows<{ authorization_status?: string; c?: string }>(
    "7fq8-wig2",
    {
      select: "authorization_status, count(*) as c",
      group: "authorization_status",
      order: "c DESC",
      limit: 10,
    },
    signal,
  );
  return rows.map((row) => ({
    authorizationStatus: row.authorization_status?.trim() ?? "Unknown",
    count: Number(row.c ?? 0),
  }));
}

export async function getTceqPendingPermitsPageData(county?: string | null, signal?: AbortSignal): Promise<PendingPermitsPageData> {
  const [permits, statusCounts] = await Promise.all([
    fetchTceqPendingPermits(signal),
    fetchTceqPermitStatusCounts(signal),
  ]);
  const filteredPermits = filterPendingPermitsByCounty(permits, county);
  return {
    countyFilter: county?.trim() ? county.trim() : null,
    generatedAt: new Date().toISOString(),
    summary: summarizePendingPermits(filteredPermits, statusCounts),
    permits: filteredPermits,
  };
}
