import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const readFileMock = vi.fn();

vi.mock("fs/promises", () => ({
  readFile: (...args: unknown[]) => readFileMock(...args),
}));

function analyticsFile(filename: string) {
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

describe("statewide analytics page", () => {
  beforeEach(() => {
    vi.resetModules();
    readFileMock.mockReset();
  });

  it("renders statewide movers, scatter analysis, and provenance cards from Wave 1 artifacts", async () => {
    readFileMock.mockImplementation(async (filename: string) => analyticsFile(filename));

    const pageModule = await import("@/app/analytics/page");
    const page = await pageModule.default();
    const text = renderToStaticMarkup(page);

    expect(text).toContain("Texas statewide analytics terminal");
    expect(text).toContain("County workspace");
    expect(text).toContain("Screening lanes");
    expect(text).toContain("Counties to open next");
    expect(text).toContain('href="/counties/harris-county"');
    expect(text).toContain('href="/counties/orange-county"');
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

    const pageModule = await import("@/app/analytics/page");
    const page = await pageModule.default();
    const text = renderToStaticMarkup(page);

    expect(text).toContain("Texas statewide analytics terminal");
    expect(text).toContain("Wave 1 comparison snapshots are not available yet.");
    expect(text).toContain("Wave 1 did not produce enough mover rows for screening lanes yet.");
    expect(text).toContain("Movers unavailable");
    expect(text).toContain("Pressure outlier bars will appear when pressure-risk-scatter.json contains points.");
    expect(text).toContain("The statewide scatter will appear once pressure-risk-scatter.json is committed.");
    expect(text).toContain("No source-freshness artifact was available.");
  });
});
