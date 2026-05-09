import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tceq-permits", () => ({
  getTceqPendingPermitsPageData: vi.fn(async (county?: string) => ({
    countyFilter: county ?? null,
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
          filingCounts: { comments: 1, hearingRequests: 1, publicMeetingRequests: 0 },
          latestFiledAt: "2026-04-04",
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
    ],
  })),
}));

describe("permits page", () => {
  it("renders statewide pending permit tracking", async () => {
    const pageModule = await import("@/app/permits/page");
    const page = await pageModule.default({ searchParams: Promise.resolve({}) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("TCEQ pending permits");
    expect(text).toContain("Pending permit tracker for Texas");
    expect(text).toContain("Travis County");
    expect(text).toContain("WQ0001");
    expect(text).toContain("Alpha Water LLC");
    expect(text).toContain("CID open cases");
    expect(text).toContain("WQ0000447000");
  });

  it("renders the selected county filter when present", async () => {
    const pageModule = await import("@/app/permits/page");
    const page = await pageModule.default({ searchParams: Promise.resolve({ county: "travis-county" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("County filter");
    expect(text).toContain("travis-county");
  });
});
