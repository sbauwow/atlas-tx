# Grassroots strip validation preregistration and data schema

Generated: 2026-05-10

## Purpose

This document defines a preregistration-style study plan and a first data schema for using grassroots water-strip observations as a **separate validation and mismatch-detection layer** on top of the Atlas TX public-data water-risk pipeline.

This is intentionally **not** a regulatory or compliance protocol. The goal is to evaluate whether grassroots strip observations can add value as:

1. an **external validation layer** for a public-data risk model, and
2. a **mismatch-detection layer** for places where community observations and official/public signals diverge.

---

## 1. Study framing

### Primary thesis question

> Do counties or public-water-system areas ranked as higher risk by public regulatory and hydrometeorological data exhibit higher rates of repeated grassroots water-strip anomalies?

### Secondary thesis question

> Can repeated grassroots strip anomalies identify meaningful mismatch cases that are not obvious from public-data risk ranking alone?

### Evidence-class rule

Public-data outcomes and grassroots strip observations must remain separate evidence classes.

- **Public data** provide the primary predictive backbone.
- **Grassroots strips** provide external validation, exploratory enrichment, and mismatch detection.

Grassroots strip observations must **not** be silently merged into the authoritative target label for the public-data model.

---

## 2. Main hypotheses

### H1 — External validation hypothesis
Higher public-data risk rank is associated with a higher rate of grassroots strip anomalies.

### H2 — Repeat anomaly hypothesis
Higher public-data risk rank is associated more strongly with **repeated** strip anomalies than with one-off strip anomalies.

### H3 — Mismatch hypothesis
Grassroots strip observations identify counties or PWS areas where community-observed anomaly patterns diverge materially from public-data risk ranking.

### H4 — Seasonal stress hypothesis
Temperature-seasonality and hydrologic stress context are associated with higher grassroots strip anomaly rates.

---

## 3. Unit of analysis

### Primary unit
**County-month**

Reason:
- already supported by the canonical Atlas TX panel
- easier to join when PWS identity is uncertain
- feasible with public data and modest grassroots collection volume

### Preferred follow-on unit
**PWS-month**

Reason:
- stronger causal and operational interpretability
- better linkage between observations and local water systems
- likely more informative once enough observations include reliable utility/PWS names

### Initial rule
All first-pass analyses should be designed to work at county-month. If PWS identity is high-confidence, a parallel exploratory PWS-month slice may be added later.

---

## 4. Public-data backbone

The public-data ranking model is built independently from grassroots strip observations.

### Current public-data feature groups
- SDWIS persistence and prior burden
- empirical-Bayes county baseline risk
- sewer overflow context
- precipitation context
- flood / flash-flood warning context
- nearest-gauge streamflow context
- drought context
- temperature-seasonality context
- structural context such as permits / impaired segments / hydrology context score

### Primary public-data outcome
- `sdwis_event_any` at month \(t+1\)

### Current strongest public-data thesis result
The strongest current model combines:
- persistent county baseline risk
- EB shrinkage
- overflow / precipitation / warnings / streamflow / drought
- temperature-seasonality context

The grassroots study does **not** replace this model. It evaluates whether community observations behave consistently with it and whether they reveal useful mismatch cases.

---

## 5. Grassroots observation protocol

## 5.1 Minimum required metadata per observation
Each grassroots strip observation should record:

- observation timestamp
- county
- latitude/longitude if available
- utility / PWS name if known
- water source context if known (tap / household / school / other)
- strip brand and model
- analytes available on the strip
- photo of strip next to chart
- whether protocol instructions were followed
- whether repeat tests were taken
- collector type: `protocol_driven` or `opportunistic`

## 5.2 Preferred field protocol
To reduce noise, observers should be asked to:

1. photograph the strip next to the manufacturer chart,
2. use consistent lighting where possible,
3. follow the strip timing instructions exactly,
4. record the water source type,
5. repeat the test if a strong anomaly appears,
6. avoid mixing brands within the same longitudinal household series where possible.

## 5.3 Quality rule
Observations failing minimum photo/protocol checks should not be used in the primary analysis.

They may be retained in a lower-confidence exploratory table for sensitivity analysis.

---

## 6. Observation-level schema

