import type { CidCaseWithFilings } from "@/lib/tceq-permits";

export type PermitTimelineEvent = {
  key: string;
  title: string;
  dateLabel: string;
  sortDate: string;
  detail: string;
  tone: "info" | "attention" | "watch";
};

export type PermitProceduralLane = {
  timeline: PermitTimelineEvent[];
  undatedSignals: string[];
  pressure: {
    label: string;
    headline: string;
    interpretation: string[];
    caveat: string;
  };
};

function formatTimelineDate(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatCount(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function buildFilingDetail(caseRow: CidCaseWithFilings): string {
  const parts: string[] = [];
  if (caseRow.filingCounts.hearingRequests > 0) {
    parts.push(formatCount(caseRow.filingCounts.hearingRequests, "hearing request", "hearing requests"));
  }
  if (caseRow.filingCounts.publicMeetingRequests > 0) {
    parts.push(formatCount(caseRow.filingCounts.publicMeetingRequests, "public meeting request", "public meeting requests"));
  }
  if (caseRow.filingCounts.comments > 0) {
    parts.push(formatCount(caseRow.filingCounts.comments, "public comment", "public comments"));
  }

  if (parts.length === 0) {
    return "No protest filings are visible in the current CID snapshot.";
  }

  return `${parts.join(", ")} visible in the current CID snapshot.`;
}

export function buildPermitProceduralLane({
  caseRow,
  countyPermitCount,
  generatedAt,
}: {
  caseRow: CidCaseWithFilings;
  countyPermitCount: number;
  generatedAt: string | null;
}): PermitProceduralLane {
  const timeline: PermitTimelineEvent[] = [];

  const latestFiledLabel = caseRow.latestFiledAt ? formatTimelineDate(caseRow.latestFiledAt) : null;
  if (caseRow.latestFiledAt && latestFiledLabel) {
    timeline.push({
      key: "latest-filing",
      title: "Latest filing activity visible",
      dateLabel: latestFiledLabel,
      sortDate: new Date(caseRow.latestFiledAt).toISOString(),
      detail: buildFilingDetail(caseRow),
      tone: caseRow.filingCounts.hearingRequests > 0 ? "attention" : caseRow.filingCounts.publicMeetingRequests > 0 ? "watch" : "info",
    });
  }

  const refreshedLabel = generatedAt ? formatTimelineDate(generatedAt) : null;
  if (generatedAt && refreshedLabel) {
    timeline.push({
      key: "snapshot-refreshed",
      title: "Atlas procedural snapshot refreshed",
      dateLabel: refreshedLabel,
      sortDate: new Date(generatedAt).toISOString(),
      detail: `Atlas last checked this permit lane against the cached CID/TCEQ inputs on ${refreshedLabel}.`,
      tone: "info",
    });
  }

  timeline.sort((left, right) => left.sortDate.localeCompare(right.sortDate));

  const undatedSignals: string[] = [
    `Current record status: ${caseRow.itemStatus}.`,
    caseRow.tceqDocketNumber ? `TCEQ docket listed: ${caseRow.tceqDocketNumber}.` : "No TCEQ docket number is visible in the current snapshot.",
    caseRow.soahDocketNumber ? `SOAH docket listed: ${caseRow.soahDocketNumber}.` : "No SOAH docket number is visible yet.",
  ];

  if (!latestFiledLabel) {
    undatedSignals.push("No dated protest filing activity is visible yet; monitor later refreshes for chronology.");
  }

  const proceduralPressureScore =
    caseRow.filingCounts.hearingRequests * 5 +
    caseRow.filingCounts.publicMeetingRequests * 4 +
    caseRow.filingCounts.comments +
    (caseRow.soahDocketNumber ? 3 : 0) +
    (caseRow.tceqDocketNumber ? 1 : 0) +
    Math.min(countyPermitCount, 4);

  const label =
    proceduralPressureScore >= 11 ? "Elevated procedural pressure" :
      proceduralPressureScore >= 6 ? "Active procedural pressure" :
        proceduralPressureScore >= 1 ? "Early procedural pressure" :
          "Low visible procedural pressure";

  const headline = caseRow.filingCounts.hearingRequests > 0
    ? `The record shows a contested path forming around ${caseRow.tceqId}.`
    : caseRow.filingCounts.publicMeetingRequests > 0
      ? `The record shows organized participation around ${caseRow.tceqId}.`
      : caseRow.latestFiledAt
        ? `The record shows some public participation around ${caseRow.tceqId}.`
        : `The record is still light on visible dated participation for ${caseRow.tceqId}.`;

  const interpretation = [
    buildFilingDetail(caseRow),
    countyPermitCount > 0
      ? `${countyPermitCount} pending permit${countyPermitCount === 1 ? " is" : "s are"} also visible in ${caseRow.county ?? "this county"}, which may add context for cumulative local attention.`
      : `No additional pending permits were matched to ${caseRow.county ?? "this county"} in the current page dataset.`,
    caseRow.soahDocketNumber
      ? "A SOAH docket is listed, which usually means the procedural track has moved beyond a simple comment-only posture."
      : "No SOAH docket is listed yet, so this page should be read as an early procedural snapshot rather than a full hearing history.",
  ];

  return {
    timeline,
    undatedSignals,
    pressure: {
      label,
      headline,
      interpretation,
      caveat: "Support and preparation only — this timeline summarizes public-record procedure and is not legal advice, a merits judgment, or a claim that any filing should be protested.",
    },
  };
}
