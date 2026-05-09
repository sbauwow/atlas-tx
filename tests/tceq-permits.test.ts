import { describe, expect, it } from "vitest";

import {
  buildPendingPermitCountyMapRows,
  filterPendingPermitsByCounty,
  normalizeTceqWaterPermits,
  summarizeCidOpenCases,
  summarizePendingPermits,
  formatCidSnapshotAgeBadge,
  getPermitFilingDetailPageData,
  type TceqPermitStatusCount,
} from "@/lib/tceq-permits";

describe("tceq permits", () => {
  const permits = normalizeTceqWaterPermits([
    {
      permit_number: "WQ0001",
      authorization_type: "IND WW",
      authorization_status: "PENDING",
      permittee_name: "Alpha Water LLC",
      facility_county: "TRAVIS",
      nearest_city: "AUSTIN",
      latitude: "30.27",
      longitude: "-97.74",
    },
    {
      permit_number: "WQ0002",
      authorization_type: "MUN WW",
      authorization_status: "PENDING",
      permittee_name: "Beta Utility",
      facility_county: "HAYS",
      nearest_city: "BUDA",
      latitude: "30.08",
      longitude: "-97.84",
    },
    {
      permit_number: "WQ0003",
      authorization_type: "IND WW",
      authorization_status: "PENDING",
      permittee_name: "Gamma Water",
      facility_county: "TRAVIS",
      nearest_city: "AUSTIN",
      latitude: null,
      longitude: null,
    },
  ]);

  it("normalizes raw TCEQ pending permit rows", () => {
    expect(permits[0]).toMatchObject({
      permitNumber: "WQ0001",
      authorizationType: "IND WW",
      authorizationStatus: "PENDING",
      permitteeName: "Alpha Water LLC",
      county: "Travis County",
      nearestCity: "Austin",
    });
  });

  it("filters permits by county", () => {
    expect(filterPendingPermitsByCounty(permits, "travis-county")).toHaveLength(2);
    expect(filterPendingPermitsByCounty(permits, "Hays County")).toHaveLength(1);
  });

  it("builds county map rows from permits and CID cases", () => {
    const mapRows = buildPendingPermitCountyMapRows(
      permits,
      [
        {
          tceqId: "WQ0000447000",
          applicantName: "Alpha Water LLC",
          county: "Travis County",
          programArea: "WQ",
          itemStatus: "open",
          tceqDocketNumber: "2026-001",
          soahDocketNumber: "582-26-0001",
          regulatedEntityNumber: null,
          customerNumber: null,
          filingCounts: { comments: 1, hearingRequests: 1, publicMeetingRequests: 0 },
          latestFiledAt: "2026-04-04",
        },
      ],
    );

    expect(mapRows[0]).toMatchObject({
      county: "Travis County",
      slug: "travis-county",
      permitCount: 2,
      cidCaseCount: 1,
      hearingRequestCount: 1,
      publicMeetingRequestCount: 0,
      hasProceduralPressure: true,
    });
    expect(mapRows[1]).toMatchObject({
      county: "Hays County",
      permitCount: 1,
      cidCaseCount: 0,
      hasProceduralPressure: false,
    });
  });

  it("summarizes statewide pending permit pressure", () => {
    const statusCounts: TceqPermitStatusCount[] = [
      { authorizationStatus: "PENDING", count: 3 },
      { authorizationStatus: "ACTIVE", count: 9 },
    ];

    const summary = summarizePendingPermits(permits, statusCounts);

    expect(summary.pendingPermitCount).toBe(3);
    expect(summary.activePermitCount).toBe(9);
    expect(summary.countyCount).toBe(2);
    expect(summary.authorizationTypeCount).toBe(2);
    expect(summary.topCounties[0]).toEqual({ county: "Travis County", count: 2 });
  });

  it("formats fresh CID snapshot age badges", () => {
    expect(formatCidSnapshotAgeBadge("2026-05-09T00:00:00.000Z", new Date("2026-05-10T12:00:00.000Z"))).toEqual({
      ageLabel: "1d old",
      refreshedLabel: "Refreshed May 9, 2026",
      freshnessBand: "fresh",
    });
  });

  it("formats aging and stale CID snapshot age badges", () => {
    expect(formatCidSnapshotAgeBadge("2026-05-05T00:00:00.000Z", new Date("2026-05-10T12:00:00.000Z"))).toEqual({
      ageLabel: "5d old",
      refreshedLabel: "Refreshed May 5, 2026",
      freshnessBand: "aging",
    });
    expect(formatCidSnapshotAgeBadge("2026-05-01T00:00:00.000Z", new Date("2026-05-10T12:00:00.000Z"))).toEqual({
      ageLabel: "9d old",
      refreshedLabel: "Refreshed May 1, 2026",
      freshnessBand: "stale",
    });
    expect(formatCidSnapshotAgeBadge(null, new Date("2026-05-10T12:00:00.000Z"))).toEqual(null);
  });

  it("summarizes CID open cases and protest pressure", () => {
    const summary = summarizeCidOpenCases(
      [
        {
          tceqId: "WQ0000447000",
          applicantName: "Alpha Water LLC",
          county: "Travis County",
          programArea: "WQ",
          itemStatus: "open",
          tceqDocketNumber: "2026-001",
          soahDocketNumber: "582-26-0001",
          regulatedEntityNumber: null,
          customerNumber: null,
        },
        {
          tceqId: "APO0009876",
          applicantName: "Beta Materials",
          county: "Hays County",
          programArea: "APO",
          itemStatus: "open",
          tceqDocketNumber: null,
          soahDocketNumber: null,
          regulatedEntityNumber: null,
          customerNumber: null,
        },
      ],
      [
        { tceqId: "WQ0000447000", filingType: "hearing_request", filerOrganization: "Public Citizen", filedAt: "2026-04-03" },
        { tceqId: "WQ0000447000", filingType: "comment", filerOrganization: null, filedAt: "2026-04-04" },
      ],
    );

    expect(summary.openCaseCount).toBe(2);
    expect(summary.protestedCaseCount).toBe(1);
    expect(summary.hearingRequestCount).toBe(1);
    expect(summary.topProgramAreas[0]).toEqual({ programArea: "APO", count: 1 });
    expect(summary.cases[0]).toMatchObject({
      tceqId: "WQ0000447000",
      filingCounts: { comments: 1, hearingRequests: 1, publicMeetingRequests: 0 },
      latestFiledAt: "2026-04-04",
    });
  });

  it("builds filing detail page data from a CID case plus related permits", () => {
    const detail = getPermitFilingDetailPageData({
      tceqId: "WQ0000447000",
      permits,
      cidSummary: {
        available: true,
        generatedAt: "2026-05-09T00:00:00.000Z",
        openCaseCount: 2,
        protestedCaseCount: 1,
        hearingRequestCount: 1,
        publicMeetingRequestCount: 0,
        caveats: ["CID Search One is fragile; treat this lane as best-effort procedural context."],
        topProgramAreas: [
          { programArea: "WQ", count: 1 },
          { programArea: "APO", count: 1 },
        ],
        cases: [
          {
            tceqId: "WQ0000447000",
            applicantName: "Alpha Water LLC",
            county: "Travis County",
            programArea: "WQ",
            itemStatus: "open",
            tceqDocketNumber: "2026-001",
            soahDocketNumber: "582-26-0001",
            regulatedEntityNumber: null,
            customerNumber: null,
            filingCounts: { comments: 1, hearingRequests: 1, publicMeetingRequests: 0 },
            latestFiledAt: "2026-04-04",
          },
        ],
      },
    });

    expect(detail.caseRow.tceqId).toBe("WQ0000447000");
    expect(detail.relatedPermits).toHaveLength(1);
    expect(detail.relatedPermits[0]?.permitNumber).toBe("WQ0001");
    expect(detail.countyPermitCount).toBe(2);
    expect(detail.redFlagRow?.reasons.map((reason) => reason.text)).toContain("SOAH docket present");
    expect(detail.redFlagRow?.reasons.map((reason) => reason.text)).toContain("2 pending permits in Travis County");
  });
});