```ts
export type GrassrootsStripObservation = {
  observation_id: string;
  observed_at: string;                 // ISO timestamp
  observed_date: string;               // YYYY-MM-DD
  year_month: string;                  // YYYY-MM
  county_fips: string | null;
  county_name: string | null;
  latitude: number | null;
  longitude: number | null;
  pws_name_raw: string | null;
  pws_id_candidate: string | null;
  location_type: "household" | "school" | "business" | "public_site" | "unknown";
  collector_type: "protocol_driven" | "opportunistic" | "unknown";
  strip_brand: string | null;
  strip_model: string | null;
  analyte_panel: string[];             // e.g. ["nitrate", "nitrite", "hardness", "chlorine", "pH"]
  photo_path: string | null;
  photo_quality_ok: 0 | 1;
  protocol_followed_ok: 0 | 1;
  replicate_group_id: string | null;
  replicate_index: number | null;
  notes: string | null;
};
```

---

## 7. Analyte-result schema

Each observation may contain multiple analyte band labels.

```ts
export type GrassrootsStripAnalyteResult = {
  observation_id: string;
  analyte: string;                     // e.g. nitrate, nitrite, chlorine, pH, hardness
  band_label_raw: string | null;       // original human or vision-assigned label
  band_label_normalized: string | null;
  severity_bucket: "normal" | "borderline" | "abnormal" | "unknown";
  severity_score: number | null;       // optional ordinal score, e.g. 0, 1, 2
  confidence: number | null;           // optional model or QA confidence, 0-1
};
```

### Important rule
`severity_score` is an ordinal convenience field for analysis. It is **not** a measured concentration and must never be described as such unless the strip brand is explicitly calibrated and reported.

---

## 8. Derived observation-level anomaly variables

These are derived after QA filtering.

```ts
export type GrassrootsStripObservationDerived = {
  observation_id: string;
  qa_pass_primary: 0 | 1;
  strip_any_anomaly: 0 | 1;
  strip_multi_analyte_anomaly: 0 | 1;
  strip_borderline_any: 0 | 1;
  strip_abnormal_analyte_count: number;
  strip_max_severity_score: number | null;
};
```

### Primary anomaly definition
An observation is counted as `strip_any_anomaly = 1` if:
- `photo_quality_ok = 1`,
- `protocol_followed_ok = 1`, and
- at least one analyte has `severity_bucket = "abnormal"`.

### Stronger anomaly definition
`strip_multi_analyte_anomaly = 1` if two or more analytes are abnormal in the same observation.

This should be reported separately because it is more conservative and likely more informative.

---

## 9. County-month aggregation schema

The first paper should aggregate grassroots observations to county-month.

```ts
export type CountyMonthGrassrootsStripSummary = {
  county_fips: string;
  county_name: string;
  year_month: string;
  strip_observation_count: number;
  strip_qa_pass_count: number;
  strip_any_anomaly_count: number;
  strip_multi_analyte_anomaly_count: number;
  strip_any_anomaly_rate: number | null;
  strip_multi_analyte_anomaly_rate: number | null;
  strip_repeat_anomaly_any: 0 | 1;
  strip_repeat_anomaly_count: number;
  strip_protocol_driven_count: number;
  strip_opportunistic_count: number;
};
```

### Repeat anomaly rule
A county-month gets `strip_repeat_anomaly_any = 1` if, within a defined rolling window such as 30 days:
- at least two QA-pass observations exist, and
- at least two of them are anomalous,
- or one strong multi-analyte anomaly is confirmed by a second QA-pass anomalous observation.

This is preferred over a one-off anomaly flag because it is less sensitive to strip noise.

---

## 10. Primary analysis plan

## 10.1 Analysis A — External validation

### Objective
Test whether higher public-data risk rank is associated with more grassroots strip anomalies.

### Main county-month outcomes
- `strip_any_anomaly_rate`
- `strip_repeat_anomaly_any`
- `strip_multi_analyte_anomaly_rate`

### Main predictor
- public-data county-month risk score or risk rank from the canonical Atlas TX model

### Preferred first-pass test
Compare top-risk decile vs bottom-risk decile on:
- repeat anomaly prevalence
- anomaly rate
- multi-analyte anomaly rate

### Regression form
A simple first model:

\[
\Pr(\text{strip\_repeat\_anomaly\_any}_{i,t}=1) = \sigma(\beta_0 + \beta_1 \text{public\_risk\_rank}_{i,t} + \beta_2 \log(1+\text{strip\_observation\_count}_{i,t}) + \beta_3 \text{season}_t)
\]

If data volume is adequate, add region indicators or county random effects.

---

## 10.2 Analysis B — Mismatch detection

### Objective
Find county-months where grassroots and public-data signals diverge.

### Suggested mismatch score
\[
\text{mismatch}_{i,t} = z(\text{strip\_repeat\_anomaly\_signal}_{i,t}) - z(\text{public\_risk\_score}_{i,t})
\]

Interpretation:
- large positive values: more grassroots anomaly than expected from public risk
- large negative values: less grassroots anomaly than expected from public risk

