# First precipitation-aware model ladder for county-month SDWIS backtest

Generated: 2026-05-09T20:36:29.978Z

## Scope

- Panel: `data/panels/county_month_water_risk.csv`
- Horizon: predict **any county-month SDWIS health-based event at (t+1)** from features observed at month (t)
- Example count: 14490
- Train outcome window: 2020-02 through 2023-12
- Validation outcome window: 2024-01 through 2024-12
- Test outcome window: 2025-01 through 2025-12
- Weather included in this pass: historical county-centroid precipitation, county-month NWS flood/flash-flood warning context, nearest-gauge streamflow context, county-month drought context, and county-centroid temperature/heat context
- Weather not yet included: no additional planned weather layer beyond the current proxy stack
- EB county baseline prior mean: 0.159
- EB county baseline prior strength: 2.792

## Model ladder

| Model | Split | N | Positives | Prevalence | AUROC | AUPRC | Brier | Precision@top-decile | Lift@top-decile |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Prevalence baseline | train | 9534 | 1527 | 0.16 | 0.5 | 0.194 | 0.135 | 0.241 | 1.507 |
| Prevalence baseline | validation | 2446 | 532 | 0.217 | 0.5 | 0.251 | 0.173 | 0.302 | 1.389 |
| Prevalence baseline | test | 2510 | 385 | 0.153 | 0.5 | 0.174 | 0.13 | 0.203 | 1.325 |
| Persistence only | train | 9534 | 1527 | 0.16 | 0.813 | 0.435 | 0.124 | 0.493 | 3.079 |
| Persistence only | validation | 2446 | 532 | 0.217 | 0.71 | 0.389 | 0.166 | 0.445 | 2.046 |
| Persistence only | test | 2510 | 385 | 0.153 | 0.805 | 0.393 | 0.119 | 0.45 | 2.935 |
| Persistence + EB county baseline | train | 9534 | 1527 | 0.16 | 0.879 | 0.612 | 0.091 | 0.621 | 3.879 |
| Persistence + EB county baseline | validation | 2446 | 532 | 0.217 | 0.774 | 0.559 | 0.138 | 0.645 | 2.965 |
| Persistence + EB county baseline | test | 2510 | 385 | 0.153 | 0.798 | 0.461 | 0.107 | 0.498 | 3.247 |
| Persistence + overflow | train | 9534 | 1527 | 0.16 | 0.794 | 0.409 | 0.123 | 0.483 | 3.014 |
| Persistence + overflow | validation | 2446 | 532 | 0.217 | 0.71 | 0.387 | 0.166 | 0.437 | 2.008 |
| Persistence + overflow | test | 2510 | 385 | 0.153 | 0.796 | 0.385 | 0.118 | 0.45 | 2.935 |
| Persistence + precipitation | train | 9534 | 1527 | 0.16 | 0.82 | 0.427 | 0.124 | 0.486 | 3.033 |
| Persistence + precipitation | validation | 2446 | 532 | 0.217 | 0.715 | 0.386 | 0.166 | 0.437 | 2.008 |
| Persistence + precipitation | test | 2510 | 385 | 0.153 | 0.796 | 0.386 | 0.119 | 0.434 | 2.831 |
| Persistence + overflow + precipitation + interaction | train | 9534 | 1527 | 0.16 | 0.801 | 0.409 | 0.123 | 0.476 | 2.974 |
| Persistence + overflow + precipitation + interaction | validation | 2446 | 532 | 0.217 | 0.727 | 0.393 | 0.166 | 0.429 | 1.97 |
| Persistence + overflow + precipitation + interaction | test | 2510 | 385 | 0.153 | 0.792 | 0.381 | 0.118 | 0.446 | 2.909 |
| Persistence + EB baseline + overflow + precipitation + NWS flood | train | 9534 | 1527 | 0.16 | 0.879 | 0.616 | 0.09 | 0.633 | 3.951 |
| Persistence + EB baseline + overflow + precipitation + NWS flood | validation | 2446 | 532 | 0.217 | 0.778 | 0.563 | 0.137 | 0.645 | 2.965 |
| Persistence + EB baseline + overflow + precipitation + NWS flood | test | 2510 | 385 | 0.153 | 0.795 | 0.456 | 0.107 | 0.498 | 3.247 |
| Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow | train | 9534 | 1527 | 0.16 | 0.88 | 0.621 | 0.09 | 0.64 | 3.996 |
| Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow | validation | 2446 | 532 | 0.217 | 0.775 | 0.559 | 0.138 | 0.637 | 2.928 |
| Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow | test | 2510 | 385 | 0.153 | 0.794 | 0.46 | 0.107 | 0.494 | 3.221 |
| Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought | train | 9534 | 1527 | 0.16 | 0.88 | 0.62 | 0.09 | 0.639 | 3.99 |
| Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought | validation | 2446 | 532 | 0.217 | 0.775 | 0.559 | 0.138 | 0.629 | 2.89 |
| Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought | test | 2510 | 385 | 0.153 | 0.795 | 0.46 | 0.108 | 0.494 | 3.221 |
| Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat | train | 9534 | 1527 | 0.16 | 0.88 | 0.623 | 0.089 | 0.644 | 4.023 |
| Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat | validation | 2446 | 532 | 0.217 | 0.79 | 0.578 | 0.136 | 0.678 | 3.115 |
| Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat | test | 2510 | 385 | 0.153 | 0.805 | 0.475 | 0.105 | 0.506 | 3.299 |
| Persistence + overflow + precipitation + structural context | train | 9534 | 1527 | 0.16 | 0.742 | 0.377 | 0.121 | 0.463 | 2.889 |
| Persistence + overflow + precipitation + structural context | validation | 2446 | 532 | 0.217 | 0.691 | 0.384 | 0.163 | 0.469 | 2.158 |
| Persistence + overflow + precipitation + structural context | test | 2510 | 385 | 0.153 | 0.741 | 0.357 | 0.118 | 0.438 | 2.857 |
| Persistence + EB baseline + overflow + precipitation + structural context | train | 9534 | 1527 | 0.16 | 0.878 | 0.614 | 0.09 | 0.63 | 3.931 |
| Persistence + EB baseline + overflow + precipitation + structural context | validation | 2446 | 532 | 0.217 | 0.78 | 0.57 | 0.137 | 0.661 | 3.04 |
| Persistence + EB baseline + overflow + precipitation + structural context | test | 2510 | 385 | 0.153 | 0.799 | 0.461 | 0.107 | 0.478 | 3.117 |

