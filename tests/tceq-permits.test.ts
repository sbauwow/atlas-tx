import { describe, expect, it } from "vitest";

import {
  filterPendingPermitsByCounty,
  normalizeTceqWaterPermits,
  summarizePendingPermits,
  type TceqPermitStatusCount,
} from "@/lib/tceq-permits";

describe("tceq permits", () => {
  const permits = normalizeTceqWaterPermits([
    {
      permit_number: "WQ0001",
      authorization_type: "IND WW",
      authorization_status: "PENDING",
      permittee_name: "Alpha Water LLC",
      facility_county: "TRAVIS",
      nearest_city: "AUSTIN",
      latitude: "30.27",
      longitude: "-97.74",
    },
    {
      permit_number: "WQ0002",
      authorization_type: "MUN WW",
      authorization_status: "PENDING",
      permittee_name: "Beta Utility",
      facility_county: "HAYS",
      nearest_city: "BUDA",
      latitude: "30.08",
      longitude: "-97.84",
    },
    {
      permit_number: "WQ0003",
      authorization_type: "IND WW",
      authorization_status: "PENDING",
      permittee_name: "Gamma Water",
      facility_county: "TRAVIS",
      nearest_city: "AUSTIN",
      latitude: null,
      longitude: null,
    },
  ]);

  it("normalizes raw TCEQ pending permit rows", () => {
    expect(permits[0]).toMatchObject({
      permitNumber: "WQ0001",
      authorizationType: "IND WW",
      authorizationStatus: "PENDING",
      permitteeName: "Alpha Water LLC",
      county: "Travis County",
      nearestCity: "Austin",
    });
  });

  it("filters permits by county", () => {
    expect(filterPendingPermitsByCounty(permits, "travis-county")).toHaveLength(2);
    expect(filterPendingPermitsByCounty(permits, "Hays County")).toHaveLength(1);
  });

  it("summarizes statewide pending permit pressure", () => {
    const statusCounts: TceqPermitStatusCount[] = [
      { authorizationStatus: "PENDING", count: 3 },
      { authorizationStatus: "ACTIVE", count: 9 },
    ];

    const summary = summarizePendingPermits(permits, statusCounts);

    expect(summary.pendingPermitCount).toBe(3);
    expect(summary.activePermitCount).toBe(9);
    expect(summary.countyCount).toBe(2);
    expect(summary.authorizationTypeCount).toBe(2);
    expect(summary.topCounties[0]).toEqual({ county: "Travis County", count: 2 });
  });
});
