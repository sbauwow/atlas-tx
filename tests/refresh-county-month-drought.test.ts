import { describe, expect, it } from "vitest";

import { buildCountyMonthDroughtSnapshot } from "../scripts/refresh-county-month-drought";

describe("refresh-county-month-drought", () => {
  it("builds a deterministic drought snapshot from injected CSV", async () => {
    const result = await buildCountyMonthDroughtSnapshot({
      startDate: "2020-01-01",
      endDate: "2020-01-31",
      generatedAt: "2026-05-09T17:10:00.000Z",
      fetchCountyText: async (countyFips) => [
        "MapDate,FIPS,County,State,None,D0,D1,D2,D3,D4,ValidStart,ValidEnd,StatisticFormatID",
        `20200107,${countyFips},County,TX,50,25,25,0,0,0,2020-01-07,2020-01-13,1`,
      ].join("\n"),
    });

    expect(result.countyCount).toBe(254);
    expect(result.rowCount).toBe(254);
    expect(result.snapshot.rows[0]?.droughtFractionD1plus).toBe(0.25);
  });
});
