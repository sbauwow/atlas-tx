# What Texas Open Data Can and Cannot Tell Us About Next-Month Drinking-Water Risk

Generated: 2026-05-10

## Abstract

We build a reproducible Texas county-month panel from contest-relevant Texas open data, enriched with adjacent federal public environmental context, to test what an integrated open-data stack can contribute to drinking-water risk ranking. The panel links SDWIS health-based violation outcomes to Texas sewer overflows, permits, surface-water context, precipitation, flood-warning context, nearest-gauge streamflow, drought, and county-centroid temperature proxies from 2020-01 through 2025-12. It contains 18,288 county-month rows spanning 254 counties and 72 months. We evaluate pooled logistic and county fixed-effects-style predictive ladders for ranking next-month county SDWIS event occurrence. Across model families, persistent county baseline risk dominates most short-run trigger layers, and a simple empirical-Bayes county baseline materially improves ranking performance relative to persistence-only baselines. Precipitation, flood-warning, streamflow, and drought context add limited incremental value beyond the stabilized chronic baseline. Temperature-seasonality context adds the clearest improvement in both pooled and within-county-style backtests. In the full pooled trigger stack, validation AUPRC rises from 0.559 for the non-temperature EB trigger benchmark to 0.578, while test AUPRC rises from 0.460 to 0.475. In the county fixed-effects-style pass, the analogous improvement is from 0.559 to 0.578 in validation and from 0.462 to 0.478 in test. Heat-focused ablations indicate that freeze-day context and the combined heat-days-plus-freeze-days bundle carry more signal than mean-temperature anomaly alone. We interpret these results as evidence about predictive association and open-data ranking utility rather than causal proof.

---

## 1. Introduction

Public drinking-water risk is often communicated through isolated incidents, system-specific enforcement actions, or after-the-fact notice events. That mode of analysis remains important, but it makes it difficult to compare places systematically or to ask whether available public signals improve short-horizon risk ranking. The Texas open-data contest framing sharpens this problem: Texas agencies expose multiple fragmented but high-value open datasets, yet there is no single integrated, reproducible workflow for identifying where next-month drinking-water stress may be elevated or where official signals appear inconsistent. Texas therefore offers a useful setting for testing what open data can and cannot do when assembled into a statewide drinking-water monitoring panel.

This paper asks a pragmatic rather than causal question: given a county-month stack built from Texas open data and adjacent federal public environmental context, which features improve ranking of **next-month** SDWIS health-based event occurrence? More specifically, do short-run trigger layers such as precipitation, flood warnings, streamflow, drought, and temperature add predictive value beyond persistent county-level baseline risk?

The resulting empirical picture is narrower and more informative than a generic “weather matters” story. Most tested trigger layers contribute only modest incremental value once persistent county risk is encoded properly. A simple empirical-Bayes county baseline provides a strong small-area stabilization device and substantially improves predictive ranking. Among the tested contextual layers, temperature-seasonality features are the first to show a clear and robust incremental gain beyond the existing non-temperature trigger stack.

### 1.1 Questions

We focus on four questions:

1. What can a Texas open-data water-risk stack learn from contest-relevant public data alone?
2. How much predictive signal comes from persistent county baseline risk?
3. Do trigger layers improve next-month SDWIS ranking beyond that stabilized baseline?
4. Which contextual layers are most informative in a county-month public-data design?

### 1.2 Contest and open-data relevance

The thesis is motivated directly by the open-data contest setting. Its goal is not just to fit a predictive model, but to test whether contest-relevant Texas open data can be turned into a reproducible statewide water-risk ranking system. The paper therefore treats the source stack itself as part of the research contribution:

- **Texas open data** provide the core operational and environmental infrastructure layers, especially sewer overflows, permits, water districts, and surface-water context.
- **Adjacent public federal sources** provide additive enrichment for drinking-water outcomes and hydrometeorological context, especially SDWIS, streamflow, drought, and archived warnings.
- **Grassroots strip observations**, when used, are framed as a separate community validation layer rather than a replacement for the open-data backbone.

This framing matters because one of the paper's central findings is not just predictive. It is also infrastructural: some open-data layers materially improve the ranking system, while others are mainly descriptive or explanatory at county-month resolution.

### 1.3 Contributions

The paper makes four bounded contributions.