## Main read

- Best validation AUPRC in this first pass: **Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat** with validation AUPRC **0.578** and test AUPRC **0.475**.
- Persistence-only is the baseline to beat. Compare every richer model against that row first.
- The main question here is not whether precipitation "works" in isolation, but whether it adds ranking signal when overflow and persistence are already present.

## Coefficient snapshots

### Prevalence baseline

- Intercept-only prevalence baseline.

### Persistence only

- sdwis_prior_3m_count: 0.487
- sdwis_prior_12m_count: 0.261
- sdwis_cumulative_prior_count: -0.099
- sdwis_prior_1m_any: -0.068

### Persistence + EB county baseline

- county_eb_baseline: 1.743
- sdwis_prior_1m_any: -0.741
- sdwis_prior_3m_count: 0.168
- sdwis_cumulative_prior_count: -0.104
- sdwis_prior_12m_count: 0.007

### Persistence + overflow

- sdwis_prior_3m_count: 0.471
- sdwis_prior_12m_count: 0.25
- overflow_count: 0.165
- overflow_log_gallons_sum: -0.128
- overflow_any: 0.125
- sdwis_prior_1m_any: -0.087
- sdwis_cumulative_prior_count: -0.085
- overflow_repeat_3m_any: 0.067

### Persistence + precipitation

- sdwis_prior_3m_count: 0.487
- sdwis_prior_12m_count: 0.261
- sdwis_cumulative_prior_count: -0.095
- precip_total_mm: 0.09
- sdwis_prior_1m_any: -0.072
- heavy_rain_days: -0.052
- precip_max_1d_mm: 0.014
- precip_anomaly_z: 0.004

