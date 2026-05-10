import { describe, expect, it } from "vitest";

import { buildCountyMonthPrecipitationSnapshot } from "../scripts/refresh-county-month-precipitation";

describe("refresh-county-month-precipitation", () => {
  it("builds a deterministic snapshot when fetches are injected", async () => {
    const result = await buildCountyMonthPrecipitationSnapshot({
      startDate: "2020-01-01",
      endDate: "2020-02-29",
      generatedAt: "2026-05-09T13:30:00.000Z",
      throttleMs: 0,
      fetchArchive: async () => ({
        daily: {
          time: ["2020-01-01", "2020-01-02", "2020-02-01"],
          precipitation_sum: [10, 30, 5],
        },
      }),
    });

    expect(result.countyCount).toBe(254);
    expect(result.rowCount).toBe(254 * 2);
    expect(result.startYearMonth).toBe("2020-01");
    expect(result.endYearMonth).toBe("2020-02");
    expect(result.snapshot.source).toBe("Open-Meteo Historical Weather API");
    expect(result.snapshot.heavyRainDayThresholdMm).toBe(25);

    const firstCountyRows = result.snapshot.rows.filter((row) => row.countyFips === "48001");
    expect(firstCountyRows).toEqual([
      expect.objectContaining({
        countyName: "Anderson County",
        yearMonth: "2020-01",
        precipTotalMm: 40,
        precipMax1dMm: 30,
        heavyRainDays: 1,
      }),
      expect.objectContaining({
        countyName: "Anderson County",
        yearMonth: "2020-02",
        precipTotalMm: 5,
        precipMax1dMm: 5,
        heavyRainDays: 0,
      }),
    ]);
  });
});
