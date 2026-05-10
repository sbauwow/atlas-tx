import { describe, expect, it } from "vitest";

import {
  aggregateCountyMonthFloodAlerts,
  buildOpenFemaIpawsUrl,
  extractCountyMonthFloodAlertRows,
} from "@/lib/datasets/nws-flood-alerts";

describe("nws flood alerts helpers", () => {
  it("builds an OpenFEMA IPAWS URL with the expected flood-warning filters", () => {
    const url = buildOpenFemaIpawsUrl({
      startIso: "2024-05-01T00:00:00.000Z",
      endIso: "2024-06-01T00:00:00.000Z",
      top: 1000,
      skip: 0,
    });

    const parsed = new URL(url);
    const filter = parsed.searchParams.get("$filter") ?? "";
    expect(parsed.origin + parsed.pathname).toBe("https://www.fema.gov/api/open/v1/IpawsArchivedAlerts");
    expect(filter).toContain("sender eq 'w-nws.webmaster@noaa.gov'");
    expect(filter).toContain("Flash Flood Warning");
    expect(filter).toContain("Flood Warning");
    expect(filter).toContain("TXC");
  });

  it("extracts Texas county-month rows from a flash-flood alert", () => {
    const rows = extractCountyMonthFloodAlertRows(
      {
        sent: "2024-05-01T23:22:00.000Z",
        info: [
          {
            event: "Flash Flood Warning",
            area: [
              {
                areaDesc: "Freestone, TX; Limestone, TX",
                geocode: [
                  { name: "SAME", value: "048161" },
                  { name: "SAME", value: "048293" },
                  { name: "UGC", value: "TXC161" },
                ],
              },
            ],
          },
        ],
      },
      new Map([
        ["48161", "Freestone County"],
        ["48293", "Limestone County"],
      ]),
    );

    expect(rows).toEqual([
      {
        countyFips: "48161",
        countyName: "Freestone County",
        yearMonth: "2024-05",
        floodWarningAny: 0,
        floodWarningCount: 0,
        flashFloodWarningAny: 1,
        flashFloodWarningCount: 1,
        source: "https://www.fema.gov/api/open/v1/IpawsArchivedAlerts",
      },
      {
        countyFips: "48293",
        countyName: "Limestone County",
        yearMonth: "2024-05",
        floodWarningAny: 0,
        floodWarningCount: 0,
        flashFloodWarningAny: 1,
        flashFloodWarningCount: 1,
        source: "https://www.fema.gov/api/open/v1/IpawsArchivedAlerts",
      },
    ]);
  });

  it("aggregates duplicate county-month rows into counts and any-flags", () => {
    const rows = aggregateCountyMonthFloodAlerts([
      {
        countyFips: "48161",
        countyName: "Freestone County",
        yearMonth: "2024-05",
        floodWarningAny: 1,
        floodWarningCount: 1,
        flashFloodWarningAny: 0,
        flashFloodWarningCount: 0,
        source: "x",
      },
      {
        countyFips: "48161",
        countyName: "Freestone County",
        yearMonth: "2024-05",
        floodWarningAny: 0,
        floodWarningCount: 0,
        flashFloodWarningAny: 1,
        flashFloodWarningCount: 1,
        source: "x",
      },
    ]);

    expect(rows).toEqual([
      {
        countyFips: "48161",
        countyName: "Freestone County",
        yearMonth: "2024-05",
        floodWarningAny: 1,
        floodWarningCount: 1,
        flashFloodWarningAny: 1,
        flashFloodWarningCount: 1,
        source: "x",
      },
    ]);
  });
});
