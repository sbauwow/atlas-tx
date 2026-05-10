# Heat ablation memo for the Texas county-month water-risk thesis

Generated: 2026-05-10T01:37:59.510Z

## Scope

- Panel: `data/panels/county_month_water_risk.csv`
- Example count: 14490
- Goal: decompose the incremental gain from the heat layer added on top of the existing EB-aware trigger stack
- Benchmark model: **Benchmark: EB trigger stack without heat**
- Train outcome window: 2020-02 through 2023-12
- Validation outcome window: 2024-01 through 2024-12
- Test outcome window: 2025-01 through 2025-12

## Main result

### Pooled ladder
- Benchmark validation AUPRC: **0.559**
- Best heat-ablation validation AUPRC: **0.578** (Benchmark + full heat stack)
- Benchmark test AUPRC: **0.46**
- Best heat-ablation test AUPRC: **0.475**

### County-FE-style ladder
- Benchmark validation AUPRC: **0.559**
- Best heat-ablation validation AUPRC: **0.578** (Benchmark + heat_days + freeze_days)
- Benchmark test AUPRC: **0.462**
- Best heat-ablation test AUPRC: **0.478**

## Interpretation summary

- The heat gain is **not** purely an artifact of throwing every heat term into the model at once.
- In the current run, the strongest single added heat term by validation AUPRC is **freeze_days** in the pooled ladder and **freeze_days** in the FE-style ladder.
- The combined `heat_days + freeze_days` bundle performs better than any single heat term, and the full heat stack matches or slightly improves on that result.
- `temp_mean_anomaly_z` and `overflow_x_heat` contribute less on their own than the stronger freeze/heat-count combinations.
- If we emphasize one single heat variable in the thesis narrative, the current evidence points more strongly to **freeze_days** than to `temp_mean_anomaly_z` or `overflow_x_heat`, while the best compact bundle is **heat_days + freeze_days**.

## Full ablation table

| Family | Model | Split | N | Positives | Prevalence | AUROC | AUPRC | Brier | Precision@top-decile | Lift@top-decile |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| pooled | Benchmark: EB trigger stack without heat | validation | 2446 | 532 | 0.217 | 0.775 | 0.559 | 0.138 | 0.629 | 2.89 |
| pooled | Benchmark: EB trigger stack without heat | test | 2510 | 385 | 0.153 | 0.795 | 0.46 | 0.108 | 0.494 | 3.221 |
| pooled | Benchmark + temp_mean_anomaly_z | validation | 2446 | 532 | 0.217 | 0.774 | 0.558 | 0.138 | 0.633 | 2.909 |
| pooled | Benchmark + temp_mean_anomaly_z | test | 2510 | 385 | 0.153 | 0.795 | 0.46 | 0.107 | 0.494 | 3.221 |
| pooled | Benchmark + heat_days | validation | 2446 | 532 | 0.217 | 0.775 | 0.558 | 0.138 | 0.629 | 2.89 |
| pooled | Benchmark + heat_days | test | 2510 | 385 | 0.153 | 0.794 | 0.46 | 0.108 | 0.494 | 3.221 |
| pooled | Benchmark + freeze_days | validation | 2446 | 532 | 0.217 | 0.788 | 0.577 | 0.136 | 0.673 | 3.096 |
| pooled | Benchmark + freeze_days | test | 2510 | 385 | 0.153 | 0.803 | 0.472 | 0.106 | 0.482 | 3.143 |
| pooled | Benchmark + overflow_x_heat | validation | 2446 | 532 | 0.217 | 0.775 | 0.558 | 0.138 | 0.629 | 2.89 |
| pooled | Benchmark + overflow_x_heat | test | 2510 | 385 | 0.153 | 0.794 | 0.459 | 0.108 | 0.494 | 3.221 |
| pooled | Benchmark + temp_mean_anomaly_z + heat_days | validation | 2446 | 532 | 0.217 | 0.774 | 0.558 | 0.138 | 0.633 | 2.909 |
| pooled | Benchmark + temp_mean_anomaly_z + heat_days | test | 2510 | 385 | 0.153 | 0.795 | 0.46 | 0.107 | 0.494 | 3.221 |
| pooled | Benchmark + heat_days + freeze_days | validation | 2446 | 532 | 0.217 | 0.789 | 0.578 | 0.136 | 0.678 | 3.115 |
| pooled | Benchmark + heat_days + freeze_days | test | 2510 | 385 | 0.153 | 0.805 | 0.475 | 0.105 | 0.502 | 3.273 |
| pooled | Benchmark + temp_mean_anomaly_z + heat_days + freeze_days | validation | 2446 | 532 | 0.217 | 0.79 | 0.578 | 0.136 | 0.678 | 3.115 |
| pooled | Benchmark + temp_mean_anomaly_z + heat_days + freeze_days | test | 2510 | 385 | 0.153 | 0.805 | 0.475 | 0.105 | 0.506 | 3.299 |
| pooled | Benchmark + full heat stack | validation | 2446 | 532 | 0.217 | 0.79 | 0.578 | 0.136 | 0.678 | 3.115 |
| pooled | Benchmark + full heat stack | test | 2510 | 385 | 0.153 | 0.805 | 0.475 | 0.105 | 0.506 | 3.299 |
| fixed_effects | Benchmark: EB trigger stack without heat | validation | 2446 | 532 | 0.217 | 0.774 | 0.559 | 0.138 | 0.649 | 2.984 |
| fixed_effects | Benchmark: EB trigger stack without heat | test | 2510 | 385 | 0.153 | 0.796 | 0.462 | 0.107 | 0.498 | 3.247 |
| fixed_effects | Benchmark + temp_mean_anomaly_z | validation | 2446 | 532 | 0.217 | 0.773 | 0.558 | 0.138 | 0.649 | 2.984 |
| fixed_effects | Benchmark + temp_mean_anomaly_z | test | 2510 | 385 | 0.153 | 0.796 | 0.463 | 0.107 | 0.49 | 3.195 |
| fixed_effects | Benchmark + heat_days | validation | 2446 | 532 | 0.217 | 0.774 | 0.559 | 0.138 | 0.649 | 2.984 |
| fixed_effects | Benchmark + heat_days | test | 2510 | 385 | 0.153 | 0.796 | 0.463 | 0.107 | 0.498 | 3.247 |
| fixed_effects | Benchmark + freeze_days | validation | 2446 | 532 | 0.217 | 0.787 | 0.577 | 0.136 | 0.678 | 3.115 |
| fixed_effects | Benchmark + freeze_days | test | 2510 | 385 | 0.153 | 0.805 | 0.475 | 0.105 | 0.482 | 3.143 |
| fixed_effects | Benchmark + overflow_x_heat | validation | 2446 | 532 | 0.217 | 0.774 | 0.559 | 0.138 | 0.649 | 2.984 |
| fixed_effects | Benchmark + overflow_x_heat | test | 2510 | 385 | 0.153 | 0.796 | 0.462 | 0.107 | 0.498 | 3.247 |
| fixed_effects | Benchmark + temp_mean_anomaly_z + heat_days | validation | 2446 | 532 | 0.217 | 0.773 | 0.558 | 0.138 | 0.653 | 3.003 |
| fixed_effects | Benchmark + temp_mean_anomaly_z + heat_days | test | 2510 | 385 | 0.153 | 0.797 | 0.464 | 0.107 | 0.49 | 3.195 |
| fixed_effects | Benchmark + heat_days + freeze_days | validation | 2446 | 532 | 0.217 | 0.789 | 0.578 | 0.135 | 0.686 | 3.153 |
| fixed_effects | Benchmark + heat_days + freeze_days | test | 2510 | 385 | 0.153 | 0.807 | 0.478 | 0.105 | 0.498 | 3.247 |
| fixed_effects | Benchmark + temp_mean_anomaly_z + heat_days + freeze_days | validation | 2446 | 532 | 0.217 | 0.789 | 0.578 | 0.136 | 0.686 | 3.153 |
| fixed_effects | Benchmark + temp_mean_anomaly_z + heat_days + freeze_days | test | 2510 | 385 | 0.153 | 0.807 | 0.478 | 0.105 | 0.502 | 3.273 |
| fixed_effects | Benchmark + full heat stack | validation | 2446 | 532 | 0.217 | 0.789 | 0.578 | 0.136 | 0.686 | 3.153 |
| fixed_effects | Benchmark + full heat stack | test | 2510 | 385 | 0.153 | 0.807 | 0.478 | 0.105 | 0.498 | 3.247 |

