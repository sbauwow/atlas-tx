import { describe, expect, it } from "vitest";

import type { CidCaseRow, CidProtestRow } from "@/lib/datasets/cid";
import {
  buildOperatorIntelligenceDataset,
  buildStatewideOperatorSummaryRows,
  getOperatorDetailView,
  normalizeOperatorName,
  operatorSlug,
} from "@/lib/operator-intelligence";
import { normalizeTceqWaterPermits, type TceqWaterPermit } from "@/lib/tceq-permits";

const permits: TceqWaterPermit[] = normalizeTceqWaterPermits([
  {
    permit_number: "WQ0001",
    authorization_type: "IND WW",
    authorization_status: "PENDING",
    permittee_name: "Acme Water, LLC",
    facility_county: "TRAVIS",
    nearest_city: "AUSTIN",
    latitude: "30.27",
    longitude: "-97.74",
  },
  {
    permit_number: "WQ0002",
    authorization_type: "IND WW",
    authorization_status: "PENDING",
    permittee_name: "ACME WATER LLC",
    facility_county: "HAYS",
    nearest_city: "BUDA",
    latitude: "30.08",
    longitude: "-97.84",
  },
  {
    permit_number: "WQ0003",
    authorization_type: "MUN WW",
    authorization_status: "PENDING",
    permittee_name: "Blue River Utility District",
    facility_county: "TRAVIS",
    nearest_city: "AUSTIN",
    latitude: "30.29",
    longitude: "-97.75",
  },
]);

const cidCases: CidCaseRow[] = [
  {
    tceqId: "WQ0000447000",
    applicantName: "ACME WATER LLC",
    county: "Travis County",
    programArea: "WQ",
    itemStatus: "open",
    tceqDocketNumber: "2026-001",
    soahDocketNumber: "582-26-0001",
    regulatedEntityNumber: null,
    customerNumber: null,
  },
  {
    tceqId: "WQ0000555000",
    applicantName: "Blue River Utility District",
    county: "Travis County",
    programArea: "WQ",
    itemStatus: "open",
    tceqDocketNumber: null,
    soahDocketNumber: null,
    regulatedEntityNumber: null,
    customerNumber: null,
  },
  {
    tceqId: "WQ0000666000",
    applicantName: "ACME WATER, LLC",
    county: "Hays County",
    programArea: "WQ",
    itemStatus: "closed",
    tceqDocketNumber: null,
    soahDocketNumber: null,
    regulatedEntityNumber: null,
    customerNumber: null,
  },
];

const cidProtests: CidProtestRow[] = [
  {
    tceqId: "WQ0000447000",
    filingType: "hearing_request",
    filerOrganization: "Public Citizen",
    filedAt: "2026-04-11",
  },
  {
    tceqId: "WQ0000447000",
    filingType: "public_meeting_request",
    filerOrganization: "Sierra Club Lone Star Chapter",
    filedAt: "2026-04-12",
  },
  {
    tceqId: "WQ0000447000",
    filingType: "comment",
    filerOrganization: null,
    filedAt: "2026-04-13",
  },
  {
    tceqId: "WQ0000555000",
    filingType: "comment",
    filerOrganization: null,
    filedAt: "2026-04-02",
  },
];

describe("operator intelligence helpers", () => {
  it("normalizes operator names and slugs without fake enrichment", () => {
    expect(normalizeOperatorName("  Acme   Water, LLC  ")).toBe("Acme Water, LLC");
    expect(operatorSlug("Acme Water, LLC")).toBe("acme-water-llc");
    expect(operatorSlug("ACME WATER LLC")).toBe("acme-water-llc");
  });

  it("builds statewide operator summary rows from permits and CID data", () => {
    const rows = buildStatewideOperatorSummaryRows({ permits, cidCases, cidProtests });
    expect(rows).toHaveLength(2);

    expect(rows[0]).toMatchObject({
      slug: "acme-water-llc",
      operatorName: "Acme Water, LLC",
      permitCount: 2,
      caseCount: 1,
      protestedCaseCount: 1,
      countyCount: 2,
      filingCounts: {
        comments: 1,
        hearingRequests: 1,
        publicMeetingRequests: 1,
      },
      proceduralPressureScore: 10,
      latestFiledAt: "2026-04-13",
    });
    expect(rows[0]?.aliases).toEqual(["ACME WATER LLC", "Acme Water, LLC"]);
    expect(rows[0]?.concentration).toEqual({
      permitShareStatewide: 0.6667,
      caseShareStatewide: 0.5,
      protestedCaseShareStatewide: 0.5,
      proceduralPressureShareStatewide: 0.9091,
      countyPermitConcentration: 0.5,
      countyCaseConcentration: 1,
      topPermitCounty: {
        county: "Hays County",
        permitCount: 1,
        share: 0.5,
      },
      topCaseCounty: {
        county: "Travis County",
        caseCount: 1,
        share: 1,
      },
    });

    expect(rows[1]).toMatchObject({
      slug: "blue-river-utility-district",
      operatorName: "Blue River Utility District",
      permitCount: 1,
      caseCount: 1,
      protestedCaseCount: 1,
      countyCount: 1,
      filingCounts: {
        comments: 1,
        hearingRequests: 0,
        publicMeetingRequests: 0,
      },
      proceduralPressureScore: 1,
      latestFiledAt: "2026-04-02",
    });
  });

  it("builds detail rows with counties, permits, cases, and statewide totals", () => {
    const dataset = buildOperatorIntelligenceDataset({ permits, cidCases, cidProtests });
    expect(dataset.statewide).toEqual({
      operatorCount: 2,
      permitCount: 3,
      caseCount: 2,
      protestedCaseCount: 2,
      filingCounts: {
        comments: 2,
        hearingRequests: 1,
        publicMeetingRequests: 1,
      },
      proceduralPressureScore: 11,
    });

    const acme = getOperatorDetailView(dataset, "acme-water-llc");
    expect(acme).not.toBeNull();
    expect(acme?.counties).toEqual([
      {
        county: "Travis County",
        countySlug: "travis-county",
        permitCount: 1,
        caseCount: 1,
        protestedCaseCount: 1,
        filingCounts: { comments: 1, hearingRequests: 1, publicMeetingRequests: 1 },
        proceduralPressureScore: 10,
        latestFiledAt: "2026-04-13",
      },
      {
        county: "Hays County",
        countySlug: "hays-county",
        permitCount: 1,
        caseCount: 0,
        protestedCaseCount: 0,
        filingCounts: { comments: 0, hearingRequests: 0, publicMeetingRequests: 0 },
        proceduralPressureScore: 0,
        latestFiledAt: null,
      },
    ]);
    expect(acme?.permits.map((permit) => permit.permitNumber)).toEqual(["WQ0002", "WQ0001"]);
    expect(acme?.cases).toHaveLength(1);
    expect(acme?.cases[0]).toMatchObject({
      tceqId: "WQ0000447000",
      applicantName: "ACME WATER LLC",
      county: "Travis County",
      filingCounts: { comments: 1, hearingRequests: 1, publicMeetingRequests: 1 },
      latestFiledAt: "2026-04-13",
    });
    expect(getOperatorDetailView(dataset, "missing-operator")).toBeNull();
  });
});
