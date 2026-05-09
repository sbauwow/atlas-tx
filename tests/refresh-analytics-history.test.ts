import { describe, expect, it } from "vitest";

import {
  buildCountyHistoryArtifact,
  buildCountyMoversArtifact,
  buildPressureRiskScatterArtifact,
  buildSourceFreshnessArtifact,
  mergeCountyHistory,
  writeAnalyticsArtifacts,
  type CountyHistoryArtifact,
} from "../scripts/refresh-analytics-history";
import type { SdwisSnapshot } from "@/lib/datasets/sdwis";
import type { SurfaceWaterQualitySnapshot } from "@/lib/datasets/surface-water-quality";
import type { TwdbHydrologySnapshot } from "@/lib/datasets/twdb-hydrology";

function buildInput(overrides?: Partial<Parameters<typeof buildCountyHistoryArtifact>[0]>): Parameters<typeof buildCountyHistoryArtifact>[0] {
  const sdwisSnapshot: SdwisSnapshot = {
    generatedAt: "2026-05-09T01:50:21.429Z",
    source: "https://data.epa.gov/efservice",
    filter: {
      primacyAgencyCode: "TX",
      healthBasedOnly: true,
      since: "2023-04-01",
    },
    caveats: ["fixture"],
    rowCount: 3,
    rows: [
      {
        pwsid: "TX001",
        pwsName: "Alpha Water",
        county: "Alpha County",
        populationServed: 1000,
        violationId: "1",
        violationCode: "43",
        violationCategory: "TT",
        isHealthBased: true,
        contaminantCode: "0300",
        complianceStatusCode: "R",
        complPerBeginDate: "2026-05-01",
        complPerEndDate: "2026-05-31",
        pwsTypeCode: "CWS",
        ruleCode: "122",
        ruleGroupCode: "100",
        publicNotificationTier: 1,
      },
      {
        pwsid: "TX001",
        pwsName: "Alpha Water",
        county: "Alpha County",
        populationServed: 1000,
        violationId: "2",
        violationCode: "43",
        violationCategory: "TT",
        isHealthBased: true,
        contaminantCode: "0300",
        complianceStatusCode: "R",
        complPerBeginDate: "2026-05-10",
        complPerEndDate: "2026-05-31",
        pwsTypeCode: "CWS",
        ruleCode: "122",
        ruleGroupCode: "100",
        publicNotificationTier: 1,
      },
      {
        pwsid: "TX002",
        pwsName: "Bravo Utility",
        county: "Bravo County",
        populationServed: 500,
        violationId: "3",
        violationCode: "45",
        violationCategory: "TT",
        isHealthBased: true,
        contaminantCode: "0300",
        complianceStatusCode: "R",
        complPerBeginDate: "2026-01-15",
        complPerEndDate: "2026-02-15",
        pwsTypeCode: "CWS",
        ruleCode: "122",
        ruleGroupCode: "100",
        publicNotificationTier: 3,
      },
    ],
  };

  const acsSnapshot = {
    generatedAt: "2026-05-08T00:00:00.000Z",
    source: "https://api.census.gov/data/2023/acs/acs5",
    rows: [
      { NAME: "Alpha County, Texas", B01003_001E: "100000" },
      { NAME: "Bravo County, Texas", B01003_001E: "50000" },
    ],
  };

  const surfaceWaterSnapshot: SurfaceWaterQualitySnapshot = {
    generatedAt: "2026-05-09T04:56:55.042Z",
    source: "https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer",
    rows: [
      {
        layerId: 8,
        layerName: "Stream Segments",
        segmentId: "A1",
        segmentName: "Alpha Segment 1",
        basinName: "Alpha Basin",
        segmentClass: "Classified",
        segmentType: "Freshwater Stream",
        countyName: "Alpha County",
        size: 4,
        sizeUnit: "Miles",
        assessmentYear: 2024,
        isImpaired: true,
        impairmentFlags: {
          aquaticLife: false,
          contactRecreation: true,
          generalUse: false,
          fishConsumption: false,
          publicWaterSupply: true,
          oysterWaters: false,
        },
        sourceUrl: "https://example.test/alpha-1",
      },
      {
        layerId: 8,
        layerName: "Stream Segments",
        segmentId: "A2",
        segmentName: "Alpha Segment 2",
        basinName: "Alpha Basin",
        segmentClass: "Classified",
        segmentType: "Freshwater Stream",
        countyName: "Alpha County",
        size: 5,
        sizeUnit: "Miles",
        assessmentYear: 2024,
        isImpaired: true,
        impairmentFlags: {
          aquaticLife: true,
          contactRecreation: false,
          generalUse: false,
          fishConsumption: false,
          publicWaterSupply: false,
          oysterWaters: false,
        },
        sourceUrl: "https://example.test/alpha-2",
      },
      {
        layerId: 7,
        layerName: "Reservoir Segments",
        segmentId: "B1",
        segmentName: "Bravo Reservoir",
        basinName: "Bravo Basin",
        segmentClass: "Classified",
        segmentType: "Reservoir",
        countyName: "Bravo County",
        size: 6,
        sizeUnit: "Acres",
        assessmentYear: 2024,
        isImpaired: false,
        impairmentFlags: {
          aquaticLife: false,
          contactRecreation: false,
          generalUse: false,
          fishConsumption: false,
          publicWaterSupply: false,
          oysterWaters: false,
        },
        sourceUrl: "https://example.test/bravo-1",
      },
    ],
  };

  const twdbHydrologySnapshot: TwdbHydrologySnapshot = {
    generatedAt: "2026-05-09T04:06:07.779Z",
    source: "TWDB GIS downloads",
    rows: [],
  };

  return {
    generatedAt: "2026-05-09T16:52:00.000Z",
    sdwisSnapshot,
    acsSnapshot,
    surfaceWaterSnapshot,
    twdbHydrologySnapshot,
    previousHistory: null,
    ...overrides,
  };
}

