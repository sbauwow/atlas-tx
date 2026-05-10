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

describe("operator detail page", () => {
  it("renders public-record operator detail with county footprint, watch queue, and rosters", async () => {
    const pageModule = await import("@/app/operators/[slug]/page");
    const page = await pageModule.default({ params: Promise.resolve({ slug: "alpha-water-llc" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("Operator detail from public records");
    expect(text).toContain("Alpha Water LLC");
    expect(text).toContain("Record profile");
    expect(text).toContain("Aliases in current records");
    expect(text).toContain("Statewide permit share");
    expect(text).toContain("67%");
    expect(text).toContain("Interpretation");
    expect(text).toContain("Elevated procedural pressure is visible in current CID filings.");
    expect(text).toContain("Watchlist-ready lane");
    expect(text).toContain("Watch next from this operator");
    expect(text).toContain("Atlas now saves these county and permit lanes into local/shared browser watchlists.");
    expect(text).toContain("Open saved watchlists");
    expect(text).toContain("Add to watchlist");
    expect(text).toContain("county | Travis County | /counties/travis-county | permits 1 | cases 1 | pressure 10");
    expect(text).toContain("permit-lane | WQ0001 | /permits?county=travis-county | IND WW | Travis County");
    expect(text).toContain('aria-label="Watch next from this operator copyable queue"');
    expect(text).toContain("Route back into county context");
    expect(text).toContain("County footprint");
    expect(text).toContain("Travis County");
    expect(text).toContain("Hays County");
    expect(text).toContain("CID case roster");
    expect(text).toContain("WQ0000447000");
    expect(text).toContain("1 HR / 1 PM / 1 C");
    expect(text).toContain("Pending permit roster");
    expect(text).toContain("WQ0001");
    expect(text).toContain("WQ0002");
    expect(text).toContain('href=\"/operators\"');
    expect(text).toContain('href=\"/counties/travis-county\"');
    expect(text).toContain('href=\"/counties/hays-county\"');
    expect(text).toContain('href=\"/permits?county=hays-county\"');
    expect(text).toContain('href=\"/water/counties/travis-county\"');
    expect(text).toContain('href=\"/water/counties/hays-county\"');
  });

  it("throws not found for unknown slugs and has a graceful fallback page", async () => {
    const pageModule = await import("@/app/operators/[slug]/page");
    await expect(pageModule.default({ params: Promise.resolve({ slug: "missing-operator" }) })).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK|404/);

    const notFoundModule = await import("@/app/operators/[slug]/not-found");
    const text = renderToStaticMarkup(notFoundModule.default());

    expect(text).toContain("Operator not found");
    expect(text).toContain("No operator detail matched that slug");
    expect(text).toContain('href="/operators"');
  });
});
