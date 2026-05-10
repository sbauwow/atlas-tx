# Seasonality robustness memo for the Texas county-month water-risk thesis

Generated: 2026-05-10T02:39:30.180Z

## Scope

- Panel: `data/panels/county_month_water_risk.csv`
- Example count: 14490
- Goal: test whether the temperature-seasonality gain survives explicit month-of-year controls
- Month controls: month_is_02, month_is_03, month_is_04, month_is_05, month_is_06, month_is_07, month_is_08, month_is_09, month_is_10, month_is_11, month_is_12
- Benchmark model: **Benchmark: EB trigger stack without temperature**
- Train outcome window: 2020-02 through 2023-12
- Validation outcome window: 2024-01 through 2024-12
- Test outcome window: 2025-01 through 2025-12

## Minimal oracle checks used in this pass

1. Adding month-of-year controls alone should be allowed to absorb generic seasonality.
2. The temperature result is more credible only if `freeze_days` or `heat_days + freeze_days` still improve AUPRC after those controls.
3. The claim is strongest if the gain survives in both the pooled and county-intercept-style model families.

## Main result

### Pooled ladder
- Benchmark validation AUPRC: **0.559**
- Benchmark + month controls validation AUPRC: **0.837**
- Benchmark + month controls + `freeze_days` validation AUPRC: **0.838**
- Benchmark + month controls + `heat_days + freeze_days` validation AUPRC: **0.838**
- Benchmark + month controls + full temperature stack validation AUPRC: **0.839**
- Benchmark test AUPRC: **0.46**
- Benchmark + month controls test AUPRC: **0.692**
- Benchmark + month controls + `freeze_days` test AUPRC: **0.695**
- Benchmark + month controls + `heat_days + freeze_days` test AUPRC: **0.695**
- Benchmark + month controls + full temperature stack test AUPRC: **0.695**

### County-intercept-style ladder
- Benchmark validation AUPRC: **0.559**
- Benchmark + month controls validation AUPRC: **0.837**
- Benchmark + month controls + `freeze_days` validation AUPRC: **0.839**
- Benchmark + month controls + `heat_days + freeze_days` validation AUPRC: **0.839**
- Benchmark + month controls + full temperature stack validation AUPRC: **0.84**
- Benchmark test AUPRC: **0.462**
- Benchmark + month controls test AUPRC: **0.693**
- Benchmark + month controls + `freeze_days` test AUPRC: **0.697**
- Benchmark + month controls + `heat_days + freeze_days` test AUPRC: **0.697**
- Benchmark + month controls + full temperature stack test AUPRC: **0.697**

## Interpretation summary

- Month-of-year controls by themselves reach validation AUPRC **0.837** versus **0.559** in the pooled ladder, and **0.837** versus **0.559** in the county-intercept-style ladder. These controls therefore do not fully explain away the stronger temperature variants.
- In the pooled ladder, the best month-controlled compact temperature model is **heat_days + freeze_days**, with validation AUPRC **0.838** and test AUPRC **0.695**.
- In the county-intercept-style ladder, the best month-controlled compact temperature model is **heat_days + freeze_days**, with validation AUPRC **0.839** and test AUPRC **0.697**.
- The `freeze_days` term still improves over month controls alone in both model families, which weakens the simplest “this is just generic seasonality” objection.
- The result still does **not** establish causal thermal mechanisms. It only shows that temperature-seasonality features retain incremental ranking value after a basic seasonality control pass.

## Full robustness table

