# Atlas TX paper roadmap: leading and lagging indicators of water-quality risk in Texas

_Date: 2026-05-09_

## Summary

This memo turns the current Atlas TX exploratory work into a **paper-ready research agenda**.

The current evidence suggests:

1. **Past SDWIS health-based violation history is the strongest predictor of future SDWIS burden.**
2. **Sewer overflow activity is useful as a contextual signal, but mostly as a marker of already high-risk places rather than a universal short-horizon trigger.**
3. **Impaired surface-water context and permit density behave more like structural leading indicators than direct event triggers.**
4. **The highest-value next step is a county-month or PWS-month panel that adds weather/hydrology to distinguish chronic risk from trigger events.**
5. **Bee / beekeeping-ag-exemption analysis is plausible as an exploratory side-study, but the open-data constraints are severe.** There appears to be no obvious statewide, parcel-level, machine-readable open dataset of actual beekeeping ag valuation uptake.

This memo proposes a publishable paper design, a sequence of backtests, and a realistic bee-data extension.

---

## 1. Paper framing

### Working title

**Leading and lagging indicators of drinking-water risk in Texas: a county-panel study using SDWIS, sewer overflows, permit density, impairment context, and hydrometeorological triggers**

### Central research question

Which publicly available environmental and operational signals are most useful for anticipating or explaining later **health-based drinking-water violations** in Texas?

### Candidate contribution

The paper should not claim that Atlas TX discovered a causal model of contamination. A stronger and more defensible contribution is:

- a reproducible Texas open-data panel,
- a taxonomy of **leading vs lagging vs contextual** indicators,
- evidence on which indicators add signal beyond persistence,
- a practical framework for public-interest monitoring and investigative triage.

### Stronger claim we may be able to support

> In Texas public data, prior drinking-water violation history dominates as a predictor of future SDWIS burden, while sewer overflows, surface-water impairment, permit density, and weather/hydrology are better interpreted as contextual and interaction signals rather than standalone causal triggers.

---

## 2. Outcome definitions

We should define multiple outcomes and treat them separately.

### Primary outcome

**Health-based SDWIS violation event**

Recommended unit:
- PWS-month if we can get defensible joins
- county-month as the fallback / current baseline

Recommended outcome forms:
- binary: any health-based SDWIS violation in month \(t\)
- count: number of unique SDWIS health-based violation episodes in month \(t\)
- severity-weighted count: weighting by population served, notification tier, violation category, and recency

### Secondary outcomes

- DWRS-like weighted score in month \(t\)
- persistence outcome: whether a violation recurs within 3/6/12 months
- event-window outcome: any SDWIS violation within \([t, t+1]\), \([t, t+3]\)

### Important distinction

We should explicitly separate:
- **leading indicators**: signals observable before the outcome
- **contemporaneous correlates**: signals in the same month
- **lagging indicators**: signals that happen after or because of the event

---

## 3. Indicator taxonomy for the paper

### A. Persistence / system-history indicators

These are likely the strongest baseline features.

- prior SDWIS health-based events
- prior DWRS score
- prior repeated violations at the same PWS/county
- prior public-notification tiers

**Interpretation:** these are not mechanistic explanations; they capture path dependence, chronic infrastructure weakness, governance limits, or monitoring intensity.

### B. Structural risk indicators

These are slow-moving conditions.

- TCEQ permit density
- impaired surface-water segment counts
- governance complexity / district fragmentation
- hydrologic setting (basin / aquifer / HUC context)
- rurality / population served mix / system type mix

**Interpretation:** best treated as chronic exposure or complexity context.

### C. Event-trigger indicators

These are short-horizon triggers that may move risk.

- sewer overflow counts / gallons
- repeated recent overflows
- flood warnings / flash flood warnings
- heavy rainfall totals (24h / 72h / 7d)
- streamflow anomalies (high and low)
- drought category / persistence
- temperature / heat anomalies

**Interpretation:** these are the most plausible candidates for genuine short-run leading indicators.

### D. Lagging indicators

These may be useful for diagnosis but not for forecasting.

