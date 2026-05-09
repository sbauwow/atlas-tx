import { describe, expect, it } from "vitest";

import { scoreDrinkingWaterRisk } from "@/lib/scoring/dwrs";

describe("scoreDrinkingWaterRisk", () => {
  it("aggregates SDWIS violations into ranked per-PWS DWRS rows", () => {
    const rows = scoreDrinkingWaterRisk({
      violations: [
        {
          pwsid: "TX1234567",
          pwsName: "Alpha Water System",
          county: "Travis County",
          populationServed: 10000,
          violationId: "V1",
          violationCode: "MCL",
          violationCategory: "TT",
          isHealthBased: true,
          contaminantCode: "1005",
          complianceStatusCode: "open",
          complPerBeginDate: "2026-04-01",
          complPerEndDate: null,
          pwsTypeCode: "CWS",
          ruleCode: null,
          ruleGroupCode: null,
          publicNotificationTier: 1,
        },
        {
          pwsid: "TX1234567",
          pwsName: "Alpha Water System",
          county: "Travis County",
          populationServed: 10000,
          violationId: "V2",
          violationCode: "MON",
          violationCategory: "MRDL",
          isHealthBased: true,
          contaminantCode: "2000",
          complianceStatusCode: "open",
          complPerBeginDate: "2025-10-01",
          complPerEndDate: null,
          pwsTypeCode: "CWS",
          ruleCode: null,
          ruleGroupCode: null,
          publicNotificationTier: 2,
        },
        {
          pwsid: "TX7654321",
          pwsName: "Beta Rural Water",
          county: "Comal County",
          populationServed: 500,
          violationId: "V3",
          violationCode: "MCL",
          violationCategory: "TT",
          isHealthBased: true,
          contaminantCode: "1005",
          complianceStatusCode: "open",
          complPerBeginDate: "2026-03-01",
          complPerEndDate: null,
          pwsTypeCode: "CWS",
          ruleCode: null,
          ruleGroupCode: null,
          publicNotificationTier: 1,
        },
      ],
      asOf: "2026-05-01",
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      pwsId: "TX1234567",
      pwsName: "Alpha Water System",
      county: "Travis County",
      populationServed: 10000,
      violationCount: 2,
    });
    expect(rows[0]?.components).toEqual({
      violationSeverity: 3.5,
      populationWeight: 2,
      recencyWeight: 1.5,
    });
    expect(rows[0]?.rawScore).toBeCloseTo(5.5, 4);
    expect(rows[0]?.score).toBe(100);
    expect(rows[0]?.topViolations).toEqual([
      { code: "MCL", date: "2026-04-01" },
      { code: "MON", date: "2025-10-01" },
    ]);

    expect(rows[1]).toMatchObject({
      pwsId: "TX7654321",
      pwsName: "Beta Rural Water",
      county: "Comal County",
      populationServed: 500,
      violationCount: 1,
    });
    expect(rows[1]?.components).toEqual({
      violationSeverity: 2,
      populationWeight: 0.1,
      recencyWeight: 1,
    });
    expect(rows[1]?.rawScore).toBeCloseTo(0.2, 4);
    expect(rows[1]?.score).toBe(0);
  });

  it("filters by county and minimum population while ignoring non-health-based rows", () => {
    const rows = scoreDrinkingWaterRisk({
      violations: [
        {
          pwsid: "TX1111111",
          pwsName: "Target System",
          county: "Brazoria County",
          populationServed: 2500,
          violationId: "V1",
          violationCode: "MCL",
          violationCategory: "TT",
          isHealthBased: true,
          contaminantCode: null,
          complianceStatusCode: "open",
          complPerBeginDate: "2026-04-15",
          complPerEndDate: null,
          pwsTypeCode: "CWS",
          ruleCode: null,
          ruleGroupCode: null,
          publicNotificationTier: 1,
        },
        {
          pwsid: "TX1111111",
          pwsName: "Target System",
          county: "Brazoria County",
          populationServed: 2500,
          violationId: "V2",
          violationCode: "MON",
          violationCategory: "MON",
          isHealthBased: false,
          contaminantCode: null,
          complianceStatusCode: "open",
          complPerBeginDate: "2026-04-10",
          complPerEndDate: null,
          pwsTypeCode: "CWS",
          ruleCode: null,
          ruleGroupCode: null,
          publicNotificationTier: 3,
        },
        {
          pwsid: "TX2222222",
          pwsName: "Too Small System",
          county: "Brazoria County",
          populationServed: 900,
          violationId: "V3",
          violationCode: "MCL",
          violationCategory: "TT",
          isHealthBased: true,
          contaminantCode: null,
          complianceStatusCode: "open",
          complPerBeginDate: "2026-04-20",
          complPerEndDate: null,
          pwsTypeCode: "CWS",
          ruleCode: null,
          ruleGroupCode: null,
          publicNotificationTier: 1,
        },
        {
          pwsid: "TX3333333",
          pwsName: "Wrong County System",
          county: "Travis County",
          populationServed: 10000,
          violationId: "V4",
          violationCode: "MCL",
          violationCategory: "TT",
          isHealthBased: true,
          contaminantCode: null,
          complianceStatusCode: "open",
          complPerBeginDate: "2026-04-22",
          complPerEndDate: null,
          pwsTypeCode: "CWS",
          ruleCode: null,
          ruleGroupCode: null,
          publicNotificationTier: 1,
        },
      ],
      county: "BRAZORIA COUNTY",
      minPopulation: 1000,
      asOf: "2026-05-01",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      pwsId: "TX1111111",
      pwsName: "Target System",
      county: "Brazoria County",
      populationServed: 2500,
      violationCount: 1,
    });
    expect(rows[0]?.topViolations).toEqual([{ code: "MCL", date: "2026-04-15" }]);
  });
});
