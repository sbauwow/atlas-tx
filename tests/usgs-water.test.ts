import { describe, expect, it } from "vitest";
import { filterGaugesForCounty, parseUsgsRdbText } from "@/lib/water/usgs";

const sample = `# comment\nagency_cd\tsite_no\tstation_nm\tdec_lat_va\tdec_long_va\tcounty_cd\tsite_tp_cd\n5s\t15s\t50s\t10s\t10s\t10s\t10s\nUSGS\t08158000\tColorado River at Austin\t30.2500\t-97.7500\t453\tST\nUSGS\t08000000\tSan Antonio River at San Antonio\t29.4200\t-98.4900\t029\tST\n`;

describe("USGS water gauges", () => {
  it("parses NWIS RDB text into normalized stream gauges", () => {
    const gauges = parseUsgsRdbText(sample);

    expect(gauges[0]).toEqual({
      sourceId: "usgs-stream-sites",
      siteNumber: "08158000",
      stationName: "Colorado River at Austin",
      countyName: "Travis County",
      countyFips: "48453",
      latitude: 30.25,
      longitude: -97.75,
      siteType: "ST",
      status: "active",
      raw: {
        agency_cd: "USGS",
        site_no: "08158000",
        station_nm: "Colorado River at Austin",
        dec_lat_va: "30.2500",
        dec_long_va: "-97.7500",
        county_cd: "453",
        site_tp_cd: "ST",
      },
    });
  });

  it("filters gauges by Texas county FIPS slug mapping when county name is absent", () => {
    const gauges = parseUsgsRdbText(sample);
    expect(filterGaugesForCounty(gauges, "travis-county").map((gauge) => gauge.siteNumber)).toEqual(["08158000"]);
    expect(filterGaugesForCounty(gauges, "bexar-county").map((gauge) => gauge.siteNumber)).toEqual(["08000000"]);
  });
});
