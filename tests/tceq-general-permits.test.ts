import { describe, expect, it } from "vitest";
import {
  classifyGeneralPermitLane,
  filterOilAndGasExtractionPermits,
  filterPetroleumBulkStationPermits,
  normalizeGeneralPermitRecord,
  summarizeGeneralPermitsByCounty,
  summarizeOilAndGasExtractionPermitsByCounty,
  summarizePetroleumBulkStationPermitsByCounty,
} from "@/lib/water/tceq-general-permits";

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
  it("classifies permit lanes by permit number prefix", () => {
    expect(classifyGeneralPermitLane("TXG310001")).toBe("oil-gas-extraction");
    expect(classifyGeneralPermitLane("TXG340001")).toBe("petroleum-bulk-stations");
    expect(classifyGeneralPermitLane("TXG560001")).toBe("other-general-permit");
  });

  it("normalizes permit records for county use", () => {
    expect(normalizeGeneralPermitRecord(records[0])).toEqual({
      sourceId: "tceq-general-water-permits",
      permitNumber: "TXG123",
      countyName: "Travis County",
      permitStatus: "ACTIVE",
      permitType: "GENERAL PERMIT AUTHORIZATION",
      permitLane: "other-general-permit",
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

  it("filters and summarizes the oil and gas extraction authorizations", () => {
    const normalized = [
      normalizeGeneralPermitRecord({ permit_no: "TXG310001", permit_status: "ACTIVE", permit_type: "GENERAL", county_name: "FAYETTE", site_name: "Pad A" }),
      normalizeGeneralPermitRecord({ permit_no: "TXG310045", permit_status: "PENDING", permit_type: "GENERAL", county_name: "FAYETTE", site_name: "Pad B" }),
      normalizeGeneralPermitRecord({ permit_no: "TXG340100", permit_status: "ACTIVE", permit_type: "GENERAL", county_name: "HARRIS", site_name: "Terminal" }),
      normalizeGeneralPermitRecord({ permit_no: "TXG560010", permit_status: "ACTIVE", permit_type: "GENERAL", county_name: "TRAVIS", site_name: "Outfall" }),
    ];
    const oilAndGas = filterOilAndGasExtractionPermits(normalized);
    const petroleumBulk = filterPetroleumBulkStationPermits(normalized);

    expect(oilAndGas.map((record) => record.permitNumber)).toEqual(["TXG310001", "TXG310045"]);
    expect(summarizeOilAndGasExtractionPermitsByCounty(oilAndGas).get("fayette-county")).toEqual({ count: 2, countyName: "Fayette County" });
    expect(petroleumBulk.map((record) => record.permitNumber)).toEqual(["TXG340100"]);
    expect(summarizePetroleumBulkStationPermitsByCounty(normalized).get("harris-county")).toEqual({ count: 1, countyName: "Harris County" });
  });
});
