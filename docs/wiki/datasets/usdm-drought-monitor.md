---
title: USDM — US Drought Monitor
type: dataset
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.6
source_count: 1
decay_profile: medium
tags: [dataset, federal, drought, weekly, gis, layer]
sources:
  - docs/research/texas-gis-inventory.md
registry_id: null
relationships:
  - {type: published_by, target: agencies/noaa.md}
stale: false
---

# USDM — US Drought Monitor

Weekly classified-drought map of the US. Joint product of NOAA / USDA / UNL (National Drought Mitigation Center at University of Nebraska–Lincoln).

## What it is

Polygon dataset published weekly (Thursday release for prior-week data). Each polygon is classified D0–D4:

- **D0** — Abnormally Dry
- **D1** — Moderate Drought
- **D2** — Severe Drought
- **D3** — Extreme Drought
- **D4** — Exceptional Drought

Each higher class fully contains the lower classes geometrically (a D4 polygon is also D0/D1/D2/D3). The classifier is **expert-driven** — a weekly synthesis of multiple physical inputs (precipitation, soil moisture, streamflow, vegetation indices, expert reports), not a deterministic threshold model.

## Why it matters here

Drought directly affects atlas-tx's water-risk story:

- **Aquifer drawdown** — sustained drought stresses TWDB-mapped major aquifers; small TX PWSs that depend on a single well can run dry.
- **Surface-water reservoirs** — drought drives reservoir levels down, can degrade source-water quality (concentrations rise, treatment harder).
- **Boil-water notices and SDWA violations correlate with extended D3/D4** in some TX regions.

Pairs naturally with [SDWIS](epa-sdwis-violations.md) violation timing and [TWDB hydrology](../agencies/twdb.md) layers.

## Schema notes

- **DM** field (0–4) gives the drought class.
- Geometry is polygons in WGS84 (web service).
- Each weekly snapshot is its own dataset — atlas-tx would want to cache a TX-clipped time series, not just the latest week.
- **Statistics by area** are also published — % of state in each class per week — which is often the friendlier shape for a county-level trend.

## How it's served

- ArcGIS feature service (current week + recent weeks).
- Shapefile / GeoJSON / KMZ downloads at https://droughtmonitor.unl.edu/.
- USDA-published statistics tables (state, county, HUC-aggregated) downloadable as CSV.

## Caveats (always emit downstream)

- **Subjective synthesis.** USDM is expert-classified, not a model output. Two weeks with the same physical inputs can be classified differently. This is by design — the human-in-the-loop is the point — but it means USDM is *not* a measurement layer.
- **Polygon boundaries are coarse.** USDM is intentionally smoothed; not appropriate for sub-county or per-PWS exposure.
- **Drought ≠ water-supply emergency.** A county in D3 may have abundant municipal supply via a non-local water utility; another county in D1 may be running on stressed aquifers. Use USDM as the climate-stress signal, not the supply-stress signal.
- **"Latest week" snapshots can churn.** USDM may be revised in the following week's release as more data arrives.

## Status in atlas-tx

Not currently registered. Strong candidate for first weather-related signal — drought stress is a leading indicator for water-system strain in Texas. Natural future ID: `usdm-drought-tx` (current week) or `usdm-drought-tx-history` (time series), `accessType: external`.

## See also

- [NOAA agency](../agencies/noaa.md)
- [TWDB hydrology](../agencies/twdb.md) — aquifers/reservoirs that drought stresses.
- [Storm Events](noaa-storm-events.md) — has its own event-coded drought rows; complementary, not redundant.