- later notices following a violation
- post-event regulatory actions
- downstream biological impairment observed well after the event

---

## 4. Publishable empirical strategy

## Study 1 — descriptive persistence benchmark

**Question:** how much of future SDWIS burden is explained by prior SDWIS burden alone?

Models:
- county fixed baseline ranking
- autoregressive count model
- simple panel persistence benchmark

Deliverable:
- benchmark every richer model must beat

### Why this matters

If persistence already explains most variance, then the real paper contribution becomes:
- identifying which additional signals improve early warning,
- and which merely proxy for persistent high-risk counties.

---

## Study 2 — event-trigger backtest with weather/hydrology

**Question:** do overflow and hydrometeorological conditions improve short-horizon prediction of SDWIS events?

Recommended panel:
- unit: county-month initially, later PWS-month if feasible
- period: as long as overlap permits, ideally 2020–present

Outcome:
- any SDWIS event at \(t+h\), for \(h \in \{0,1,2,3\}\)

Candidate predictors at \(t\):
- any overflow
- overflow count
- overflow gallons
- repeated overflow in prior 3 months
- rainfall totals
- NWS flood warning presence
- streamflow anomaly state
- drought category
- heat anomaly
- interactions, especially:
  - overflow × heavy rain
  - overflow × low flow
  - overflow × drought
  - overflow × heat

Recommended model families:
- fixed-effects logistic panel for binary outcomes
- Poisson / negative binomial fixed-effects style count models where practical
- simple regularized models for ranking performance, not just inference

Key design principle:
- compare models with and without persistence terms
- compare models with and without county fixed effects

### Main publishable question

Does weather/hydrology add signal **after controlling for persistence and county effects**?

---

## Study 3 — structural context vs trigger decomposition

**Question:** which features matter because they identify risky counties, and which matter because they move risk over time within the same county?

This study should explicitly decompose:
- between-county signal
- within-county signal

Practical test:
- naive cross-sectional association
- county fixed-effects association
- event-study style lead/lag bins where feasible

Interpretation target:
- permit density and impairment likely remain mostly **between-county** features
- weather/overflow interactions are the best candidates for **within-county** movement

---

## Study 4 — ranking utility for public-interest monitoring

**Question:** even if causal inference is limited, which public indicators are most useful for identifying counties/PWSs that later experience SDWIS burden?

Metrics:
- top-decile lift
- precision@k
- overlap with future top-25 burden counties/PWSs
- AUROC / PR where useful
- calibration plots for risk bins

This gives the paper a practical contribution even if causal claims remain modest.

---

## 5. Paper-ready hypotheses

These are the ones worth preregistering or writing into a methods section.

### H1. Persistence hypothesis

Counties/PWSs with greater prior health-based SDWIS burden are more likely to experience future SDWIS burden.

**Expectation:** strongly supported.

### H2. Overflow-trigger hypothesis

Recent sewer overflow activity predicts higher probability of near-term SDWIS burden.

**Expectation:** supported in naive cross-county analysis, weaker after county fixed effects.

### H3. Interaction hypothesis

Overflow activity is more predictive when combined with high rainfall, flood alerts, high streamflow, drought, or heat anomalies.

**Expectation:** this is the most promising next hypothesis and should be a paper centerpiece.

### H4. Structural-context hypothesis

Permit density and impaired surface-water context predict future SDWIS burden primarily through persistent county-level differences rather than short-term within-county movements.

**Expectation:** likely supported.

### H5. Repeated-pressure hypothesis

Repeated overflow pressure in the prior 2–3 months is more predictive than a single overflow month.

**Expectation:** likely modest support, especially in interaction with weather.

---

## 6. Negative controls and falsification logic

If we want a stronger paper, we should define things that should **not** work well.

Possible negative controls:
- future weather predicting past SDWIS events
- hydrology variables shifted to impossible windows
- random county reassignment placebo
- permit density alone as a short-run trigger without persistence terms

Possible placebo outcomes:
- non-health-based SDWIS violations
- outcomes less plausibly tied to environmental trigger windows

