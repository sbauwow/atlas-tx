import { describe, expect, it } from "vitest";

import {
  attachMonthlyPrecipitationAnomalies,
  buildOpenMeteoArchiveUrl,
  normalizeOpenMeteoDailyPrecipitation,
  summarizeDailyPrecipitationToMonthly,
} from "@/lib/datasets/precipitation";

describe("precipitation helpers", () => {
  it("builds an Open-Meteo historical archive URL with daily precipitation_sum", () => {
    const url = buildOpenMeteoArchiveUrl({
      latitude: 31.794265,
      longitude: -95.660516,
      startDate: "2020-01-01",
      endDate: "2020-01-31",
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://archive-api.open-meteo.com/v1/archive");
    expect(parsed.searchParams.get("daily")).toBe("precipitation_sum");
    expect(parsed.searchParams.get("timezone")).toBe("GMT");
    expect(parsed.searchParams.get("latitude")).toBe("31.794265");
  });

  it("normalizes daily precipitation arrays and skips nulls", () => {
    const rows = normalizeOpenMeteoDailyPrecipitation({
      daily: {
        time: ["2020-01-01", "2020-01-02", "2020-01-03"],
        precipitation_sum: [1.2, null, 3.4],
      },
    });

    expect(rows).toEqual([
      { date: "2020-01-01", precipitationMm: 1.2 },
      { date: "2020-01-03", precipitationMm: 3.4 },
    ]);
  });

  it("aggregates daily precipitation to county-month totals, maxima, and heavy-rain-day counts", () => {
    const monthly = summarizeDailyPrecipitationToMonthly([
      { date: "2020-01-01", precipitationMm: 5 },
      { date: "2020-01-02", precipitationMm: 30 },
      { date: "2020-01-10", precipitationMm: 10 },
      { date: "2020-02-01", precipitationMm: 40 },
    ], 25);

    expect(monthly).toEqual([
      {
        yearMonth: "2020-01",
        precipTotalMm: 45,
        precipMax1dMm: 30,
        heavyRainDays: 1,
      },
      {
        yearMonth: "2020-02",
        precipTotalMm: 40,
        precipMax1dMm: 40,
        heavyRainDays: 1,
      },
    ]);
  });

  it("attaches same-calendar-month precipitation anomalies", () => {
    const rows = attachMonthlyPrecipitationAnomalies([
      {
        countyFips: "48001",
        countyName: "Anderson County",
        yearMonth: "2020-01",
        precipTotalMm: 10,
        precipMax1dMm: 10,
        heavyRainDays: 0,
        sourceUrl: "x",
      },
      {
        countyFips: "48001",
        countyName: "Anderson County",
        yearMonth: "2021-01",
        precipTotalMm: 20,
        precipMax1dMm: 10,
        heavyRainDays: 0,
        sourceUrl: "x",
      },
      {
        countyFips: "48001",
        countyName: "Anderson County",
        yearMonth: "2020-02",
        precipTotalMm: 5,
        precipMax1dMm: 5,
        heavyRainDays: 0,
        sourceUrl: "x",
      },
      {
        countyFips: "48001",
        countyName: "Anderson County",
        yearMonth: "2021-02",
        precipTotalMm: 5,
        precipMax1dMm: 5,
        heavyRainDays: 0,
        sourceUrl: "x",
      },
    ]);

    expect(rows.find((row) => row.yearMonth === "2020-01")?.precipAnomalyZ).toBe(-1);
    expect(rows.find((row) => row.yearMonth === "2021-01")?.precipAnomalyZ).toBe(1);
    expect(rows.find((row) => row.yearMonth === "2020-02")?.precipAnomalyZ).toBeNull();
  });
});