1. **Open-data systems contribution**: it assembles contest-relevant Texas open data plus adjacent public federal context into a reproducible county-month drinking-water risk panel.
2. **Method contribution**: a simple empirical-Bayes county baseline provides a strong and interpretable small-area stabilization baseline for county-month event prediction.
3. **Empirical contribution**: chronic county baseline risk dominates most short-run trigger layers, while temperature-seasonality context adds measurable incremental ranking value.
4. **Civic-tech contribution**: statewide open-data water-risk monitoring appears to benefit more from baseline stabilization plus selected contextual layers than from naive event-trigger stacking alone, and it creates a natural interface for later community-validation layers.

### 1.4 Non-claims

This paper does **not** claim causal identification. It does not treat county-centroid air temperature as water temperature, nor nearest-gauge streamflow as a full county hydrologic exposure measure. The results are about predictive association, ranking utility, and additive contextual interpretation.

---

## 2. Data and panel construction

### 2.1 Unit of observation

The unit of observation is the **Texas county-month**. The canonical panel spans:

- **254 counties**
- **72 months**
- **2020-01 through 2025-12**
- **18,288 rows**

The canonical persisted artifacts are:

- `data/panels/county_month_water_risk.csv`
- `data/panels/county_month_water_risk.schema.json`

### 2.2 Outcome

The main outcome is county-month SDWIS health-based burden, with the primary predictive target defined as:

- `sdwis_event_any`: whether at least one unique health-based SDWIS event occurs in the county-month

The panel also stores:

- `sdwis_event_count`
- persistence-history fields such as `sdwis_prior_1m_any`, `sdwis_prior_3m_count`, `sdwis_prior_12m_count`, and `sdwis_cumulative_prior_count`

The predictive task is to use features observed in month \(t\) to rank the probability of `sdwis_event_any` in month \(t+1\).

### 2.3 Predictor families

The panel includes five main predictor groups.

#### A. Persistence / outcome-history

These variables encode the local recent history of SDWIS event burden and serve as the baseline-to-beat.

#### B. Overflow context

County-month overflow features include incident counts, total gallons, log gallons, recent repeat activity, and severity-style indicators from the Texas overflow source.

#### C. Structural context

Current-snapshot contextual variables include:

- `permit_count_current`
- `impaired_segments_current`
- `hydrology_context_score_current`

These are treated as contextual between-county covariates rather than true monthly backfilled histories.

#### D. Weather and hydrometeorological context

The enriched panel includes:

- precipitation totals and anomalies
- NWS flood / flash-flood warning context from historical OpenFEMA IPAWS filtering
- nearest-gauge USGS streamflow anomaly-derived indicators
- U.S. Drought Monitor county-month drought fractions
- county-centroid temperature features: `temp_mean_anomaly_z`, `heat_days`, `freeze_days`

#### E. Interaction terms

The panel stores precomputed interaction features such as:

- `overflow_x_precip_anomaly`
- `overflow_x_flood_warning`
- `overflow_x_drought`
- `overflow_x_heat`
- `overflow_x_streamflow_high`
- `overflow_x_streamflow_low`

### 2.4 Data provenance and proxy structure

The panel is intentionally organized as **Texas open data at the core plus adjacent public federal context as additive enrichment**.

#### Texas open-data core
The central open-data backbone includes Texas-source layers such as:
- sewer overflows
- permits
- water-district or related state context
- surface-water context

#### Adjacent public federal/environmental enrichment
Additional public sources supply:
- SDWIS outcomes
- streamflow context
- drought context
- archived warning context
- weather proxies

Several contextual layers are approximate by construction.

- Precipitation and temperature use **county-centroid Open-Meteo archive** queries.
- Streamflow uses the **nearest active USGS gauge** to each county centroid.
- Drought uses **weekly U.S. Drought Monitor county statistics** aggregated to county-month means.
- Flood-warning context comes from **historical OpenFEMA IPAWS alerts** filtered to Texas county codes.

These choices were made to create a fully reproducible statewide panel quickly, but they also define the paper’s limitation boundary: this is a county-month open-data ranking framework, not a fully spatially weighted hydrologic exposure model.

### 2.5 Coverage and usable rows

By the latest rebuild:

- all **18,288** county-month rows have precipitation, drought, and temperature context attached
- all **18,288** rows also have flood-warning context attached once the historical snapshot exists
- trigger-model usable rows remain capped at **14,698** because streamflow coverage depends on nearest-gauge assignment and historical availability

---

## 3. Methods

### 3.1 Prediction target

For each county-month row at time \(t\), we predict whether `sdwis_event_any = 1` at \(t+1\).