These checks help distinguish real timing signal from broad county risk ranking.

---

## 7. What to build next in the repo

### Priority 1 — historical weather/hydrology panel

Build a reproducible county-month table with:
- precipitation totals
- NWS alert counts by category
- streamflow anomaly summaries
- drought category
- heat anomaly summaries

### Priority 2 — research-grade monthly feature store

One canonical table keyed by:
- county, month
- later ideally PWS, month

Columns should include:
- outcome(s)
- persistence features
- overflow features
- structural context
- weather/hydrology context
- caveat columns / missingness flags

### Priority 3 — experiment scripts with frozen outputs

Create reproducible scripts under `experiments/` for:
- baseline persistence model
- trigger model
- interaction model
- ranking evaluation

### Priority 4 — paper figures

Likely high-value figures:
1. timeline of major indicator classes
2. lead/lag lift chart for overflow and weather signals
3. persistence vs enriched-model performance comparison
4. county map of residual risk after persistence baseline
5. top case-study counties/PWSs

---

## 8. Bee / beekeeping-ag-exemption angle

This is interesting, but the data reality is much worse than for water.

## What seems available

### A. Texas beekeeping ag valuation rule/guideline information

There is clear public documentation that beekeeping can qualify for agricultural valuation in Texas, and county implementation varies in practice.

Relevant sources found:
- Texas Apiary Inspection Service (TAIS): beekeeping ag valuation overview
- county appraisal district guideline PDFs
- Texas Beekeepers Association county master list PDF of county beekeeping valuation guidelines

### B. Bee registry / bee-location systems

- **BeeCheck TX** exists, but appears to be an operational registration / coordination system, not obviously an open downloadable research dataset.
- I do **not** currently have evidence that county-level or apiary-level BeeCheck TX data are openly downloadable for research.

### C. National bee health survey data

- USDA / APHIS honey bee survey data appear downloadable at least in some public form.
- Unclear from the current pass whether Texas-specific county-level detail is openly usable in a way that can be joined cleanly to water data.

## What appears missing or weak

### 1. Statewide open data on actual beekeeping ag valuation uptake

I do **not** currently see a clean statewide open dataset of:
- parcels receiving beekeeping agricultural valuation,
- county totals of bee-ag-exemption acreage,
- or county-level counts of approved bee-valuation properties.

The Texas Comptroller pages explicitly suggest local appraisal and agricultural special-appraisal questions are handled at the county appraisal-district level, which is a warning sign for fragmented data availability.

### 2. Open statewide apiary count data

I do not yet have evidence of an openly downloadable county-by-county Texas apiary registration dataset.

## Bee-related hypotheses worth considering

### H-bee-1. Pollinator-vulnerability context hypothesis

Counties with more impaired water context, higher permit density, and stronger agricultural chemical intensity may also be counties where bee health is more vulnerable.

**Problem:** without county-level bee outcome data, this remains conceptual.

### H-bee-2. Bee-friendly land-use proxy hypothesis

County-level beekeeping ag-valuation friendliness (minimum acreage, hive thresholds, county guidance leniency) may correlate with land-use structures that also correlate with water-quality risk.

**Problem:** this is a policy/guideline proxy, not an observed bee-presence measure.

### H-bee-3. Bee uptake as environmental stewardship proxy

If we can obtain county-level counts of bee-ag-valuation uptake, those counts might proxy for small-acreage stewardship or diversified land management, which could have weak associations with lower water risk in some regions.

**Problem:** this is speculative and extremely vulnerable to confounding.

### H-bee-4. Pesticide / runoff shared-exposure hypothesis

Bee health and water-quality deterioration may share upstream drivers such as pesticide pressure, runoff, and land-use intensity.

**Implication:** the bee angle may fit better as a **shared exposure paper extension** than as a direct bee-water causal analysis.

## My current recommendation on bees

### Strong recommendation

Treat the bee angle as a **secondary exploratory extension**, not as a core paper axis yet.

### Why

Because right now we have:
- strong open water-quality and overflow data,
- weak open outcome data for bees,
- fragmented local appraisal-district implementation,
- and no clean statewide open dataset of actual bee-ag-exemption uptake.

