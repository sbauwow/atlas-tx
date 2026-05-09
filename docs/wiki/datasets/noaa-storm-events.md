---
title: NOAA Storm Events Database
type: dataset
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.55
source_count: 1
decay_profile: medium
tags: [dataset, federal, weather, hazard, history]
sources:
  - docs/research/texas-gis-inventory.md
registry_id: null
relationships:
  - {type: published_by, target: agencies/noaa.md}
stale: false
---

# NOAA Storm Events Database

Per-event severe-weather records for the US since 1950, maintained by NCEI / NWS.

## What it is

One row per recorded storm event: tornado, severe thunderstorm wind, hail, flash flood, river flood, hurricane / tropical storm, drought episode, heat wave, winter storm, wildfire (limited), and ~50 other event types. Records include:

- **Event type** (controlled vocabulary).
- **Begin/end date+time and lat/long** — where available; older records are sparser.
- **Magnitude** — wind speed (kt), hail size (in), F/EF tornado scale, etc.
- **Casualties** — direct/indirect deaths and injuries.
- **Damage estimates** — property and crop damage in $.
- **Episode narrative** + **event narrative** — free text.

## Why it matters here

Hurricane and flood history are first-class context for a Texas water-risk story:

- **Gulf Coast counties** carry hurricane-strike history that affects PWS resilience expectations.
- **Inland flash-flood events** correlate with surface-water-quality post-event spikes (sediment, sewage overflows).
- **Drought episodes** as event-coded entries connect to USDM polygons for trend analysis.

Atlas-tx is not currently using this. Listed here as an adjacent dataset relevant for any "what happened to county X over the last decade" surface.

## Schema notes

- Event type vocabulary changed in 1996 (formal NWS classification scheme started). Older records use coarser categories — long-period analysis must reconcile.
- **County-level location is provided for many but not all events.** Tornado tracks have begin/end coordinates; large-scale events (drought, hurricane) are coded by zone or county.
- Damage estimates are **survey-grade**, not authoritative. Treat as order-of-magnitude.

## How it's served

- Bulk CSV/HTML at NCEI Storm Events publication site, organized by year.
- No friendly REST API; download-and-parse pattern.

## Caveats (always emit downstream)

- **Reporting changes over time.** Early records (1950s–1970s) are sparser; small events were less likely to be recorded. A "rising tornado count over decades" is partly a reporting artifact.
- **County coding**: storm-event "county" is the impacted county, not the meteorological event center. A multi-county event spawns multiple rows.
- **Damage figures are not adjusted for inflation in raw downloads.** Atlas-tx-side normalization required for trend comparisons.
- **Casualties exclude indirect public-health impacts** (hospital admissions during heat waves attributed elsewhere, e.g., CDC).

## Status in atlas-tx

Not currently registered. Natural future ID: `noaa-storm-events-tx` with `accessType: external`. A TX-only filter is straightforward (state column) and bulk-downloads keep the demo path off live NOAA.

## See also

- [NOAA agency](../agencies/noaa.md)
- [USDM Drought Monitor](usdm-drought-monitor.md) — gridded drought, complementary to the event-coded drought rows here.
