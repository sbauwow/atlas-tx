# Paper-ready panel specification and experiment plan

_Date: 2026-05-09_

## Summary

This document converts the current Atlas TX water-risk work into a **paper-ready empirical design**.

It defines:
- the primary research questions,
- the panel unit(s) of analysis,
- exact outcome and feature families,
- lead/lag windows,
- baseline and enriched models,
- validation and falsification tests,
- deliverable tables/figures,
- and a secondary **phone color-strip collection** track for future field validation and community data collection.

The intended first paper should stay focused on **Texas drinking-water risk indicators**. The phone color-strip collection should be treated as a **future validation / augmentation module**, not the paper’s core identification strategy.

---

## 1. Paper objective

### Working title

**Leading and lagging indicators of drinking-water risk in Texas: a reproducible panel study of SDWIS, sewer overflows, structural context, and hydrometeorological triggers**

### Core question

Which publicly available signals are most useful for:
1. predicting later **health-based SDWIS drinking-water violations**,
2. distinguishing **chronic structural risk** from **short-run event triggers**, and
3. supporting public-interest monitoring without overstating causality?

### Secondary question

Can a future **phone color-strip collection** protocol provide low-cost field validation or supplementary ground-truth for community-facing water-risk monitoring?

---

## 2. Main design choice: two linked panels

We should explicitly define **two empirical panels**.

## Panel A — county-month panel

This is the practical first paper panel because the data already join reasonably at county level.

### Unit
- county \(c\)
- month \(t\)

### Coverage target
- Texas counties
- monthly observations
- preferred period: **2020-01 through latest complete month**

### Strengths
- feasible now with current Atlas TX data assets
- enough coverage for weather, overflow, permits, surface-water context, and SDWIS aggregation
- suitable for first publishable descriptive / predictive paper

### Weaknesses
- county joins blur exposure pathways
- county-level matching may mix distinct public water systems (PWSs)
- limited causal precision

## Panel B — PWS-month panel

This is the stronger follow-on panel if data cleaning allows it.

### Unit
- public water system \(p\)
- month \(t\)

### Coverage target
- all Texas PWSs with stable identifiers and county/service-area linkage
- monthly observations over the overlapping historical window

### Strengths
- better alignment between SDWIS outcome and operational history
- stronger causal timing tests
- more compelling journal contribution

### Weaknesses
- much harder entity resolution
- overflow and environmental exposure linkage may be noisy unless geocoded
- requires more effort than the county paper baseline

## Recommendation

For the immediate paper:
- **primary analysis = county-month panel**
- **robustness / future extension = PWS-month panel**

---

## 3. Outcome definitions

Outcomes should be explicitly tiered.

## Primary outcome

### O1. Any health-based SDWIS violation in month \(t\)

Binary variable:
\[
Y^{(bin)}_{c,t} = \mathbb{1}(\text{at least one unique health-based SDWIS violation episode in county } c \text{ during month } t)
\]

This is the clearest outcome for lead/lag trigger tests.

## Secondary outcomes

### O2. Count of unique health-based SDWIS violation episodes in month \(t\)

Count variable:
\[
Y^{(count)}_{c,t} = \text{number of unique health-based SDWIS episodes in county } c \text{ during month } t
\]

### O3. Population-weighted SDWIS burden

If feasible from available SDWIS metadata:
\[
Y^{(pop)}_{c,t} = \sum_{i \in \text{events}_{c,t}} w_i
\]
where \(w_i\) could reflect population served, violation seriousness, or notification tier.

### O4. Recurrence outcome

Binary variable for whether a county or PWS with an event in month \(t\) experiences another event in \([t+1, t+3]\) or \([t+1, t+6]\).

## Outcome deduplication rule

Use one canonical event-episode dedupe rule and freeze it.

Recommended rule:
- unique by `(pwsid, violationId, complPerBeginDate)` where available
- if a component is missing, fall back to the most stable documented combination

Sensitivity analyses should compare at least one alternate dedupe rule.

---

## 4. Predictor families

## A. Persistence features

These are the baseline features every model should include or be benchmarked against.

### Monthly persistence
- SDWIS count in \(t-1\)
- SDWIS count in previous 3 months
- SDWIS count in previous 12 months
- indicator for any SDWIS event in previous 1/3/6/12 months

### Chronic-history persistence
- cumulative SDWIS burden from training period start to \(t-1\)
- rolling average violation rate
- repeated-episode indicator

### Why these matter

