import { describe, expect, it } from "vitest";

import { haversineMiles, parseUsgsRdb, summarizeDailyDischargeToMonthly } from "@/lib/datasets/streamflow";
import { assignNearestSites, normalizeUsgsDailyDischargeFromRdb, normalizeUsgsSitesFromRdb } from "../scripts/refresh-county-month-streamflow";

describe("streamflow helpers", () => {
  it("parses simple USGS RDB tables", () => {
    const rows = parseUsgsRdb("agency_cd\tsite_no\tstation_nm\nd\td\td\nUSGS\t08158000\tColorado River at Austin\n");
    expect(rows).toEqual([{ agency_cd: "USGS", site_no: "08158000", station_nm: "Colorado River at Austin" }]);
  });

  it("normalizes site and daily discharge rows", () => {
    const sites = normalizeUsgsSitesFromRdb("agency_cd\tsite_no\tstation_nm\tdec_lat_va\tdec_long_va\nd\td\td\tn\tn\nUSGS\t08158000\tColorado River at Austin\t30.25\t-97.75\n");
    const daily = normalizeUsgsDailyDischargeFromRdb("agency_cd\tsite_no\tdatetime\t123_00060_00003\nd\td\td\tn\nUSGS\t08158000\t2020-01-01\t100\nUSGS\t08158000\t2020-01-02\t200\n", "08158000");
    expect(sites[0]?.siteNumber).toBe("08158000");
    expect(daily).toEqual([
      { siteNumber: "08158000", date: "2020-01-01", dischargeCfs: 100 },
      { siteNumber: "08158000", date: "2020-01-02", dischargeCfs: 200 },
    ]);
  });

  it("assigns nearest sites and summarizes monthly anomalies", () => {
    const counties = [{ county_fips: "48001", county_name: "Anderson County", county_slug: "anderson-county", centroid: { lat: 31.8, lon: -95.6, fips: "48001" } }];
    const sites = [
      { siteNumber: "1", stationName: "Near", latitude: 31.7, longitude: -95.5 },
      { siteNumber: "2", stationName: "Far", latitude: 35, longitude: -100 },
    ];
    const nearest = assignNearestSites(counties as never, sites);
    expect(nearest.get("48001")?.siteNumber).toBe("1");

    const monthly = summarizeDailyDischargeToMonthly("1", "Near", [
      { siteNumber: "1", date: "2020-01-01", dischargeCfs: 10 },
      { siteNumber: "1", date: "2020-01-02", dischargeCfs: 20 },
      { siteNumber: "1", date: "2021-01-01", dischargeCfs: 50 },
      { siteNumber: "1", date: "2021-01-02", dischargeCfs: 70 },
    ], "48001", "Anderson County");
    expect(monthly[0]?.yearMonth).toBe("2020-01");
    expect(monthly[0]?.streamflowMeanCfs).toBe(15);
    expect(monthly[0]?.streamflowAnomalyZ).toBe(-1);
    expect(monthly[1]?.streamflowExtremeHighAny).toBe(0);
  });

  it("computes sensible haversine distances", () => {
    expect(haversineMiles(31.8, -95.6, 31.8, -95.6)).toBe(0);
    expect(haversineMiles(31.8, -95.6, 32.8, -95.6)).toBeGreaterThan(60);
  });
});