### 3.2 Temporal split design

The backtest uses a fixed chronological split:

- **Train**: 2020-02 through 2023-12
- **Validation**: 2024-01 through 2024-12
- **Test**: 2025-01 through 2025-12

This design preserves temporal ordering and makes the final test period a genuine forward holdout.

### 3.3 Model families

We evaluate two main model families. The first asks how far a simple statewide pooled ranking model can go. The second asks whether the same trigger layers still help after absorbing county-specific baseline propensity more explicitly.

#### Pooled ladder

This family compares progressively richer pooled logistic models:

1. prevalence baseline
2. persistence only
3. persistence + EB county baseline
4. overflow and precipitation additions
5. enriched weather-trigger stacks
6. structural-context comparison models

#### County fixed-effects-style ladder

This family uses pooled logistic models with county-specific intercepts to approximate a within-county comparison. The question here is whether trigger layers still add value after absorbing county baseline propensity more explicitly.

### 3.4 Empirical-Bayes county baseline

A central modeling device is the EB county baseline. The rationale is straightforward: county-level outcome rates are heterogeneous, and even with equal observation windows, a shrunk county baseline gives a more stable chronic-risk encoding than naive raw-rate intuition. In this panel, the EB term consistently improves ranking performance and helps separate the chronic baseline story from the short-run trigger story.

### 3.5 Metrics

We report:

- AUROC
- AUPRC
- Brier score
- precision at top decile
- lift at top decile

Because the event is relatively imbalanced and the intended use is ranking, **AUPRC** is the primary metric.

---

## 4. Results

## 4.1 Persistent county baseline risk dominates

The first and most stable result is that persistent county baseline risk is the strongest signal in the panel. The persistence-only model already substantially outperforms the prevalence baseline, and adding the EB county baseline produces another material jump.

In the pooled ladder:

- Persistence only: validation AUPRC **0.389**, test **0.393**
- Persistence + EB county baseline: validation AUPRC **0.559**, test **0.461**

In the county-FE-style ladder:

- County FE + persistence: validation AUPRC **0.411**, test **0.417**
- County FE + persistence + EB baseline: validation AUPRC **0.559**, test **0.463**

These gains are too large to treat as incidental. They indicate that chronic county heterogeneity is not a nuisance side issue; it is the main predictive component in this county-month design.

## 4.2 Most non-heat trigger layers add only modest value

Adding precipitation, flood-warning, streamflow, and drought layers improved context and interpretability, but their predictive contribution beyond the stabilized chronic baseline was modest.

For example, the pooled non-heat EB trigger stack reached:

- validation AUPRC **0.559**
- test AUPRC **0.460**

This is essentially unchanged from the simpler EB baseline model in validation and only marginally different in test. The county-FE-style non-heat benchmark shows the same pattern:

- validation AUPRC **0.559**
- test AUPRC **0.462**

The main implication is that the county-month design, at least with the current proxies, supports a stronger chronic-risk narrative than a dramatic storm-trigger narrative.

## 4.3 Temperature context adds the clearest incremental gain

The strongest pooled enriched model is:

**Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat**

with:

- validation AUPRC **0.578**
- test AUPRC **0.475**

The strongest county-FE-style enriched model is:

**County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat**

with:

- validation AUPRC **0.578**
- test AUPRC **0.478**

Relative to the non-heat EB trigger benchmark, this is a meaningful gain in both validation and test. It is also the first trigger-layer addition in the weather stack to improve both model families clearly enough to change the thesis narrative.

### Table 1. Core Model Comparison Summary

| Family | Model | Validation AUPRC | Test AUPRC |
|---|---|---:|---:|
| Pooled | Persistence only | 0.389 | 0.393 |
| Pooled | Persistence + EB county baseline | 0.559 | 0.461 |
| Pooled | EB trigger stack without temperature | 0.559 | 0.460 |
| Pooled | EB trigger stack + temperature | 0.578 | 0.475 |
| Pooled | EB + structural context | 0.570 | 0.461 |
| County FE-style | FE + persistence | 0.411 | 0.417 |
| County FE-style | FE + EB baseline | 0.559 | 0.463 |
| County FE-style | FE trigger stack without temperature | 0.559 | 0.462 |
| County FE-style | FE trigger stack + temperature | 0.578 | 0.478 |
| County FE-style | FE + precipitation interaction model | 0.567 | 0.459 |

### Figure 1. Selected Model Comparisons by Family and Split