These are likely to dominate predictive performance. That is not a nuisance; it is a major paper result.

## B. Sewer overflow trigger features

From TCEQ sanitary sewer overflow data.

### Monthly features
- any overflow in month \(t\)
- overflow count in month \(t\)
- total reported gallons in month \(t\)
- log gallons in month \(t\)
- severe overflow indicator (e.g. top decile or top quartile gallons)

### Rolling features
- overflow count in prior 3 months
- overflow gallons in prior 3 months
- repeated-overflow indicator in prior 3 months
- months since last overflow

### Optional severity refinements
- count of spills reaching water in month \(t\)
- count of unusually large spills
- count weighted by receiving environment type if available

## C. Structural context features

These are mostly slow-moving and should be interpreted as between-county risk context.

### Existing Atlas-friendly candidates
- permit count current
- impaired surface-water segment count current
- hydrology context summary
- county urban/rural proxy if added later
- population proxy if available

### Additional desirable candidates
- system count per county
- mean PWS size or population served
- governance fragmentation proxy
- watershed / basin fixed effects

## D. Weather and hydrometeorological features

This is the highest-priority missing block.

### Precipitation
For each county-month:
- total precipitation in month \(t\)
- anomaly relative to county-month climatology
- max 1-day precipitation in month \(t\)
- number of heavy-rain days above threshold
- rolling precipitation in prior 7/30/90 days if daily panel intermediates are used

### Temperature / heat
- mean temperature anomaly
- max temperature anomaly
- count of extreme heat days
- count of freeze days if relevant for infrastructure stress

### Drought
- drought category summary for county-month
- fraction of county in D0–D4
- drought persistence indicators

### Flood / NWS alerts
- count of flood-related warnings/watch/advisory events in month \(t\)
- any flash-flood warning
- any flood warning
- total alert-days or county-alert overlaps

### Streamflow / hydrology
- streamflow anomaly class
- count of gauges in high-flow category
- count of gauges in low-flow category
- county summary of abnormal flow persistence

## E. Interaction features

These may be the most scientifically interesting predictors.

### Priority interactions
- overflow × heavy precipitation anomaly
- overflow × flood warning presence
- overflow × high streamflow anomaly
- overflow × drought severity
- overflow × heat anomaly

### Interpretation goal

These interactions test whether overflow events are more consequential when embedded in hydrologic stress.

---

## 5. Lead/lag specification

This must be explicit and frozen early.

## Main horizons

For feature vector observed at month \(t\), predict outcomes at:
- \(t+0\) contemporaneous association
- \(t+1\) short lead
- \(t+2\)
- \(t+3\)

## Secondary horizons
- \(t+6\)
- \(t+12\) for structural-risk models only

## Why these windows

- \(t+0\) helps descriptive interpretation but is not a true forecasting horizon
- \(t+1\) through \(t+3\) are the main trigger windows
- longer horizons are better for structural-risk and persistence questions

## Event-study extension

If daily event dates can be handled robustly, create lead/lag bins around overflow or extreme-weather events:
- lead bins: \(-3, -2, -1\) months
- event month: 0
- lag bins: \(+1, +2, +3\) months

This is useful mainly to inspect timing asymmetry rather than claim strict causality.

---

## 6. Data table specification

## Canonical county-month table

Suggested file:
- `data/panels/county_month_water_risk.parquet` or CSV if needed

### Keys
- `county_fips`
- `county_name`
- `year`
- `month`
- `year_month`

### Outcome columns
- `sdwis_event_any`
- `sdwis_event_count`
- `sdwis_event_weighted`
- `sdwis_prior_1m_any`
- `sdwis_prior_3m_count`
- `sdwis_prior_12m_count`

### Overflow columns
- `overflow_any`
- `overflow_count`
- `overflow_gallons`
- `overflow_log_gallons`
- `overflow_severe_any`
- `overflow_count_3m`
- `overflow_gallons_3m`
- `overflow_repeat_3m`
- `months_since_overflow`

### Structural columns
- `permit_count_current`
- `impaired_segments_current`
- `hydrology_alert_score_current`
- `county_population` if available
- `pws_count` if available

### Weather/hydrology columns
- `precip_total_mm`
- `precip_anomaly_z`
- `heavy_rain_days`
- `temp_mean_anomaly_z`
- `heat_days`
- `freeze_days`
- `drought_fraction_d1plus`
- `drought_fraction_d3plus`
- `flood_warning_any`
- `flood_warning_count`
- `flash_flood_warning_any`
- `streamflow_high_count`
- `streamflow_low_count`
- `streamflow_extreme_high_any`
- `streamflow_extreme_low_any`

