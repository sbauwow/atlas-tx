import { describe, expect, it } from "vitest";
import {
  filterLcraLakeLevelsBySite,
  filterLcraStageFlowBySite,
  normalizeLcraLakeLevelReadings,
  normalizeLcraStageFlowReadings,
} from "@/lib/water/lcra-hydromet";

describe("lcra hydromet", () => {
  it("normalizes stage-flow readings", () => {
    const readings = normalizeLcraStageFlowReadings([
      {
        siteNumber: 4558,
        location: "Colorado River at Austin",
        dateTime: "2026-05-09T04:40:11Z",
        stage: 15.04,
        flow: 1005,
        bankfull: 25,
        floodStage: 33,
      },
    ]);

    expect(readings).toEqual([
      {
        sourceId: "lcra-hydromet-stageflow",
        siteNumber: "4558",
        stationName: "Colorado River at Austin",
        observedAt: "2026-05-09T04:40:11Z",
        stageFeet: 15.04,
        flowCfs: 1005,
        bankfullFeet: 25,
        floodStageFeet: 33,
        raw: {
          siteNumber: 4558,
          location: "Colorado River at Austin",
          dateTime: "2026-05-09T04:40:11Z",
          stage: 15.04,
          flow: 1005,
          bankfull: 25,
          floodStage: 33,
        },
      },
    ]);
  });

  it("normalizes lake-level readings and filters by site number", () => {
    const readings = normalizeLcraLakeLevelReadings([
      {
        siteNumber: 3963,
        location: "Mansfield Dam",
        dateTime: "2026-05-09T04:40:06Z",
        elevation: 664.13,
      },
      {
        siteNumber: 3999,
        location: "Tom Miller Dam",
        dateTime: "2026-05-09T04:40:07Z",
        elevation: 492.14,
      },
    ]);

    expect(filterLcraLakeLevelsBySite(readings, "3963")).toEqual([readings[0]]);
    expect(filterLcraStageFlowBySite([
      {
        sourceId: "lcra-hydromet-stageflow",
        siteNumber: "4558",
        stationName: "Colorado River at Austin",
        observedAt: "2026-05-09T04:40:11Z",
        raw: {},
      },
    ], "4558")).toHaveLength(1);
    expect(readings[0]).toMatchObject({
      sourceId: "lcra-hydromet-lakelevels",
      siteNumber: "3963",
      stationName: "Mansfield Dam",
      observedAt: "2026-05-09T04:40:06Z",
      elevationFeet: 664.13,
    });
  });
});
