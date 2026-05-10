import { describe, expect, it } from "vitest";

import {
  attachMonthlyTemperatureAnomalies,
  buildOpenMeteoTemperatureArchiveUrl,
  normalizeOpenMeteoDailyTemperature,
  summarizeDailyTemperatureToMonthly,
} from "@/lib/datasets/temperature";

describe("temperature helpers", () => {
  it("builds an Open-Meteo historical archive URL with daily temperature variables", () => {
    const url = buildOpenMeteoTemperatureArchiveUrl({
      latitude: 31.794265,
      longitude: -95.660516,
      startDate: "2020-01-01",
      endDate: "2020-01-31",
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://archive-api.open-meteo.com/v1/archive");
    expect(parsed.searchParams.get("daily")).toBe("temperature_2m_mean,temperature_2m_max,temperature_2m_min");
    expect(parsed.searchParams.get("timezone")).toBe("GMT");
  });

  it("normalizes daily temperature arrays and skips nulls", () => {
    const rows = normalizeOpenMeteoDailyTemperature({
      daily: {
        time: ["2020-01-01", "2020-01-02", "2020-01-03"],
        temperature_2m_mean: [10, null, 12],
        temperature_2m_max: [15, 16, 18],
        temperature_2m_min: [5, 6, 7],
      },
    });

    expect(rows).toEqual([
      { date: "2020-01-01", temperatureMeanC: 10, temperatureMaxC: 15, temperatureMinC: 5 },
      { date: "2020-01-03", temperatureMeanC: 12, temperatureMaxC: 18, temperatureMinC: 7 },
    ]);
  });

  it("aggregates daily temperature to county-month means, heat days, and freeze days", () => {
    const monthly = summarizeDailyTemperatureToMonthly([
      { date: "2020-01-01", temperatureMeanC: 10, temperatureMaxC: 20, temperatureMinC: 2 },
      { date: "2020-01-02", temperatureMeanC: 12, temperatureMaxC: 36, temperatureMinC: -1 },
      { date: "2020-02-01", temperatureMeanC: 20, temperatureMaxC: 38, temperatureMinC: 5 },
    ]);

    expect(monthly).toEqual([
      {
        yearMonth: "2020-01",
        tempMeanC: 11,
        heatDays: 1,
        freezeDays: 1,
      },
      {
        yearMonth: "2020-02",
        tempMeanC: 20,
        heatDays: 1,
        freezeDays: 0,
      },
    ]);
  });

  it("attaches same-calendar-month temperature anomalies", () => {
    const rows = attachMonthlyTemperatureAnomalies([
      {
        countyFips: "48001",
        countyName: "Anderson County",
        yearMonth: "2020-01",
        tempMeanC: 10,
        heatDays: 0,
        freezeDays: 0,
        sourceUrl: "x",
      },
      {
        countyFips: "48001",
        countyName: "Anderson County",
        yearMonth: "2021-01",
        tempMeanC: 20,
        heatDays: 0,
        freezeDays: 0,
        sourceUrl: "x",
      },
      {
        countyFips: "48001",
        countyName: "Anderson County",
        yearMonth: "2020-02",
        tempMeanC: 5,
        heatDays: 0,
        freezeDays: 0,
        sourceUrl: "x",
      },
      {
        countyFips: "48001",
        countyName: "Anderson County",
        yearMonth: "2021-02",
        tempMeanC: 5,
        heatDays: 0,
        freezeDays: 0,
        sourceUrl: "x",
      },
    ]);

    expect(rows.find((row) => row.yearMonth === "2020-01")?.tempMeanAnomalyZ).toBe(-1);
    expect(rows.find((row) => row.yearMonth === "2021-01")?.tempMeanAnomalyZ).toBe(1);
    expect(rows.find((row) => row.yearMonth === "2020-02")?.tempMeanAnomalyZ).toBeNull();
  });
});
