import { describe, expect, it } from "vitest";

import { addMonths, buildExamples, evaluateSplit } from "../experiments/model_precipitation_ladder";

describe("model_precipitation_ladder helpers", () => {
  it("adds months across year boundaries", () => {
    expect(addMonths("2023-12", 1)).toBe("2024-01");
    expect(addMonths("2024-01", -1)).toBe("2023-12");
  });

  it("builds t+1 examples from consecutive county-month rows", () => {
    const examples = buildExamples([
      {
        county_fips: "48001",
        county_name: "Anderson County",
        year: 2023,
        month: 12,
        year_month: "2023-12",
        sdwis_event_any: 0,
        sdwis_prior_1m_any: 0,
        sdwis_prior_3m_count: 0,
        sdwis_prior_6m_count: 0,
        sdwis_prior_12m_count: 0,
        sdwis_cumulative_prior_count: 0,
        overflow_any: 1,
        overflow_count: 2,
        overflow_gallons_sum: 100,
        overflow_log_gallons_sum: 4.615,
        overflow_severe_any: 1,
        overflow_reaches_water_count: 1,
        overflow_count_3m: 2,
        overflow_gallons_sum_3m: 100,
        overflow_repeat_3m_any: 1,
        overflow_months_since_last: 0,
        permit_count_current: 1,
        impaired_segments_current: 1,
        hydrology_context_score_current: 1,
        precip_total_mm: 50,
        precip_anomaly_z: 1,
        heavy_rain_days: 1,
        precip_max_1d_mm: 20,
        overflow_x_precip_anomaly: 2,
        weather_data_complete_flag: 1,
        row_usable_for_trigger_models: 1,
      },
      {
        county_fips: "48001",
        county_name: "Anderson County",
        year: 2024,
        month: 1,
        year_month: "2024-01",
        sdwis_event_any: 1,
        sdwis_prior_1m_any: 0,
        sdwis_prior_3m_count: 0,
        sdwis_prior_6m_count: 0,
        sdwis_prior_12m_count: 0,
        sdwis_cumulative_prior_count: 0,
        overflow_any: 0,
        overflow_count: 0,
        overflow_gallons_sum: 0,
        overflow_log_gallons_sum: 0,
        overflow_severe_any: 0,
        overflow_reaches_water_count: 0,
        overflow_count_3m: 0,
        overflow_gallons_sum_3m: 0,
        overflow_repeat_3m_any: 0,
        overflow_months_since_last: 1,
        permit_count_current: 1,
        impaired_segments_current: 1,
        hydrology_context_score_current: 1,
        precip_total_mm: 10,
        precip_anomaly_z: -1,
        heavy_rain_days: 0,
        precip_max_1d_mm: 10,
        overflow_x_precip_anomaly: 0,
        weather_data_complete_flag: 1,
        row_usable_for_trigger_models: 1,
      },
    ]);

    expect(examples).toHaveLength(1);
    expect(examples[0]).toMatchObject({
      split: "validation",
      feature_year_month: "2023-12",
      target_year_month: "2024-01",
      y: 1,
    });
  });

  it("computes perfect-discrimination metrics on a clean toy example", () => {
    const metrics = evaluateSplit([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9]);
    expect(metrics.auroc).toBe(1);
    expect(metrics.auprc).toBe(1);
    expect(metrics.liftAtTopDecile).toBeGreaterThan(1);
  });
});