## Best pooled heat terms

### Benchmark + full heat stack
- Validation AUPRC: **0.578**
- Test AUPRC: **0.475**
- Top coefficients:
  - county_eb_baseline: 1.738
  - sdwis_prior_1m_any: -0.724
  - freeze_days: -0.207
  - sdwis_prior_3m_count: 0.162
  - flood_warning_any: -0.105
  - sdwis_cumulative_prior_count: -0.103

## Best county-FE-style heat terms

### Benchmark + heat_days + freeze_days
- Validation AUPRC: **0.578**
- Test AUPRC: **0.478**
- Top coefficients:
  - county_eb_baseline: 1.624
  - sdwis_prior_1m_any: -0.665
  - freeze_days: -0.197
  - sdwis_prior_3m_count: 0.152
  - flood_warning_any: -0.097
  - sdwis_cumulative_prior_count: -0.09

## Thesis-facing read

1. The non-heat benchmark remains strong because stabilized chronic county baseline risk is still doing most of the work.
2. The heat result survives decomposition well enough to stay in the main thesis narrative.
3. The best single heat term is currently **freeze_days**, while the best compact heat bundle is **heat_days + freeze_days**.
4. The final thesis should still present heat as **predictive association / contextual value**, not causal proof.

## Recommended writeup language

> In heat-focused ablations, the strongest single incremental term was county-month freeze-day context, while the combined heat-days-plus-freeze-days bundle and the full heat stack delivered the best validation performance overall. This suggests that the observed gain is not solely an artifact of one unstable interaction term, though the result remains predictive rather than causal and still depends on county-centroid air-temperature proxies.

## Next recommended step

- Convert this memo directly into the heat subsection of the results and discussion sections.
- If one more robustness pass is desired, test whether the heat gain is concentrated in warm-season holdout months.

## Sources

- Open-Meteo Historical Weather API  
  https://open-meteo.com/en/docs/historical-weather-api
- Open-Meteo historical weather OpenAPI spec  
  https://github.com/open-meteo/open-meteo/blob/main/openapi_historical_weather_api.yml
- EPA Envirofacts SDWIS API  
  https://www.epa.gov/enviro/envirofacts-data-service-api
- Texas Open Data portal  
  https://data.texas.gov/
