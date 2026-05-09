import { normalizeCountyName, sameCounty, countySlug } from "@/lib/counties";
import type { CidCaseRow, CidProtestRow } from "@/lib/datasets/cid";
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
  cidSummary: CidOpenCasesSummary;
  permits: TceqWaterPermit[];
};

export type PendingPermitCountyMapRow = {
  county: string;
  slug: string;
  permitCount: number;
  cidCaseCount: number;
  hearingRequestCount: number;
  publicMeetingRequestCount: number;
  hasProceduralPressure: boolean;
};

export type CidCaseWithFilings = CidCaseRow & {
  filingCounts: {
    comments: number;
    hearingRequests: number;
    publicMeetingRequests: number;
  };
  latestFiledAt: string | null;
};

export type CidOpenCasesSummary = {
  available: boolean;
  generatedAt: string | null;
  openCaseCount: number;
  protestedCaseCount: number;
  hearingRequestCount: number;
  publicMeetingRequestCount: number;
  caveats: string[];
  topProgramAreas: Array<{ programArea: string; count: number }>;
  cases: CidCaseWithFilings[];
};

export type CidSnapshotFreshnessBand = "fresh" | "aging" | "stale";

export function formatCidSnapshotAgeBadge(
  generatedAt: string | null,
  now = new Date(),
): { ageLabel: string; refreshedLabel: string; freshnessBand: CidSnapshotFreshnessBand } | null {
  if (!generatedAt) return null;
  const snapshotAt = new Date(generatedAt);
  if (Number.isNaN(snapshotAt.getTime())) return null;
  const ageMs = Math.max(0, now.getTime() - snapshotAt.getTime());
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  const refreshedLabel = `Refreshed ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(snapshotAt)}`;
  return {
    ageLabel: `${ageDays}d old`,
    refreshedLabel,
    freshnessBand: ageDays <= 1 ? "fresh" : ageDays <= 7 ? "aging" : "stale",
  };
}

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

export function buildPendingPermitCountyMapRows(
  permits: TceqWaterPermit[],
  cases: CidCaseWithFilings[],
): PendingPermitCountyMapRow[] {
  const byCounty = new Map<string, PendingPermitCountyMapRow>();

  for (const permit of permits) {
    if (!permit.county) continue;
    const normalized = normalizeCountyName(permit.county);
    const slug = countySlug(normalized);
    const current = byCounty.get(slug) ?? {
      county: normalized,
      slug,
      permitCount: 0,
      cidCaseCount: 0,
      hearingRequestCount: 0,
      publicMeetingRequestCount: 0,
      hasProceduralPressure: false,
    };
    current.permitCount += 1;
    byCounty.set(slug, current);
  }

  for (const item of cases) {
    if (!item.county) continue;
    const normalized = normalizeCountyName(item.county);
    const slug = countySlug(normalized);
    const current = byCounty.get(slug) ?? {
      county: normalized,
      slug,
      permitCount: 0,
      cidCaseCount: 0,
      hearingRequestCount: 0,
      publicMeetingRequestCount: 0,
      hasProceduralPressure: false,
    };
    current.cidCaseCount += 1;
    current.hearingRequestCount += item.filingCounts.hearingRequests;
    current.publicMeetingRequestCount += item.filingCounts.publicMeetingRequests;
    current.hasProceduralPressure ||= item.filingCounts.hearingRequests > 0 || item.filingCounts.publicMeetingRequests > 0;
    byCounty.set(slug, current);
  }

  return Array.from(byCounty.values()).sort((left, right) => {
    return (
      right.permitCount - left.permitCount ||
      right.cidCaseCount - left.cidCaseCount ||
      right.hearingRequestCount - left.hearingRequestCount ||
      left.county.localeCompare(right.county)
    );
  });
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

export function summarizeCidOpenCases(cases: CidCaseRow[], protests: CidProtestRow[]): CidOpenCasesSummary {
  const protestMap = new Map<string, CidProtestRow[]>();
  for (const protest of protests) {
    const rows = protestMap.get(protest.tceqId) ?? [];
    rows.push(protest);
    protestMap.set(protest.tceqId, rows);
  }

  const topProgramAreas = new Map<string, number>();
  const enrichedCases = cases
    .filter((row) => row.itemStatus === "open")
    .map((row) => {
      topProgramAreas.set(row.programArea, (topProgramAreas.get(row.programArea) ?? 0) + 1);
      const filings = protestMap.get(row.tceqId) ?? [];
      const filingCounts = {
        comments: filings.filter((item) => item.filingType === "comment").length,
        hearingRequests: filings.filter((item) => item.filingType === "hearing_request").length,
        publicMeetingRequests: filings.filter((item) => item.filingType === "public_meeting_request").length,
      };
      return {
        ...row,
        filingCounts,
        latestFiledAt: filings.map((item) => item.filedAt).sort().at(-1) ?? null,
      } satisfies CidCaseWithFilings;
    })
    .sort((left, right) => {
      const leftPressure = left.filingCounts.hearingRequests + left.filingCounts.publicMeetingRequests + left.filingCounts.comments;
      const rightPressure = right.filingCounts.hearingRequests + right.filingCounts.publicMeetingRequests + right.filingCounts.comments;
      return rightPressure - leftPressure || left.tceqId.localeCompare(right.tceqId);
    });

  return {
    available: true,
    generatedAt: null,
    openCaseCount: enrichedCases.length,
    protestedCaseCount: enrichedCases.filter((row) => row.latestFiledAt !== null).length,
    hearingRequestCount: protests.filter((row) => row.filingType === "hearing_request").length,
    publicMeetingRequestCount: protests.filter((row) => row.filingType === "public_meeting_request").length,
    caveats: [],
    topProgramAreas: Array.from(topProgramAreas.entries())
      .map(([programArea, count]) => ({ programArea, count }))
      .sort((left, right) => right.count - left.count || left.programArea.localeCompare(right.programArea))
      .slice(0, 10),
    cases: enrichedCases,
  };
}

async function loadCidCasesSnapshot(): Promise<{ generatedAt?: string; caveats?: string[]; rows?: CidCaseRow[] } | null> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "public", "cache", "cid-cases-tx.json"), "utf8");
    return JSON.parse(raw) as { generatedAt?: string; caveats?: string[]; rows?: CidCaseRow[] };
  } catch {
    return null;
  }
}

