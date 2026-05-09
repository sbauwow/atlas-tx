---
title: Atlas TX Data Landscape — Overview
type: overview
tier: semantic
created: 2026-05-08
updated: 2026-05-08
last_confirmed: 2026-05-08
confidence: 0.6
source_count: 2
decay_profile: slow
tags: [overview, water, ej, gis]
sources:
  - docs/research/texas-gis-inventory.md
  - docs/contracts/dataset-registry.md
relationships: []
stale: false
---

# Overview — Atlas TX data landscape

Living synthesis of the data sources Atlas TX touches. Update when the picture shifts. Keep dense.

## What Atlas TX is, in one paragraph

Atlas TX is a Texas water-risk + environmental-justice intelligence platform. The unit of analysis is the **county**. Counties get **derived signals** — most centrally a Drinking Water Risk Score ([DWRS](concepts/dwrs-score.md)) — composed from federal compliance data ([SDWIS violations](datasets/epa-sdwis-violations.md)), exposure indicators ([EJScreen 2024](datasets/epa-ejscreen-2024.md)), and demographic context ([ACS](datasets/census-acs5-2023-county.md)). State-side context comes from [TCEQ](agencies/tceq.md) (water quality permits, CID, surface-water impairment) and [TWDB](agencies/twdb.md) (hydrology / aquifers / HUCs / planning regions).

## Source families

The wiki is organized around three families of publishers, ordered by current centrality to the platform:

1. **EPA** — federal. Drives the score. SDWIS for compliance, EJScreen for exposure, ECHO/TRI as secondary context.
2. **Texas state** — TCEQ for environmental compliance, TWDB for hydrology, TxGIO/StratMap for base layers, RRC and TxDOT for infrastructure overlays.
3. **Adjacent federal** — Census (ACS demographics), USGS (NHD hydrography), NOAA (water/weather), FEMA (NFHL flood zones). Pulled in as needed for context layers.

See [Agencies](#) by following [`index.md`](index.md).

## Portal landscape

Most TX state tabular data flows through [`data.texas.gov`](portals/data-texas-gov.md) (Socrata, 4×4 IDs). GIS comes from agency hubs (TCEQ GIS Data Hub, TWDB GIS downloads, TxGIO StratMap) — typically ArcGIS Hub or REST feature services. EPA data comes through stable program endpoints (SDWIS Federal Reporting, ECHO REST, EJScreen mapping/API), not a single portal. Federal-fallback layers (NHD, NFHL) live on USGS / FEMA hubs.

## Current scope vs. future scope

In v1 scope:
- TCEQ Water Quality Permits (`7fq8-wig2`)
- Texas Water Districts (`hr84-s96f`)
- EPA SDWIS Violations
- EPA EJScreen 2024
- Census ACS5 2023 (county)
- EPA ECHO + TCEQ CID (secondary)
- TWDB hydrology context (aquifers, basins, HUC8)
- TCEQ surface-water-quality segments (impairment context)

Out of v1 scope (per `docs/plans/2026-05-08-water-risk-refocus.md`):
- Fiscal / debt datasets — explicitly deferred
- Live federal API calls in the demo path — always cached snapshot

## Where this overview is wrong

This page is `confidence: 0.6` because it was authored at wiki-init from two sources. It will sharpen as agency / portal / dataset pages get reinforced or contradicted. When a downstream page disagrees, update *here* too.
