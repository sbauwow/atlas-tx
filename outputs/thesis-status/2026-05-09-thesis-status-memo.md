# Thesis status memo — Texas county-month water-risk pipeline

Generated: 2026-05-09

## Bottom line

The thesis is now **empirically real but not yet paper-finished**.

We have a reproducible Texas county-month panel, a backtest ladder, and a defensible central result. The strongest current framing is not a broad causal weather thesis. It is an **open-data county-month risk-ranking thesis** in which:

1. **persistent county baseline risk dominates**,
2. **empirical-Bayes shrinkage materially improves baseline-risk estimation**,
3. **broad month-of-year seasonality is a major predictive component**, and
4. **temperature-seasonality features add only a smaller residual gain once explicit month controls are present**.

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
- related-work positioning and source/proxy table
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

## 4. Broad seasonality is a major predictor, and temperature adds only a smaller residual gain

The latest robustness pass added explicit month-of-year controls on top of the non-temperature EB trigger benchmark, then layered compact temperature terms back in.

Main read:
- month controls alone raised pooled validation/test AUPRC from **0.559 / 0.460** to **0.837 / 0.692**
- the analogous county-intercept-style model rose from **0.559 / 0.462** to **0.837 / 0.693**
- adding `freeze_days` or `heat_days + freeze_days` on top of month controls still helped, but only modestly

Interpretation:
- the earlier heat result was real, but it partly reflected broad seasonal timing
- the reviewer-safe claim is now that **temperature-seasonality features provide a small residual refinement beyond broad month-of-year seasonality**, not that they define a large standalone trigger layer

---

## Best current model results

## Pooled ladder

Best pre-robustness pooled temperature model:

**Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat**

Metrics:
- Validation AUPRC: **0.578**
- Test AUPRC: **0.475**

Seasonality-robustness comparison:
- Benchmark + month-of-year controls: validation **0.837**, test **0.692**
- Benchmark + month-of-year controls + `freeze_days`: validation **0.838**, test **0.695**
- Benchmark + month-of-year controls + `heat_days + freeze_days`: validation **0.838**, test **0.695**

Read:
- broad annual timing is doing far more work than the earlier unconstrained heat gain alone suggested
- compact temperature features still add a small residual improvement after month controls

## County fixed-effects-style ladder

Best pre-robustness county-intercept-style temperature model:

**County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat**

Metrics:
- Validation AUPRC: **0.578**
- Test AUPRC: **0.478**

Seasonality-robustness comparison:
- Benchmark + month-of-year controls: validation **0.837**, test **0.693**
- Benchmark + month-of-year controls + `freeze_days`: validation **0.839**, test **0.697**
- Benchmark + month-of-year controls + `heat_days + freeze_days`: validation **0.839**, test **0.697**

Read:
- the month-control result survives the county-intercept-style pass too, so the paper should no longer treat the earlier temperature gain as a large standalone effect
- the remaining thermal signal is smaller but still directionally consistent across both model families

---

## Best current thesis framing

The strongest current thesis statement is:

> Using contest-relevant Texas open data plus adjacent public environmental context, a Texas county-month backtest of SDWIS health-based event occurrence shows that persistent county-level baseline risk and broad month-of-year seasonality are the dominant predictive components, empirical-Bayes shrinkage improves baseline-risk estimation, and county-month temperature-seasonality features add only modest residual ranking value beyond those stronger baselines and the non-temperature trigger stack.

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
- a seasonality robustness pass that exposed a stronger annual-timing component instead of leaving the thermal story under-tested
- a narrower but more defensible residual temperature-seasonality result
- a clear methodological contribution through EB stabilization

That is enough for a credible thesis spine.

---

## Remaining gaps before this is submission-ready

## A. Better paper framing after the seasonality check

We now need the paper to state clearly that:
- broad month-of-year seasonality is a major predictor
- the earlier heat gain was partly a seasonality story
- `freeze_days` and `heat_days + freeze_days` still add only a smaller residual refinement after month controls

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

**Related-work + source/proxy table + threat-to-validity pass**

Questions to answer next:
1. How should the paper position itself relative to open-data monitoring, water-risk surveillance, and small-area prediction work?
2. Which source/proxy table best explains the Texas-open-data backbone versus federal enrichments?
3. How should the discussion explicitly distinguish chronic baseline risk, broad seasonality, and residual temperature-seasonality refinement?
4. Do we want one additional warm-season vs cool-season descriptive cut, or is the month-control robustness pass enough?

---

## Overall assessment

### Do we have a thesis?
**Yes.**

### Is it empirically supported enough to write up seriously?
**Yes.**

### Is it finished?
**No.**

Most honest one-sentence status:

> We now have a real thesis result: chronic county baseline risk and broad month-of-year seasonality are the main predictive signals, EB shrinkage materially improves risk estimation, and compact temperature-seasonality terms add only a smaller residual next-month SDWIS ranking gain after explicit season controls, but the final paper framing is still unfinished.

---

## Key artifacts

- `papers/2026-05-09-panel-spec-and-experiment-plan.md`
- `papers/2026-05-09-shrinkage-experiment-plan-and-eb-baseline.md`
- `docs/contracts/county-month-water-risk-panel.md`
- `outputs/panel-summary/county-month-water-risk-coverage.md`
- `outputs/model-results/2026-05-09-precipitation-aware-model-ladder.md`
- `outputs/model-results/2026-05-09-fixed-effects-precipitation-backtest.md`
- `outputs/thesis-status/2026-05-09-heat-ablation-memo.md`
- `outputs/thesis-status/2026-05-10-seasonality-robustness-memo.md`

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
