import { describe, expect, it } from "vitest";
import {
  filterLcraArrpLandPermitsByCounty,
  filterLcraArrpOutfallsByCounty,
  normalizeLcraArrpLandPermitRecord,
  normalizeLcraArrpOutfallRecord,
} from "@/lib/water/lcra-arrp";

describe("LCRA ARRP", () => {
  it("normalizes outfall records for county use", () => {
    const raw = {
      objectid: 386069,
      permitNum: "11332-001",
      outfall: "001",
      permittee: "AQUASOURCE UTILITY INC",
      status: "Current",
      county: "BURNET",
      latDd: 30.58973587,
      longDd: -98.40366235,
      segment: "1406",
      basin: "14",
    };

    expect(normalizeLcraArrpOutfallRecord(raw)).toEqual({
      sourceId: "lcra-arrp-outfalls",
      recordId: "386069",
      permitNumber: "11332-001",
      countyName: "Burnet County",
      permitteeName: "AQUASOURCE UTILITY INC",
      status: "Current",
      segmentId: "1406",
      basinId: "14",
      outfallNumber: "001",
      latitude: 30.58973587,
      longitude: -98.40366235,
      raw,
    });
  });

  it("normalizes land permits and filters both datasets by county slug", () => {
    const land = [
      normalizeLcraArrpLandPermitRecord({
        recordId: 231,
        permitNum: "TXG920613",
        permittee: "GUY GOEN & SONS INC",
        status: "Current",
        county: "GAINES",
        latDd: 32.547888,
        longDd: -102.900468,
        segment: "1412",
        basin: "14",
        permittype: "GP-C",
        revtype: "WW",
      }),
      normalizeLcraArrpLandPermitRecord({
        recordId: 702,
        permitNum: "04674-000",
        permittee: "SYNAGRO OF TEXAS-CDR INC",
        status: "Current",
        county: "COLORADO",
        latDd: 29.592099,
        longDd: -96.416609,
        segment: "1402",
        basin: "14",
        permittype: "SP",
        revtype: "WWTP",
      }),
    ];

    const outfalls = [
      normalizeLcraArrpOutfallRecord({
        objectid: 1,
        permitNum: "A",
        permittee: "Alpha",
        status: "Current",
        county: "COLORADO",
        latDd: 29.6,
        longDd: -96.4,
      }),
      normalizeLcraArrpOutfallRecord({
        objectid: 2,
        permitNum: "B",
        permittee: "Beta",
        status: "Current",
        county: "TRAVIS",
        latDd: 30.3,
        longDd: -97.8,
      }),
    ];

    expect(filterLcraArrpLandPermitsByCounty(land, "colorado-county")).toEqual([land[1]]);
    expect(filterLcraArrpOutfallsByCounty(outfalls, "travis-county")).toEqual([outfalls[1]]);
    expect(land[0]).toMatchObject({
      sourceId: "lcra-arrp-land-permits",
      recordId: "231",
      countyName: "Gaines County",
      permitType: "GP-C",
      reviewType: "WW",
    });
  });
});