### Interaction columns
- `overflow_x_precip_anomaly`
- `overflow_x_flood_warning`
- `overflow_x_drought`
- `overflow_x_heat`
- `overflow_x_streamflow_high`
- `overflow_x_streamflow_low`

### Quality / missingness columns
- `sdwis_data_complete_flag`
- `overflow_data_complete_flag`
- `weather_data_complete_flag`
- `streamflow_data_complete_flag`
- `notes_missingness`

---

## 7. Model sequence

The paper should present models in a ladder.

## Model 0 — prevalence benchmark

Predict using statewide base rate only.

Purpose:
- sanity check
- calibration baseline

## Model 1 — persistence-only baseline

Binary outcome:
\[
\Pr(Y_{c,t+h}=1) = f(\text{prior SDWIS history})
\]

Count outcome:
- Poisson or negative binomial with persistence features only

Purpose:
- strongest realistic baseline to beat

## Model 2 — persistence + structural context

Add:
- permit count
- impaired segments
- slow-moving hydrology context

Purpose:
- test whether structural context adds ranking signal beyond persistence

## Model 3 — persistence + overflow triggers

Add:
- overflow any/count/gallons/recent repeats

Purpose:
- quantify overflow contribution alone

## Model 4 — persistence + weather/hydrology triggers

Add:
- rainfall
- alerts
- streamflow
- drought
- heat

Purpose:
- quantify trigger contribution without overflow interactions

## Model 5 — full interaction model

Add all major interactions.

Purpose:
- test whether overflow signal is conditional on weather/hydrologic stress

## Model 6 — county fixed-effects model

Binary formulation example:
\[
\text{logit}\;\Pr(Y_{c,t+h}=1) = \alpha_c + \gamma_t + X_{c,t}\beta
\]

where:
- \(\alpha_c\) = county fixed effects
- \(\gamma_t\) = month-year fixed effects or season/year controls

Purpose:
- separate within-county movement from cross-county risk ranking

## Model 7 — seasonal / time-aware ML ranking model

Examples:
- regularized logistic regression
- gradient-boosted trees with careful time splits

Purpose:
- optimize ranking utility, not inference

Important:
- clearly separate inferential models from predictive models

---

## 8. Identification and interpretation rules

The paper should adopt strict language.

## Allowed claims
- predictive association
- ranking utility
- temporal lead/lag consistency
- persistence vs trigger decomposition
- within-county vs between-county contrasts

## Claims to avoid unless stronger design emerges
- causal effect of overflow on drinking-water violations
- direct evidence of contamination caused by a specific event
- claims about harm to residents from county-level associations alone

## Interpretation rule of thumb

- if a feature is strong only in naive cross-county analysis, call it **structural context or place marker**
- if it remains strong with county fixed effects and timing makes sense, call it a **candidate trigger signal**

---

## 9. Validation strategy

## Time split

Recommended:
- training: 2020–2023
- validation: 2024
- holdout test: 2025 or latest complete period

If 2025 remains partial, use rolling-origin evaluation.

## Rolling evaluation

For each cutoff month:
- train on all prior months
- predict next 1/3 months
- aggregate metrics

This is more paper-worthy than a random split.

## Metrics

### Binary outcomes
- AUROC
- AUPRC
- Brier score
- calibration slope/intercept
- precision@k
- recall@k
- top-decile lift

### Count outcomes
- MAE
- RMSE
- Poisson deviance if appropriate
- rank correlation with future burden

### Public-interest ranking metrics
- overlap with future top-25 burden counties
- median future burden within predicted high-risk decile
- burden captured by top-k ranked counties

---

## 10. Falsification and negative controls

To strengthen the paper, predefine these.

## Timing placebo tests
- future rainfall predicting past SDWIS
- future overflow predicting past SDWIS
- shuffled month labels within county

## Spatial placebo tests
- assign neighboring-county weather to wrong county
- random county permutation for overflow exposure

## Outcome placebo tests
- use weaker administrative outcomes less tied to environmental triggers
- compare against non-health-based SDWIS outcomes

## Feature placebo tests
- include a meaningless transformed exposure and show it does not improve fit

---

## 11. Sensitivity analyses

Minimum set:

