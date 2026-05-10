import { describe, expect, it } from "vitest";

import { buildCountyMonthStreamflowSnapshot } from "../scripts/refresh-county-month-streamflow";

describe("refresh-county-month-streamflow", () => {
  it("builds a deterministic snapshot from injected site and daily RDB payloads", async () => {
    const result = await buildCountyMonthStreamflowSnapshot({
      startDate: "2020-01-01",
      endDate: "2021-01-31",
      generatedAt: "2026-05-09T15:00:00.000Z",
      fetchSitesText: async () => "agency_cd\tsite_no\tstation_nm\tdec_lat_va\tdec_long_va\nd\td\td\tn\tn\nUSGS\t0001\tNear A\t31.7\t-95.5\nUSGS\t0002\tNear B\t32.3\t-102.8\n",
      fetchDailyText: async (siteNumber) => `agency_cd\tsite_no\tdatetime\t123_00060_00003\nd\td\td\tn\nUSGS\t${siteNumber}\t2020-01-01\t10\nUSGS\t${siteNumber}\t2021-01-01\t20\n`,
    });

    expect(result.siteCount).toBeGreaterThan(0);
    expect(result.countyCount).toBe(254);
    expect(result.rowCount).toBeGreaterThan(0);
    expect(result.snapshot.rows[0]).toMatchObject({
      yearMonth: "2020-01",
      streamflowMeanCfs: 10,
    });
  });
});