### Persistence + overflow + precipitation + interaction

- sdwis_prior_3m_count: 0.472
- sdwis_prior_12m_count: 0.25
- overflow_count: 0.186
- overflow_log_gallons_sum: -0.128
- overflow_any: 0.118
- sdwis_prior_1m_any: -0.09
- sdwis_cumulative_prior_count: -0.083
- overflow_repeat_3m_any: 0.063

### Persistence + EB baseline + overflow + precipitation + NWS flood

- county_eb_baseline: 1.747
- sdwis_prior_1m_any: -0.737
- sdwis_prior_3m_count: 0.167
- flood_warning_any: -0.108
- sdwis_cumulative_prior_count: -0.101
- flood_warning_count: -0.07
- overflow_any: -0.049
- overflow_x_flood_warning: 0.047

### Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow

- county_eb_baseline: 1.748
- sdwis_prior_1m_any: -0.733
- sdwis_prior_3m_count: 0.162
- flood_warning_any: -0.109
- sdwis_cumulative_prior_count: -0.099
- streamflow_extreme_high_any: 0.098
- streamflow_high_count: -0.094
- streamflow_extreme_low_any: 0.073

### Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought

- county_eb_baseline: 1.748
- sdwis_prior_1m_any: -0.733
- sdwis_prior_3m_count: 0.162
- flood_warning_any: -0.11
- sdwis_cumulative_prior_count: -0.099
- streamflow_extreme_high_any: 0.098
- streamflow_high_count: -0.094
- streamflow_extreme_low_any: 0.072

### Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat

- county_eb_baseline: 1.738
- sdwis_prior_1m_any: -0.724
- freeze_days: -0.207
- sdwis_prior_3m_count: 0.162
- flood_warning_any: -0.105
- sdwis_cumulative_prior_count: -0.103
- streamflow_extreme_high_any: 0.089
- streamflow_high_count: -0.089

### Persistence + overflow + precipitation + structural context

- sdwis_prior_3m_count: 0.463
- hydrology_context_score_current: 0.278
- sdwis_prior_12m_count: 0.238
- impaired_segments_current: 0.177
- sdwis_prior_1m_any: -0.13
- precip_anomaly_z: 0.114
- sdwis_cumulative_prior_count: -0.105
- permit_count_current: 0.103

### Persistence + EB baseline + overflow + precipitation + structural context

- county_eb_baseline: 1.728
- sdwis_prior_1m_any: -0.736
- sdwis_prior_3m_count: 0.171
- sdwis_cumulative_prior_count: -0.101
- hydrology_context_score_current: 0.064
- precip_anomaly_z: 0.061
- overflow_any: -0.059
- precip_total_mm: -0.055

## Interpretation notes

1. These are **first-pass predictive comparisons**, not causal estimates.
2. The logistic models are pooled across counties and do **not** yet include county fixed effects.
3. Structural columns are current-snapshot context features, not historical monthly backfills.
4. The precipitation layer is county-centroid Open-Meteo archive context, not a polygon-weighted county rainfall product.
5. This pass now includes precipitation, county-month flood/flash-flood warning context, nearest-gauge streamflow context, county-month drought context, and county-centroid temperature/heat context.

## Recommended next step

- Run the same ladder with **county fixed effects or county-demeaned features** for the main trigger specifications.
- Then consider a **formal partial-pooling county intercept model** or a higher-resolution **PWS-month** design, since the main remaining uncertainty is whether trigger timing becomes more informative at finer geographic resolution.

## Sources

- Open-Meteo Historical Weather API  
  https://open-meteo.com/en/docs/historical-weather-api
- Open-Meteo historical weather OpenAPI spec  
  https://github.com/open-meteo/open-meteo/blob/main/openapi_historical_weather_api.yml
- EPA Envirofacts SDWIS API  
  https://www.epa.gov/enviro/envirofacts-data-service-api
- Texas Open Data portal  
  https://data.texas.gov/
