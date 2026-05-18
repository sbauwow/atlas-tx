import { describe, expect, it } from "vitest";

import { convertCsvRows } from "../experiments/claim_support_arbitration_csv_to_json";

describe("claim_support_arbitration_csv_to_json", () => {
  it("converts spreadsheet-style rows into benchmark JSON rows", () => {
    const rows = convertCsvRows([
      {
        id: "capture-1001",
        stripBrand: "JED Pool Tools 5-way",
        chartVisible: "true",
        imageQualityLabel: "valid",
        readabilityLabel: "readable",
        client_free_chlorine_band: "2",
        client_total_alkalinity_band: "1",
        client_ph_band: "3",
        client_total_hardness_band: "1",
        second_free_chlorine_band: "2",
        second_total_alkalinity_band: "1",
        second_ph_band: "3",
        second_total_hardness_band: "1",
        manual_free_chlorine_band: "2",
        manual_total_alkalinity_band: "1",
        manual_ph_band: "3",
        manual_total_hardness_band: "1",
        qa_blur: "false",
        qa_low_light: "false",
        qa_saturation_clip: "true",
        qa_glare: "false",
        qa_underfill: "false",
        qa_no_chart_detected: "false",
        notes: "Example row",
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.chartVisible).toBe(true);
    expect(rows[0]?.clientBandByAnalyte.free_chlorine).toBe(2);
    expect(rows[0]?.qaFlags).toContain("saturation-clip");
  });
});
