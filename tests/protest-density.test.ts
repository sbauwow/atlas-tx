import { describe, expect, it } from "vitest";

import { scoreProtestDensity } from "@/lib/scoring/protest_density";

describe("scoreProtestDensity", () => {
  it("aggregates CID filings into county APD scores with raw and per-capita components", () => {
    const rows = scoreProtestDensity({
      cases: [
        {
          tceqId: "WQ1",
          applicantName: "Dow",
          county: "Brazoria County",
          programArea: "WQ",
          itemStatus: "open",
          tceqDocketNumber: "2026-001",
          soahDocketNumber: "582-26-1234",
          regulatedEntityNumber: null,
          customerNumber: null,
        },
        {
          tceqId: "WQ2",
          applicantName: "Big Rock",
          county: "Comal County",
          programArea: "APO",
          itemStatus: "open",
          tceqDocketNumber: null,
          soahDocketNumber: null,
          regulatedEntityNumber: null,
          customerNumber: null,
        },
        {
          tceqId: "WQ3",
          applicantName: "Ignore Closed",
          county: "Comal County",
          programArea: "WQ",
          itemStatus: "closed",
          tceqDocketNumber: null,
          soahDocketNumber: null,
          regulatedEntityNumber: null,
          customerNumber: null,
        },
      ],
      protests: [
        {
          tceqId: "WQ1",
          filingType: "comment",
          filerOrganization: null,
          filedAt: "2026-04-01",
        },
        {
          tceqId: "WQ1",
          filingType: "comment",
          filerOrganization: null,
          filedAt: "2026-04-02",
        },
        {
          tceqId: "WQ1",
          filingType: "hearing_request",
          filerOrganization: "Public Citizen",
          filedAt: "2026-04-03",
        },
        {
          tceqId: "WQ2",
          filingType: "public_meeting_request",
          filerOrganization: "Sierra Club",
          filedAt: "2026-04-04",
        },
      ],
      countyPopulation: {
        "Brazoria County": 380000,
        "Comal County": 180000,
      },
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      county: "Brazoria County",
      openCaseCount: 1,
      components: {
        commentCount: 2,
        hearingRequestCount: 1,
        publicMeetingRequestCount: 0,
        soahCaseCount: 1,
      },
    });
    expect(rows[0]?.rawPressure).toBeCloseTo(5.1345, 3);
    expect(rows[0]?.per1kPopulation).toBeCloseTo(0.0135, 3);
    expect(rows[0]?.score).toBe(100);

    expect(rows[1]).toMatchObject({
      county: "Comal County",
      openCaseCount: 1,
      components: {
        commentCount: 0,
        hearingRequestCount: 0,
        publicMeetingRequestCount: 1,
        soahCaseCount: 0,
      },
    });
    expect(rows[1]?.rawPressure).toBeCloseTo(1.75, 3);
    expect(rows[1]?.per1kPopulation).toBeCloseTo(0.0097, 3);
    expect(rows[1]?.score).toBe(0);
  });

  it("can filter by county and minimum population", () => {
    const rows = scoreProtestDensity({
      cases: [
        {
          tceqId: "WQ1",
          applicantName: "Dow",
          county: "Brazoria County",
          programArea: "WQ",
          itemStatus: "open",
          tceqDocketNumber: null,
          soahDocketNumber: null,
          regulatedEntityNumber: null,
          customerNumber: null,
        },
        {
          tceqId: "WQ2",
          applicantName: "Small County Case",
          county: "Loving County",
          programArea: "WQ",
          itemStatus: "open",
          tceqDocketNumber: null,
          soahDocketNumber: null,
          regulatedEntityNumber: null,
          customerNumber: null,
        },
      ],
      protests: [],
      countyPopulation: {
        "Brazoria County": 380000,
        "Loving County": 64,
      },
      county: "Brazoria County",
      minPopulation: 1000,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.county).toBe("Brazoria County");
  });
});
