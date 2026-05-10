import { normalizeCountyName, sameCounty, countySlug } from "@/lib/counties";
import type { CidCaseRow, CidProtestRow } from "@/lib/datasets/cid";
import { scorePermitFilingRedFlags, type PermitFilingRedFlagRow } from "@/lib/scoring/permit_filing_red_flags";
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
  date_coverage_began?: string | null;
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
  coverageBeganAt?: string | null;
};

export type ActivePermitTenureRow = {
  permitNumber: string;
  permitteeName: string;
  authorizationType: string;
  county: string | null;
  countySlug: string | null;
  coverageBeganAt: string;
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
  activeTenure: ActivePermitTenureRow[];
};

export type PermitFilingDetailPageData = {
  caseRow: CidCaseWithFilings;
  countyPermitCount: number;
  relatedPermits: TceqWaterPermit[];
  redFlagRow: PermitFilingRedFlagRow | null;
  cidSummary: CidOpenCasesSummary;
};

export type PermitProtestPrep = {
  participationStatus: string[];
  evidenceChecklist: string[];
  draftText: string;
  exportText: string;
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

export type CountyPendingFightRow = {
  tceqId: string;
  applicantName: string;
  county: string | null;
  countySlug: string | null;
  programArea: string;
  countyPermitCount: number;
  proceduralPressureScore: number;
  itemStatus: string;
  tceqDocketNumber: string | null;
  soahDocketNumber: string | null;
  latestFiledAt: string | null;
  filingCounts: {
    comments: number;
    hearingRequests: number;
    publicMeetingRequests: number;
  };
  namedFilingOrgs: string[];
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

function normalizeDateString(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
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
      coverageBeganAt: normalizeDateString(row.date_coverage_began),
    }))
    .filter((row) => row.permitNumber.length > 0);
}

/**
 * Active-permit tenure rows for the Marey-style coverage chart on /permits.
 * Filters to ACTIVE permits with a parseable `date_coverage_began`.
 */
