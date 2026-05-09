---
title: Source — Texas GIS Inventory (research note)
type: source
tier: semantic
created: 2026-05-08
updated: 2026-05-08
last_confirmed: 2026-05-08
confidence: 0.6
source_count: 1
decay_profile: medium
tags: [source, research-note, gis, inventory]
sources:
  - docs/research/texas-gis-inventory.md
relationships:
  - {type: references, target: agencies/tceq.md}
  - {type: references, target: agencies/twdb.md}
  - {type: references, target: agencies/epa.md}
  - {type: references, target: portals/data-texas-gov.md}
stale: false
---

# Source — Texas GIS Inventory

Summary of the in-repo research note at [`docs/research/texas-gis-inventory.md`](../../research/texas-gis-inventory.md). The note is the live document; this page is the durable wiki-side anchor.

## Purpose of the note

First-pass, atlas-tx-oriented inventory of Texas GIS sources. Not a claim to enumerate every TX layer — just a planning inventory of the highest-value statewide portals, dataset families, and ingestion candidates.

## Bottom line (verbatim claim)

The note asserts that Atlas TX already has the right *tabular* core for the water-risk story (TCEQ Water Quality Permits, Texas Water Districts, EPA SDWIS, EPA EJScreen, Census ACS, plus optional TCEQ CID / EPA ECHO / EPA TRI). What is missing is a cleaner statewide *GIS* inventory around those tables.

## Six recommended GIS source families (per the note)

1. [`data.texas.gov`](../portals/data-texas-gov.md) — Socrata catalog for state-agency tabular datasets.
2. **TCEQ GIS Data Hub** — environmental / water layers; complements [TCEQ](../agencies/tceq.md) tabular sources.
3. **TWDB GIS downloads** — water, hydro, aquifer, well, planning-region geometry; complements [TWDB](../agencies/twdb.md).
4. **TxGIO / StratMap** — statewide base layers (parcels, address points, hydrography, imagery, lidar).
5. **TxDOT Open Data** — roadway / infrastructure overlays.
6. **Railroad Commission GIS** — oil / gas / pipeline overlays.

## Highest-value next ingestions (per the note)

- TWDB aquifers, river basins, HUCs, reservoirs, wells, planning regions
- TCEQ GIS hub layers complementing permits / water districts
- StratMap hydrography, parcels, address points, imagery, elevation
- RRC oil / gas / pipeline overlays
- TxDOT roadway / congestion / project layers

These are candidates for future `layers/` and `agencies/` pages — currently absent or stub-only in the wiki.

## How to use this page

When ingesting a new TX GIS source, check whether the note already covers it. If yes, cite the note in the new page's `sources:` and bump this page's `source_count` / `last_confirmed`. If the new info contradicts the note, follow contradiction resolution.

## Confidence

`0.6` — the note is recent (2026-05-08) and authored against live portals, but it is explicitly self-described as "first pass". Reinforce as ingestion confirms claims.
