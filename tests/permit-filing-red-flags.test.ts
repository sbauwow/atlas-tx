import { describe, expect, it } from "vitest";

import { scorePermitFilingRedFlags } from "@/lib/scoring/permit_filing_red_flags";

const permits = [
  {
    permitNumber: "WQ0001",
    authorizationType: "IND WW",
    authorizationStatus: "PENDING",
    permitteeName: "Alpha Water LLC",
    county: "Travis County",
    nearestCity: "Austin",
    latitude: 30.27,
    longitude: -97.74,
  },
  {
    permitNumber: "WQ0002",
    authorizationType: "IND WW",
    authorizationStatus: "PENDING",
    permitteeName: "Alpha Water LLC",
    county: "Travis County",
    nearestCity: "Austin",
    latitude: 30.28,
    longitude: -97.75,
  },
  {
    permitNumber: "WQ0003",
    authorizationType: "MUN WW",
    authorizationStatus: "PENDING",
    permitteeName: "Beta Utility",
    county: "Hays County",
    nearestCity: "Buda",
    latitude: 30.08,
    longitude: -97.84,
  },
];

const cases = [
  {
    tceqId: "WQ0000447000",
    applicantName: "Alpha Water LLC",
    county: "Travis County",
    programArea: "WQ",
    itemStatus: "open" as const,
    tceqDocketNumber: "2026-001",
    soahDocketNumber: "582-26-0001",
    regulatedEntityNumber: null,
    customerNumber: null,
    filingCounts: { comments: 2, hearingRequests: 1, publicMeetingRequests: 0 },
    latestFiledAt: "2026-04-04",
  },
  {
    tceqId: "APO0000002",
    applicantName: "Beta Utility",
    county: "Hays County",
    programArea: "APO",
    itemStatus: "open" as const,
    tceqDocketNumber: null,
    soahDocketNumber: null,
    regulatedEntityNumber: null,
    customerNumber: null,
    filingCounts: { comments: 0, hearingRequests: 0, publicMeetingRequests: 1 },
    latestFiledAt: "2026-04-02",
  },
];

describe("scorePermitFilingRedFlags", () => {
  it("ranks filings by explainable procedural and county pressure reasons", () => {
    const rows = scorePermitFilingRedFlags({ permits, cases });

    expect(rows).toHaveLength(2);
    expect(rows[0]?.tceqId).toBe("WQ0000447000");
    expect(rows[0]?.applicantName).toBe("Alpha Water LLC");
    expect(rows[0]?.county).toBe("Travis County");
    expect(rows[0]?.components.proceduralPressure).toBeGreaterThan(rows[1]?.components.proceduralPressure ?? 0);
    expect(rows[0]?.reasons.map((reason) => reason.text)).toContain("SOAH docket present");
    expect(rows[0]?.reasons.map((reason) => reason.text)).toContain("1 hearing request filed");
    expect(rows[0]?.reasons.map((reason) => reason.text)).toContain("2 pending permits in Travis County");
    expect(rows[0]?.caveats).toContain("Red flags are public-record leads, not proof that an application is invalid.");
  });
});
