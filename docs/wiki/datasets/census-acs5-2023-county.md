---
title: Census ACS 5-year (2023, TX county)
type: dataset
tier: semantic
created: 2026-05-08
updated: 2026-05-08
last_confirmed: 2026-05-08
confidence: 0.75
source_count: 1
decay_profile: medium
tags: [dataset, federal, demographics]
sources:
  - docs/contracts/dataset-registry.md
registry_id: census-acs5-2023-county
relationships:
  - {type: published_by, target: agencies/census-bureau.md}
  - {type: implements, target: concepts/acs.md}
stale: false
---

# Census ACS5 — 2023 vintage, TX county level

`registry_id: census-acs5-2023-county` · `accessType: external` · category `demographic`.

## What it is

American Community Survey 5-year estimates, 2023 vintage, aggregated to **county**. Population + key demographic breakouts used by atlas-tx scores for normalization.

## Schema notes (Atlas TX usage)

Join key is **county FIPS** (5-digit, including state prefix). County name strings vary across TX sources — always normalize with `src/lib/counties.ts` before joining text-keyed sources, and prefer FIPS joins where possible.

`keyFields` per registry contract. Population (`pop`-style field) is the most-loaded column; it feeds:
- DWRS (population served × violation severity)
- Active Protest Density (per-1k normalization)

## Why it matters

Atlas TX scores are mostly per-county or per-PWS. Both shapes need population to weight (DWRS) or normalize (APD).

## Caveats (always emit downstream)

- **Rolling 5-year estimate.** The 2023 5-year vintage covers 2019–2023; it is a smoothed estimate, not a point-in-time count.
- **Vintage churn.** Census releases annually. When the 2024 vintage is registered, `supersedes` this page.
- **County != PWS service area.** DWRS uses *PWS-served population*, which the SDWIS PWS data carries on its own. This ACS slice is the *county* normalizer, not the PWS-side one. Don't conflate.

## Refresh

External; dedicated fetcher. ACS API takes table IDs (`B01003_001E` etc.) and geography filters.
