import { describe, expect, it } from "vitest";

import {
  buildCountyInfoIndex,
  buildCountyMonthSkeleton,
  aggregateSdwisMonthlyOutcomes,
  summarizeOverflowRows,
  summarizeImpairedSegmentsByCounty,
  summarizeHydrologyContextScores,
} from "../experiments/build_county_month_water_risk_panel";
import type { SdwisRow } from "@/lib/datasets/sdwis";
import type { SurfaceWaterQualityRow } from "@/lib/datasets/surface-water-quality";
import type { TwdbHydrologyRow } from "@/lib/datasets/twdb-hydrology";

describe("build_county_month_water_risk_panel helpers", () => {
  it("builds a county-month skeleton across the requested monthly window", () => {
    const counties = buildCountyInfoIndex().slice(0, 2);
    const rows = buildCountyMonthSkeleton(counties, "2020-01", "2020-03");

    expect(rows).toHaveLength(6);
    expect(rows[0]).toMatchObject({
      county_fips: counties[0]?.county_fips,
      county_name: counties[0]?.county_name,
      year_month: "2020-01",
    });
    expect(rows.at(-1)).toMatchObject({
      county_fips: counties[1]?.county_fips,
      county_name: counties[1]?.county_name,
      year_month: "2020-03",
    });
  });

  it("dedupes SDWIS rows by event key within county-month", () => {
    const rows: SdwisRow[] = [
      {
        pwsid: "TX001",
        pwsName: "System A",
        county: "Bell County",
        populationServed: 1000,
        violationId: "1",
        violationCode: "A",
        violationCategory: "TT",
        isHealthBased: true,
        contaminantCode: null,
        complianceStatusCode: null,
        complPerBeginDate: "2024-01-10",
        complPerEndDate: null,
        pwsTypeCode: null,
        ruleCode: null,
        ruleGroupCode: null,
        publicNotificationTier: null,
      },
      {
        pwsid: "TX001",
        pwsName: "System A",
        county: "BELL",
        populationServed: 1000,
        violationId: "1",
        violationCode: "A",
        violationCategory: "TT",
        isHealthBased: true,
        contaminantCode: null,
        complianceStatusCode: null,
        complPerBeginDate: "2024-01-10",
        complPerEndDate: null,
        pwsTypeCode: null,
        ruleCode: null,
        ruleGroupCode: null,
        publicNotificationTier: null,
      },
      {
        pwsid: "TX001",
        pwsName: "System A",
        county: "Bell County",
        populationServed: 1000,
        violationId: "2",
        violationCode: "B",
        violationCategory: "TT",
        isHealthBased: true,
        contaminantCode: null,
        complianceStatusCode: null,
        complPerBeginDate: "2024-01-20",
        complPerEndDate: null,
        pwsTypeCode: null,
        ruleCode: null,
        ruleGroupCode: null,
        publicNotificationTier: null,
      },
    ];

    const monthly = aggregateSdwisMonthlyOutcomes(rows);

    expect(monthly.get("Bell County__2024-01")).toEqual({
      sdwis_event_any: 1,
      sdwis_event_count: 2,
    });
  });

  it("summarizes overflow counts, gallons, and severe spill flags", () => {
    const summary = summarizeOverflowRows([
      {
        county: "BELL",
        start_date: "2024-01-15T00:00:00.000",
        amount: "100",
        amount_unit: "GALLONS",
        receiving_water_body: "NO WATER BODY PROVIDED",
      },
      {
        county: "Bell County",
        start_date: "2024-01-20T00:00:00.000",
        amount: "2",
        amount_unit: "MGD",
        receiving_water_body: "Leon River",
      },
      {
        county: "Bell County",
        start_date: "2024-02-01T00:00:00.000",
        amount: "50",
        amount_unit: "GALLONS",
        receiving_water_body: "Lampasas River",
      },
    ]);

    expect(summary.monthly.get("Bell County__2024-01")).toMatchObject({
      overflow_any: 1,
      overflow_count: 2,
      overflow_gallons_sum: 2_000_100,
      overflow_reaches_water_count: 1,
    });
    expect(summary.severeThresholdGallons).toBeGreaterThan(0);
  });

  it("counts distinct impaired segments by county", () => {
    const rows: SurfaceWaterQualityRow[] = [
      {
        layerId: 7,
        layerName: "Reservoir Segments",
        segmentId: "0102",
        segmentName: "A",
        basinName: null,
        segmentClass: null,
        segmentType: null,
        countyName: "Potter County",
        size: null,
        sizeUnit: null,
        assessmentYear: null,
        isImpaired: true,
        impairmentFlags: {
          aquaticLife: false,
          contactRecreation: false,
          generalUse: true,
          fishConsumption: false,
          publicWaterSupply: false,
          oysterWaters: false,
        },
        sourceUrl: "x",
      },
      {
        layerId: 8,
        layerName: "Stream Segments",
        segmentId: "0102",
        segmentName: "A-duplicate",
        basinName: null,
        segmentClass: null,
        segmentType: null,
        countyName: "POTTER",
        size: null,
        sizeUnit: null,
        assessmentYear: null,
        isImpaired: true,
        impairmentFlags: {
          aquaticLife: false,
          contactRecreation: true,
          generalUse: false,
          fishConsumption: false,
          publicWaterSupply: false,
          oysterWaters: false,
        },
        sourceUrl: "x",
      },
      {
        layerId: 8,
        layerName: "Stream Segments",
        segmentId: "0304",
        segmentName: "B",
        basinName: null,
        segmentClass: null,
        segmentType: null,
        countyName: "Bowie County",
        size: null,
        sizeUnit: null,
        assessmentYear: null,
        isImpaired: false,
        impairmentFlags: {
          aquaticLife: false,
          contactRecreation: false,
          generalUse: false,
          fishConsumption: false,
          publicWaterSupply: false,
          oysterWaters: false,
        },
        sourceUrl: "x",
      },
    ];

    const counts = summarizeImpairedSegmentsByCounty(rows);

    expect(counts.get("Potter County")).toBe(1);
    expect(counts.has("Bowie County")).toBe(false);
  });

  it("scores hydrology context by centroid/bbox overlap count", () => {
    const counties = [buildCountyInfoIndex().find((row) => row.county_name === "Anderson County")!];
    const hydrologyRows: TwdbHydrologyRow[] = [
      {
        layerId: "twdb-major-aquifers",
        layerName: "Major Aquifers",
        primaryCode: null,
        name: null,
        basin: null,
        region: null,
        subregion: null,
        bbox: [-96, 31, -95, 32],
        geometryType: "polygon",
        sourceUrl: "x",
      },
      {
        layerId: "twdb-huc8",
        layerName: "HUC8",
        primaryCode: null,
        name: null,
        basin: null,
        region: null,
        subregion: null,
        bbox: [-100, 20, -99, 21],
        geometryType: "polygon",
        sourceUrl: "y",
      },
    ];

    const scores = summarizeHydrologyContextScores(hydrologyRows, counties);

    expect(scores.get("Anderson County")).toBe(1);
  });
});
