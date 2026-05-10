# Contract — County-month water-risk panel

> Contract version: **0.1.0** — initial contract for the canonical county-month research panel used by Atlas TX water-risk backtests and paper-facing experiments.
>
> Changelog:
> - 0.1.0 (2026-05-09): initial contract — defines the canonical county-month panel schema, provenance, build rules, missingness semantics, outcome definitions, feature families, and validation guardrails for paper-oriented experiments.

This contract defines the **canonical research panel** for Atlas TX’s leading/lagging water-quality indicator work.

It is intentionally narrower and more explicit than the general dataset registry contract. The goal is to make the panel:
- reproducible,
- audit-friendly,
- safe for paper drafting,
- and stable enough that model comparisons are meaningful across runs.

---

## Scope

The county-month panel is the default research table for experiments that ask:

1. which public signals lead later SDWIS health-based violations,
2. which signals mainly capture chronic county-level risk,
3. which signals are best treated as explanatory context rather than direct evidence,
4. and whether enriched trigger features improve prediction beyond persistence.

This panel is:
- the **primary paper panel** for the first Atlas TX water-indicator paper,
- the default input for county-level backtests under `experiments/`,
- and a stepping stone toward a future PWS-month panel.

This panel is **not**:
- a public-facing water-safety score by itself,
- a causal proof table,
- or a default place to mix in unreviewed community-observation data.

Community / phone color-strip observations are a separate evidence class and must follow `docs/contracts/community-observation.md`.

---

## Canonical output artifact

Preferred output path:
- `data/panels/county_month_water_risk.parquet`

Fallback if Parquet support is unavailable in the build path:
- `data/panels/county_month_water_risk.csv`
- plus a sidecar schema summary at `data/panels/county_month_water_risk.schema.json`

Optional derived outputs:
- `outputs/panel-summary/county-month-water-risk-coverage.md`
- `outputs/panel-summary/county-month-water-risk-missingness.csv`

Rules:
- there is exactly **one canonical county-month panel** at a time;
- experiment scripts may derive temporary filtered tables, but must not silently redefine core columns;
- if a core definition changes, bump this contract version and note the break in `CHANGELOG.md`.

---

## Primary builder

Suggested canonical builder path:
- `experiments/build_county_month_water_risk_panel.ts`

The builder must:
1. construct the complete county-month key space,
2. attach outcomes,
3. attach feature families,
4. add provenance and missingness flags,
5. write the canonical panel,
6. write a compact coverage / QA summary.

The builder must be deterministic given the same input snapshots or live pulls.

---

## Unit of observation

One row equals one:
- Texas county
- calendar month

### Canonical key

```ts
export type CountyMonthKey = {
  countyFips: string;   // 5-character zero-padded county FIPS
  countyName: string;   // canonical Atlas county name
  year: number;         // four-digit year
  month: number;        // 1-12
  yearMonth: string;    // YYYY-MM
};
```

### Key rules

- `countyFips` is the primary geographic key whenever available.
- `countyName` is retained for readability and joins to datasets that only expose county names.
- `yearMonth` must be derived from `year` and `month`; it is not an independent source field.
- Every county-month row must be unique on `(countyFips, yearMonth)`.

### Coverage target

Preferred initial coverage:
- all Texas counties with valid FIPS and Atlas county lookup support
- monthly rows from `2020-01` through the latest **complete** month with acceptable source overlap

If source incompleteness requires a narrower period, the builder must:
- emit the exact min/max months used,
- report the reason in the QA summary,
- and set relevant source completeness flags.

---

## Column classes

The panel has six column classes:

1. key columns
2. outcome columns
3. predictor columns
4. interaction columns
5. provenance / freshness columns
6. missingness / caveat columns

### Naming rules

- use `snake_case` for persisted panel columns;
- use suffixes like `_any`, `_count`, `_sum`, `_mean`, `_max`, `_z`, `_3m`, `_12m` consistently;
- do not use ambiguous abbreviations except common domain terms such as `sdwis`, `pws`, `nws`, `usgs`.

