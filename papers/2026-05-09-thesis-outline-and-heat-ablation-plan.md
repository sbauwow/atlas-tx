# Thesis outline and heat-ablation plan

Generated: 2026-05-09

## Purpose

This document combines two next-step deliverables for the Atlas TX county-month water-risk thesis:

1. a paper-ready thesis outline, and
2. a focused heat-ablation plan designed to test whether the latest heat gain is robust, interpretable, and worth emphasizing in the final writeup.

The current empirical position is:
- chronic county baseline risk is the dominant predictive component,
- empirical-Bayes shrinkage materially improves baseline-risk encoding,
- most non-heat trigger layers add only modest incremental value, and
- heat is the first trigger layer that clearly improves next-month SDWIS ranking performance in both pooled and county-FE-style ladders.

---

# Part I — Thesis / paper outline

## Working title options

### Option A
**Chronic baseline risk and heat-related trigger context in Texas county-month drinking-water violation prediction**

### Option B
**Ranking next-month drinking-water risk in Texas: persistent county baselines, empirical-Bayes shrinkage, and incremental heat context**

### Option C
**Beyond rainfall: chronic county risk and heat context in a Texas county-month SDWIS backtest**

Recommended current choice: **Option B**.

It best matches the actual contribution:
- predictive ranking,
- county-month design,
- stabilized baseline risk,
- incremental heat result.

---

## Abstract skeleton

This study builds a reproducible Texas county-month panel linking SDWIS health-based violation outcomes to sewer overflows, precipitation, flood-warning context, nearest-gauge streamflow, drought, and temperature/heat proxies from 2020-01 through 2025-12. We evaluate pooled and county fixed-effects-style predictive ladders for next-month county SDWIS event occurrence. Across model families, persistent county baseline risk dominates short-run trigger layers, and an empirical-Bayes county baseline materially improves ranking performance. Precipitation, flood-warning, streamflow, and drought layers add limited incremental value beyond baseline risk. In contrast, county-month heat context produces the clearest improvement in both pooled and within-county-style backtests. The resulting evidence supports a cautious predictive interpretation: stabilized chronic county risk is the primary signal, while heat-related context adds measurable incremental ranking value. We frame these results as predictive association and contextual interpretation rather than causal proof.

---

## 1. Introduction

### 1.1 Motivation
- Drinking-water risk is often discussed through isolated events, but public-risk monitoring may benefit from a reproducible county-month panel that integrates regulatory outcomes with contextual trigger layers.
- Many plausible signals exist: sewer overflows, rainfall, flooding, drought, hydrology, and seasonal temperature stress.
- The practical question is not only whether these signals correlate with outcomes, but whether they improve **next-month ranking utility** beyond persistent county-level baseline differences.

### 1.2 Problem statement
We ask:
1. How much predictive signal comes from persistent county baseline risk?
2. Do trigger layers improve next-month SDWIS event ranking beyond that baseline?
3. Which contextual layers are most informative in a county-month design?

### 1.3 Contribution claims
The paper should claim the following, and no more:

1. **Data contribution**: a reproducible Texas county-month panel linking SDWIS events to overflow, precipitation, warning, streamflow, drought, and heat context.
2. **Method contribution**: a simple empirical-Bayes county baseline provides a strong small-area stabilization baseline for county-month event prediction.
3. **Empirical contribution**: chronic county baseline risk dominates most short-run trigger layers, but heat context adds measurable incremental predictive value.
4. **Practical contribution**: county-month water-risk monitoring may benefit more from baseline stabilization plus selected contextual layers than from naive event-trigger stacking.

### 1.4 Non-claims
Do not claim:
- causal identification,
- direct measurement of exposure,
- that county-centroid air temperature equals water temperature,
- that county-month is the final operational resolution.

---

## 2. Related framing / literature positioning

This section should situate the work against:
- SDWIS- or compliance-based drinking-water risk monitoring
- environmental early-warning / surveillance systems
- small-area estimation / empirical-Bayes stabilization
- hydrometeorological context for water-quality or treatment-stress interpretation

The key positioning point is:

> This paper is not trying to replace mechanistic hydrology or causal environmental epidemiology. It is building a pragmatic, explainable county-month risk-ranking pipeline from public data and testing what actually improves holdout ranking performance.

---

## 3. Data and panel construction

### 3.1 Unit of observation
- Texas county-month
- 254 counties
- 72 months
- 2020-01 through 2025-12
- 18,288 rows

### 3.2 Outcome
- `sdwis_event_any`
- `sdwis_event_count`
- health-based SDWIS violation episodes aggregated to county-month

### 3.3 Predictor families
#### Persistence / outcome-history features
- `sdwis_prior_1m_any`
- `sdwis_prior_3m_count`
- `sdwis_prior_6m_count`
- `sdwis_prior_12m_count`
- `sdwis_cumulative_prior_count`

