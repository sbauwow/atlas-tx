import { describe, expect, it } from "vitest";

import { buildCountyMonthNwsFloodAlertsSnapshot } from "../scripts/refresh-county-month-nws-flood-alerts";

describe("refresh-county-month-nws-flood-alerts", () => {
  it("builds a deterministic snapshot from injected monthly fetches", async () => {
    const result = await buildCountyMonthNwsFloodAlertsSnapshot({
      startYearMonth: "2024-05",
      endYearMonth: "2024-05",
      generatedAt: "2026-05-09T14:45:00.000Z",
      fetchMonthly: async () => [
        {
          sent: "2024-05-01T23:22:00.000Z",
          info: [
            {
              event: "Flash Flood Warning",
              area: [
                {
                  geocode: [
                    { name: "SAME", value: "048161" },
                    { name: "SAME", value: "048293" },
                  ],
                },
              ],
            },
          ],
        },
        {
          sent: "2024-05-02T20:00:00.000Z",
          info: [
            {
              event: "Flood Warning",
              area: [
                {
                  geocode: [
                    { name: "SAME", value: "048161" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(result.rawAlertCount).toBe(2);
    expect(result.countyMonthRowCount).toBe(2);
    expect(result.snapshot.rows).toEqual([
      expect.objectContaining({
        countyFips: "48161",
        countyName: "Freestone County",
        yearMonth: "2024-05",
        floodWarningAny: 1,
        floodWarningCount: 1,
        flashFloodWarningAny: 1,
        flashFloodWarningCount: 1,
      }),
      expect.objectContaining({
        countyFips: "48293",
        countyName: "Limestone County",
        yearMonth: "2024-05",
        floodWarningAny: 0,
        floodWarningCount: 0,
        flashFloodWarningAny: 1,
        flashFloodWarningCount: 1,
      }),
    ]);
  });
});
