---
title: US Census Bureau
type: agency
tier: semantic
created: 2026-05-08
updated: 2026-05-08
last_confirmed: 2026-05-08
confidence: 0.75
source_count: 1
decay_profile: slow
tags: [agency, federal, demographics]
sources:
  - docs/contracts/dataset-registry.md
relationships: []
stale: false
---

# US Census Bureau

Federal agency. Publishes the demographic context layer Atlas TX uses to normalize scores.

## What it publishes that we use

- **ACS 5-year, 2023 vintage, county level** — registered `census-acs5-2023-county`. Population + demographics. See [`datasets/census-acs5-2023-county.md`](../datasets/census-acs5-2023-county.md). Used inside [DWRS](../concepts/dwrs-score.md) (PWS population × violation severity) and inside per-capita normalization for the Active Protest Density score.

## Things to know

- ACS 5-year is a *rolling estimate*, not a point-in-time snapshot. For a county scored "today", the 2023 5-year vintage covers 2019–2023. Treat as smoothed.
- ACS releases vintages annually. When a newer vintage lands, it `supersedes` the older one — create a new dataset page and mark the old `stale: true`.
- For *block-group* level demographics, EJScreen already fuses ACS into its own indicator file. Don't double-pull unless we genuinely need raw ACS at sub-county.
- County FIPS join keys are stable. Use them, not name strings.

## Authority

- Authoritative for US demographic estimates between decennial censuses.
