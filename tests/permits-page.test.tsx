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

    expect(text).toContain("TCEQ pending permits");
    expect(text).toContain("Pending permit tracker for Texas");
    expect(text).toContain("Travis County");
    expect(text).toContain("WQ0001");
    expect(text).toContain("Alpha Water LLC");
    expect(text).toContain("CID open cases");
    expect(text).toContain("WQ0000447000");
    expect(text).toContain("CID snapshot age");
    expect(text).toContain("1d old");
    expect(text).toContain("Fresh");
    expect(text).toContain("border-emerald-400/20 bg-emerald-400/10");
    expect(text).toContain("County permit map");
    expect(text).toContain("data-county-map-path=\"travis-county\"");
    expect(text).toContain("data-county-map-path=\"hays-county\"");
    expect(text).not.toContain("data-county-map-tile");
  });

  it("renders the selected county filter when present", async () => {
    const pageModule = await import("@/app/permits/page");
    const page = await pageModule.default({ searchParams: Promise.resolve({ county: "travis-county" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("County filter");
    expect(text).toContain("travis-county");
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
