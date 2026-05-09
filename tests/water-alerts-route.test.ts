import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/water/nws", () => ({
  fetchTexasWaterAlerts: vi.fn().mockResolvedValue([
    {
      sourceId: "nws-alerts",
      alertId: "alert-1",
      event: "Flood Warning",
      countyNames: ["Travis County"],
      geometryType: "none",
      raw: {},
    },
  ]),
  filterAlertsForCounty: vi.fn((alerts: Array<{ countyNames?: string[] }>, county: string) => alerts.filter((alert) => alert.countyNames?.includes("Travis County") && county.includes("travis"))),
}));

describe("water alerts API route", () => {
  it("returns all Texas water alerts", async () => {
    const { GET } = await import("@/app/api/water/alerts/route");
    const response = await GET(new Request("http://localhost/api/water/alerts"));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.alerts[0].alertId).toBe("alert-1");
  });

  it("filters alerts by county query param", async () => {
    const { GET } = await import("@/app/api/water/alerts/route");
    const response = await GET(new Request("http://localhost/api/water/alerts?county=travis-county"));
    const payload = await response.json();
    expect(payload.alerts).toHaveLength(1);
  });
});
