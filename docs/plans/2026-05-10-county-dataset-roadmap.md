# Atlas TX — County dataset roadmap

_Date: 2026-05-10_

## Summary

This note translates the current Atlas TX county data surface into a practical execution order.

Atlas TX already has a meaningful county-level water and hydrology stack. The most important next move is not to add more generic county datasets. It is to deepen the county water-risk workflow with stronger weather normalization, notice/treatment-stress signals, and better SDWIS/EJ integration.

A simple rule:

> County datasets should be prioritized by how much they improve water-risk explanation, contradiction detection, and journalist utility.

---

## 1. Current county dataset classes

Atlas TX currently has three county-dataset classes.

### A. Active county water/hydrology stack

These are the strongest county-ready sources in the current product.

- TCEQ Water Quality Individual Permits (`7fq8-wig2`)
- Texas Water Districts (`hr84-s96f`)
- TCEQ sanitary sewer overflows (`8kc5-95uk`)
- NWS active alerts (`nws-alerts`)
- USGS Texas stream sites / streamflow context (`usgs-stream-sites`)
- FEMA NFHL floodplain context (`fema-nfhl`)
- TCEQ surface-water quality segments (`tceq-swq-segments`)
- TWDB hydrology context (`twdb-major-aquifers`, `twdb-river-basins`, `twdb-huc8`)
- regional enrichment from LCRA and GBRA

These are the main county-ready operational and explanatory layers right now.

### B. Strategically important but not fully productized county signals

These matter a lot to the Atlas TX thesis, but are not yet as operationally embedded in county flows.

- EPA SDWIS Drinking Water Violations
- EPA EJScreen
- EPA ECHO
- Census ACS county/block-group context
- TCEQ CID Search One / Search Two
- county-month weather/hydrology research panels

### C. Legacy / secondary county inventory

These still exist, but they are not the current center of gravity.

- CPI investigations (`waxz-c9q5`)
- County returns (`ctj5-pypw`)
- Sales tax rates (`tmhs-ahbh`)
- debt datasets

These are useful only if Atlas intentionally reopens a broader fiscal/social county-comparison lane.

---

## 2. County dataset status matrix

| Dataset | County-ready now | In product UI | In APIs | Strategic priority | Notes |
|---|---:|---:|---:|---|---|
| TCEQ permits | yes | yes | yes | very high | primary burden/activity layer |
| Texas water districts | yes | yes | yes | very high | governance/infrastructure context |
| TCEQ sewer overflows | yes | yes | yes | very high | county stress/anomaly signal |
| NWS alerts | yes | yes | yes | very high | official weather-event context |
| USGS stream sites/streamflow | yes | yes | yes | very high | strongest hydrologic explanatory signal |
| FEMA NFHL | yes | yes | yes | high | flood exposure context |
| TCEQ surface-water quality segments | yes | partly | yes | very high | important burden/impairment context |
| TWDB hydrology layers | yes-ish | partly | partly | high | watershed/aquifer context |
| LCRA / GBRA water layers | yes for covered geography | yes | yes | high | basin/regional enrichment |
| PUCT water/sewer datasets | partly | partly | partly | medium | secondary governance context |
| EPA SDWIS | partly | not fully | partly | very high | strategically central; still needs fuller county folding |
| EPA EJScreen | partly | not fully | partly | very high | core to burden overlay thesis |
| EPA ECHO | partly | not fully | partly | high | compliance-gap and contradiction support |
| Census ACS | partly | partly | partly | high | denominators, demographics, normalization |
| CID Search One/Two | partly | not fully | partly | high | journalist/community-signal layer |
| Boil-water notices | no | no | no | very high | one of the best future county signals |
| E2 disinfectant reporting | no | no | no | very high | treatment-stress signal |
| IBI / biology | no | no | no | high | ecology/contradiction layer |
| CPI investigations | yes | legacy | legacy | low | legacy county-comparison lane |
| County returns | yes | legacy | legacy | low | legacy county-comparison lane |
| Sales tax rates | yes | legacy | legacy | low | legacy county-comparison lane |
| Debt datasets | partly | no | no | low | registered but out of current scope |

---

## 3. Now / Next / Later roadmap

## Now

These are the county datasets Atlas TX should actively use and strengthen immediately.

1. TCEQ permits
2. Texas water districts
3. sewer overflows
4. NWS alerts
5. USGS streamflow / gauges
6. FEMA floodplain context
7. TCEQ surface-water quality segments
8. TWDB / LCRA / GBRA hydrology context

### Why now

These are already the healthiest county stack in the repo. They are the best base for:
- county water summaries
- anomaly explanation
- hydrologic/weather normalization
- reporter-facing county drilldowns

---

## Next

These are the county datasets that should deepen the thesis after the current base is stable.

1. county-month precipitation
2. county-month streamflow history
3. county-month drought
4. SDWIS county/PWS integration
5. EJScreen county/block-group folding
6. ACS demographic normalization support

### Why next

These datasets move Atlas from a county water-operations explorer toward a county water-risk intelligence system that can better separate:
- persistence,
- structural stress,
- and trigger pressure.

This is also the cleanest path for turning current Feynman research into product value.

---

## Later

These are very high-value county datasets, but they should follow after the county water/weather base is stronger.

1. boil-water notices
2. E2 disinfectant residual reporting
3. IBI / biological integrity
4. EPA ECHO fuller county workflow integration
5. CID protest/community-signal folding
6. community observation layers

### Why later

These are strategically powerful, especially for contradiction detection and journalist workflows, but they are harder to operationalize cleanly than the current water + weather + hydrology stack.

---

## 4. Top-10 county dataset priorities

If Atlas TX needs a hard prioritization list, it should be:

1. TCEQ permits
2. sewer overflows
3. EPA SDWIS
4. NWS alerts
5. USGS streamflow
6. drought
7. TCEQ surface-water quality segments
8. Texas water districts
9. EJScreen
10. boil-water notices

### Why this order

- 1–4 define burden + stress + event context
- 5–6 explain hydrologic timing and chronic pressure
- 7–9 deepen county interpretation and burden framing
- 10 is one of the strongest future mismatch signals

---

## 5. Execution guidance

### County work should be prioritized in this order

1. public-record water risk
2. operational stress
3. hydrologic/weather explanation
4. burden/governance context
5. contradiction detection
6. community verification later

### Avoid

- spending too much time on legacy fiscal/social county sources
- adding generic county datasets with weak connection to the water thesis
- introducing community/observational data into county scoring before the official county layer is robust

---

## 6. Quick action list

If this roadmap is executed quickly, the next county dataset moves should be:

1. promote county-month weather/hydrology work from research into county summary surfaces
2. add boil-water notices as the next major county mismatch signal
3. strengthen county SDWIS + EJ county intelligence output
4. add E2 treatment-stress context
5. add IBI / biology later as an additive contradiction layer

---

## 7. Product thesis for county datasets

A concise version:

> Atlas TX is strongest when county datasets are used to explain water risk, not just count county facts.

That means county data should first help answer:
- what is persistently risky here?
- what changed recently?
- what does weather explain?
- what still looks contradictory after context is added?
