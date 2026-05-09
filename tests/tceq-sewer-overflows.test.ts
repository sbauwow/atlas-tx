import { describe, expect, it } from "vitest";
import { normalizeSewerOverflowEvent, summarizeSewerOverflowsByCounty } from "@/lib/water/tceq-sewer-overflows";

const rows = [
  {
    incident_number: "1",
    regulated_entity_name: "Utility A",
    incident_location_county: "TRAVIS",
    amount: "200",
    amount_unit: "GALLONS",
    material_type: "Sewage",
    start_date: "2026-05-01T00:00:00.000",
    end_date: "2026-05-01T02:00:00.000",
    cause: "GREASE",
    status_code: "CLOSED",
  },
  {
    incident_number: "2",
    regulated_entity_name: "Utility B",
    incident_location_county: "TRAVIS",
    amount: "1.5",
    amount_unit: "MGD",
    material_type: "Sewage",
    start_date: "2026-05-02T00:00:00.000",
    end_date: "2026-05-02T02:00:00.000",
    cause: "RAIN",
    status_code: "CLOSED",
  },
];

describe("TCEQ sewer overflows", () => {
  it("normalizes a spill row into gallons and county metadata", () => {
    expect(normalizeSewerOverflowEvent(rows[0])).toEqual({
      sourceId: "tceq-sewer-overflows",
      incidentNumber: "1",
      countyName: "Travis County",
      entityName: "Utility A",
      materialType: "Sewage",
      amountGallons: 200,
      startDate: "2026-05-01T00:00:00.000",
      endDate: "2026-05-01T02:00:00.000",
      cause: "GREASE",
      status: "CLOSED",
      raw: rows[0],
    });
  });

  it("summarizes recent spills by county", () => {
    const summary = summarizeSewerOverflowsByCounty(rows.map(normalizeSewerOverflowEvent));
    expect(summary.get("travis-county")).toEqual({ count: 2, gallons: 1500200, countyName: "Travis County" });
  });
});
