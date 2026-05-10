import { describe, expect, it } from "vitest";

import { buildUsdmCountyUrl, parseUsdmCsv, summarizeUsdmWeeklyRowsToMonthly } from "@/lib/datasets/drought";

describe("drought helpers", () => {
  it("builds a USDM county statistics URL", () => {
    const url = buildUsdmCountyUrl({ countyFips: "48001", startDate: "2020-01-01", endDate: "2020-02-01" });
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByArea");
    expect(parsed.searchParams.get("aoi")).toBe("48001");
  });

  it("parses USDM CSV and summarizes monthly D1+/D3+ fractions", () => {
    const csv = [
      "MapDate,FIPS,County,State,None,D0,D1,D2,D3,D4,ValidStart,ValidEnd,StatisticFormatID",
      "20200107,48001,Anderson County,TX,50,25,25,0,0,0,2020-01-07,2020-01-13,1",
      "20200114,48001,Anderson County,TX,0,0,50,50,0,0,2020-01-14,2020-01-20,1",
    ].join("\n");
    const rows = summarizeUsdmWeeklyRowsToMonthly(parseUsdmCsv(csv), "48001", "Anderson County");
    expect(rows).toEqual([
      {
        countyFips: "48001",
        countyName: "Anderson County",
        yearMonth: "2020-01",
        droughtFractionD1plus: 0.625,
        droughtFractionD3plus: 0,
        source: "https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByArea",
      },
    ]);
  });
});
