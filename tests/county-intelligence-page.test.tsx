import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const readFileMock = vi.fn();

vi.mock("fs/promises", () => ({
  readFile: (...args: unknown[]) => readFileMock(...args),
}));

vi.mock("@/lib/atlas-county-explorer", () => ({
  getDefaultAtlasCountyExplorerService: () => ({
    getCountyBreakdown: vi.fn(async (slug: string) => ({
      overview: {
        county: { name: "Travis County", slug },
        compositeScore: 91.2,
        ranks: { composite: 3, permits: 5, "water-districts": 8, "sales-tax-rates": 11 },
        metrics: {
          permits: { permitCount: 14 },
          "water-districts": { districtCount: 6 },
          "sales-tax-rates": { averageRate: 8.25 },
        },
        sourceValues: { permits: 14, "water-districts": 6, "sales-tax-rates": 8.25 },
      },
      profile: {
        county: { name: "Travis County", slug },
        datasets: [
          { sourceId: "permits", label: "Permits", recordCount: 14, status: "ready" },
          { sourceId: "water-districts", label: "Water districts", recordCount: 6, status: "ready" },
        ],
      },
      highlights: [
        { sourceId: "permits", label: "Permits", rank: 5, value: 14 },
        { sourceId: "water-districts", label: "Water districts", rank: 8, value: 6 },
        { sourceId: "sales-tax-rates", label: "Sales tax rates", rank: 11, value: 8.25 },
      ],
      hydrologyContext: {
        countyCentroid: { lat: 30.3, lon: -97.7 },
        layerHits: {
          "twdb-major-aquifers": 1,
          "twdb-river-basins": 2,
          "twdb-huc8": 3,
        },
        matches: [
          { layerId: "twdb-river-basins", layerName: "River basins", primaryCode: "12", name: "Colorado", basin: "Colorado", region: null, subregion: null },
        ],
        caveat: "Centroid overlap only.",
      },
    })),
  }),
}));

vi.mock("@/app/operators/operator-page-data", () => ({
  getOperatorIntelligencePageData: vi.fn(async () => ({
    statewide: {
      operatorCount: 2,
      permitCount: 3,
      caseCount: 2,
      protestedCaseCount: 2,
      filingCounts: { comments: 2, hearingRequests: 1, publicMeetingRequests: 1 },
      proceduralPressureScore: 11,
    },
    summaryRows: [],
    detailRows: [
      {
        slug: "alpha-water-llc",
        operatorName: "Alpha Water LLC",
        normalizedName: "ALPHA WATER LLC",
        aliases: ["Alpha Water LLC"],
        countyCount: 2,
        permitCount: 2,
        caseCount: 1,
        protestedCaseCount: 1,
        filingCounts: { comments: 1, hearingRequests: 1, publicMeetingRequests: 1 },
        proceduralPressureScore: 10,
        latestFiledAt: "2026-04-13",
        concentration: {
          permitShareStatewide: 0.67,
          caseShareStatewide: 0.5,
          protestedCaseShareStatewide: 0.5,
          proceduralPressureShareStatewide: 0.91,
          countyPermitConcentration: 0.5,
          countyCaseConcentration: 1,
          topPermitCounty: { county: "Travis County", share: 0.5, permitCount: 1 },
          topCaseCounty: { county: "Travis County", share: 1, caseCount: 1 },
        },
        counties: [
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
        ],
        permits: [],
        cases: [],
      },
      {
        slug: "beta-utility-district",
        operatorName: "Beta Utility District",
        normalizedName: "BETA UTILITY DISTRICT",
        aliases: ["Beta Utility District"],
        countyCount: 1,
        permitCount: 1,
        caseCount: 1,
        protestedCaseCount: 1,
        filingCounts: { comments: 1, hearingRequests: 0, publicMeetingRequests: 0 },
        proceduralPressureScore: 1,
        latestFiledAt: "2026-04-02",
        concentration: {
          permitShareStatewide: 0.33,
          caseShareStatewide: 0.5,
          protestedCaseShareStatewide: 0.5,
          proceduralPressureShareStatewide: 0.09,
          countyPermitConcentration: 1,
          countyCaseConcentration: 1,
          topPermitCounty: { county: "Travis County", share: 1, permitCount: 1 },
          topCaseCounty: { county: "Travis County", share: 1, caseCount: 1 },
        },
        counties: [
          {
            county: "Travis County",
            countySlug: "travis-county",
            permitCount: 1,
            caseCount: 1,
            protestedCaseCount: 1,
            filingCounts: { comments: 1, hearingRequests: 0, publicMeetingRequests: 0 },
            proceduralPressureScore: 1,
            latestFiledAt: "2026-04-02",
          },
        ],
        permits: [],
        cases: [],
      },
    ],
  })),
}));