#### Overflow features
- monthly overflow count / gallons / severity / recent repeat terms

#### Structural context
- permit count
- impaired segments
- hydrology context score

#### Weather / hydrometeorological context
- precipitation
- NWS flood / flash-flood warnings
- nearest-gauge streamflow
- drought
- temperature / heat

### 3.4 Data provenance and proxies
Be explicit that:
- precipitation and temperature are county-centroid Open-Meteo archive proxies
- streamflow is nearest-gauge county-centroid assignment
- drought is based on weekly U.S. Drought Monitor county statistics aggregated to month
- flood warnings come from historical OpenFEMA IPAWS filtering

### 3.5 Missingness and usable rows
- all 18,288 rows now have drought and temperature context
- trigger-model usable rows remain capped by streamflow coverage: 14,698

---

## 4. Methods

### 4.1 Prediction target
Predict whether county-month \(t\) features improve ranking of **SDWIS event occurrence at \(t+1\)**.

### 4.2 Split design
- train: 2020-02 through 2023-12
- validation: 2024-01 through 2024-12
- test: 2025-01 through 2025-12

### 4.3 Model ladder
#### Pooled ladder
- prevalence baseline
- persistence only
- persistence + EB county baseline
- overflow / precipitation layers
- enriched trigger stacks
- structural context comparison

#### County-FE-style ladder
- pooled logistic with county-specific intercepts
- same trigger-stack progression

### 4.4 EB county baseline
Explain that the EB term is a small-area stabilization device for county baseline risk, not a final classifier by itself.

### 4.5 Evaluation metrics
- AUPRC
- AUROC
- Brier score
- precision at top decile
- lift at top decile

Primary emphasis should remain on **AUPRC** because the event is imbalanced and ranking utility is the practical target.

---

## 5. Results

### 5.1 Baseline dominance result
Show that persistence and EB baseline dominate most trigger layers.

### 5.2 Modest gains from non-heat trigger layers
Report that precipitation, flood warnings, streamflow, and drought contribute little beyond EB baseline risk.

### 5.3 Heat result
Current key result:

#### Pooled best model
**Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat**
- validation AUPRC: **0.578**
- test AUPRC: **0.475**

#### FE-style best model
**County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat**
- validation AUPRC: **0.578**
- test AUPRC: **0.478**

### 5.4 Interpretive statement
The paper should say:

> Heat is the first contextual trigger layer in this stack that clearly improves holdout ranking performance beyond stabilized chronic county baseline risk and the previously added hydrometeorological proxies.

Not:
- “heat causes violations,”
- “weather is the main story,”
- or “the trigger stack dominates persistent risk.”

---

## 6. Discussion

### 6.1 Main interpretation
- chronic risk matters more than most short-run triggers
- baseline stabilization is crucial
- contextual weather layers are not all equally informative
- heat may capture treatment stress, seasonal infrastructure vulnerability, or unmeasured seasonal conditions better than the other tested proxies

### 6.2 Why heat may matter more
Candidate interpretations:
- heat may better capture seasonal system stress than monthly precipitation totals
- thermal stress may co-move with treatment burden, source-water quality changes, or operational strain
- heat may function partly as a better-timed seasonal risk proxy than drought category or streamflow anomaly alone

### 6.3 Why county-month still matters despite coarse resolution
- good for statewide reproducible public-data ranking
- enough to identify chronic-vs-trigger tradeoffs
- useful bridge to PWS-month follow-on work

---

## 7. Limitations

Must include all of these explicitly:
- county-month is coarse and may hide system-level timing
- county-centroid precipitation and temperature are proxies, not county-integrated exposure measures
- nearest-gauge streamflow assignment is approximate
- fixed-effects-style pass is not a full hierarchical or conditional-logit solution
- predictive association is not causal identification
- SDWIS event timing reflects regulatory records, not perfect real-time exposure timing

---

## 8. Conclusion

Suggested conclusion shape:

1. A reproducible county-month panel can support practical public-data water-risk ranking.
2. Chronic baseline heterogeneity dominates naive trigger stories.
3. Empirical-Bayes shrinkage is a strong and useful stabilizer.
4. Heat is the first trigger layer in the stack that clearly improves next-month ranking performance.
5. The natural next step is finer-resolution modeling or formal partial pooling.

---

## 9. Figures and tables to include

### Core tables
1. Panel coverage table
2. Model ladder table — pooled
3. Model ladder table — FE-style
4. Heat ablation table

### Core figures
1. Pipeline / panel construction diagram
2. AUPRC comparison bar chart across model ladders
3. Validation vs test AUPRC comparison for enriched trigger stacks
4. Optional county baseline distribution / EB shrinkage visualization

---

# Part II — Heat ablation plan

## Objective

