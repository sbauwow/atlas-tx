import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let cidSnapshotGeneratedAt = "2026-05-09T00:00:00.000Z";

vi.mock("@/lib/tceq-permits", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tceq-permits")>();
  return {
    ...actual,
    getTceqPendingPermitsPageData: vi.fn(async (county?: string) => ({
      countyFilter: county ?? null,
      generatedAt: cidSnapshotGeneratedAt,
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
        generatedAt: cidSnapshotGeneratedAt,
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
        {
          permitNumber: "WQ0002",
          authorizationType: "MUN WW",
          authorizationStatus: "PENDING",
          permitteeName: "Beta Utility",
          county: "Hays County",
          nearestCity: "Buda",
          latitude: 30.08,
          longitude: -97.84,
        },
        {
          permitNumber: "WQ0003",
          authorizationType: "IND WW",
          authorizationStatus: "PENDING",
          permitteeName: "Alpha Water LLC",
          county: "Travis County",
          nearestCity: "Austin",
          latitude: 30.29,
          longitude: -97.75,
        },
      ],
    })),
  };
});

describe("permits page", () => {
  beforeEach(() => {
    cidSnapshotGeneratedAt = "2026-05-09T00:00:00.000Z";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders statewide pending permit tracking", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-10T12:00:00.000Z"));

    const pageModule = await import("@/app/permits/page");
    const page = await pageModule.default({ searchParams: Promise.resolve({}) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("Texas Commission on Environmental Quality");
    expect(text).toContain("TCEQ pending permits");
    expect(text).toContain("Pending permit tracker for Texas");
    expect(text).toContain("Travis County");
    expect(text).toContain("WQ0001");
    expect(text).toContain("Alpha Water LLC");
    expect(text).toContain("Commissioners’ Integrated Database");
    expect(text).toContain("CID open cases");
    expect(text).toContain("WQ0000447000");
    expect(text).toContain("CID snapshot age");
    expect(text).toContain("1d old");
    expect(text).toContain("Fresh");
    expect(text).toContain("border-emerald-400/20 bg-emerald-400/10");
    expect(text).toContain("County permit map");
    expect(text).toContain("Click a highlighted county to open its filtered permit view.");
    expect(text).toContain("data-county-map-path=\"travis-county\"");
    expect(text).toContain("data-county-map-path=\"hays-county\"");
    expect(text).toContain("href=\"/permits?county=travis-county\"");
    expect(text).toContain("href=\"/water/counties/travis-county\"");
    expect(text).toContain("href=\"/counties/travis-county\"");
    expect(text).toContain("County intelligence");
    expect(text).toContain("Open county pages");
    expect(text).toContain("Filings that need scrutiny");
    expect(text).toContain("Top permittees and applicants");
    expect(text).toContain("Concentration lane for who is carrying the most pending-permit volume");
    expect(text).toContain('href=\"/operators/alpha-water-llc\"');
    expect(text).toContain("66.7%");
    expect(text).toContain("Pending permits");
    expect(text).toContain("CID cases");
    expect(text).toContain("Travis County holds 2 permits (100% of this operator&#x27;s pending lane).");
    expect(text).toContain("100% of visible CID cases and 100% of visible procedural pressure.");
    expect(text).toContain("State Office of Administrative Hearings");
    expect(text).toContain("SOAH docket present");
    expect(text).toContain("1 hearing request filed");
    expect(text).toContain("2 pending permits in Travis County");
    expect(text).toContain("title=\"Commissioners’ Integrated Database\"");
    expect(text).not.toContain("data-county-map-tile");
  });

  it("renders the selected county filter when present", async () => {
    const pageModule = await import("@/app/permits/page");
    const page = await pageModule.default({ searchParams: Promise.resolve({ county: "travis-county" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("County filter");
    expect(text).toContain("travis-county");
    expect(text).toContain("County workspace");
    expect(text).toContain("href=\"/water/counties/travis-county\"");
    expect(text).toContain("href=\"/permits?county=tom-green-county\"");
    expect(text).toContain("href=\"/permits?county=trinity-county\"");
  });

  it("renders an aging badge when the CID snapshot is several days old", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-10T12:00:00.000Z"));
    cidSnapshotGeneratedAt = "2026-05-05T00:00:00.000Z";

    const pageModule = await import("@/app/permits/page");
    const page = await pageModule.default({ searchParams: Promise.resolve({}) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("5d old");
    expect(text).toContain("Aging");
    expect(text).toContain("border-amber-400/20 bg-amber-400/10");
  });
});