---

## Required key columns

```ts
county_fips: string
county_name: string
year: number
month: number
year_month: string
```

Constraints:
- `county_fips` non-null
- `county_name` non-null
- `year` non-null
- `month` in `[1, 12]`
- `year_month` format `YYYY-MM`

---

## Outcome contract

The main paper outcome is **health-based SDWIS burden**.

### Canonical outcome columns

```ts
sdwis_event_any: 0 | 1
sdwis_event_count: number
sdwis_event_weighted: number | null
```

Definitions:
- `sdwis_event_any`: 1 if at least one unique health-based SDWIS violation episode occurs in that county-month.
- `sdwis_event_count`: count of unique health-based SDWIS violation episodes in that county-month.
- `sdwis_event_weighted`: optional weighted burden score if a stable weighting scheme is implemented; otherwise null for all rows until promoted by explicit contract bump.

### Episode dedupe rule

Canonical first-pass dedupe:
- unique by `(pwsid, violation_id, compl_per_begin_date)` where available

If a component is unavailable in the fetched record shape, the builder must use the nearest stable substitute and document the exact fallback in code comments and the QA summary.

### Outcome source assumptions

- SDWIS rows are authoritative regulatory records but still incomplete proxies for underlying real-world water-quality harm.
- A county-month SDWIS outcome is an aggregation of PWS events and does not imply countywide exposure.

### Required historical outcome helpers

These should be generated in the same panel because nearly every model needs them.

```ts
sdwis_prior_1m_any: 0 | 1
sdwis_prior_3m_count: number
sdwis_prior_6m_count: number
sdwis_prior_12m_count: number
sdwis_cumulative_prior_count: number
```

Definitions:
- all `prior_*` fields must exclude the current month.
- `sdwis_cumulative_prior_count` is cumulative count from panel start through month `t-1`.

---

## Predictor family contract

## A. Sewer overflow features

Canonical monthly features:

```ts
overflow_any: 0 | 1
overflow_count: number
overflow_gallons_sum: number
overflow_log_gallons_sum: number
overflow_severe_any: 0 | 1 | null
overflow_reaches_water_count: number | null
```

Canonical rolling features:

```ts
overflow_count_3m: number
overflow_gallons_sum_3m: number
overflow_repeat_3m_any: 0 | 1
overflow_months_since_last: number | null
```

Definitions:
- `overflow_any`: 1 if any sanitary sewer overflow row is assigned to the county-month.
- `overflow_count`: count of normalized overflow incidents.
- `overflow_gallons_sum`: total reported gallons for incidents in that county-month.
- `overflow_log_gallons_sum`: `log1p(overflow_gallons_sum)`.
- `overflow_severe_any`: 1 if any overflow exceeds the chosen severe threshold; threshold must be frozen in builder code and reported in QA.
- `overflow_repeat_3m_any`: 1 if overflow activity occurred in at least 2 of the previous 3 months, or under a stricter alternative if documented. The exact rule must be frozen and documented.
- `overflow_months_since_last`: months since previous overflow event in the same county.

Rules:
- counts default to `0` when source coverage is present and no events are observed.
- counts must be `null` only when source coverage is not available or cannot be trusted for the month.

## B. Structural context features

These are mostly slow-moving and usually enter as contextual rather than trigger variables.

Required first-pass columns:

```ts
permit_count_current: number | null
impaired_segments_current: number | null
hydrology_context_score_current: number | null
```

Definitions:
- `permit_count_current`: latest available normalized permit count assigned to the county.
- `impaired_segments_current`: latest available normalized impaired/use-support segment count assigned to the county.
- `hydrology_context_score_current`: compact county-level hydrology context summary if already defined in Atlas TX; otherwise null until a stable rule is promoted.

Rules:
- current-snapshot structural columns must be clearly documented as **time-invariant within the panel window** unless historical backfills are later added.
- if a feature is time-invariant, models should generally use it as between-county context, not as within-county trigger evidence.