describe("refresh-analytics-history", () => {
  it("builds an initial county history artifact from committed snapshot inputs", () => {
    const artifact = buildCountyHistoryArtifact(buildInput());

    expect(artifact.artifact).toBe("county-history");
    expect(artifact.historyLength).toBe(1);
    expect(artifact.provenance.sources.map((source) => source.sourceId)).toEqual([
      "sdwis",
      "acs-county",
      "surface-water-quality",
      "twdb-hydrology",
    ]);

    const alpha = artifact.counties.find((county) => county.county.slug === "alpha-county");
    const bravo = artifact.counties.find((county) => county.county.slug === "bravo-county");

    expect(alpha?.snapshots[0]).toMatchObject({
      metrics: {
        countyRawRisk: 0.8,
        violationCount: 2,
        impairedSegmentCount: 2,
        impairedPublicWaterSupplySegmentCount: 1,
      },
      ranks: {
        risk: 1,
        pressure: 1,
      },
    });
    expect(alpha?.snapshots[0]?.highlights.topSystems[0]).toMatchObject({
      pwsId: "TX001",
      pwsName: "Alpha Water",
      violationCount: 2,
    });
    expect(bravo?.snapshots[0]).toMatchObject({
      metrics: {
        countyRawRisk: 0.05,
        violationCount: 1,
        impairedSegmentCount: 0,
      },
      ranks: {
        risk: 2,
        pressure: 2,
      },
    });
  });

  it("appends snapshots across runs and derives movers/scatter/freshness artifacts", () => {
    const firstHistory = buildCountyHistoryArtifact(buildInput());
    const secondHistory = buildCountyHistoryArtifact(
      buildInput({
        generatedAt: "2026-05-10T16:52:00.000Z",
        previousHistory: firstHistory,
        sdwisSnapshot: {
          ...buildInput().sdwisSnapshot,
          rows: [
            ...buildInput().sdwisSnapshot.rows,
            {
              pwsid: "TX002",
              pwsName: "Bravo Utility",
              county: "Bravo County",
              populationServed: 10000,
              violationId: "4",
              violationCode: "45",
              violationCategory: "TT",
              isHealthBased: true,
              contaminantCode: "0300",
              complianceStatusCode: "R",
              complPerBeginDate: "2026-05-09",
              complPerEndDate: "2026-05-31",
              pwsTypeCode: "CWS",
              ruleCode: "122",
              ruleGroupCode: "100",
              publicNotificationTier: 1,
            },
            {
              pwsid: "TX002",
              pwsName: "Bravo Utility",
              county: "Bravo County",
              populationServed: 500,
              violationId: "5",
              violationCode: "45",
              violationCategory: "TT",
              isHealthBased: true,
              contaminantCode: "0300",
              complianceStatusCode: "R",
              complPerBeginDate: "2026-05-08",
              complPerEndDate: "2026-05-31",
              pwsTypeCode: "CWS",
              ruleCode: "122",
              ruleGroupCode: "100",
              publicNotificationTier: 1,
            },
            {
              pwsid: "TX002",
              pwsName: "Bravo Utility",
              county: "Bravo County",
              populationServed: 500,
              violationId: "6",
              violationCode: "45",
              violationCategory: "TT",
              isHealthBased: true,
              contaminantCode: "0300",
              complianceStatusCode: "R",
              complPerBeginDate: "2026-05-07",
              complPerEndDate: "2026-05-31",
              pwsTypeCode: "CWS",
              ruleCode: "122",
              ruleGroupCode: "100",
              publicNotificationTier: 1,
            },
          ],
          rowCount: 6,
        },
      }),
    );

    const merged = mergeCountyHistory(firstHistory, secondHistory.counties);
    expect(merged.find((county) => county.county.slug === "alpha-county")?.snapshots).toHaveLength(2);
    expect(merged.find((county) => county.county.slug === "bravo-county")?.snapshots).toHaveLength(2);

    const movers = buildCountyMoversArtifact(secondHistory);
    expect(movers.baselineSnapshotAt).toBe("2026-05-09T16:52:00.000Z");
    expect(movers.comparisonSnapshotAt).toBe("2026-05-10T16:52:00.000Z");
    const bravoMover = movers.movers.find((entry) => entry.county.slug === "bravo-county");
    expect(bravoMover).toMatchObject({
      county: { slug: "bravo-county" },
      movement: "up",
      currentRank: 1,
      previousRank: 2,
      rankDelta: 1,
    });

    const scatter = buildPressureRiskScatterArtifact(secondHistory);
    expect(scatter.axes).toEqual({ x: "pressureScore", y: "countyRiskScore" });
    expect(scatter.points.find((point) => point.county.slug === "bravo-county")?.quadrant).toBe("lower-pressure-high-risk");

    const freshness = buildSourceFreshnessArtifact(secondHistory);
    expect(freshness.sources.find((source) => source.sourceId === "sdwis")).toMatchObject({
      ageDays: 1.63,
      status: "fresh",
    });
  });

  it("writes the four analytics artifacts under the requested base directory", async () => {
    const history = buildCountyHistoryArtifact(buildInput());
    const writes: Array<{ path: string; content: string }> = [];

    await writeAnalyticsArtifacts(
      {
        countyHistory: history,
        countyMovers: buildCountyMoversArtifact(history),
        pressureRiskScatter: buildPressureRiskScatterArtifact(history),
        sourceFreshness: buildSourceFreshnessArtifact(history),
      },
      {
        baseDir: "public/cache/analytics",
        writeFile: async (target, content) => {
          writes.push({ path: target, content });
        },
      },
    );

    expect(writes.map((entry) => entry.path)).toEqual([
      "public/cache/analytics/county-history.json",
      "public/cache/analytics/county-movers.json",
      "public/cache/analytics/pressure-risk-scatter.json",
      "public/cache/analytics/source-freshness.json",
    ]);
    expect(JSON.parse(writes[0]?.content ?? "{}") as CountyHistoryArtifact).toMatchObject({
      artifact: "county-history",
      counties: [
        { county: { slug: "alpha-county" } },
        { county: { slug: "bravo-county" } },
      ],
    });
  });
});
