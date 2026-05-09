import type { CidCaseRow, CidProtestRow } from "../datasets/cid";
import { normalizeCountyName } from "../counties";

export type ProtestDensityInput = {
  cases: CidCaseRow[];
  protests: CidProtestRow[];
  countyPopulation: Record<string, number>;
  county?: string;
  minPopulation?: number;
};

export type ProtestDensityRow = {
  county: string;
  score: number;
  rawPressure: number;
  per1kPopulation: number;
  openCaseCount: number;
  components: {
    commentCount: number;
    hearingRequestCount: number;
    publicMeetingRequestCount: number;
    soahCaseCount: number;
  };
  caveats: string[];
};

type CountyAccumulator = {
  rawPressure: number;
  openCaseCount: number;
  commentCount: number;
  hearingRequestCount: number;
  publicMeetingRequestCount: number;
  soahCaseCount: number;
};

function emptyAccumulator(): CountyAccumulator {
  return {
    rawPressure: 0,
    openCaseCount: 0,
    commentCount: 0,
    hearingRequestCount: 0,
    publicMeetingRequestCount: 0,
    soahCaseCount: 0,
  };
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function normalizeScore(value: number, min: number, max: number): number {
  if (max === min) return 100;
  return Math.round(((value - min) / (max - min)) * 10000) / 100;
}

export function scoreProtestDensity(
  input: ProtestDensityInput,
): ProtestDensityRow[] {
  const protestsById = new Map<string, CidProtestRow[]>();
  for (const protest of input.protests) {
    const list = protestsById.get(protest.tceqId) ?? [];
    list.push(protest);
    protestsById.set(protest.tceqId, list);
  }

  const targetCounty = input.county ? normalizeCountyName(input.county) : null;
  const accumulators = new Map<string, CountyAccumulator>();

  for (const row of input.cases) {
    if (row.itemStatus !== "open" || !row.county) continue;
    const county = normalizeCountyName(row.county);
    if (targetCounty && county !== targetCounty) continue;

    const filings = protestsById.get(row.tceqId) ?? [];
    const commentCount = filings.filter((f) => f.filingType === "comment").length;
    const hearingRequestCount = filings.filter(
      (f) => f.filingType === "hearing_request",
    ).length;
    const publicMeetingRequestCount = filings.filter(
      (f) => f.filingType === "public_meeting_request",
    ).length;
    const soahCaseCount = row.soahDocketNumber ? 1 : 0;

    const filingPressurePerItem =
      1 +
      0.35 * Math.log1p(commentCount) +
      0.75 * publicMeetingRequestCount +
      1.25 * hearingRequestCount +
      2.5 * soahCaseCount;

    const acc = accumulators.get(county) ?? emptyAccumulator();
    acc.rawPressure += filingPressurePerItem;
    acc.openCaseCount += 1;
    acc.commentCount += commentCount;
    acc.hearingRequestCount += hearingRequestCount;
    acc.publicMeetingRequestCount += publicMeetingRequestCount;
    acc.soahCaseCount += soahCaseCount;
    accumulators.set(county, acc);
  }

  const rows = [...accumulators.entries()]
    .map(([county, acc]) => {
      const population = input.countyPopulation[county] ?? 0;
      return { county, acc, population };
    })
    .filter(({ population }) => population >= (input.minPopulation ?? 0))
    .map(({ county, acc, population }) => ({
      county,
      rawPressure: round4(acc.rawPressure),
      per1kPopulation: round4(acc.rawPressure / (population / 1000)),
      openCaseCount: acc.openCaseCount,
      components: {
        commentCount: acc.commentCount,
        hearingRequestCount: acc.hearingRequestCount,
        publicMeetingRequestCount: acc.publicMeetingRequestCount,
        soahCaseCount: acc.soahCaseCount,
      },
      caveats: [
        "Reflects only currently-open CID items; historical protests excluded.",
        "Filing counts may include duplicate people, repeat submissions, or organization campaigns.",
        "Hearing request ≠ contested case granted; SOAH docket # is the harder signal.",
      ],
    }));

  const per1k = rows.map((row) => row.per1kPopulation);
  const min = per1k.length ? Math.min(...per1k) : 0;
  const max = per1k.length ? Math.max(...per1k) : 0;

  return rows
    .map((row) => ({
      ...row,
      score: normalizeScore(row.per1kPopulation, min, max),
    }))
    .sort((a, b) => b.score - a.score || b.rawPressure - a.rawPressure);
}