async function loadCidProtestsSnapshot(): Promise<{ generatedAt?: string; caveats?: string[]; rows?: CidProtestRow[] } | null> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "public", "cache", "cid-protests-tx.json"), "utf8");
    return JSON.parse(raw) as { generatedAt?: string; caveats?: string[]; rows?: CidProtestRow[] };
  } catch {
    return null;
  }
}

async function loadCidOpenCasesSummary(county?: string | null): Promise<CidOpenCasesSummary> {
  const [caseSnapshot, protestSnapshot] = await Promise.all([
    loadCidCasesSnapshot(),
    loadCidProtestsSnapshot(),
  ]);

  if (!caseSnapshot || !protestSnapshot) {
    return {
      available: false,
      generatedAt: null,
      openCaseCount: 0,
      protestedCaseCount: 0,
      hearingRequestCount: 0,
      publicMeetingRequestCount: 0,
      caveats: ["CID open-case snapshot unavailable. Run refresh:cid after stabilizing Search One/browser fallback."],
      topProgramAreas: [],
      cases: [],
    };
  }

  const filteredCases = county?.trim()
    ? caseSnapshot.rows?.filter((row) => row.county && sameCounty(row.county, county)) ?? []
    : caseSnapshot.rows ?? [];
  const caseIds = new Set(filteredCases.map((row) => row.tceqId));
  const filteredProtests = (protestSnapshot.rows ?? []).filter((row) => caseIds.has(row.tceqId));
  const summary = summarizeCidOpenCases(filteredCases, filteredProtests);
  return {
    ...summary,
    generatedAt: caseSnapshot.generatedAt ?? protestSnapshot.generatedAt ?? null,
    caveats: [
      ...(caseSnapshot.caveats ?? []),
      ...(protestSnapshot.caveats ?? []),
      "CID Search One remains fragile; treat this lane as best-effort procedural context rather than guaranteed live statewide coverage.",
    ],
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
  const [permits, statusCounts, cidSummary] = await Promise.all([
    fetchTceqPendingPermits(signal),
    fetchTceqPermitStatusCounts(signal),
    loadCidOpenCasesSummary(county),
  ]);
  const filteredPermits = filterPendingPermitsByCounty(permits, county);
  return {
    countyFilter: county?.trim() ? county.trim() : null,
    generatedAt: new Date().toISOString(),
    summary: summarizePendingPermits(filteredPermits, statusCounts),
    cidSummary,
    permits: filteredPermits,
  };
}
