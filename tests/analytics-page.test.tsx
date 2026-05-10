import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const readFileMock = vi.fn();
const getTceqPendingPermitsPageDataMock = vi.fn();

vi.mock("fs/promises", () => ({
  readFile: (...args: unknown[]) => readFileMock(...args),
}));

vi.mock("@/lib/tceq-permits", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tceq-permits")>();
  return {
    ...actual,
    getTceqPendingPermitsPageData: (...args: unknown[]) => getTceqPendingPermitsPageDataMock(...args),
  };
});

function analyticsFile(filename: string) {
  if (filename.includes("county-history.json")) {
    return JSON.stringify({
      artifact: "county-history",
      artifactVersion: 1,
      generatedAt: "2026-05-09T22:08:46.795Z",
      historyLength: 2,
    });
  }

  if (filename.includes("county-movers.json")) {
    return JSON.stringify({
      artifact: "county-movers",
      artifactVersion: 1,
      generatedAt: "2026-05-09T22:08:46.795Z",
      baselineSnapshotAt: "2026-05-09T22:05:56.932Z",
      comparisonSnapshotAt: "2026-05-09T22:08:46.795Z",
      notes: [
        "Rank deltas compare the newest county-history snapshot against the immediately preceding real snapshot.",
        "Ties remain ordered by current risk score.",
      ],
      movers: [
        {
          county: { name: "Harris County", slug: "harris-county" },
          movement: "up",
          currentRank: 1,
          previousRank: 3,
          rankDelta: 2,
          currentRiskScore: 100,
          previousRiskScore: 96.4,
          scoreDelta: 3.6,
          currentPressureScore: 100,
          previousPressureScore: 98.1,
        },
        {
          county: { name: "Travis County", slug: "travis-county" },
          movement: "steady",
          currentRank: 2,
          previousRank: 2,
          rankDelta: 0,
          currentRiskScore: 9.72,
          previousRiskScore: 9.72,
          scoreDelta: 0,
          currentPressureScore: 0.43,
          previousPressureScore: 0.43,
        },
        {
          county: { name: "Orange County", slug: "orange-county" },
          movement: "new",
          currentRank: 11,
          previousRank: null,
          rankDelta: null,
          currentRiskScore: 5.2,
          previousRiskScore: null,
          scoreDelta: null,
          currentPressureScore: 14.44,
          previousPressureScore: null,
        },
      ],
    });
  }

  if (filename.includes("pressure-risk-scatter.json")) {
    return JSON.stringify({
      artifact: "pressure-risk-scatter",
      artifactVersion: 1,
      generatedAt: "2026-05-09T22:08:46.795Z",
      axes: {
        x: "pressureScore",
        y: "countyRiskScore",
      },
      notes: [
        "Both axes are normalized to a 0-100 statewide range for stable chart consumption.",
        "Quadrants use median splits from the newest real county-history snapshot.",
      ],
      points: [
        {
          county: { name: "Harris County", slug: "harris-county" },
          x: 100,
          y: 100,
          population: null,
          impairedSegmentCount: 90,
          hydrologyLayerHitCount: 3,
          systemCount: 253,
          violationCount: 484,
          quadrant: "high-pressure-high-risk",
        },
        {
          county: { name: "Travis County", slug: "travis-county" },
          x: 0.43,
          y: 9.72,
          population: 1300000,
          impairedSegmentCount: 5,
          hydrologyLayerHitCount: 3,
          systemCount: 28,
          violationCount: 136,
          quadrant: "lower-pressure-high-risk",
        },
        {
          county: { name: "Orange County", slug: "orange-county" },
          x: 14.44,
          y: 5.2,
          population: null,
          impairedSegmentCount: 13,
          hydrologyLayerHitCount: 3,
          systemCount: 10,
          violationCount: 240,
          quadrant: "high-pressure-high-risk",
        },
      ],
    });
  }

  if (filename.includes("source-freshness.json")) {
    return JSON.stringify({
      artifact: "source-freshness",
      artifactVersion: 1,
      generatedAt: "2026-05-09T22:08:46.795Z",
      sources: [
        {
          sourceId: "sdwis",
          label: "EPA SDWIS Texas snapshot",
          artifactPath: "public/cache/sdwis-tx.json",
          source: "https://data.epa.gov/efservice",
          generatedAt: "2026-05-09T01:50:21.429Z",
          ageDays: 0.85,
          status: "fresh",
          rowCount: 11686,
          notes: [
            "SDWIS rows are self-reported by primacy agencies; recent quarters lag.",
          ],
        },
        {
          sourceId: "surface-water-quality",
          label: "TCEQ surface-water-quality snapshot",
          artifactPath: "public/cache/surface-water-quality-tx.json",
          source: "https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer",
          generatedAt: "2026-05-09T04:56:55.042Z",
          ageDays: 0.72,
          status: "fresh",
          rowCount: 1523,
          notes: [
            "County-level pressure uses impaired segment counts from the cached surface-water snapshot.",
          ],
        },
      ],
    });
  }

  throw new Error(`Unexpected file request: ${filename}`);
}

