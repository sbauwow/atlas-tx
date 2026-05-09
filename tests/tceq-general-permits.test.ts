import { describe, expect, it } from "vitest";
import { normalizeGeneralPermitRecord, summarizeGeneralPermitsByCounty } from "@/lib/water/tceq-general-permits";

const records = [
  {
    permit_no: "TXG123",
    permit_status: "ACTIVE",
    permit_type: "GENERAL PERMIT AUTHORIZATION",
    site_name: "Alpha Ranch",
    county_name: "TRAVIS",
    latitude: "30.25",
    longitude: "-97.75",
  },
  {
    permit_no: "TXG456",
    permit_status: "PENDING",
    permit_type: "GENERAL PERMIT AUTHORIZATION",
    site_name: "Beta Ranch",
    county_name: "TRAVIS",
    latitude: "30.20",
    longitude: "-97.70",
  },
];

describe("TCEQ general water permits", () => {
  it("normalizes permit records for county use", () => {
    expect(normalizeGeneralPermitRecord(records[0])).toEqual({
      sourceId: "tceq-general-water-permits",
      permitNumber: "TXG123",
      countyName: "Travis County",
      permitStatus: "ACTIVE",
      permitType: "GENERAL PERMIT AUTHORIZATION",
      siteName: "Alpha Ranch",
      latitude: 30.25,
      longitude: -97.75,
      raw: records[0],
    });
  });

  it("summarizes permit counts by county", () => {
    const summary = summarizeGeneralPermitsByCounty(records.map(normalizeGeneralPermitRecord));
    expect(summary.get("travis-county")).toEqual({ count: 2, countyName: "Travis County" });
  });
});