Determine whether the heat improvement is:
1. real,
2. robust,
3. interpretable,
4. and narrow enough to write up honestly.

---

## Main ablation questions

### Q1. Which heat term is driving the gain?
Candidate features:
- `temp_mean_anomaly_z`
- `heat_days`
- `freeze_days`
- `overflow_x_heat`

### Q2. Is the gain additive or interaction-driven?
- Does heat help on its own?
- Or only when combined with overflow burden?

### Q3. Does heat help mostly in pooled comparisons, or does it survive within-county-style comparison?
Current evidence suggests it survives both, but this should be pressure-tested explicitly.

### Q4. Is the gain seasonal?
- concentrated in summer holdout months?
- stable across years?

### Q5. Is the gain mostly chronic-seasonal proxying, or true incremental trigger timing?
This is the hardest interpretive question.

---

## Proposed ablation ladder

Use the current best non-heat model as the benchmark:

**Benchmark**
- Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought

Then test:

### A. Single heat-term additions
1. benchmark + `temp_mean_anomaly_z`
2. benchmark + `heat_days`
3. benchmark + `freeze_days`
4. benchmark + `overflow_x_heat` alone only if parent terms are present appropriately

### B. Small heat bundles
5. benchmark + (`temp_mean_anomaly_z`, `heat_days`)
6. benchmark + (`heat_days`, `freeze_days`)
7. benchmark + (`temp_mean_anomaly_z`, `heat_days`, `freeze_days`)

### C. Full heat stack
8. benchmark + (`temp_mean_anomaly_z`, `heat_days`, `freeze_days`, `overflow_x_heat`)

Run the same ladder in:
- pooled model family
- county-FE-style model family

---

## Minimal decision rules

### Evidence that heat is real enough to emphasize
Emphasize heat in the thesis if:
- it improves validation AUPRC in both pooled and FE-style ladders,
- test AUPRC does not collapse,
- and at least one heat term remains useful outside an overfit interaction-only specification.

### Evidence that heat should be downplayed
Downplay heat if:
- all gains disappear when decomposed,
- only one noisy interaction term drives the effect,
- or the result is purely validation-only and vanishes in test.

---

## Additional robustness checks

### 1. Seasonal holdout summary
Report performance separately for:
- warm months
- cool months

Goal:
- check whether heat gain is just trivial summer tagging or a broader ranking improvement

### 2. Coefficient inspection
For top heat models, inspect the largest standardized coefficients:
- sign
- stability across pooled vs FE-style
- whether `heat_days` or `temp_mean_anomaly_z` dominates

### 3. Calibration sanity check
Because AUPRC may improve from better ranking rather than better calibration, also check whether Brier improves modestly and consistently.

### 4. Simpler benchmark check
Compare heat against:
- EB baseline only
- EB baseline + overflow
- EB baseline + all previous non-heat trigger layers

This guards against overstating the gain relative to the most relevant baseline.

---

## Proposed artifact

Recommended single durable output:
- `outputs/thesis-status/2026-05-09-heat-ablation-memo.md`

Contents:
- benchmark model table
- ablation ladder table
- pooled and FE-style results
- coefficient snapshots
- interpretation and caveats

---

## Expected interpretive outcomes

### Outcome A — Strong heat result survives
Then the thesis should clearly foreground heat as the standout trigger layer.

### Outcome B — Heat decomposes into one useful term
Then the thesis should foreground that one term, likely `heat_days` or `temp_mean_anomaly_z`, not the whole generic heat stack.

### Outcome C — Heat gain weakens materially after ablation
Then the thesis should still mention the preliminary gain, but move the emphasis back toward the chronic-baseline and EB-shrinkage contribution.

---

## Recommended execution order

1. Build pooled heat ablation ladder
2. Build FE-style heat ablation ladder
3. Compare validation and test AUPRC side by side
4. Inspect coefficient snapshots
5. Write heat-ablation memo
6. Convert this outline plus memo into the full paper draft

---

## Current recommendation

The project is ready to move from “pipeline-building” to “thesis-writing with one more robustness pass.”

Most efficient next sequence:

1. run the heat ablation,
2. write the heat memo,
3. draft the paper directly from the outline above.

## Sources

- Open-Meteo Historical Weather API  
  https://open-meteo.com/en/docs/historical-weather-api
- Open-Meteo historical weather OpenAPI spec  
  https://github.com/open-meteo/open-meteo/blob/main/openapi_historical_weather_api.yml
- U.S. Drought Monitor web service docs  
  https://droughtmonitor.unl.edu/DmData/DataDownload/WebServiceInfo.aspx
- USGS Water Services overview  
  https://www.usgs.gov/tools/usgs-water-services
- OpenFEMA IPAWS Archived Alerts  
  https://www.fema.gov/openfema-data-page/ipaws-archived-alerts-v1