### Best realistic bee-data path

1. Build a county-level table from the **Texas Beekeepers Association county guidelines master list**.
   - county
   - minimum acreage
   - hive minimum / intensity
   - productivity valuation notes
   - caveats about manual extraction and guideline-vs-uptake distinction

2. Search for open county appraisal roll fields or records requests that expose actual 1-d-1 classifications.

3. Check whether APHIS bee survey data can be turned into a Texas county panel.

4. If not, reposition the bee material as:
   - a future work section,
   - or a separate paper on fragmented environmental-governance data infrastructure.

---

## 9. Best paper strategy from here

## Paper 1: main water-risk indicators paper

This should be the immediate target.

### Likely structure

1. Introduction
2. Texas water-risk data landscape
3. Indicator taxonomy: persistence, structural context, triggers, lagging signals
4. Data and panel construction
5. Backtests
6. Results
7. Interpretation and limits
8. Implications for public-interest monitoring

### Why this is publishable

- large public-data integration problem
- clear applied public-interest use case
- strong methodological question about leading vs lagging indicators
- honest distinction between ranking utility and causal inference

## Paper 2: exploratory bee / pollinator extension

Only pursue if we can secure actual outcome data or actual county-level uptake data.

Possible title direction:

**Fragmented data on pollinator-support land use in Texas: can beekeeping agricultural valuation be used as an environmental stewardship indicator?**

That may become more of a governance/data-infrastructure paper than a causal environmental-health paper.

---

## 10. Concrete next actions

### Immediate

1. Finalize the county-month historical feature store.
2. Add historical weather/hydrology joins.
3. Re-run overflow lead/lag backtests with interactions and county fixed effects.
4. Build one persistence-only benchmark and one enriched benchmark.
5. Freeze figures and tables for a first internal draft.

### Bee track, parallel but secondary

1. Extract the Texas Beekeepers county ag-valuation master list into structured CSV.
2. Catalogue county appraisal district bee-guideline PDFs and standardize fields.
3. Investigate whether any county appraisal roll exports expose bee/ag classifications.
4. Investigate whether APHIS bee survey data can be joined at county or at least regional level in Texas.

---

## Bottom line

For the academic paper, the strongest path is:

- **core paper:** water-quality leading/lagging indicators in Texas,
- **main empirical contribution:** persistence vs structural context vs event triggers,
- **main missing ingredient:** historical weather/hydrology interactions,
- **bee angle:** promising but currently underpowered by open-data availability, so treat as secondary until better data are secured.

## Sources

- Texas Apiary Inspection Service (TAIS) — agricultural valuation overview  
  https://txbeeinspection.tamu.edu/public/agricultural-exemption/
- Texas Apiary Inspection Service (TAIS) — regulations  
  https://txbeeinspection.tamu.edu/regulations/
- Texas Beekeepers Association county ag-valuation master list PDF  
  https://texasbeekeepers.org/wp-content/uploads/2024/06/Ag-Valuation-County-Guidelines-Master-List-2024-06-24.pdf
- Texas Comptroller open data portal  
  https://comptroller.texas.gov/transparency/open-data/
- Texas Comptroller county appraisal district directory / local property appraisal guidance  
  https://comptroller.texas.gov/taxes/property-tax/county-directory/
- BeeCheck TX  
  https://tx.beecheck.org/
- USDA / APHIS honey bee survey public download portal  
  https://www.usbeedata.org/state_reports/public_download/
- Review on sublethal effects of environmental contaminants in honey bees  
  https://mdpi-res.com/d_attachment/ijerph/ijerph-18-01863/article_deploy/ijerph-18-01863-v2.pdf?version=1613727036
- Systematic review of residual toxicity studies of pesticides to bees  
  https://peerj.com/articles/16672
- EPA Envirofacts SDWIS API  
  https://www.epa.gov/enviro/envirofacts-data-service-api
- TCEQ surface water segments service  
  https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer
- Texas Open Data portal  
  https://data.texas.gov/
