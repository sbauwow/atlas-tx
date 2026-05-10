# Within-county / fixed-effects precipitation-trigger backtest

Generated: 2026-05-09T20:37:42.280Z

## Scope

- Panel: `data/panels/county_month_water_risk.csv`
- Horizon: predict **any county-month SDWIS health-based event at (t+1)** from month (t) features
- Example count: 14490
- Train outcome window: 2020-02 through 2023-12
- Validation outcome window: 2024-01 through 2024-12
- Test outcome window: 2025-01 through 2025-12
- Design: pooled logistic models with **county-specific intercepts** to approximate a within-county / fixed-effects comparison
- EB county baseline prior mean: 0.159
- EB county baseline prior strength: 2.792

## Model ladder

| Model | Split | N | Positives | Prevalence | AUROC | AUPRC | Brier | Precision@top-decile | Lift@top-decile |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| County FE + persistence | train | 9534 | 1527 | 0.16 | 0.852 | 0.46 | 0.123 | 0.505 | 3.151 |
| County FE + persistence | validation | 2446 | 532 | 0.217 | 0.737 | 0.411 | 0.164 | 0.482 | 2.214 |
| County FE + persistence | test | 2510 | 385 | 0.153 | 0.82 | 0.417 | 0.117 | 0.466 | 3.039 |
| County FE + persistence + EB baseline | train | 9534 | 1527 | 0.16 | 0.879 | 0.612 | 0.091 | 0.625 | 3.905 |
| County FE + persistence + EB baseline | validation | 2446 | 532 | 0.217 | 0.773 | 0.559 | 0.138 | 0.645 | 2.965 |
| County FE + persistence + EB baseline | test | 2510 | 385 | 0.153 | 0.799 | 0.463 | 0.106 | 0.502 | 3.273 |
| County FE + persistence + overflow | train | 9534 | 1527 | 0.16 | 0.826 | 0.431 | 0.122 | 0.487 | 3.04 |
| County FE + persistence + overflow | validation | 2446 | 532 | 0.217 | 0.729 | 0.406 | 0.163 | 0.465 | 2.139 |
| County FE + persistence + overflow | test | 2510 | 385 | 0.153 | 0.81 | 0.404 | 0.116 | 0.45 | 2.935 |
| County FE + persistence + precipitation | train | 9534 | 1527 | 0.16 | 0.838 | 0.448 | 0.123 | 0.503 | 3.138 |
| County FE + persistence + precipitation | validation | 2446 | 532 | 0.217 | 0.734 | 0.407 | 0.164 | 0.478 | 2.196 |
| County FE + persistence + precipitation | test | 2510 | 385 | 0.153 | 0.815 | 0.41 | 0.117 | 0.454 | 2.961 |
| County FE + persistence + overflow + precipitation + interaction | train | 9534 | 1527 | 0.16 | 0.818 | 0.427 | 0.122 | 0.485 | 3.027 |
| County FE + persistence + overflow + precipitation + interaction | validation | 2446 | 532 | 0.217 | 0.74 | 0.411 | 0.163 | 0.457 | 2.102 |
| County FE + persistence + overflow + precipitation + interaction | test | 2510 | 385 | 0.153 | 0.809 | 0.401 | 0.116 | 0.458 | 2.987 |
| County FE + persistence + EB baseline + overflow + precipitation + NWS flood | train | 9534 | 1527 | 0.16 | 0.879 | 0.616 | 0.09 | 0.633 | 3.951 |
| County FE + persistence + EB baseline + overflow + precipitation + NWS flood | validation | 2446 | 532 | 0.217 | 0.777 | 0.564 | 0.137 | 0.649 | 2.984 |
| County FE + persistence + EB baseline + overflow + precipitation + NWS flood | test | 2510 | 385 | 0.153 | 0.797 | 0.459 | 0.107 | 0.494 | 3.221 |
| County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow | train | 9534 | 1527 | 0.16 | 0.88 | 0.621 | 0.09 | 0.639 | 3.99 |
| County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow | validation | 2446 | 532 | 0.217 | 0.775 | 0.559 | 0.138 | 0.653 | 3.003 |
| County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow | test | 2510 | 385 | 0.153 | 0.796 | 0.462 | 0.107 | 0.498 | 3.247 |
| County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought | train | 9534 | 1527 | 0.16 | 0.88 | 0.62 | 0.09 | 0.639 | 3.99 |
| County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought | validation | 2446 | 532 | 0.217 | 0.774 | 0.559 | 0.138 | 0.649 | 2.984 |
| County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought | test | 2510 | 385 | 0.153 | 0.796 | 0.462 | 0.107 | 0.498 | 3.247 |
| County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat | train | 9534 | 1527 | 0.16 | 0.88 | 0.624 | 0.089 | 0.645 | 4.029 |
| County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat | validation | 2446 | 532 | 0.217 | 0.789 | 0.578 | 0.136 | 0.686 | 3.153 |
| County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat | test | 2510 | 385 | 0.153 | 0.807 | 0.478 | 0.105 | 0.498 | 3.247 |
| County FE + persistence + EB baseline + overflow + precipitation + interaction | train | 9534 | 1527 | 0.16 | 0.878 | 0.614 | 0.09 | 0.629 | 3.924 |
| County FE + persistence + EB baseline + overflow + precipitation + interaction | validation | 2446 | 532 | 0.217 | 0.778 | 0.567 | 0.137 | 0.661 | 3.04 |
| County FE + persistence + EB baseline + overflow + precipitation + interaction | test | 2510 | 385 | 0.153 | 0.797 | 0.459 | 0.107 | 0.486 | 3.169 |

