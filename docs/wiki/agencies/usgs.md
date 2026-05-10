---
title: USGS — US Geological Survey
type: agency
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.6
source_count: 1
decay_profile: slow
tags: [agency, federal, water, hydrology, geology, gis]
sources:
  - docs/research/texas-gis-inventory.md
relationships:
  - {type: references, target: agencies/twdb.md}
  - {type: references, target: datasets/usgs-nwis.md}
  - {type: references, target: concepts/nhd.md}
stale: false
---

# USGS — US Geological Survey

Federal scientific agency. The authoritative source for nationally-comparable hydrography, real-time streamflow / groundwater levels, and water-quality monitoring data. Adjacent to Atlas TX's Texas-state stack but increasingly relevant as the platform extends past indicator layers into observational hydrology.

## What it publishes that we (could) use

### National Hydrography Dataset (NHD)
- **NHD Flowlines** — every river, stream, canal in the US as a line geometry. Used to put TCEQ permits and PWS service areas in actual hydrologic context (which stream does this discharge enter, which downstream PWS intakes does it threaten).
- **Watershed Boundary Dataset (WBD)** — HUC-coded polygons (HUC2 → HUC12). [TWDB's HUC8 layer](twdb.md) mirrors WBD attribution for Texas; for nationally-comparable joins prefer USGS WBD directly.
- **NHDPlus** — value-added NHD with flow-direction, mean-annual-flow estimates, and catchment polygons per flowline.

### National Water Information System (NWIS)
- **Surface-water gauges** — real-time and historical streamflow at ~10,000+ stations nationally; substantial Texas coverage.
- **Groundwater levels** — well-level observations.
- **Water-quality monitoring** — multi-parameter samples (chemistry, turbidity, etc.) at fixed stations.

### 3D Elevation Program (3DEP)
- **Lidar / DEM** — national elevation. TX-specific lidar also lives in TxGIO StratMap; USGS is the federal entry point.

## Authority

- **Authoritative** for nationally-comparable hydrography (NHD/WBD/NHDPlus) and US elevation.
- **Authoritative** for the underlying HUC scheme. (TWDB HUC8 attribution is friendlier for TX-only work; the codes are the same.)
- **Indicator-grade for water quality**: NWIS samples are real measurements, but stations are sparse — coverage gaps make NWIS-derived "water quality near a county" inherently approximate.

## Things to know

- **NHD vs TWDB river basins**: TWDB river basins are TX state planning units; NHD HUCs are USGS hydrologic units. They divide Texas differently. Use the right one for the question being asked.
- **NWIS station IDs are 8-15 digit strings.** Keep as strings.
- **Real-time NWIS** is genuinely real-time and rate-limited. For atlas-tx demo paths, cache snapshots; never depend on a live USGS endpoint at request time.
- USGS data products often ship as **TopoJSON / shapefile / FGDB** rather than friendly REST. Some have ArcGIS feature services. Pick the path that fits Atlas TX's existing fetcher pattern.

## Status in atlas-tx

Not currently registered in the dataset registry (as of contract v0.4.0). Listed here as a known adjacent source — likely candidates for first registration are NHD flowlines (as a layer) and WBD HUC8 (potentially superseding `twdb-huc8` for nationally-comparable joins, though TWDB attribution is friendlier in-state).

## See also

- [TWDB](twdb.md) — TX-state hydrology counterpart.
- Texas GIS inventory note (lists USGS as a federal-fallback source).
