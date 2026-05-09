import type { CidCaseWithFilings, TceqWaterPermit } from "@/lib/tceq-permits";

export type PermitFilingRedFlagReason = {
  category: "procedural-pressure" | "county-pressure";
  severity: "medium" | "high";
  text: string;
};

export type PermitFilingRedFlagRow = {
  tceqId: string;
  applicantName: string;
  county: string | null;
  programArea: string;
  score: number;
  components: {
    proceduralPressure: number;
    countyPressure: number;
  };
  reasons: PermitFilingRedFlagReason[];
  caveats: string[];
};

export function scorePermitFilingRedFlags({
  permits,
  cases,
}: {
  permits: TceqWaterPermit[];
  cases: CidCaseWithFilings[];
}): PermitFilingRedFlagRow[] {
  const countyPermitCounts = new Map<string, number>();
  for (const permit of permits) {
    if (!permit.county) continue;
    countyPermitCounts.set(permit.county, (countyPermitCounts.get(permit.county) ?? 0) + 1);
  }

  return cases
    .filter((row) => row.itemStatus === "open")
    .map((row) => {
      const reasons: PermitFilingRedFlagReason[] = [];
      let proceduralPressure = 0;
      let countyPressure = 0;

      if (row.soahDocketNumber) {
        proceduralPressure += 4;
        reasons.push({ category: "procedural-pressure", severity: "high", text: "SOAH docket present" });
      }
      if (row.filingCounts.hearingRequests > 0) {
        proceduralPressure += row.filingCounts.hearingRequests * 3;
        reasons.push({
          category: "procedural-pressure",
          severity: "high",
          text: `${row.filingCounts.hearingRequests} hearing request filed${row.filingCounts.hearingRequests === 1 ? "" : "s"}`,
        });
      }
      if (row.filingCounts.publicMeetingRequests > 0) {
        proceduralPressure += row.filingCounts.publicMeetingRequests * 2;
        reasons.push({
          category: "procedural-pressure",
          severity: "medium",
          text: `${row.filingCounts.publicMeetingRequests} public meeting request filed${row.filingCounts.publicMeetingRequests === 1 ? "" : "s"}`,
        });
      }
      if (row.filingCounts.comments > 0) {
        proceduralPressure += Math.min(2, row.filingCounts.comments);
        reasons.push({
          category: "procedural-pressure",
          severity: "medium",
          text: `${row.filingCounts.comments} public comment filed${row.filingCounts.comments === 1 ? "" : "s"}`,
        });
      }

      const permitCount = row.county ? (countyPermitCounts.get(row.county) ?? 0) : 0;
      if (row.county && permitCount > 1) {
        countyPressure += permitCount;
        reasons.push({
          category: "county-pressure",
          severity: permitCount >= 3 ? "high" : "medium",
          text: `${permitCount} pending permits in ${row.county}`,
        });
      }

      return {
        tceqId: row.tceqId,
        applicantName: row.applicantName,
        county: row.county,
        programArea: row.programArea,
        score: proceduralPressure + countyPressure,
        components: {
          proceduralPressure,
          countyPressure,
        },
        reasons,
        caveats: [
          "Red flags are public-record leads, not proof that an application is invalid.",
          "Procedural pressure does not determine legal merit or permit outcome.",
        ],
      } satisfies PermitFilingRedFlagRow;
    })
    .sort((left, right) => right.score - left.score || left.tceqId.localeCompare(right.tceqId));
}
