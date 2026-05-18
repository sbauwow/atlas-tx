import type { CidProtestRow } from "@/lib/datasets/cid";
import {
  buildOperatorIntelligenceDataset,
  getOperatorDetailView,
  type OperatorDetailViewModel,
  type OperatorIntelligenceDataset,
} from "@/lib/operator-intelligence";
import { getTceqPendingPermitsPageData } from "@/lib/tceq-permits";

function expandSummaryCaseFilingsToDerivedProtests(args: {
  tceqId: string;
  latestFiledAt: string | null;
  filingCounts: {
    comments: number;
    hearingRequests: number;
    publicMeetingRequests: number;
  };
}): CidProtestRow[] {
  const filedAt = args.latestFiledAt;
  if (!filedAt) {
    return [];
  }

  const rows: CidProtestRow[] = [];
  for (let index = 0; index < args.filingCounts.comments; index += 1) {
    rows.push({ tceqId: args.tceqId, filingType: "comment", filerOrganization: null, filedAt });
  }
  for (let index = 0; index < args.filingCounts.hearingRequests; index += 1) {
    rows.push({ tceqId: args.tceqId, filingType: "hearing_request", filerOrganization: null, filedAt });
  }
  for (let index = 0; index < args.filingCounts.publicMeetingRequests; index += 1) {
    rows.push({ tceqId: args.tceqId, filingType: "public_meeting_request", filerOrganization: null, filedAt });
  }
  return rows;
}

export async function getOperatorIntelligencePageData(): Promise<OperatorIntelligenceDataset> {
  let permitsPageData: Awaited<ReturnType<typeof getTceqPendingPermitsPageData>>;
  try {
    permitsPageData = await getTceqPendingPermitsPageData();
  } catch (error) {
    // `/operators` and `/maps/operators` are statically generated; a failed or
    // slow live TCEQ fetch must not reject the prerender and fail `next build`
    // (AGENTS.md §5). Degrade to an empty operator dataset instead.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[operator-page-data] permits source failed, degrading to empty operators dataset", error);
    }
    return buildOperatorIntelligenceDataset({ permits: [], cidCases: [], cidProtests: [] });
  }

  const derivedProtests = permitsPageData.cidSummary.cases.flatMap((row) =>
    expandSummaryCaseFilingsToDerivedProtests({
      tceqId: row.tceqId,
      latestFiledAt: row.latestFiledAt,
      filingCounts: row.filingCounts,
    }),
  );

  return buildOperatorIntelligenceDataset({
    permits: permitsPageData.permits,
    cidCases: permitsPageData.cidSummary.cases,
    cidProtests: derivedProtests,
  });
}

export async function getOperatorDetailPageData(slug: string): Promise<{
  dataset: OperatorIntelligenceDataset;
  operator: OperatorDetailViewModel | null;
}> {
  const dataset = await getOperatorIntelligencePageData();
  return {
    dataset,
    operator: getOperatorDetailView(dataset, slug),
  };
}