![Selected model comparisons](../outputs/figures/model-comparison-selected.png)

## 4.4 Heat-Focused Ablation

A dedicated heat ablation was run against the non-temperature EB trigger benchmark. Four findings matter most:

1. The gain is **not** solely an artifact of including every heat variable at once.
2. The strongest **single** added temperature-seasonality term by validation AUPRC is `freeze_days` in both pooled and county-FE-style ladders.
3. The best compact bundle is `heat_days + freeze_days`.
4. The full heat stack matches or slightly improves on the best compact bundle.

Key ablation values:

### Pooled single-term ablations
- Benchmark + `freeze_days`: validation AUPRC **0.577**, test **0.472**
- Benchmark + `heat_days`: validation AUPRC **0.558**, test **0.460**
- Benchmark + `temp_mean_anomaly_z`: validation AUPRC **0.558**, test **0.460**
- Benchmark + `overflow_x_heat`: validation AUPRC **0.558**, test **0.459**

### Pooled compact bundle
- Benchmark + `heat_days + freeze_days`: validation AUPRC **0.578**, test **0.475**

### County-FE-style single-term ablations
- Benchmark + `freeze_days`: validation AUPRC **0.577**, test **0.475**
- Benchmark + `heat_days`: validation AUPRC **0.559**, test **0.463**
- Benchmark + `temp_mean_anomaly_z`: validation AUPRC **0.558**, test **0.463**
- Benchmark + `overflow_x_heat`: validation AUPRC **0.559**, test **0.462**

### County-FE-style compact bundle
- Benchmark + `heat_days + freeze_days`: validation AUPRC **0.578**, test **0.478**

This ablation sharpens the wording of the result. The paper should not claim merely that “hot days” explain the gain. A more accurate description is that **temperature-seasonality context**, especially the `freeze_days` term and the `heat_days + freeze_days` bundle, carries measurable incremental ranking value.

### Table 2. Heat Ablation Summary

| Family | Ablation model | Validation AUPRC | Test AUPRC |
|---|---|---:|---:|
| Pooled | Benchmark: non-heat EB trigger stack | 0.559 | 0.460 |
| Pooled | + `freeze_days` | 0.577 | 0.472 |
| Pooled | + `heat_days + freeze_days` | 0.578 | 0.475 |
| Pooled | + full heat stack | 0.578 | 0.475 |
| County FE-style | Benchmark: non-heat EB trigger stack | 0.559 | 0.462 |
| County FE-style | + `freeze_days` | 0.577 | 0.475 |
| County FE-style | + `heat_days + freeze_days` | 0.578 | 0.478 |
| County FE-style | + full heat stack | 0.578 | 0.478 |

### Figure 2. Heat Ablation AUPRC by Family and Split

![Heat ablation AUPRC](../outputs/figures/heat-ablation-auprc.png)

## 4.5 Structural context comparison

A structural-context EB model without the enriched trigger stack reaches:

- validation AUPRC **0.570**
- test **0.461**

This remains strong, but the heat-enriched trigger stack now surpasses it in validation and test. That matters because it shows the thesis does not reduce entirely to “baseline risk plus static structure.” The temperature-seasonality layer is now empirically competitive enough to deserve real attention.

---

## 5. Discussion

## 5.1 Main interpretation

The clearest reading of the results is that county-month drinking-water risk ranking from public/open data is dominated by persistent baseline heterogeneity and that simple small-area stabilization is crucial. Most contextual weather layers do not overwhelm that chronic-risk structure. Temperature-seasonality context is the first contextual layer to materially improve ranking beyond the stabilized baseline.

This is a stronger and more defensible contribution than a looser story about generic weather influence. The panel shows that many intuitively plausible open-data trigger layers either add little at this resolution or are already partially absorbed by persistent county differences. That negative result is informative for the contest/open-data framing: it tells us not just how to predict better, but which public layers are mainly contextual and which ones materially improve the ranking system.

## 5.2 Why temperature-seasonality may matter more than the other triggers

Several interpretations are plausible.

1. **Operational stress**: temperature-seasonality variables may track treatment and system stress better than monthly precipitation totals do.
2. **Seasonal source-water quality dynamics**: thermal conditions may co-move with source-water characteristics that are not directly measured in the panel.
3. **Seasonal infrastructure vulnerability**: freeze-day and hot-day counts may proxy vulnerability windows better than drought category or streamflow anomaly alone.
4. **Better timing proxy**: count-based temperature variables may align more closely with operational conditions than monthly mean anomalies or event-warning counts.

