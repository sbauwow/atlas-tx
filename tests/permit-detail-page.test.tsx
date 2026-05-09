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
          permitNumber: "WQ0003",
          authorizationType: "IND WW",
          authorizationStatus: "PENDING",
          permitteeName: "Gamma Water",
          county: "Travis County",
          nearestCity: "Austin",
          latitude: 30.28,
          longitude: -97.75,
        },
      ],
    })),
  };
});

describe("permit filing detail page", () => {
  it("renders filing detail with county workspace and red-flag context", async () => {
    const pageModule = await import("@/app/permits/[tceqId]/page");
    const page = await pageModule.default({ params: Promise.resolve({ tceqId: "WQ0000447000" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("County workspace");
    expect(text).toContain("Alpha Water LLC");
    expect(text).toContain("WQ0000447000");
    expect(text).toContain("SOAH docket present");
    expect(text).toContain("1 hearing request filed");
    expect(text).toContain("2 pending permits in Travis County");
    expect(text).toContain("Related county permits");
    expect(text).toContain("WQ0001");
    expect(text).toContain("Protest prep panel");
    expect(text).toContain("Participation status");
    expect(text).toContain("Evidence checklist");
    expect(text).toContain("Draft from facts");
    expect(text).toContain("Submission pack");
    expect(text).toContain("Request a contested case hearing");
    expect(text).toContain("Describe how the filing affects Travis County or nearby neighborhoods.");
    expect(text).toContain("I am submitting this comment regarding TCEQ ID WQ0000447000");
    expect(text).toContain('href="/permits?county=travis-county"');
    expect(text).toContain('href="/water/counties/travis-county"');
  });
});
