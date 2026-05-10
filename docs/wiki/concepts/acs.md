---
title: ACS — American Community Survey
type: concept
tier: semantic
created: 2026-05-10
updated: 2026-05-10
last_confirmed: 2026-05-10
confidence: 0.7
source_count: 2
decay_profile: medium
tags: [concept, federal, demographics, census]
sources:
  - https://www.census.gov/programs-surveys/acs
  - docs/wiki/datasets/census-acs5-2023-county.md
relationships:
  - {type: references, target: agencies/census-bureau.md}
  - {type: references, target: datasets/census-acs5-2023-county.md}
  - {type: references, target: concepts/ej-index.md}
stale: false
---

# American Community Survey

Continuous demographic and housing survey run by the [U.S. Census Bureau](../agencies/census-bureau.md). Replaced the long-form decennial census after 2010. Population, race/ethnicity, language, income, poverty, housing, commuting, education, disability, etc. — at every Census geographic level from the nation down to block groups.

Two release cadences:

- **1-year estimates** — published annually, for areas with population ≥ 65,000.
- **5-year estimates** — published annually, smoothed across a rolling 5-year sample. Required for small areas (block groups, sparsely populated counties, tracts). Atlas TX uses 5-year because TX rural counties demand it.

## Why it matters here

- **County-level normalization.** Atlas TX joins ACS5 county-level demographics into the [DWRS](dwrs-score.md) and [APD](apd-score.md) outputs to express findings as rates per affected population, not raw counts.
- **EJ index input.** The [EJ index](ej-index.md) methodology in [EJScreen](../datasets/epa-ejscreen-2024.md) is built on ACS demographic + socioeconomic indicators at block-group level.
- **Block-group buffer joins.** Future EJ work will buffer permits/violations against ACS block-group geometry to compute exposure-weighted demographic burden.

## Schema notes

- ACS variable IDs are the canonical join key. `B01003_001E` = total population (estimate); the `_M` suffix is margin of error. Atlas TX uses the `E` (estimate) variants and stores margins of error only when explicitly modeling uncertainty.
- ACS has explicit non-significance markers: "(X)" or "-" in published tables — pages that ingest ACS must handle these, not coerce them to 0.
- 5-year data labels span the period (e.g. 2019–2023 ACS5 published Dec 2024).

## Caveats

- **ACS is sample-based.** All values carry margins of error. Treat differences within MOE as not-significant. The "population" column is an estimate, not a count.
- **5-year vs. 1-year is not a small choice.** They cover different time windows and produce different point estimates for the same area. Pick one and stick with it within an analysis.
- **Race/ethnicity categories evolve across vintages.** Cross-year comparisons require checking the table specs.

## See also

- [`census-acs5-2023-county`](../datasets/census-acs5-2023-county.md)
- [Census Bureau](../agencies/census-bureau.md) · [EJ index](ej-index.md)
