# Thesis status memo — Texas county-month water-risk pipeline

Generated: 2026-05-09

## Bottom line

The thesis is now **empirically real but not yet paper-finished**.

We have a reproducible Texas county-month panel, a backtest ladder, and a defensible central result. The strongest current framing is not a broad causal weather thesis. It is an **open-data county-month risk-ranking thesis** in which:

1. **persistent county baseline risk dominates**,
2. **empirical-Bayes shrinkage materially improves baseline-risk estimation**, and
3. **temperature / heat context is the first trigger layer that clearly adds incremental predictive value** beyond precipitation, flood-warning, streamflow, and drought proxies.

---

## Current status

### What is complete

- Canonical county-month Texas panel built and regenerated from contest-relevant Texas open data plus adjacent public federal context
- Historical window fixed at **2020-01 through 2025-12**
- Coverage fixed at **254 counties × 72 months = 18,288 rows**
- Reproducible experiment scripts for:
  - pooled logistic model ladder
  - county fixed-effects-style ladder
  - empirical-Bayes county baseline shrinkage
- Historical context layers integrated for:
  - precipitation
  - NWS flood / flash-flood warnings
  - nearest-gauge USGS streamflow
  - drought
  - temperature / heat

### What is not complete

- final thesis/paper draft
- focused heat ablation and interpretation section
- partial-pooling / hierarchical follow-on model
- PWS-month extension
- final polished limitations / reviewer-objection section

---

## Canonical panel status

### Canonical artifact
- `data/panels/county_month_water_risk.csv`
- `data/panels/county_month_water_risk.schema.json`

### Coverage
- Rows: **18,288**
- Counties: **254**
- Months: **72**
- Window: **2020-01** through **2025-12**

### Trigger-model usable rows
- **14,698** rows usable for current trigger models

Interpretation:
- precipitation, drought, and temperature/heat are now attached statewide
- trigger-model usability is still limited by streamflow coverage, not by heat coverage

---

## Main empirical findings

## 1. Chronic county baseline risk is the strongest signal

Across pooled and county-FE-style ladders, the main predictive gains come from capturing persistent county-level heterogeneity rather than from short-run event triggers alone.

Interpretation:
- some counties appear to carry persistently elevated next-month SDWIS event propensity
- this chronic risk is more important than most single trigger layers tested so far

## 2. Empirical-Bayes shrinkage is a major methodological improvement

The EB county baseline consistently improves performance over simple persistence-only models.

Interpretation:
- the useful shrinkage story here is **small-area stabilization of county baseline risk**
- this is a stronger and more defensible thesis contribution than forcing a direct James–Stein-on-predictions framing

## 3. Precipitation, flood warnings, streamflow, and drought were modest on their own

Earlier enrichments improved context and interpretability but added only limited incremental predictive lift once EB baseline risk was present.

Interpretation:
- those layers are still useful as explanatory context
- but they did not overturn the chronic-baseline-risk story

## 4. Heat is the first trigger layer that clearly improved the ladder

The latest pass added county-centroid temperature/heat features:
- `temp_mean_anomaly_z`
- `heat_days`
- `freeze_days`
- `overflow_x_heat`

This produced the clearest incremental gain of the trigger stack so far.

---

## Best current model results

## Pooled ladder

Best current pooled model:

**Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat**

Metrics:
- Validation AUPRC: **0.578**
- Test AUPRC: **0.475**

Relevant comparisons:
- Persistence + EB county baseline: validation **0.559**, test **0.461**
- Prior strongest pooled non-heat model: validation **0.570**, test **0.461**

Read:
- heat improved the pooled model beyond the earlier trigger stack

## County fixed-effects-style ladder

Best current FE-style model:

**County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat**

Metrics:
- Validation AUPRC: **0.578**
- Test AUPRC: **0.478**

Relevant comparisons:
- County FE + persistence + EB baseline: validation **0.559**, test **0.463**
- Prior strongest FE validation model before heat: validation **0.567**, test **0.459**

Read:
- the heat gain survives the county-FE-style pass, which makes it harder to dismiss as pure between-county confounding

---

## Best current thesis framing

The strongest current thesis statement is:

> Using contest-relevant Texas open data plus adjacent public environmental context, a Texas county-month backtest of SDWIS health-based event occurrence shows that persistent county-level baseline risk is the dominant predictive component, empirical-Bayes shrinkage improves baseline-risk estimation, and county-month temperature-seasonality context adds measurable incremental ranking value beyond precipitation, flood-warning, streamflow, and drought proxy layers.

That framing is:
- predictive rather than causal
- cautious enough for current evidence
- stronger than a generic “weather matters” claim
- more paper-ready than the original open-ended trigger hunt

---

## What we should not claim

The current evidence does **not** justify claiming that:
- heat causally produces SDWIS violations
- county-centroid air temperature is a direct measure of water-system thermal stress
- the current county-month design fully resolves within-county or within-system timing
- the trigger stack dominates chronic risk

Safer language:
- “predictive association”
- “incremental ranking value”
- “explanatory context”
- “county-centroid proxy”

---

## Why the thesis is stronger now than earlier

Earlier, the project risked becoming a weak “we added weather and got little” story.

Now the thesis is stronger because it has:
- a stable panel contract
- a reproducible build chain
- a negative result that sharpened the chronic-risk narrative
- a positive result from heat that gives the trigger section real traction
- a clear methodological contribution through EB stabilization

That is enough for a credible thesis spine.

---

## Remaining gaps before this is submission-ready

## A. Heat ablation

We still need to isolate which heat terms are actually doing the work:
- `heat_days`
- `temp_mean_anomaly_z`
- `freeze_days`
- `overflow_x_heat`

## B. Better model form

The next methodological upgrade should likely be one of:
- formal partial pooling / hierarchical county intercepts
- or a PWS-month panel

## C. Stronger discussion section

Need a clean discussion of:
- why chronic risk dominates
- why most trigger layers stayed weak
- why heat may plausibly matter more than the other trigger proxies
- why county-month remains useful despite its coarse resolution

## D. Drafting

The paper still needs:
- intro / motivation
- methods section
- results narrative
- limitations
- conclusion / next steps

---

## Recommended next move

Highest-value immediate next artifact:

**Heat ablation / interpretation memo**

Questions to answer:
1. Is the gain mostly from `heat_days` or `temp_mean_anomaly_z`?
2. Does `overflow_x_heat` matter?
3. Does heat help more in high-baseline-risk counties than low-risk ones?
4. Is the gain concentrated in summer holdout months?

After that, the project should move into a real thesis draft.

---

## Overall assessment

### Do we have a thesis?
**Yes.**

### Is it empirically supported enough to write up seriously?
**Yes.**

### Is it finished?
**No.**

Most honest one-sentence status:

> We now have a real thesis result: chronic county baseline risk is the main predictive signal, EB shrinkage materially improves risk estimation, and heat is the first weather context layer that clearly adds incremental next-month SDWIS ranking value, but the final writeup and heat-focused robustness pass are still unfinished.

---

## Key artifacts

- `papers/2026-05-09-panel-spec-and-experiment-plan.md`
- `papers/2026-05-09-shrinkage-experiment-plan-and-eb-baseline.md`
- `docs/contracts/county-month-water-risk-panel.md`
- `outputs/panel-summary/county-month-water-risk-coverage.md`
- `outputs/model-results/2026-05-09-precipitation-aware-model-ladder.md`
- `outputs/model-results/2026-05-09-fixed-effects-precipitation-backtest.md`

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