## Main read

- Best validation AUPRC in this within-county pass: **County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat** with validation AUPRC **0.578** and test AUPRC **0.478**.
- The question here is narrower than in the pooled ladder: do overflow and precipitation help *after allowing each county to have its own baseline propensity*?
- If incremental gains stay small here, that is evidence that the trigger layers are weaker than the chronic county-risk story.

## Coefficient snapshots

### County FE + persistence

- County intercept count: 207
- Mean absolute county intercept: 0.026
- sdwis_prior_3m_count: 0.437
- sdwis_prior_12m_count: 0.249
- sdwis_prior_1m_any: -0.075
- sdwis_cumulative_prior_count: -0.047

### County FE + persistence + EB baseline

- County intercept count: 207
- Mean absolute county intercept: 0.008
- county_eb_baseline: 1.634
- sdwis_prior_1m_any: -0.68
- sdwis_prior_3m_count: 0.157
- sdwis_cumulative_prior_count: -0.093
- sdwis_prior_12m_count: 0.021

### County FE + persistence + overflow

- County intercept count: 207
- Mean absolute county intercept: 0.025
- sdwis_prior_3m_count: 0.423
- sdwis_prior_12m_count: 0.239
- overflow_count: 0.159
- overflow_any: 0.103
- overflow_log_gallons_sum: -0.098
- sdwis_prior_1m_any: -0.094
- overflow_repeat_3m_any: 0.07
- overflow_severe_any: -0.047

### County FE + persistence + precipitation

- County intercept count: 207
- Mean absolute county intercept: 0.026
- sdwis_prior_3m_count: 0.437
- sdwis_prior_12m_count: 0.249
- sdwis_prior_1m_any: -0.079
- precip_total_mm: 0.076
- sdwis_cumulative_prior_count: -0.045
- heavy_rain_days: -0.044
- precip_max_1d_mm: 0.017
- precip_anomaly_z: 0.006

### County FE + persistence + overflow + precipitation + interaction

- County intercept count: 207
- Mean absolute county intercept: 0.025
- sdwis_prior_3m_count: 0.424
- sdwis_prior_12m_count: 0.24
- overflow_count: 0.179
- overflow_log_gallons_sum: -0.098
- overflow_any: 0.097
- sdwis_prior_1m_any: -0.097
- overflow_repeat_3m_any: 0.066
- heavy_rain_days: -0.054

### County FE + persistence + EB baseline + overflow + precipitation + NWS flood

- County intercept count: 207
- Mean absolute county intercept: 0.008
- county_eb_baseline: 1.634
- sdwis_prior_1m_any: -0.676
- sdwis_prior_3m_count: 0.157
- flood_warning_any: -0.099
- sdwis_cumulative_prior_count: -0.09
- flood_warning_count: -0.064
- overflow_x_flood_warning: 0.04
- overflow_severe_any: -0.036

### County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow

- County intercept count: 207
- Mean absolute county intercept: 0.008
- county_eb_baseline: 1.634
- sdwis_prior_1m_any: -0.673
- sdwis_prior_3m_count: 0.152
- flood_warning_any: -0.1
- sdwis_cumulative_prior_count: -0.087
- streamflow_extreme_high_any: 0.083
- streamflow_high_count: -0.075
- streamflow_extreme_low_any: 0.071

### County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought

- County intercept count: 207
- Mean absolute county intercept: 0.008
- county_eb_baseline: 1.634
- sdwis_prior_1m_any: -0.673
- sdwis_prior_3m_count: 0.152
- flood_warning_any: -0.101
- sdwis_cumulative_prior_count: -0.087
- streamflow_extreme_high_any: 0.083
- streamflow_high_count: -0.075
- streamflow_extreme_low_any: 0.07

### County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat

- County intercept count: 207
- Mean absolute county intercept: 0.008
- county_eb_baseline: 1.624
- sdwis_prior_1m_any: -0.664
- freeze_days: -0.197
- sdwis_prior_3m_count: 0.152
- flood_warning_any: -0.097
- sdwis_cumulative_prior_count: -0.09
- streamflow_extreme_high_any: 0.076
- streamflow_extreme_low_any: 0.075

### County FE + persistence + EB baseline + overflow + precipitation + interaction

- County intercept count: 207
- Mean absolute county intercept: 0.008
- county_eb_baseline: 1.634
- sdwis_prior_1m_any: -0.679
- sdwis_prior_3m_count: 0.156
- sdwis_cumulative_prior_count: -0.09
- precip_anomaly_z: 0.038
- overflow_severe_any: -0.038
- heavy_rain_days: -0.035
- overflow_any: -0.033

## Interpretation notes

1. This is a first-pass fixed-effects-style approximation using county intercepts, not a full conditional logit implementation.
2. The key comparison is against the earlier pooled ladder: if overflow/precipitation effects shrink materially once county baselines are absorbed, they are behaving more like place markers than universal triggers.
3. Precipitation still means county-centroid Open-Meteo archive context only.
4. This pass now includes county-month NWS flood/flash-flood warning context, nearest-gauge streamflow context, county-month drought context, and county-centroid temperature/heat context.

## Sources

- Open-Meteo Historical Weather API  
  https://open-meteo.com/en/docs/historical-weather-api
- Open-Meteo historical weather OpenAPI spec  
  https://github.com/open-meteo/open-meteo/blob/main/openapi_historical_weather_api.yml
- EPA Envirofacts SDWIS API  
  https://www.epa.gov/enviro/envirofacts-data-service-api
- Texas Open Data portal  
  https://data.texas.gov/
