import { countySlug, normalizeCountyName } from "@/lib/counties";
import type { CidCaseRow, CidProtestRow } from "@/lib/datasets/cid";
import { summarizeCidOpenCases, type CidCaseWithFilings, type TceqWaterPermit } from "@/lib/tceq-permits";

export type OperatorFilingCounts = {
  comments: number;
  hearingRequests: number;
  publicMeetingRequests: number;
};

export type OperatorCountySummaryRow = {
  county: string;
  countySlug: string;
  permitCount: number;
  caseCount: number;
  protestedCaseCount: number;
  filingCounts: OperatorFilingCounts;
  proceduralPressureScore: number;
  latestFiledAt: string | null;
};

export type OperatorConcentrationMetrics = {
  permitShareStatewide: number;
  caseShareStatewide: number;
  protestedCaseShareStatewide: number;
  proceduralPressureShareStatewide: number;
  countyPermitConcentration: number;
  countyCaseConcentration: number;
  topPermitCounty: { county: string; share: number; permitCount: number } | null;
  topCaseCounty: { county: string; share: number; caseCount: number } | null;
};

export type OperatorSummaryRow = {
  slug: string;
  operatorName: string;
  normalizedName: string;
  aliases: string[];
  countyCount: number;
  permitCount: number;
  caseCount: number;
  protestedCaseCount: number;
  filingCounts: OperatorFilingCounts;
  proceduralPressureScore: number;
  latestFiledAt: string | null;
  concentration: OperatorConcentrationMetrics;
};

export type OperatorDetailViewModel = OperatorSummaryRow & {
  counties: OperatorCountySummaryRow[];
  permits: TceqWaterPermit[];
  cases: CidCaseWithFilings[];
};

export type OperatorIntelligenceStatewideTotals = {
  operatorCount: number;
  permitCount: number;
  caseCount: number;
  protestedCaseCount: number;
  filingCounts: OperatorFilingCounts;
  proceduralPressureScore: number;
};

export type OperatorIntelligenceDataset = {
  statewide: OperatorIntelligenceStatewideTotals;
  summaryRows: OperatorSummaryRow[];
  detailRows: OperatorDetailViewModel[];
};

type MutableCountyBucket = {
  county: string;
  countySlug: string;
  permitCount: number;
  caseCount: number;
  protestedCaseCount: number;
  filingCounts: OperatorFilingCounts;
  proceduralPressureScore: number;
  latestFiledAt: string | null;
};

type MutableOperatorBucket = {
  slug: string;
  normalizedName: string;
  aliases: Set<string>;
  permits: TceqWaterPermit[];
  cases: CidCaseWithFilings[];
  counties: Map<string, MutableCountyBucket>;
  permitCount: number;
  caseCount: number;
  protestedCaseCount: number;
  filingCounts: OperatorFilingCounts;
  proceduralPressureScore: number;
  latestFiledAt: string | null;
};

const EMPTY_FILING_COUNTS: OperatorFilingCounts = {
  comments: 0,
  hearingRequests: 0,
  publicMeetingRequests: 0,
};

function cloneFilingCounts(counts: Partial<OperatorFilingCounts> = {}): OperatorFilingCounts {
  return {
    comments: counts.comments ?? 0,
    hearingRequests: counts.hearingRequests ?? 0,
    publicMeetingRequests: counts.publicMeetingRequests ?? 0,
  };
}

function addFilingCounts(target: OperatorFilingCounts, source: Partial<OperatorFilingCounts>): void {
  target.comments += source.comments ?? 0;
  target.hearingRequests += source.hearingRequests ?? 0;
  target.publicMeetingRequests += source.publicMeetingRequests ?? 0;
}

function proceduralPressureScore(filingCounts: OperatorFilingCounts): number {
  return filingCounts.comments + filingCounts.hearingRequests * 5 + filingCounts.publicMeetingRequests * 4;
}

function maxDate(left: string | null, right: string | null): string | null {
  if (!left) return right;
  if (!right) return left;
  return left >= right ? left : right;
}

function share(part: number, whole: number): number {
  return whole > 0 ? Number((part / whole).toFixed(4)) : 0;
}

function concentrationIndex(values: number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return 0;
  const raw = values.reduce((sum, value) => {
    const portion = value / total;
    return sum + portion * portion;
  }, 0);
  return Number(raw.toFixed(4));
}

function normalizeCaseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function canonicalOperatorKey(value: string): string {
  return normalizeOperatorName(value)
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function chooseOperatorDisplayName(names: Iterable<string>): string {
  const variants = Array.from(new Set(Array.from(names).map((value) => normalizeOperatorName(value)).filter(Boolean)));
  const scored = variants.sort((left, right) => {
    const leftScore = operatorDisplayScore(left);
    const rightScore = operatorDisplayScore(right);
    return rightScore - leftScore || right.length - left.length || left.localeCompare(right);
  });
  return scored[0] ?? "Unknown operator";
}

function operatorDisplayScore(value: string): number {
  let score = 0;
  if (/[a-z]/.test(value)) score += 5;
  if (/^[A-Z0-9\s&.,'/-]+$/.test(value)) score -= 1;
  if (/\b(?:LLC|LP|LTD|INC|CO|CORP|AUTHORITY|DISTRICT)\b/i.test(value)) score += 1;
  score += Math.min(value.length, 80) / 100;
  return score;
}

function getCountyBucket(counties: Map<string, MutableCountyBucket>, county: string): MutableCountyBucket {
  const normalizedCounty = normalizeCountyName(county);
  const slug = countySlug(normalizedCounty);
  const current = counties.get(slug);
  if (current) return current;

  const created: MutableCountyBucket = {
    county: normalizedCounty,
    countySlug: slug,
    permitCount: 0,
    caseCount: 0,
    protestedCaseCount: 0,
    filingCounts: cloneFilingCounts(),
    proceduralPressureScore: 0,
    latestFiledAt: null,
  };
  counties.set(slug, created);
  return created;
}

function buildConcentrationMetrics(
  bucket: MutableOperatorBucket,
  statewide: OperatorIntelligenceStatewideTotals,
): OperatorConcentrationMetrics {
  const counties = Array.from(bucket.counties.values());
  const permitCounts = counties.map((row) => row.permitCount).filter((count) => count > 0);
  const caseCounts = counties.map((row) => row.caseCount).filter((count) => count > 0);
  const topPermitCountyRow = counties
    .filter((row) => row.permitCount > 0)
    .sort((left, right) => right.permitCount - left.permitCount || left.county.localeCompare(right.county))[0];
  const topCaseCountyRow = counties
    .filter((row) => row.caseCount > 0)
    .sort((left, right) => right.caseCount - left.caseCount || left.county.localeCompare(right.county))[0];

  return {
    permitShareStatewide: share(bucket.permitCount, statewide.permitCount),
    caseShareStatewide: share(bucket.caseCount, statewide.caseCount),
    protestedCaseShareStatewide: share(bucket.protestedCaseCount, statewide.protestedCaseCount),
    proceduralPressureShareStatewide: share(bucket.proceduralPressureScore, statewide.proceduralPressureScore),
    countyPermitConcentration: concentrationIndex(permitCounts),
    countyCaseConcentration: concentrationIndex(caseCounts),
    topPermitCounty: topPermitCountyRow
      ? {
          county: topPermitCountyRow.county,
          permitCount: topPermitCountyRow.permitCount,
          share: share(topPermitCountyRow.permitCount, bucket.permitCount),
        }
      : null,
    topCaseCounty: topCaseCountyRow
      ? {
          county: topCaseCountyRow.county,
          caseCount: topCaseCountyRow.caseCount,
          share: share(topCaseCountyRow.caseCount, bucket.caseCount),
        }
      : null,
  };
}

export function normalizeOperatorName(value: string): string {
  const cleaned = normalizeCaseWhitespace(value);
  return cleaned.length > 0 ? cleaned : "Unknown operator";
}

export function operatorSlug(value: string): string {
  const key = canonicalOperatorKey(value);
  return key.length > 0
    ? key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    : "unknown-operator";
}

export function buildOperatorIntelligenceDataset({
  permits,
  cidCases,
  cidProtests,
}: {
  permits: TceqWaterPermit[];
  cidCases: CidCaseRow[];
  cidProtests: CidProtestRow[];
}): OperatorIntelligenceDataset {
  const cidSummary = summarizeCidOpenCases(cidCases, cidProtests);
  const buckets = new Map<string, MutableOperatorBucket>();

  const getBucket = (rawName: string): MutableOperatorBucket => {
    const normalizedName = canonicalOperatorKey(rawName);
    const slug = operatorSlug(rawName);
    const current = buckets.get(slug);
    if (current) {
      current.aliases.add(normalizeOperatorName(rawName));
      return current;
    }

    const created: MutableOperatorBucket = {
      slug,
      normalizedName,
      aliases: new Set([normalizeOperatorName(rawName)]),
      permits: [],
      cases: [],
      counties: new Map(),
      permitCount: 0,
      caseCount: 0,
      protestedCaseCount: 0,
      filingCounts: cloneFilingCounts(),
      proceduralPressureScore: 0,
      latestFiledAt: null,
    };
    buckets.set(slug, created);
    return created;
  };

  for (const permit of permits) {
    const bucket = getBucket(permit.permitteeName);
    bucket.permits.push(permit);
    bucket.permitCount += 1;

    if (permit.county) {
      const county = getCountyBucket(bucket.counties, permit.county);
      county.permitCount += 1;
    }
  }

  for (const caseRow of cidSummary.cases) {
    const bucket = getBucket(caseRow.applicantName);
    bucket.cases.push(caseRow);
    bucket.caseCount += 1;
    const caseFilings = cloneFilingCounts(caseRow.filingCounts);
    addFilingCounts(bucket.filingCounts, caseFilings);
    bucket.proceduralPressureScore += proceduralPressureScore(caseFilings);
    bucket.latestFiledAt = maxDate(bucket.latestFiledAt, caseRow.latestFiledAt);
    if (caseRow.latestFiledAt) {
      bucket.protestedCaseCount += 1;
    }

    if (caseRow.county) {
      const county = getCountyBucket(bucket.counties, caseRow.county);
      county.caseCount += 1;
      if (caseRow.latestFiledAt) {
        county.protestedCaseCount += 1;
      }
      addFilingCounts(county.filingCounts, caseFilings);
      county.proceduralPressureScore += proceduralPressureScore(caseFilings);
      county.latestFiledAt = maxDate(county.latestFiledAt, caseRow.latestFiledAt);
    }
  }

  const statewide: OperatorIntelligenceStatewideTotals = {
    operatorCount: buckets.size,
    permitCount: permits.length,
    caseCount: cidSummary.cases.length,
    protestedCaseCount: cidSummary.cases.filter((row) => row.latestFiledAt !== null).length,
    filingCounts: cidSummary.cases.reduce<OperatorFilingCounts>((acc, row) => {
      addFilingCounts(acc, row.filingCounts);
      return acc;
    }, cloneFilingCounts()),
    proceduralPressureScore: cidSummary.cases.reduce(
      (total, row) => total + proceduralPressureScore(row.filingCounts),
      0,
    ),
  };

  const detailRows = Array.from(buckets.values())
    .map((bucket) => {
      const operatorName = chooseOperatorDisplayName(bucket.aliases);
      const counties = Array.from(bucket.counties.values())
        .map((countyRow) => ({
          ...countyRow,
          filingCounts: cloneFilingCounts(countyRow.filingCounts),
        }))
        .sort((left, right) => {
          return (
            right.permitCount - left.permitCount ||
            right.caseCount - left.caseCount ||
            right.proceduralPressureScore - left.proceduralPressureScore ||
            left.county.localeCompare(right.county)
          );
        });

      const summary: OperatorSummaryRow = {
        slug: bucket.slug,
        operatorName,
        normalizedName: bucket.normalizedName,
        aliases: Array.from(bucket.aliases).sort((left, right) => left.localeCompare(right)),
        countyCount: counties.length,
        permitCount: bucket.permitCount,
        caseCount: bucket.caseCount,
        protestedCaseCount: bucket.protestedCaseCount,
        filingCounts: cloneFilingCounts(bucket.filingCounts),
        proceduralPressureScore: bucket.proceduralPressureScore,
        latestFiledAt: bucket.latestFiledAt,
        concentration: buildConcentrationMetrics(bucket, statewide),
      };

      return {
        ...summary,
        counties,
        permits: [...bucket.permits].sort((left, right) => {
          return (
            (left.county ?? "").localeCompare(right.county ?? "") ||
            left.permitNumber.localeCompare(right.permitNumber)
          );
        }),
        cases: [...bucket.cases].sort((left, right) => {
          const leftPressure = proceduralPressureScore(left.filingCounts);
          const rightPressure = proceduralPressureScore(right.filingCounts);
          return (
            (right.latestFiledAt ?? "").localeCompare(left.latestFiledAt ?? "") ||
            rightPressure - leftPressure ||
            left.tceqId.localeCompare(right.tceqId)
          );
        }),
      } satisfies OperatorDetailViewModel;
    })
    .sort((left, right) => {
      return (
        right.permitCount - left.permitCount ||
        right.caseCount - left.caseCount ||
        right.proceduralPressureScore - left.proceduralPressureScore ||
        left.operatorName.localeCompare(right.operatorName)
      );
    });

  return {
    statewide,
    summaryRows: detailRows.map((row) => ({
      slug: row.slug,
      operatorName: row.operatorName,
      normalizedName: row.normalizedName,
      aliases: [...row.aliases],
      countyCount: row.countyCount,
      permitCount: row.permitCount,
      caseCount: row.caseCount,
      protestedCaseCount: row.protestedCaseCount,
      filingCounts: cloneFilingCounts(row.filingCounts),
      proceduralPressureScore: row.proceduralPressureScore,
      latestFiledAt: row.latestFiledAt,
      concentration: { ...row.concentration },
    })),
    detailRows,
  };
}

export function buildStatewideOperatorSummaryRows(args: {
  permits: TceqWaterPermit[];
  cidCases: CidCaseRow[];
  cidProtests: CidProtestRow[];
}): OperatorSummaryRow[] {
  return buildOperatorIntelligenceDataset(args).summaryRows;
}

export function getOperatorDetailView(
  dataset: OperatorIntelligenceDataset,
  slug: string,
): OperatorDetailViewModel | null {
  return dataset.detailRows.find((row) => row.slug === slug) ?? null;
}

export const EMPTY_OPERATOR_FILING_COUNTS = cloneFilingCounts(EMPTY_FILING_COUNTS);
