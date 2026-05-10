import { describe, expect, it } from "vitest";

import { buildCountyMonthTemperatureSnapshot } from "../scripts/refresh-county-month-temperature";

describe("refresh-county-month-temperature", () => {
  it("builds a deterministic snapshot when fetches are injected", async () => {
    const result = await buildCountyMonthTemperatureSnapshot({
      startDate: "2020-01-01",
      endDate: "2020-02-29",
      generatedAt: "2026-05-09T18:10:00.000Z",
      throttleMs: 0,
      fetchArchive: async () => ({
        daily: {
          time: ["2020-01-01", "2020-01-02", "2020-02-01"],
          temperature_2m_mean: [10, 12, 20],
          temperature_2m_max: [20, 36, 38],
          temperature_2m_min: [2, -1, 5],
        },
      }),
    });

    expect(result.countyCount).toBe(254);
    expect(result.rowCount).toBe(254 * 2);
    expect(result.startYearMonth).toBe("2020-01");
    expect(result.endYearMonth).toBe("2020-02");
    expect(result.snapshot.source).toBe("Open-Meteo Historical Weather API");
    expect(result.snapshot.heatDayThresholdC).toBe(35);
    expect(result.snapshot.freezeDayThresholdC).toBe(0);

    const firstCountyRows = result.snapshot.rows.filter((row) => row.countyFips === "48001");
    expect(firstCountyRows).toEqual([
      expect.objectContaining({
        countyName: "Anderson County",
        yearMonth: "2020-01",
        tempMeanC: 11,
        heatDays: 1,
        freezeDays: 1,
      }),
      expect.objectContaining({
        countyName: "Anderson County",
        yearMonth: "2020-02",
        tempMeanC: 20,
        heatDays: 1,
        freezeDays: 0,
      }),
    ]);
  });
});