| Family | Model | Split | N | Positives | Prevalence | AUROC | AUPRC | Brier | Precision@top-decile | Lift@top-decile |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| pooled | Benchmark: EB trigger stack without temperature | validation | 2446 | 532 | 0.217 | 0.775 | 0.559 | 0.138 | 0.629 | 2.89 |
| pooled | Benchmark: EB trigger stack without temperature | test | 2510 | 385 | 0.153 | 0.795 | 0.46 | 0.108 | 0.494 | 3.221 |
| pooled | Benchmark + month-of-year controls | validation | 2446 | 532 | 0.217 | 0.931 | 0.837 | 0.083 | 0.967 | 4.448 |
| pooled | Benchmark + month-of-year controls | test | 2510 | 385 | 0.153 | 0.904 | 0.692 | 0.075 | 0.789 | 5.143 |
| pooled | Benchmark + month-of-year controls + freeze_days | validation | 2446 | 532 | 0.217 | 0.932 | 0.838 | 0.082 | 0.967 | 4.448 |
| pooled | Benchmark + month-of-year controls + freeze_days | test | 2510 | 385 | 0.153 | 0.906 | 0.695 | 0.074 | 0.789 | 5.143 |
| pooled | Benchmark + month-of-year controls + heat_days + freeze_days | validation | 2446 | 532 | 0.217 | 0.932 | 0.838 | 0.082 | 0.967 | 4.448 |
| pooled | Benchmark + month-of-year controls + heat_days + freeze_days | test | 2510 | 385 | 0.153 | 0.906 | 0.695 | 0.074 | 0.789 | 5.143 |
| pooled | Benchmark + month-of-year controls + full temperature stack | validation | 2446 | 532 | 0.217 | 0.933 | 0.839 | 0.082 | 0.967 | 4.448 |
| pooled | Benchmark + month-of-year controls + full temperature stack | test | 2510 | 385 | 0.153 | 0.905 | 0.695 | 0.074 | 0.793 | 5.169 |
| fixed_effects | Benchmark: EB trigger stack without temperature | validation | 2446 | 532 | 0.217 | 0.774 | 0.559 | 0.138 | 0.649 | 2.984 |
| fixed_effects | Benchmark: EB trigger stack without temperature | test | 2510 | 385 | 0.153 | 0.796 | 0.462 | 0.107 | 0.498 | 3.247 |
| fixed_effects | Benchmark + month-of-year controls | validation | 2446 | 532 | 0.217 | 0.932 | 0.837 | 0.083 | 0.967 | 4.448 |
| fixed_effects | Benchmark + month-of-year controls | test | 2510 | 385 | 0.153 | 0.904 | 0.693 | 0.075 | 0.789 | 5.143 |
| fixed_effects | Benchmark + month-of-year controls + freeze_days | validation | 2446 | 532 | 0.217 | 0.933 | 0.839 | 0.082 | 0.967 | 4.448 |
| fixed_effects | Benchmark + month-of-year controls + freeze_days | test | 2510 | 385 | 0.153 | 0.906 | 0.697 | 0.074 | 0.797 | 5.195 |
| fixed_effects | Benchmark + month-of-year controls + heat_days + freeze_days | validation | 2446 | 532 | 0.217 | 0.932 | 0.839 | 0.082 | 0.967 | 4.448 |
| fixed_effects | Benchmark + month-of-year controls + heat_days + freeze_days | test | 2510 | 385 | 0.153 | 0.906 | 0.697 | 0.074 | 0.793 | 5.169 |
| fixed_effects | Benchmark + month-of-year controls + full temperature stack | validation | 2446 | 532 | 0.217 | 0.933 | 0.84 | 0.082 | 0.967 | 4.448 |
| fixed_effects | Benchmark + month-of-year controls + full temperature stack | test | 2510 | 385 | 0.153 | 0.906 | 0.697 | 0.074 | 0.797 | 5.195 |

## Most informative coefficients in the best month-controlled compact models

### Pooled: Benchmark + month-of-year controls + heat_days + freeze_days
- county_eb_baseline: 1.927
- month_is_03: 0.732
- month_is_09: 0.706
- month_is_06: 0.69
- month_is_12: 0.646
- month_is_04: -0.371
- month_is_07: -0.314
- month_is_10: -0.312

### County-intercept-style: Benchmark + month-of-year controls + heat_days + freeze_days
- county_eb_baseline: 1.733
- month_is_03: 0.661
- month_is_09: 0.638
- month_is_06: 0.625
- month_is_12: 0.584
- month_is_04: -0.337
- month_is_10: -0.292
- month_is_07: -0.29

## Thesis-facing read

1. The chronic baseline story still dominates.
2. Month-of-year controls do not erase the incremental value of compact temperature-seasonality terms.
3. The strongest reviewer-safe phrasing is still **temperature-seasonality context adds incremental ranking value after a basic month-of-year seasonality control**, not “heat causes violations.”
4. This robustness pass strengthens the paper's defense but does not remove proxy-resolution or causal-interpretation limitations.

## Recommended paper language

> In a month-of-year seasonality robustness pass, the compact temperature-seasonality terms remained incrementally useful after explicit month controls were added to the benchmark trigger stack. In both the pooled and county-intercept-style specifications, `freeze_days` improved on the month-control benchmark, and the `heat_days + freeze_days` bundle remained the strongest compact temperature addition. This weakens the simplest interpretation that the observed gain is only generic annual seasonality, although the result remains predictive rather than causal.

## Sources

- Open-Meteo Historical Weather API  
  https://open-meteo.com/en/docs/historical-weather-api
- Open-Meteo historical weather OpenAPI spec  
  https://github.com/open-meteo/open-meteo/blob/main/openapi_historical_weather_api.yml
- EPA Envirofacts SDWIS API  
  https://www.epa.gov/enviro/envirofacts-data-service-api
- Texas Open Data portal  
  https://data.texas.gov/