1. alternate SDWIS dedupe rule
2. alternate overflow severity threshold
3. exclude extreme counties such as Harris to test leverage
4. use counts vs binary outcomes
5. use county fixed effects vs no fixed effects
6. use season fixed effects vs month-year fixed effects
7. exclude months with heavy missingness
8. use lagged structural context only

---

## 12. Case-study selection plan

The paper should include qualitative case-study counties.

### Select counties from four buckets
1. high persistence / high future burden
2. high overflow but low later SDWIS
3. low overflow but high later SDWIS
4. strong weather-trigger signatures

### Why

These cases improve interpretability and help surface failure modes of the panel.

Likely candidates should be selected after the enriched model run, not beforehand.

---

## 13. Figure and table plan

## Core figures

### Figure 1. Conceptual taxonomy
Leading vs structural vs trigger vs lagging signals.

### Figure 2. Data and panel construction flowchart
Source systems, normalization, joins, aggregation.

### Figure 3. Lead/lag lift plot
Overflow and weather signals across horizons \(t+0\) to \(t+3\).

### Figure 4. Performance ladder
Model 0 through Model 7, showing what each added feature family contributes.

### Figure 5. Within-county vs cross-county comparison
Coefficient or marginal-effect comparison for key features.

### Figure 6. Texas map of predicted residual risk
Where enriched model predicts excess risk beyond persistence baseline.

## Core tables

### Table 1. Data sources and temporal coverage
### Table 2. Variable definitions
### Table 3. Main model results
### Table 4. Validation metrics and ranking utility
### Table 5. Sensitivity and placebo results
### Table 6. Case-study counties

---

## 14. Phone color-strip collection module

This should be framed as a **future validation and community-measurement module**.

## Purpose

Use smartphone photos of low-cost colorimetric water test strips to collect field observations that may:
- validate modeled risk signals in targeted counties,
- identify candidate local anomalies for follow-up,
- expand community participation in Atlas TX.

## Important limitation

Phone color-strip data should **not** be used as the paper’s primary outcome.

Reasons:
- strips are noisy and chemistry-specific
- user handling varies
- lighting, camera pipeline, and white balance create measurement error
- chain-of-custody is weak
- many important contaminants are not captured reliably by simple strips

## Best role in the project

Use phone color-strip collection as:
1. exploratory field validation,
2. targeted case-study evidence,
3. community monitoring prototype,
4. a separate methods appendix or future paper.

## Suggested measurable strip targets

Only include analytes where low-cost strips are reasonably common and interpretation is tractable.

### Better candidates
- pH
- nitrate / nitrite
- hardness
- alkalinity
- chlorine residual
- iron / copper if a consistent strip product is used

### Weaker candidates
- anything requiring high lab precision
- analytes where strip color distinction is poor on phone cameras
- contaminants with high public-health importance but weak strip validity

## Proposed collection protocol

### Required kit standardization
Freeze one strip product per analyte family if possible.

Each submission should record:
- strip brand and lot
- analyte type
- sample source type (tap / well / creek / pond / bottled control)
- collection date/time
- county
- optional coordinates or coarse location
- incubation timing instructions followed yes/no

### Photo protocol
Require:
- one photo including the strip and manufacturer color card
- neutral background
- no flash if avoidable, or standardized flash rule
- fixed distance guidance
- multiple photos optional
- optional white reference card in frame

### Metadata
- phone model
- OS version if available
- ambient lighting category
- whether indoor/outdoor
- whether sample was first-flush or after running tap

### Quality control
- reject blurry images
- reject images without reference color strip/card
- reject submissions without required timing metadata
- include duplicate readings for a subset
- use lab-confirmed controls for calibration if budget allows

## Analytical use

### Near-term use
- descriptive comparison of strip readings with modeled risk scores
- anomaly flagging for manual review
- not causal testing

### Future rigorous use
- calibration study with lab assays on subset samples
- estimate phone-to-lab measurement error
- derive analyte-specific confidence intervals

## Paper integration

For the first paper, include at most:
- a short future-work subsection,
- or a methods appendix describing the planned citizen-science module.

Do **not** mix strip-derived outcomes into the main SDWIS-trigger models unless a separate validation study has been completed.

---

## 15. Bee integration relative to the panel

The bee angle should remain secondary.

## Where bees could fit analytically

### As contextual covariates
If county-level bee-ag-guideline features are extracted, they could enter as exploratory structural context variables:
- minimum acreage for bee ag valuation
- hive-density requirement
- county bee-guideline strictness proxy