function analyticsPermitData() {
  return {
    countyFilter: null,
    generatedAt: "2026-05-09T22:08:46.795Z",
    summary: {
      pendingPermitCount: 3,
      activePermitCount: 9,
      countyCount: 2,
      authorizationTypeCount: 2,
      topCounties: [
        { county: "Harris County", count: 2 },
        { county: "Orange County", count: 1 },
      ],
    },
    cidSummary: {
      available: true,
      generatedAt: "2026-05-09T22:08:46.795Z",
      openCaseCount: 2,
      protestedCaseCount: 2,
      hearingRequestCount: 1,
      publicMeetingRequestCount: 1,
      caveats: [],
      topProgramAreas: [{ programArea: "WQ", count: 2 }],
      cases: [
        {
          tceqId: "WQ0000447000",
          applicantName: "Alpha Water LLC",
          county: "Harris County",
          programArea: "WQ",
          itemStatus: "open",
          tceqDocketNumber: "2026-001",
          soahDocketNumber: "582-26-0001",
          filingCounts: { comments: 1, hearingRequests: 1, publicMeetingRequests: 0 },
          latestFiledAt: "2026-05-08",
        },
        {
          tceqId: "WQ0000555000",
          applicantName: "Beta Utility",
          county: "Orange County",
          programArea: "WQ",
          itemStatus: "open",
          tceqDocketNumber: null,
          soahDocketNumber: null,
          filingCounts: { comments: 0, hearingRequests: 0, publicMeetingRequests: 1 },
          latestFiledAt: "2026-05-07",
        },
      ],
    },
    permits: [
      {
        permitNumber: "WQ0001",
        authorizationType: "IND WW",
        authorizationStatus: "PENDING",
        permitteeName: "Alpha Water LLC",
        county: "Harris County",
        nearestCity: "Houston",
        latitude: 29.76,
        longitude: -95.37,
      },
      {
        permitNumber: "WQ0002",
        authorizationType: "IND WW",
        authorizationStatus: "PENDING",
        permitteeName: "Alpha Water LLC",
        county: "Harris County",
        nearestCity: "Houston",
        latitude: 29.77,
        longitude: -95.36,
      },
      {
        permitNumber: "WQ0003",
        authorizationType: "MUN WW",
        authorizationStatus: "PENDING",
        permitteeName: "Beta Utility",
        county: "Orange County",
        nearestCity: "Orange",
        latitude: 30.09,
        longitude: -93.74,
      },
    ],
  };
}

