import { describe, expect, it } from "vitest";
import { filterAlertsForCounty, filterTexasWaterAlerts, normalizeNwsAlert } from "@/lib/water/nws";

const floodWarning = {
  id: "abc-1",
  geometry: null,
  properties: {
    event: "Flood Warning",
    severity: "Severe",
    certainty: "Likely",
    urgency: "Immediate",
    headline: "Flood Warning issued for Travis County",
    sent: "2026-05-09T00:00:00Z",
    expires: "2026-05-09T05:00:00Z",
    areaDesc: "Travis, Williamson",
  },
};

describe("NWS water alerts", () => {
  it("normalizes a water-related alert and county list", () => {
    expect(normalizeNwsAlert(floodWarning)).toEqual({
      sourceId: "nws-alerts",
      alertId: "abc-1",
      event: "Flood Warning",
      severity: "Severe",
      certainty: "Likely",
      urgency: "Immediate",
      headline: "Flood Warning issued for Travis County",
      sentAt: "2026-05-09T00:00:00Z",
      expiresAt: "2026-05-09T05:00:00Z",
      countyNames: ["Travis County", "Williamson County"],
      geometryType: "none",
      raw: floodWarning,
    });
  });

  it("keeps only water-relevant Texas alerts", () => {
    const alerts = filterTexasWaterAlerts([
      normalizeNwsAlert(floodWarning),
      normalizeNwsAlert({
        id: "abc-2",
        geometry: null,
        properties: { event: "Tornado Warning", areaDesc: "Travis" },
      }),
    ]);

    expect(alerts.map((alert) => alert.alertId)).toEqual(["abc-1"]);
  });

  it("filters normalized alerts by county slug or county name", () => {
    const alerts = [normalizeNwsAlert(floodWarning)];
    expect(filterAlertsForCounty(alerts, "travis-county")).toHaveLength(1);
    expect(filterAlertsForCounty(alerts, "bexar")).toHaveLength(0);
  });
});
