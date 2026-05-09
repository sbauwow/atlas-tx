---
title: USGS NWIS — National Water Information System
type: dataset
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.6
source_count: 1
decay_profile: medium
tags: [dataset, federal, water, hydrology, real-time, monitoring]
sources:
  - docs/research/texas-gis-inventory.md
registry_id: null
relationships:
  - {type: published_by, target: agencies/usgs.md}
  - {type: references, target: datasets/usdm-drought-monitor.md}
  - {type: references, target: agencies/twdb.md}
stale: false
---

# USGS NWIS — National Water Information System

USGS's flagship water-data system. Real-time and historical observations from thousands of stations: streamflow gauges, groundwater wells, and water-quality monitoring. Atlas-tx-relevant primarily for streamflow and groundwater levels — the *measurement* layer that complements the regulatory and indicator layers atlas-tx already uses.

## Three data types

| Data type | What it measures | Stations in TX |
|---|---|---|
| **Surface water** | Streamflow (cfs), gauge height (ft), water temperature, sometimes turbidity / DO | ~750 active + many discontinued |
| **Groundwater** | Well water level, sometimes specific conductance | ~thousands; varying observation cadence |
| **Water quality** | Multi-parameter samples (chemistry, biology) at fixed stations | Sparse compared to surface-water gauges |

## Why it matters here

Atlas-tx is mostly indicator-grade. NWIS is **measurement-grade** for the underlying physical reality of TX water:

- **Streamflow trends** under [USDM drought](usdm-drought-monitor.md) tell you whether drought is actually translating into reduced flow at specific points — closing the loop between climatic stress and surface-water supply.
- **Groundwater trends** in TWDB-mapped major aquifers say whether the aquifer is being drawn down — closing the loop between climatic stress and groundwater supply.
- **NWIS gauges with NHD COMID cross-references** let you trace upstream from a PWS intake or downstream from a TPDES discharge to see what the actual water condition is.

This is the **physical-reality counterpart** to the indicator-heavy stack atlas-tx currently consumes.

## Schema notes

- **Station ID** — 8-15 digit string, USGS-assigned, stable. Keep as string.
- **Parameter codes** — 5-digit numeric codes (e.g. `00060` = streamflow cfs, `00065` = gauge height ft, `00400` = pH). Multi-parameter stations have multiple time series.
- **Statistic codes** — daily statistics (mean, max, min) vs instantaneous values are coded.
- **Time series** — long histories at established gauges (decades), but quality varies — gaps, equipment changes, datum revisions.

## How it's served

- **NWIS Web Services** — REST APIs at `waterservices.usgs.gov`. Multiple endpoints:
  - `iv` — instantaneous values (real-time, 5-min cadence at most gauges).
  - `dv` — daily values (the daily-aggregated time series).
  - `gwlevels` — groundwater levels.
  - `qwdata` — water-quality samples (being deprecated in favor of Water Quality Portal).
  - `site` — station metadata.
- Output formats: JSON, RDB (USGS tab-separated), WaterML XML.
- **No auth required** for public data. Soft rate limits exist; bulk pulls should pace requests.

## Texas in NWIS

USGS Texas Water Science Center coordinates ~750 active surface-water gauges and many groundwater observation wells. TWDB cooperatively funds many TX gauges; some are TWDB-only and not in NWIS.

## Caveats (always emit downstream)

- **Real-time data is provisional.** Marked with a quality-code; not yet QC'd. Final ratings come months later. Don't build long-trend math on provisional data.
- **Gauges drift, get moved, get retired.** A station's record can have datum shifts, recalibrations, instrument changes — analytical care needed for multi-decade analyses.
- **Spatial coverage is sparse compared to the ground truth atlas-tx implies.** Most TX streams have no gauge. NWIS gives you data at *gauge points*, not everywhere.
- **Real-time NWIS is not appropriate for the demo path.** Cache snapshots; never call live USGS endpoints from a request handler.
- **Daily-value vs instantaneous is a real choice.** A daily mean smooths over flash-flood peaks; instantaneous data captures them. Pick deliberately.

## Status in atlas-tx

Not currently registered. Strong candidate for first measurement-grade dataset to enter the registry — pairs especially well with USDM drought (climatic stress → flow response) and with TWDB aquifer layer (groundwater levels → drawdown). Natural future ID: `usgs-nwis-tx` with `accessType: external`.

## See also

- [USGS agency](../agencies/usgs.md)
- [USDM Drought Monitor](usdm-drought-monitor.md) — climatic stress that NWIS can show the response to.
- [TWDB Major Aquifers](twdb-major-aquifers.md) — atlas-tx's aquifer geometry that NWIS groundwater levels would populate.
- [NHD concept](../concepts/nhd.md) — NWIS gauges have NHD COMID cross-references.