describe("statewide analytics page", () => {
  beforeEach(() => {
    vi.resetModules();
    readFileMock.mockReset();
    getTceqPendingPermitsPageDataMock.mockReset();
  });

  it("renders statewide movers, scatter analysis, and provenance cards from Wave 1 artifacts", async () => {
    readFileMock.mockImplementation(async (filename: string) => analyticsFile(filename));
    getTceqPendingPermitsPageDataMock.mockResolvedValue(analyticsPermitData());

    const pageModule = await import("@/app/analytics/page");
    const page = await pageModule.default();
    const text = renderToStaticMarkup(page);

    expect(text).toContain("Texas statewide analytics terminal");
    expect(text).toContain("County workspace");
    expect(text).toContain("Map-first correlation workflow");
    expect(text).toContain("County map is the statewide headliner");
    expect(text).toContain("Start on the county map, hunt your own statewide correlations");
    expect(text).toContain("Analytics map emphasis");
    expect(text).toContain("Current emphasis: county risk");
    expect(text).toContain("Texas county analytics correlation map");
    expect(text).toContain("1. Start on the map");
    expect(text).toContain("2. Check ranked movers");
    expect(text).toContain("3. Validate in scatter");
    expect(text).toContain("County risk score");
    expect(text).toContain("Permit pressure");
    expect(text).toContain("Open this county next");
    expect(text).toContain("Top counties in this view");
    expect(text).toContain('href="/analytics?mode=pressure&amp;county=harris-county#analytics-map"');
    expect(text).toContain('href="/analytics?mode=risk&amp;county=harris-county#statewide-scatter"');
    expect(text).toContain('href="/analytics?mode=risk&amp;county=orange-county#analytics-map"');
    expect(text).toContain("Harris County: risk 100, pressure 100 — Up 2 rank slots.");
    expect(text).toContain("What changed");
    expect(text).toContain("Recent movement across committed snapshots");
    expect(text).toContain("Recent movement across committed snapshots: 1 up, 0 down, 1 new.");
    expect(text).toContain("Window May 9, 10:05 PM UTC → May 9, 10:08 PM UTC");
    expect(text).toContain("Risks up: 1");
    expect(text).toContain("New in lane: 1");
    expect(text).toContain("Screening lanes");
    expect(text).toContain("Counties to open next");
    expect(text).toContain("Watchlist-ready lane");
    expect(text).toContain("Statewide open-next queue");
    expect(text).toContain("Atlas now saves these lanes into local/shared browser watchlists.");
    expect(text).toContain("Open saved watchlists");
    expect(text).toContain("Add to watchlist");
    expect(text).toContain("Copyable queue");
    expect(text).toContain("county | Harris County | /counties/harris-county | Riser");
    expect(text).toContain("operator | Alpha Water LLC | /operators/alpha-water-llc | Largest share");
    expect(text).toContain('aria-label="Statewide open-next queue copyable queue"');
    expect(text).toContain('href="/counties/harris-county"');
    expect(text).toContain('href="/counties/orange-county"');
    expect(text).toContain("Risk +3.6 · pressure 100 · prior rank 3");
    expect(text).toContain("Pressure 14.44 · no prior committed rank in this comparison window.");
    expect(text).toContain("Operator concentration");
    expect(text).toContain("Who dominates permit pressure statewide");
    expect(text).toContain("Alpha Water LLC currently carries the largest pending-permit share in Atlas");
    expect(text).toContain("2 pending permits · 66.7% of statewide permit pressure");
    expect(text).toContain("Harris County carries 2 permits (100% of this operator&#x27;s pending lane)");
    expect(text).toContain('href="/operators/alpha-water-llc"');
    expect(text).toContain("County movers");
    expect(text).toContain("Up 2 rank slots");
    expect(text).toContain("Pressure 100");
    expect(text).toContain("Pressure outliers");
    expect(text).toContain("Baseline 100");
    expect(text).toContain("Pressure vs risk statewide scatter");
    expect(text).toContain("scatter plot");
    expect(text).toContain("Harris County: Pressure score 100, County risk score 100");
    expect(text).toContain("High pressure + high risk");
    expect(text).toContain("Quadrant monitor");
    expect(text).toContain("Committed source inventory");
    expect(text).toContain("EPA SDWIS Texas snapshot");
    expect(text).toContain("public/cache/sdwis-tx.json");
    expect(text).toContain("11.7K rows cached");
    expect(text).toContain("Both axes are normalized to a 0-100 statewide range for stable chart consumption.");
  });

  it("degrades gracefully when analytics artifacts are missing", async () => {
    readFileMock.mockRejectedValue(new Error("ENOENT: no such file or directory"));
    getTceqPendingPermitsPageDataMock.mockResolvedValue({
      countyFilter: null,
      generatedAt: "2026-05-09T22:08:46.795Z",
      summary: {
        pendingPermitCount: 0,
        activePermitCount: 0,
        countyCount: 0,
        authorizationTypeCount: 0,
        topCounties: [],
      },
      cidSummary: {
        available: false,
        generatedAt: null,
        openCaseCount: 0,
        protestedCaseCount: 0,
        hearingRequestCount: 0,
        publicMeetingRequestCount: 0,
        caveats: [],
        topProgramAreas: [],
        cases: [],
      },
      permits: [],
    });

    const pageModule = await import("@/app/analytics/page");
    const page = await pageModule.default();
    const text = renderToStaticMarkup(page);

    expect(text).toContain("Texas statewide analytics terminal");
    expect(text).toContain("County map is the statewide headliner");
    expect(text).toContain("The county map will activate once pressure-risk-scatter.json exposes counties with mappable FIPS coverage.");
    expect(text).toContain("No statewide scatter counties are available yet.");
    expect(text).toContain("What changed will activate once Atlas has at least two committed statewide snapshots.");
    expect(text).toContain("Wave 1 comparison snapshots are not available yet.");
    expect(text).toContain("Atlas only shows this lane when committed artifacts support a real comparison window.");
    expect(text).toContain("Wave 1 did not produce enough mover rows for screening lanes yet.");
    expect(text).toContain("Atlas has not exposed enough county or operator lanes to build a watch queue yet.");
    expect(text).toContain("Operator concentration activates when Atlas has permittee or applicant names in the statewide permit/CID lane.");
    expect(text).toContain("Atlas will surface operator concentration here once the permit roster or CID lane exposes enough named operators to compare shares.");
    expect(text).toContain("Movers unavailable");
    expect(text).toContain("Pressure outlier bars will appear when pressure-risk-scatter.json contains points.");
    expect(text).toContain("The statewide scatter will appear once pressure-risk-scatter.json is committed.");
    expect(text).toContain("No source-freshness artifact was available.");
  });

  it("falls back to steady counties when the committed comparison window shows no movement", async () => {
    getTceqPendingPermitsPageDataMock.mockResolvedValue(analyticsPermitData());
    readFileMock.mockImplementation(async (filename: string) => {
      if (filename.includes("county-history.json")) {
        return JSON.stringify({
          artifact: "county-history",
          artifactVersion: 1,
          generatedAt: "2026-05-09T22:08:46.795Z",
          historyLength: 2,
        });
      }

      if (filename.includes("county-movers.json")) {
        return JSON.stringify({
          artifact: "county-movers",
          artifactVersion: 1,
          generatedAt: "2026-05-09T22:08:46.795Z",
          baselineSnapshotAt: "2026-05-09T22:05:56.932Z",
          comparisonSnapshotAt: "2026-05-09T22:08:46.795Z",
          movers: [
            {
              county: { name: "Harris County", slug: "harris-county" },
              movement: "steady",
              currentRank: 1,
              previousRank: 1,
              rankDelta: 0,
              currentRiskScore: 100,
              previousRiskScore: 100,
              scoreDelta: 0,
              currentPressureScore: 100,
              previousPressureScore: 100,
            },
            {
              county: { name: "Travis County", slug: "travis-county" },
              movement: "steady",
              currentRank: 2,
              previousRank: 2,
              rankDelta: 0,
              currentRiskScore: 9.72,
              previousRiskScore: 9.72,
              scoreDelta: 0,
              currentPressureScore: 0.43,
              previousPressureScore: 0.43,
            },
          ],
        });
      }

      if (filename.includes("pressure-risk-scatter.json")) {
        return JSON.stringify({ artifact: "pressure-risk-scatter", artifactVersion: 1, generatedAt: "2026-05-09T22:08:46.795Z", points: [] });
      }

      if (filename.includes("source-freshness.json")) {
        return JSON.stringify({ artifact: "source-freshness", artifactVersion: 1, generatedAt: "2026-05-09T22:08:46.795Z", sources: [] });
      }

      throw new Error(`Unexpected file request: ${filename}`);
    });

    const pageModule = await import("@/app/analytics/page");
    const page = await pageModule.default();
    const text = renderToStaticMarkup(page);

    expect(text).toContain("No county movement was recorded across the latest committed comparison window.");
    expect(text).toContain("Held rank #1 · risk 100");
    expect(text).toContain("No movement between committed snapshots · pressure 100 · prior risk 100.");
    expect(text).toContain("Statewide open-next queue");
    expect(text).toContain("county | Harris County | /counties/harris-county | Steady");
    expect(text).toContain("Steady: 2");
  });
});