## C. Weather / hydrometeorological features

These are the highest-priority enrichments for the next experiment phase.

Required planned columns once historical joins exist:

```ts
precip_total_mm: number | null
precip_anomaly_z: number | null
heavy_rain_days: number | null
precip_max_1d_mm: number | null

temp_mean_anomaly_z: number | null
heat_days: number | null
freeze_days: number | null

drought_fraction_d1plus: number | null
drought_fraction_d3plus: number | null

flood_warning_any: 0 | 1 | null
flood_warning_count: number | null
flash_flood_warning_any: 0 | 1 | null

streamflow_high_count: number | null
streamflow_low_count: number | null
streamflow_extreme_high_any: 0 | 1 | null
streamflow_extreme_low_any: 0 | 1 | null
```

Definitions:
- `*_anomaly_z` means deviation from county-month climatology or other explicitly documented baseline.
- `drought_fraction_*` is the fraction of county area or county proxy region under the specified drought category threshold.
- alert and streamflow columns must preserve nulls when historical source coverage is unavailable.

Rules:
- do not backfill missing weather values with `0` unless zero is physically meaningful and source coverage is confirmed.
- preserve the distinction between “no event observed” and “no trustworthy data available.”

---

## Interaction feature contract

The panel may include precomputed interaction columns for repeatability.

Preferred first-pass interaction columns:

```ts
overflow_x_precip_anomaly: number | null
overflow_x_flood_warning: number | null
overflow_x_drought: number | null
overflow_x_heat: number | null
overflow_x_streamflow_high: number | null
overflow_x_streamflow_low: number | null
```

Rules:
- interaction columns should only be populated when both inputs are present.
- if either parent input is null, interaction must be null.
- interaction columns must be derivable directly from already-persisted parent columns.

---

## Provenance and freshness columns

The panel must include enough provenance to support paper-writing and debugging.

Required first-pass columns:

```ts
panel_built_at: string
sdwis_source_version: string | null
overflow_source_version: string | null
structural_source_version: string | null
weather_source_version: string | null
```

Definitions:
- `panel_built_at`: ISO timestamp of panel build.
- source version fields should hold snapshot dates, file hashes, or explicit dataset refresh stamps when available.

Rule:
- provenance fields may be constant within a panel build.

---

## Missingness and caveat contract

The panel must make missingness explicit.

Required source-completeness flags:

```ts
sdwis_data_complete_flag: 0 | 1
overflow_data_complete_flag: 0 | 1
structural_data_complete_flag: 0 | 1
weather_data_complete_flag: 0 | 1
```

Optional but recommended:

```ts
row_usable_for_trigger_models: 0 | 1
row_usable_for_structural_models: 0 | 1
missingness_note: string | null
```

Definitions:
- `*_data_complete_flag = 1` means the relevant source is believed usable for that row under the builder’s documented rules.
- `row_usable_for_trigger_models` should usually require non-missing outcome, overflow, and weather/hydrology coverage if the trigger spec needs them.
- `missingness_note` is for compact, machine-generated explanations such as `"weather unavailable before 2021-01"`.

Rules:
- do not silently drop rows from the canonical panel because one source is missing.
- row filtering for a given model happens downstream and must be reported by the model script.

---

## County identity and normalization rules

### County names
- use Atlas TX canonical county names from the county lookup used elsewhere in the repo.
- preserve a normalization layer for source-side county spelling differences.
- avoid embedding source-specific county spellings into the persisted key columns.

### County FIPS
- left-pad to 5 characters.
- if a source row has county name but no FIPS, normalize to FIPS through the Atlas county lookup.
- rows that cannot be confidently assigned to a county must be excluded from county aggregates and counted in QA summaries.

### Time normalization
- all monthly buckets use calendar month in local-date interpretation unless a source requires UTC normalization; if so, document it explicitly.
- source-specific event dates should be normalized to `YYYY-MM` using one documented date field per source.

