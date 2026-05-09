---
title: Atlas TX Data Landscape — Overview
type: overview
tier: semantic
created: 2026-05-08
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.65
source_count: 2
decay_profile: slow
tags: [overview, water, ej, gis, weather, flood, drought]
sources:
  - docs/research/texas-gis-inventory.md
  - docs/contracts/dataset-registry.md
relationships: []
stale: false
---

# Overview — Atlas TX data landscape

Living synthesis of the data sources Atlas TX touches. Update when the picture shifts. Keep dense.

## What Atlas TX is, in one paragraph

Atlas TX is a Texas water-risk + environmental-justice intelligence platform. The unit of analysis is the **county**. Counties get **derived signals** — most centrally a Drinking Water Risk Score ([DWRS](concepts/dwrs-score.md)) and an Active Protest Density score ([APD](concepts/apd-score.md)) — composed from federal compliance data ([SDWIS violations](datasets/epa-sdwis-violations.md)), exposure indicators ([EJScreen 2024](datasets/epa-ejscreen-2024.md)), demographic context ([ACS](datasets/census-acs5-2023-county.md)), and state-side regulatory friction ([TCEQ CID Search One](datasets/tceq-cid-search-one.md) / [Two](datasets/tceq-cid-search-two.md)). State-side context comes from [TCEQ](agencies/tceq.md) (water quality permits, CID, surface-water impairment) and [TWDB](agencies/twdb.md) (hydrology / aquifers / HUCs / planning regions). All of it is **indicator-grade**, not measurement-grade — see [Burden vs Harm](concepts/burden-vs-harm.md), the product stance that constrains every claim the platform makes.

## Source families

The wiki is organized around three families of publishers, ordered by current centrality to the platform:

1. **EPA** — federal. Drives the score. SDWIS for compliance, EJScreen for exposure, ECHO/TRI as secondary context.
2. **Texas state** — TCEQ for environmental compliance, TWDB for hydrology, TxGIO/StratMap for base layers, RRC and TxDOT for infrastructure overlays.
3. **Adjacent federal** — [Census](agencies/census-bureau.md) (ACS demographics), [USGS](agencies/usgs.md) (NHD hydrography, NWIS streamflow), [NOAA](agencies/noaa.md) (storm events, drought via [USDM](datasets/usdm-drought-monitor.md), precipitation / climate normals), [FEMA](agencies/fema.md) (NFHL flood zones, disaster declarations). Pulled in as needed for context layers; weather and flood data is unregistered as of contract v0.4.0 but is the natural next ingestion frontier.

See [Agencies](#) by following [`index.md`](index.md).

## Portal landscape

Most TX state tabular data flows through [`data.texas.gov`](portals/data-texas-gov.md) (Socrata, 4×4 IDs). GIS comes from agency hubs (TCEQ GIS Data Hub, TWDB GIS downloads, TxGIO StratMap) — typically ArcGIS Hub or REST feature services. EPA data comes through stable program endpoints (SDWIS Federal Reporting, ECHO REST, EJScreen mapping/API), not a single portal. Federal-fallback layers (NHD, NFHL) live on USGS / FEMA hubs.

## Current scope vs. future scope

In v1 scope (every entry has a wiki dataset page as of 2026-05-09):
- [TCEQ Water Quality Permits](datasets/7fq8-wig2-tceq-water-permits.md) (`7fq8-wig2`)
- [Texas Water Districts](datasets/hr84-s96f-tx-water-districts.md) (`hr84-s96f`)
- [EPA SDWIS Violations](datasets/epa-sdwis-violations.md)
- [EPA EJScreen 2024](datasets/epa-ejscreen-2024.md)
- [Census ACS5 2023 (county)](datasets/census-acs5-2023-county.md)
- [EPA ECHO Violations](datasets/epa-echo-violations.md) (secondary) + [TCEQ CID Search One](datasets/tceq-cid-search-one.md) / [Two](datasets/tceq-cid-search-two.md)
- TWDB hydrology context — [aquifers](datasets/twdb-major-aquifers.md), [basins](datasets/twdb-river-basins.md), [HUC8](datasets/twdb-huc8.md)
- [TCEQ surface-water-quality segments](datasets/tceq-swq-segments.md) (impairment context)

Out of v1 scope (per `docs/plans/2026-05-08-water-risk-refocus.md`):
- Fiscal / debt datasets — explicitly deferred
- Live federal API calls in the demo path — always cached snapshot

## Cross-cutting axes

Three axes consistently cut across the data the wiki covers:

- **Drinking water quality** — [SDWIS](datasets/epa-sdwis-violations.md) violations × [PWSID](concepts/pwsid.md) joins × [MCL](concepts/mcl.md) thresholds. Health-based-only filter is encoded in [SDWA Violation Types](concepts/sdwa-violation-types.md). Lead is special, governed by [LCR](concepts/lcr.md) action levels rather than a conventional MCL; [LSLI](concepts/lsli.md) inventories will become a leading indicator. [PFAS](concepts/pfas.md) just transitioned from monitoring-only (UCMR5) to MCL-regulated (2024). Cross-program counterpart is [ECHO](datasets/epa-echo-violations.md), [FRS-ID-keyed](concepts/frs-id.md), distinct purpose ([SDWIS vs ECHO](comparisons/sdwis-vs-echo.md)).
- **Environmental factors** — [EJScreen indices](concepts/ej-index.md) for co-located demographic + environmental burden, [TRI](datasets/epa-tri-tx.md) for per-chemical specificity (transitively in v1 via EJScreen), [TCEQ surface-water-quality](datasets/tceq-swq-segments.md) impairment context.
- **Weather-related impacts** — [drought](datasets/usdm-drought-monitor.md) stresses aquifers and reservoirs (TWDB-mapped), [floods](datasets/fema-nfhl.md) overlap PWS service areas and EJ-vulnerable block groups within [SFHAs](concepts/sfha.md) defined on [FIRMs](concepts/firm.md), [storm events](datasets/noaa-storm-events.md) provide hurricane / flash-flood / extreme-weather history. [USGS NWIS](datasets/usgs-nwis.md) supplies the measurement-grade physical response (streamflow, groundwater levels) that closes the loop between climatic stress and water-supply reality. The [FEMA NRI](concepts/nri.md) is the federal composite hazard score for cross-county comparison. Compound risk (water risk × flood overlap × drought × demographic burden) is the natural next-stage product story.

## Where this overview is wrong

This page is `confidence: 0.65` because it was authored at wiki-init from two sources and lightly reinforced as the dataset/concept layer filled in. It will sharpen as agency / portal / dataset pages get further reinforced or contradicted. When a downstream page disagrees, update *here* too.