The current evidence does not distinguish among these mechanisms causally. But it is notable that `freeze_days` and `heat_days + freeze_days` outperform mean-temperature anomaly alone. That suggests count-based thermal stress windows may be more useful than smooth anomaly summaries in this design.

## 5.3 Why the county-month panel still matters

The county-month unit is coarse, but it remains analytically useful for three reasons.

1. It permits statewide reproducible ranking from public data.
2. It is sufficient to reveal the chronic-baseline-versus-trigger tradeoff.
3. It creates a practical bridge to a stronger future PWS-month design.

The fact that temperature-seasonality context still helps at this coarse level strengthens the case for testing finer-resolution system-month models later.

---

## 6. Limitations

The main limitations should be foregrounded explicitly.

A contest-facing version of the paper should also make clear that open-data integration strength and predictive utility are not the same thing: some datasets are valuable because they improve ranking, while others are valuable because they improve interpretability, provenance, or investigative follow-up.

### 6.1 Spatial proxy limitations

- County-centroid precipitation and temperature are not polygon-weighted county exposure estimates.
- Nearest-gauge streamflow is a pragmatic approximation, not a full hydrologic representation.

### 6.2 Temporal aggregation limitations

- County-month may obscure event timing and system-specific operational windows.
- SDWIS dates reflect regulatory record timing rather than perfect real-time exposure timing.

### 6.3 Modeling limitations

- The county-FE-style model is an approximation using county-specific intercepts rather than a full hierarchical or conditional-logit implementation.
- EB stabilization improves prediction, but it does not solve all heterogeneity concerns.

### 6.4 Interpretive limitations

- Results are predictive, not causal.
- Temperature-seasonality terms should be described as contextual proxies rather than direct thermal exposure measurements.
- A positive predictive signal for temperature context does not imply that temperature is the sole or even primary physical mechanism behind violations.

---

## 7. Conclusion

This paper presents a reproducible Texas county-month panel for ranking next-month SDWIS health-based event risk from contest-relevant open data plus adjacent public federal environmental context. Its main empirical result is that **persistent county baseline risk dominates most short-run trigger layers**, and that a simple **empirical-Bayes county baseline** materially improves ranking performance. Precipitation, flood-warning, streamflow, and drought context add limited value beyond that stabilized baseline. Temperature-seasonality context adds the clearest incremental gain, with heat-focused ablations indicating that `freeze_days` and the `heat_days + freeze_days` bundle carry the strongest additional signal.

The contribution is therefore best framed as open-data systems, predictive, and methodological at the same time. A practical statewide water-risk ranking pipeline can be built from public/open data, but not all open-data layers contribute equally: some mainly encode chronic structure, some mainly improve interpretation, and a smaller subset materially improves holdout ranking performance. The next research step should be either a formal partial-pooling county model or a finer-resolution PWS-month design, followed by a separate grassroots validation layer for testing where open-data ranking and community-observed anomalies align or diverge.

---

## 8. Tables and Figures for the Next Draft

### Core tables
1. Panel coverage table
2. Pooled model ladder table
3. County-FE-style ladder table
4. Heat ablation table

Tables 1 and 2 in this draft provide compact summary versions of the model-comparison and heat-ablation results. Full detailed ladders remain in the saved output artifacts.

### Core figures
1. Panel construction diagram
2. Validation AUPRC comparison across models
3. Validation versus test AUPRC for the enriched trigger stacks
4. Optional EB baseline / county heterogeneity figure

Figures already generated in this draft pass:
- Figure 1: `outputs/figures/model-comparison-selected.png`
- Figure 2: `outputs/figures/heat-ablation-auprc.png`

---

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
- Texas Open Data portal  
  https://data.texas.gov/
- Atlas TX pooled model ladder artifact  
  file:///home/stathis/atlas-tx/outputs/model-results/2026-05-09-precipitation-aware-model-ladder.md
- Atlas TX county-FE model ladder artifact  
  file:///home/stathis/atlas-tx/outputs/model-results/2026-05-09-fixed-effects-precipitation-backtest.md
- Atlas TX heat ablation artifact  
  file:///home/stathis/atlas-tx/outputs/thesis-status/2026-05-09-heat-ablation-memo.md
- Atlas TX panel coverage artifact  
  file:///home/stathis/atlas-tx/outputs/panel-summary/county-month-water-risk-coverage.md