---

## Build logic rules

The builder should proceed in this order.

### Step 1 — base county-month skeleton
Construct all county-month rows for the chosen panel window.

### Step 2 — attach SDWIS outcomes
Aggregate normalized SDWIS episodes to county-month.

### Step 3 — derive SDWIS persistence columns
Compute rolling and cumulative prior-history fields.

### Step 4 — attach sewer overflow features
Aggregate normalized overflow events to county-month.

### Step 5 — attach structural context
Join county-level snapshot features.

### Step 6 — attach historical weather/hydrology features
Join monthly weather and hydrologic summaries when available.

### Step 7 — derive interaction columns
Compute interactions only from persisted parent columns.

### Step 8 — attach provenance and completeness flags
Write source versions, usability flags, and missingness notes.

### Step 9 — QA summary
Emit coverage counts, missingness rates, unassigned-source-row counts, and panel window summary.

---

## QA requirements

Every successful build must emit or log at least:

1. total county-month rows
2. min/max `year_month`
3. count of counties represented
4. count of county-months with `sdwis_event_any = 1`
5. missingness rates for every required feature family
6. count of source rows dropped due to unresolvable county assignment
7. severe-threshold definition for overflow severity if used
8. any source windows judged incomplete

Preferred artifact:
- `outputs/panel-summary/county-month-water-risk-coverage.md`

---

## Modeling guardrails

This contract does not force a single model, but it does constrain interpretation.

### Required baseline family
Every paper-facing experiment must compare against at least:
- prevalence baseline
- persistence-only baseline

### Recommended model ladder
1. prevalence
2. persistence-only
3. persistence + structural context
4. persistence + overflow
5. persistence + weather/hydrology
6. persistence + full interactions
7. county fixed-effects version of a main trigger model

### Interpretation rule
- if a feature only helps cross-county ranking, describe it as structural context or a place marker;
- if it helps within-county timing with sensible lags, describe it as a candidate trigger signal.

---

## Validation guardrails

Paper-facing experiments using this panel should default to:
- train: 2020–2023
- validate: 2024
- holdout: 2025 or latest complete holdout period

If source coverage makes that impossible, the experiment must document the altered split explicitly.

Recommended metrics:
- AUROC
- AUPRC
- Brier score
- precision@k
- top-decile lift
- overlap with future top-burden counties
- MAE / RMSE for count models where relevant

---

## Sensitivity and falsification expectations

At least one serious experiment using this panel should include:
- alternate SDWIS dedupe rule,
- alternate overflow severity definition,
- county fixed-effects comparison,
- at least one timing placebo,
- and at least one leverage check excluding extreme counties.

These are not optional if the output will be used in a paper draft.

---

## Non-goals and excluded evidence classes

This panel must not silently include:
- phone color-strip readings,
- other community observations,
- anecdotal incident reports,
- unreviewed crowdsourced labels,
- or manually inferred contamination events.

Those may inform case studies or future validation work, but they are not part of the canonical county-month research panel unless a later contract version explicitly promotes a reviewed derived summary.

---

## Initial implementation map

Primary related files:
- `experiments/build_county_month_water_risk_panel.ts` — canonical builder
- `experiments/model_persistence_baseline.ts` — baseline benchmark
- `experiments/model_trigger_panel.ts` — trigger and interaction models
- `experiments/model_fixed_effects.ts` — within-county specifications
- `papers/2026-05-09-panel-spec-and-experiment-plan.md` — higher-level empirical plan
- `docs/contracts/dataset-registry.md` — upstream dataset and evidence-class contract

---

## Bottom line

This contract freezes the first research-grade county-month table for Atlas TX water-indicator work.

The default scientific stance is:
- **SDWIS history is the baseline to beat**,
- **structural context explains where risk tends to live**,
- **weather and overflow features test when risk spikes**,
- and **community phone-strip data belongs in a separate validation layer, not the core panel**.
