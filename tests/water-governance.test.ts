import { describe, expect, it } from "vitest";
import { normalizeWaterDistrictRecord, normalizeWaterUtilityRecord, summarizeGovernanceByCounty } from "@/lib/water/water-governance";

const districtRow = {
  county: "TRAVIS",
  district_number: "227001",
  distict_name: "TRAVIS WCID 1",
  district_type: "Water Control and Improvement District",
  activity_status: "Active",
  district_city: "AUSTIN",
};

const iouRow = {
  ccn_no: "10118",
  utility_name: "YAUPON COVE WATER",
  primary_county: "TRAVIS",
  all_counties: "TRAVIS, WILLIAMSON",
  city: "AUSTIN",
};

describe("water governance adapter", () => {
  it("normalizes water district records", () => {
    expect(normalizeWaterDistrictRecord(districtRow)).toEqual({
      sourceId: "tceq-water-districts",
      entityId: "227001",
      countyName: "Travis County",
      entityName: "TRAVIS WCID 1",
      entityType: "Water Control and Improvement District",
      activityStatus: "Active",
      city: "AUSTIN",
      raw: districtRow,
    });
  });

  it("normalizes utility records and summarizes governance counts by county", () => {
    const district = normalizeWaterDistrictRecord(districtRow);
    const utility = normalizeWaterUtilityRecord(iouRow, "puct-water-iou");
    expect(utility).toEqual({
      sourceId: "puct-water-iou",
      entityId: "10118",
      countyName: "Travis County",
      entityName: "YAUPON COVE WATER",
      entityType: "Investor-Owned Utility",
      activityStatus: null,
      city: "AUSTIN",
      raw: iouRow,
    });

    const summary = summarizeGovernanceByCounty([district, utility]);
    expect(summary.get("travis-county")).toEqual({
      countyName: "Travis County",
      districtCount: 1,
      utilityCount: 1,
    });
  });
});