export function buildActivePermitTenureRows(rows: TceqWaterPermitRawRow[]): ActivePermitTenureRow[] {
  return rows
    .map((row) => {
      const coverageBeganAt = normalizeDateString(row.date_coverage_began);
      const permitNumber = row.permit_number?.trim() ?? "";
      const status = row.authorization_status?.trim() ?? "";
      if (!coverageBeganAt || !permitNumber || status !== "ACTIVE") return null;
      const county = row.facility_county?.trim() ? normalizeCountyName(row.facility_county) : null;
      const startYear = new Date(coverageBeganAt).getFullYear();
      // Drop the SQL "1800-01-01" placeholder rows TCEQ uses for legacy permits.
      if (startYear < 1950) return null;
      return {
        permitNumber,
        permitteeName: row.permittee_name?.trim() ?? "Unknown permittee",
        authorizationType: row.authorization_type?.trim() ?? "Unknown",
        county,
        countySlug: county ? countySlug(county) : null,
        coverageBeganAt,
      } satisfies ActivePermitTenureRow;
    })
    .filter((row): row is ActivePermitTenureRow => row !== null);
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

export function listCountyPendingFights(
  permits: TceqWaterPermit[],
  cases: CidCaseWithFilings[],
  county?: string | null,
): CountyPendingFightRow[] {
  const filteredCases = county?.trim()
    ? cases.filter((item) => item.county && sameCounty(item.county, county))
    : cases;

  return filteredCases
    .map((item) => {
      const normalizedCounty = item.county ? normalizeCountyName(item.county) : null;
      const countyPermitCount = normalizedCounty
        ? permits.filter((permit) => permit.county && sameCounty(permit.county, normalizedCounty)).length
        : 0;
      const proceduralPressureScore =
        item.filingCounts.hearingRequests * 5 +
        item.filingCounts.publicMeetingRequests * 4 +
        item.filingCounts.comments;

      return {
        tceqId: item.tceqId,
        applicantName: item.applicantName,
        county: normalizedCounty,
        countySlug: normalizedCounty ? countySlug(normalizedCounty) : null,
        programArea: item.programArea,
        countyPermitCount,
        proceduralPressureScore,
        itemStatus: item.itemStatus,
        tceqDocketNumber: item.tceqDocketNumber,
        soahDocketNumber: item.soahDocketNumber,
        latestFiledAt: item.latestFiledAt,
        filingCounts: item.filingCounts,
        namedFilingOrgs: [],
      } satisfies CountyPendingFightRow;
    })
    .sort((left, right) => {
      return (
        right.proceduralPressureScore - left.proceduralPressureScore ||
        right.countyPermitCount - left.countyPermitCount ||
        (right.latestFiledAt ?? "").localeCompare(left.latestFiledAt ?? "") ||
        left.tceqId.localeCompare(right.tceqId)
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

export function getPermitFilingDetailPageData({
  tceqId,
  permits,
  cidSummary,
}: {
  tceqId: string;
  permits: TceqWaterPermit[];
  cidSummary: CidOpenCasesSummary;
}): PermitFilingDetailPageData {
  const caseRow = cidSummary.cases.find((row) => row.tceqId === tceqId);
  if (!caseRow) {
    throw new Error(`Permit filing not found in CID snapshot: ${tceqId}. Run refresh:cid or confirm the filing is present in the current snapshot.`);
  }

  const relatedPermits = permits.filter((permit) => {
    if (caseRow.county && permit.county && sameCounty(permit.county, caseRow.county)) {
      return permit.permitteeName === caseRow.applicantName;
    }
    return permit.permitteeName === caseRow.applicantName;
  });
  const countyPermitCount = caseRow.county
    ? permits.filter((permit) => permit.county && sameCounty(permit.county, caseRow.county as string)).length
    : 0;
  const redFlagRow = scorePermitFilingRedFlags({ permits, cases: cidSummary.cases }).find((row) => row.tceqId === tceqId) ?? null;

  return {
    caseRow,
    countyPermitCount,
    relatedPermits,
    redFlagRow,
    cidSummary,
  };
}

export function buildPermitProtestPrep({
  caseRow,
  countyPermitCount,
  redFlagReasons,
  relatedPermitNumbers,
}: {
  caseRow: CidCaseWithFilings;
  countyPermitCount: number;
  redFlagReasons: string[];
  relatedPermitNumbers: string[];
}): PermitProtestPrep {
  const participationStatus = [
    caseRow.filingCounts.hearingRequests > 0 ? "Request a contested case hearing" : "Submit a public comment",
    caseRow.filingCounts.publicMeetingRequests > 0 ? "Public meeting requests already appear in the record" : "Consider whether a public meeting request is warranted",
    caseRow.soahDocketNumber ? `SOAH referral visible: ${caseRow.soahDocketNumber}` : "No SOAH referral visible yet",
  ];

  const evidenceChecklist = [
    `Describe how the filing affects ${caseRow.county ?? "the host county"} or nearby neighborhoods.`,
    `Check whether ${countyPermitCount} pending permits in the county create cumulative burden.`,
    caseRow.latestFiledAt ? `Review the most recent filing activity from ${caseRow.latestFiledAt}.` : "Review the latest procedural activity before drafting.",
    relatedPermitNumbers.length ? `Compare against related permit IDs: ${relatedPermitNumbers.join(", ")}.` : "Check for related permits by the same applicant.",
  ];

  const draftText = [
    `I am submitting this comment regarding TCEQ ID ${caseRow.tceqId} filed by ${caseRow.applicantName}.`,
    `This filing concerns ${caseRow.programArea} activity in ${caseRow.county ?? "the relevant county"}.`,
    `The current record shows ${caseRow.filingCounts.hearingRequests} hearing request(s), ${caseRow.filingCounts.publicMeetingRequests} public meeting request(s), and ${caseRow.filingCounts.comments} public comment(s).`,
    redFlagReasons.length ? `Top visible red flags include: ${redFlagReasons.join("; ")}.` : "Atlas did not identify extra filing-level red flags beyond the base record.",
    "I request that TCEQ address these concerns clearly in the public record and explain the project-specific basis for moving forward.",
  ].join(" ");

  const exportText = [
    `Participation status: ${participationStatus.join(" | ")}`,
    `Evidence checklist: ${evidenceChecklist.join(" | ")}`,
    "Top visible red flags:",
    ...(redFlagReasons.length ? redFlagReasons.map((reason) => `- ${reason}`) : ["- No additional red flags listed"]),
    "",
    draftText,
  ].join("\n");

  return {
    participationStatus,
    evidenceChecklist,
    draftText,
    exportText,
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

export async function fetchTceqActivePermitTenure(signal?: AbortSignal): Promise<ActivePermitTenureRow[]> {
  const rows = await fetchDatasetRows<TceqWaterPermitRawRow>(
    "7fq8-wig2",
    {
      where: "authorization_status='ACTIVE' AND date_coverage_began IS NOT NULL",
      select: "permit_number, authorization_type, authorization_status, permittee_name, facility_county, date_coverage_began",
      order: "date_coverage_began ASC",
      limit: 5000,
    },
    signal,
  );
  return buildActivePermitTenureRows(rows);
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
  const [permits, statusCounts, cidSummary, activeTenureSettled] = await Promise.all([
    fetchTceqPendingPermits(signal),
    fetchTceqPermitStatusCounts(signal),
    loadCidOpenCasesSummary(county),
    fetchTceqActivePermitTenure(signal).catch(() => [] as ActivePermitTenureRow[]),
  ]);
  const filteredPermits = filterPendingPermitsByCounty(permits, county);
  const activeTenure = county?.trim()
    ? activeTenureSettled.filter((row) => row.county && sameCounty(row.county, county))
    : activeTenureSettled;
  return {
    countyFilter: county?.trim() ? county.trim() : null,
    generatedAt: new Date().toISOString(),
    summary: summarizePendingPermits(filteredPermits, statusCounts),
    cidSummary,
    permits: filteredPermits,
    activeTenure,
  };
}