### Use case
This should be used for:
- outlier ranking
- case-study selection
- journalism-oriented follow-up

Not as proof of contamination or regulatory failure.

---

## 10.3 Analysis C — Seasonal stress alignment

### Objective
Test whether grassroots anomalies rise in periods of thermal or hydrologic stress.

Candidate comparisons:
- high `freeze_days`
- high `heat_days`
- high overflow burden
- flood-warning months
- drought-heavy months

This should be described as exploratory unless preregistered with exact thresholds before data collection begins.

---

## 11. Controls and confounders

The following controls are required or strongly recommended.

### 11.1 Observation intensity control
More observations create more opportunities to detect anomalies.

Control with:
- `log(1 + strip_observation_count)`

### 11.2 Seasonality control
Both public-data stress and grassroots anomaly detection may vary seasonally.

Control with:
- month-of-year fixed effects or season dummies

### 11.3 Geography control
Regional baseline differences may be large.

Control with:
- regional indicators,
- basin indicators, or
- county/PWS intercept structure if data volume allows

### 11.4 Protocol/selection control
Observers may test disproportionately where they already suspect a problem.

Control with:
- `collector_type`
- `protocol_driven` versus `opportunistic` splits

### 11.5 QA control
Primary analysis should use only:
- `qa_pass_primary = 1`

Sensitivity analyses may relax this.

---

## 12. Inclusion and exclusion rules

### Include in primary analysis
- QA-pass observations
- observations with county assignment
- observations with analyte-level parse success

### Exclude from primary analysis
- failed-photo observations
- protocol-failed observations
- unknown-date observations
- observations with no usable analyte parse

### Secondary analysis only
- low-confidence observations
- observations with county but no stable source metadata
- mixed-protocol replicate groups

---

## 13. Minimum viable sample targets

### Pilot threshold
At least one of:
- **100–200 county-months** with grassroots observations, or
- **500+ total strip observations** with meaningful repeats

### Better target
- **1,000+ observations**
- repeated across months
- enough top-decile and bottom-decile county coverage for comparison

### Interpretation rule
If data volume is below pilot threshold, the grassroots piece should be presented as exploratory rather than confirmatory.

---

## 14. Primary decision rules

### Support for H1
Support if higher public-data risk rank is associated with higher grassroots repeat anomaly prevalence or rate after basic observation-intensity control.

### Support for H2
Support if repeated anomaly outcomes show clearer separation than one-off anomaly outcomes.

### Support for H3
Support if mismatch ranking surfaces interpretable outlier counties/PWSs that survive manual review.

### Weak evidence outcome
If only one-off anomalies move and repeated anomalies do not, treat the result as weak.

---

## 15. Reporting rules

The final paper must use cautious language.

### Acceptable language
- external validation
- sentinel screening
- predictive association
- mismatch detection
- community-observed anomaly pattern
- non-regulatory evidence layer

### Avoid
- contamination proof
- compliance inference
- diagnosis
- exact concentration estimation
- safety certification claims

---

## 16. Data storage layout

Recommended artifact locations:

### Raw / observation-level
- `data/grassroots/strip_observations.csv`
- `data/grassroots/strip_analyte_results.csv`

### Derived / aggregated
- `data/grassroots/county_month_strip_summary.csv`
- `outputs/thesis-status/grassroots-validation-analysis.md`

### Contracts / protocol
- this file as the canonical preregistration-style plan until superseded by a versioned update

---

## 17. Recommended next implementation steps

1. create the observation-level CSV/JSON schema files
2. define allowed analyte vocabulary and severity normalization rules
3. implement county assignment and optional PWS candidate matching
4. implement derived anomaly flags
5. implement county-month aggregation
6. run the first external-validation decile comparison

---

## 18. Most defensible thesis framing

If the study works, the strongest safe claim is:

> A public-data drinking-water risk ranking model identifies places with elevated future official-risk burden, while a separate grassroots strip layer provides useful external validation and mismatch-detection value when repeated observations are used instead of one-off strip readings.

That is the central claim this protocol is designed to test.

---

## Sources

- EPA Envirofacts / SDWIS API  
  https://www.epa.gov/enviro/envirofacts-data-service-api
- OpenFEMA IPAWS Archived Alerts  
  https://www.fema.gov/openfema-data-page/ipaws-archived-alerts-v1
- U.S. Drought Monitor data services  
  https://droughtmonitor.unl.edu/DmData/DataDownload/WebServiceInfo.aspx
- USGS Water Services overview  
  https://www.usgs.gov/tools/usgs-water-services
- Open-Meteo Historical Weather API  
  https://open-meteo.com/en/docs/historical-weather-api
