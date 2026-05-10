---
title: NOAA — National Oceanic and Atmospheric Administration
type: agency
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.55
source_count: 1
decay_profile: slow
tags: [agency, federal, weather, climate, water]
sources:
  - docs/research/texas-gis-inventory.md
relationships:
  - {type: references, target: datasets/noaa-storm-events.md}
  - {type: references, target: datasets/usdm-drought-monitor.md}
stale: false
---

# NOAA — National Oceanic and Atmospheric Administration

Federal weather, climate, and ocean agency. The authoritative source for weather hazards, precipitation, drought, and climate normals — all directly relevant to a TX water-risk story (drought hits aquifers, hurricanes hit Gulf Coast PWSs, floods overwhelm treatment plants).

## What it publishes that we (could) use

### Weather hazard records
- **Storm Events Database** — every recorded severe-weather event in the US since 1950 (tornado, hail, flash flood, hurricane, drought episode, ...). Per-event location, magnitude, deaths/injuries, property damage. See [`datasets/noaa-storm-events`](../datasets/noaa-storm-events.md).
- **NCEI Billion-Dollar Disasters** — curated list of US weather/climate disasters with damages ≥$1B (CPI-adjusted). Texas is heavily represented.

### Drought
- **US Drought Monitor (USDM)** — joint NOAA/USDA/UNL product. Weekly classified drought polygons (D0–D4). See [`datasets/usdm-drought-monitor`](../datasets/usdm-drought-monitor.md).
- **Climate Prediction Center (CPC)** — drought outlook, ENSO, seasonal forecasts.

### Precipitation and climate
- **GHCN-Daily** — Global Historical Climatology Network daily precipitation/temperature at thousands of TX stations.
- **Climate Normals (1991–2020)** — 30-year averages per station, the baseline against which "anomalous" is defined.
- **NEXRAD Stage IV / MRMS** — radar-derived gridded precipitation. Useful for "how much rain fell where" without depending on station spacing.
- **Atlas 14** — precipitation frequency / IDF curves used for floodplain and infrastructure design.

### Tropical cyclones
- **HURDAT2** — best-track tropical cyclone data (Atlantic basin). Texas Gulf Coast events are prominent.
- **National Hurricane Center (NHC)** — real-time advisories and post-season reports.

## Authority

- Authoritative for US weather records, climate normals, and severe-weather inventories.
- Co-authoritative for drought (with USDA/UNL) via USDM.
- For floodplain mapping and flood-frequency, defer to FEMA and USACE — NOAA provides the precipitation inputs, not the regulatory floodplain.

## Things to know

- **NOAA is huge.** "NOAA published it" is not specific enough — every NOAA dataset has a parent line office (NWS, NCEI, NESDIS, NOS). Track which one when registering a dataset.
- **Climate Normals shift.** The 1991–2020 normals replaced 1981–2010 normals around 2021. Anomaly framing depends on which normals you compare against.
- **Real-time NWS feeds are not for demo paths.** Cache or accept the latency.
- **Texas is in the warning-product seam.** TX is split across multiple NWS Weather Forecast Offices (Houston/Galveston, San Antonio, Fort Worth, Midland, Brownsville, Amarillo, Lubbock, Corpus Christi, El Paso). Statewide rollups need to handle this.

## Status in atlas-tx

Not currently registered. Listed as an adjacent federal source in the GIS inventory note. Likely first registrations: USDM (drought directly impacts surface-water and groundwater risk) and Storm Events (hurricane / flood / tornado context for Gulf Coast and inland counties).

## See also

- [FEMA](fema.md) — flood-hazard regulatory layer downstream of NOAA precipitation.
- [USGS](usgs.md) — streamflow gauges measure the runoff response to NOAA-published precipitation.
