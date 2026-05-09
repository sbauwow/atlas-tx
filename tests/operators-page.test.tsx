import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tceq-permits", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tceq-permits")>();
  return {
    ...actual,
    getTceqPendingPermitsPageData: vi.fn(async () => ({
    countyFilter: null,
    generatedAt: "2026-05-09T00:00:00.000Z",
    summary: {
      pendingPermitCount: 3,
      activePermitCount: 9,
      countyCount: 2,
      authorizationTypeCount: 2,
      topCounties: [
        { county: "Travis County", count: 2 },
        { county: "Hays County", count: 1 },
      ],
    },
    cidSummary: {
      available: true,
      generatedAt: "2026-05-09T00:00:00.000Z",
      openCaseCount: 2,
      protestedCaseCount: 2,
      hearingRequestCount: 1,
      publicMeetingRequestCount: 1,
      caveats: ["CID Search One is fragile; treat this lane as best-effort procedural context."],
      topProgramAreas: [{ programArea: "WQ", count: 2 }],
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
          filingCounts: { comments: 1, hearingRequests: 1, publicMeetingRequests: 1 },
          latestFiledAt: "2026-04-13",
        },
        {
          tceqId: "WQ0000555000",
          applicantName: "Beta Utility District",
          county: "Travis County",
          programArea: "WQ",
          itemStatus: "open",
          tceqDocketNumber: null,
          soahDocketNumber: null,
          regulatedEntityNumber: null,
          customerNumber: null,
          filingCounts: { comments: 1, hearingRequests: 0, publicMeetingRequests: 0 },
          latestFiledAt: "2026-04-02",
        },
      ],
    },
    permits: [
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
        authorizationType: "MUN WW",
        authorizationStatus: "PENDING",
        permitteeName: "Alpha Water LLC",
        county: "Hays County",
        nearestCity: "Buda",
        latitude: 30.08,
        longitude: -97.84,
      },
      {
        permitNumber: "WQ0003",
        authorizationType: "IND WW",
        authorizationStatus: "PENDING",
        permitteeName: "Beta Utility District",
        county: "Travis County",
        nearestCity: "Austin",
        latitude: 30.29,
        longitude: -97.75,
      },
    ],
    })),
  };
});

describe("operators directory page", () => {
  it("renders operator counts, filing context, and detail links", async () => {
    const pageModule = await import("@/app/operators/page");
    const page = await pageModule.default();
    const text = renderToStaticMarkup(page);

    expect(text).toContain("Public-record operator directory");
    expect(text).toContain("Operators in pending permit and CID records");
    expect(text).toContain("Operators in records");
    expect(text).toContain("Pending permits");
    expect(text).toContain("CID open cases");
    expect(text).toContain("Procedural pressure score");
    expect(text).toContain("Operator leaderboard");
    expect(text).toContain("Alpha Water LLC");
    expect(text).toContain("Beta Utility District");
    expect(text).toContain("Travis County permits · Travis County cases");
    expect(text).toContain("50% of permits · 100% of cases");
    expect(text).toContain("Apr 13, 2026");
    expect(text).toContain("1 hearing requests");
    expect(text).toContain("1 public meeting requests");
    expect(text).toContain("2 permits");
    expect(text).toContain("href=\"/operators/alpha-water-llc\"");
    expect(text).toContain("href=\"/operators/beta-utility-district\"");
  });
});