### As a separate governance dataset paper
This may be stronger than trying to force bees into the main water paper.

### As a future shared-exposure study
If pesticide or runoff proxies improve, one could test whether counties with certain water-risk profiles also show distinct pollinator-support or pollinator-vulnerability patterns.

## Recommendation

Keep bees out of the main model tables unless usable county-level outcome or uptake data are secured.

---

## 16. Repo implementation plan

## Data products

### A. Canonical panel build script
Suggested path:
- `experiments/build_county_month_water_risk_panel.ts`

### B. Feature manifest / schema doc
Suggested path:
- `docs/contracts/county-month-water-risk-panel.md`

### C. Model scripts
Suggested paths:
- `experiments/model_persistence_baseline.ts`
- `experiments/model_trigger_panel.ts`
- `experiments/model_fixed_effects.ts`
- `experiments/model_ranking_eval.ts`

### D. Result outputs
Suggested paths:
- `outputs/panel-summary/`
- `outputs/model-results/`
- `outputs/figures/`

## Minimal build order

1. freeze county-month schema
2. generate SDWIS monthly outcomes
3. generate overflow monthly features
4. attach current structural context
5. attach historical weather/hydrology
6. run persistence-only baseline
7. run enriched trigger models
8. run fixed-effects and placebo checks
9. freeze tables/figures
10. draft paper sections

---

## 17. Concrete next experiments

## Experiment 1 — panel assembly audit
Goal:
- verify every county-month row count,
- verify missingness patterns,
- verify temporal overlap across data sources.

Deliverable:
- data coverage table
- missingness heatmap

## Experiment 2 — persistence benchmark
Goal:
- establish the irreducible baseline performance of prior SDWIS history.

Deliverable:
- benchmark metrics for all horizons

## Experiment 3 — overflow-only trigger test
Goal:
- replicate and formalize current overflow lift results on frozen panel tables.

Deliverable:
- lead/lag figure
- naive vs fixed-effects comparison

## Experiment 4 — weather/hydrology augmentation
Goal:
- test whether hydrometeorological features improve short-run prediction.

Deliverable:
- incremental performance table
- interaction coefficients / importance measures

## Experiment 5 — placebo and sensitivity battery
Goal:
- ensure the story survives simple adversarial checks.

Deliverable:
- robustness appendix

## Experiment 6 — phone color-strip pilot design
Goal:
- define the citizen-science protocol before any public collection.

Deliverable:
- protocol memo
- sample submission schema
- calibration design against lab-confirmed or known-control samples

---

## 18. Bottom line

The first paper should be built around a **county-month panel** that distinguishes:
- **persistence**,
- **structural context**,
- and **event triggers**.

The most important empirical question is:

> Do weather and hydrologic conditions add short-run signal beyond persistence, and do they change the meaning of sewer overflow events?

The **phone color-strip collection** is worth keeping in scope, but as a **future validation / field collection module**, not as the main outcome for the paper.

## Sources

- EPA Envirofacts SDWIS API  
  https://www.epa.gov/enviro/envirofacts-data-service-api
- Texas Open Data portal  
  https://data.texas.gov/
- TCEQ surface water segments service  
  https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer
- Texas Apiary Inspection Service — agricultural valuation  
  https://txbeeinspection.tamu.edu/public/agricultural-exemption/
- Texas Apiary Inspection Service — regulations  
  https://txbeeinspection.tamu.edu/regulations/
- Texas Beekeepers Association county ag-valuation master list  
  https://texasbeekeepers.org/wp-content/uploads/2024/06/Ag-Valuation-County-Guidelines-Master-List-2024-06-24.pdf
- Texas Comptroller open data portal  
  https://comptroller.texas.gov/transparency/open-data/
- Texas Comptroller county appraisal district directory  
  https://comptroller.texas.gov/taxes/property-tax/county-directory/
- BeeCheck TX  
  https://tx.beecheck.org/
- USDA / APHIS honey bee survey public downloads  
  https://www.usbeedata.org/state_reports/public_download/
- Review on Sublethal Effects of Environmental Contaminants in Honey Bees (Apis mellifera), Knowledge Gaps and Future Perspectives  
  https://mdpi-res.com/d_attachment/ijerph/ijerph-18-01863/article_deploy/ijerph-18-01863-v2.pdf?version=1613727036
- Systematic review of residual toxicity studies of pesticides to bees and veracity of guidance on pesticide labels  
  https://peerj.com/articles/16672