function analyticsFile(filename: string) {
  if (filename.includes("county-history.json")) {
    return JSON.stringify({
      generatedAt: "2026-05-09T22:08:46.795Z",
      provenance: {
        method:
          "County analytics are derived from committed SDWIS, ACS county population, surface-water-quality, and TWDB hydrology snapshots. History appends one real snapshot per run and never fabricates prior periods.",
        notes: [
          "countyRiskScore is the statewide 0-100 normalization of summed SDWIS DWRS raw scores per county.",
          "pressureScore is the statewide 0-100 normalization of impaired segment counts per 100k residents when population is available; otherwise it falls back to raw impaired segment count.",
        ],
      },
      counties: [
        {
          county: { name: "Travis County", slug: "travis-county" },
          latestSnapshotAt: "2026-05-09T22:08:46.795Z",
          snapshots: [
            {
              snapshotAt: "2026-05-09T22:05:56.932Z",
              metrics: {
                countyRiskScore: 9.72,
                pressureScore: 0.43,
                systemCount: 28,
                violationCount: 136,
                impairedSegmentCount: 5,
                affectedPopulation: 146954,
                population: 1300000,
                hydrologyLayerHitCount: 3,
              },
              ranks: { risk: 2, pressure: 152 },
              highlights: {
                topSystems: [
                  { pwsId: "TX2270014", pwsName: "CITY OF PFLUGERVILLE", score: 5.01, violationCount: 10 },
                  { pwsId: "TX2270033", pwsName: "MANVILLE WSC", score: 2.87, violationCount: 7 },
                ],
              },
            },
            {
              snapshotAt: "2026-05-09T22:08:46.795Z",
              metrics: {
                countyRiskScore: 9.72,
                pressureScore: 0.43,
                systemCount: 28,
                violationCount: 136,
                impairedSegmentCount: 5,
                affectedPopulation: 146954,
                population: 1300000,
                hydrologyLayerHitCount: 3,
              },
              ranks: { risk: 2, pressure: 152 },
              highlights: {
                topSystems: [
                  { pwsId: "TX2270014", pwsName: "CITY OF PFLUGERVILLE", score: 5.01, violationCount: 10 },
                  { pwsId: "TX2270033", pwsName: "MANVILLE WSC", score: 2.87, violationCount: 7 },
                ],
              },
            },
          ],
        },
        {
          county: { name: "Other County", slug: "other-county" },
          latestSnapshotAt: "2026-05-09T22:08:46.795Z",
          snapshots: [
            {
              snapshotAt: "2026-05-09T22:08:46.795Z",
              metrics: {
                countyRiskScore: 1,
                pressureScore: 1,
                systemCount: 1,
                violationCount: 1,
                impairedSegmentCount: 1,
                affectedPopulation: 1,
                population: 1,
                hydrologyLayerHitCount: 1,
              },
              ranks: { risk: 1, pressure: 1 },
            },
          ],
        },
      ],
    });
  }

  if (filename.includes("county-movers.json")) {
    return JSON.stringify({
      notes: ["Rank deltas compare the newest county-history snapshot against the immediately preceding real snapshot."],
      movers: [
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
    return JSON.stringify({
      generatedAt: "2026-05-09T22:08:46.795Z",
      notes: [
        "Both axes are normalized to a 0-100 statewide range for stable chart consumption.",
        "Quadrants use median splits from the newest real county-history snapshot.",
      ],
      points: [
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
      ],
    });
  }

  throw new Error(`Unexpected file request: ${filename}`);
}

describe("county intelligence page", () => {
  beforeEach(() => {
    vi.resetModules();
    readFileMock.mockReset();
  });

  it("renders county analytics blocks from committed Wave 1 artifacts", async () => {
    readFileMock.mockImplementation(async (filename: string) => analyticsFile(filename));

    const pageModule = await import("@/app/counties/[slug]/page");
    const page = await pageModule.default({ params: Promise.resolve({ slug: "travis-county" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("County workspace");
    expect(text).toContain("Travis County county intelligence");
    expect(text).toContain("Add to watchlist");
    expect(text).toContain('id="watchlist-county:travis-county"');
    expect(text).toContain('href="/watchlists"');
    expect(text).toContain("Texas Water Development Board");
    expect(text).toContain("Hydrologic Unit Code");
    expect(text).toContain('title="Texas Water Development Board"');
    expect(text).toContain('title="Hydrologic Unit Code"');
    expect(text).toContain('href=\"/permits?county=travis-county\"');
    expect(text).toContain('href=\"/water/counties/travis-county\"');
    expect(text).toContain('href=\"/counties/tom-green-county\"');
    expect(text).toContain('href=\"/counties/trinity-county\"');
    expect(text).toContain("Composite score");
    expect(text).toContain("91.20");
    expect(text).toContain("Colorado");
    expect(text).toContain("Centroid overlap only.");
    expect(text).toContain("Analytics snapshot");
    expect(text).toContain("Risk trend from committed snapshots");
    expect(text).toContain("What changed and why");
    expect(text).toContain("Driver decomposition");
    expect(text).toContain("Top systems behind the county signal");
    expect(text).toContain("Operators visible in this county snapshot");
    expect(text).toContain("Alpha Water LLC");
    expect(text).toContain("Beta Utility District");
    expect(text).toContain("1 permits · 1 cases · 10 procedural pressure in Travis County");
    expect(text).toContain('id="watchlist-operator:alpha-water-llc"');
    expect(text).toContain('href=\"/operators/alpha-water-llc\"');
    expect(text).toContain('href=\"/operators/beta-utility-district\"');
    expect(text).toContain("Move from county stress to named operators");
    expect(text).toContain("Lower pressure + high risk");
    expect(text).toContain("CITY OF PFLUGERVILLE");
    expect(text).toContain("steady across the latest committed comparison window");
    expect(text).toContain("never fabricates prior periods");
    expect(text).toContain("Both axes are normalized to a 0-100 statewide range for stable chart consumption.");
  });

  it("degrades gracefully when committed county history is unavailable", async () => {
    readFileMock.mockImplementation(async (filename: string) => {
      if (filename.includes("county-history.json")) {
        return JSON.stringify({
          generatedAt: "2026-05-09T22:08:46.795Z",
          provenance: { method: "History exists, but not for Travis County.", notes: [] },
          counties: [],
        });
      }

      if (filename.includes("county-movers.json")) {
        return JSON.stringify({ notes: [], movers: [] });
      }

      if (filename.includes("pressure-risk-scatter.json")) {
        return JSON.stringify({ generatedAt: "2026-05-09T22:08:46.795Z", notes: [], points: [] });
      }

      throw new Error(`Unexpected file request: ${filename}`);
    });

    const pageModule = await import("@/app/counties/[slug]/page");
    const page = await pageModule.default({ params: Promise.resolve({ slug: "travis-county" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("Trend panel waiting on committed history");
    expect(text).toContain("What this means");
    expect(text).toContain("Trend language appears once the committed analytics cache includes this county");
    expect(text).toContain("No ranked driver decomposition was available beyond the current highlight list.");
    expect(text).toContain("No top-system highlights were available in the committed county-history record for this county.");
  });
});
