---
title: EJScreen Indices — what the numbers mean
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.6
source_count: 1
decay_profile: slow
tags: [concept, ej, ejscreen, indicator, methodology]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: references, target: datasets/epa-ejscreen-2024.md}
  - {type: references, target: concepts/burden-vs-harm.md}
stale: false
---

# EJScreen Indices

What the EJScreen "indices" are, why there are several of them, and what the percentiles mean. Important because Atlas TX uses these directly in the EJ Burden Overlap score.

## The three layers of the index family

EJScreen ships per-block-group:

### 1. Raw environmental indicators
Direct values for ~13 environmental burden proxies. Examples:
- **Particulate matter (PM2.5)** — annual avg µg/m³.
- **Ozone** — summer seasonal avg ppb.
- **Air toxics cancer risk** — modeled lifetime cancer risk per million.
- **Diesel particulate matter** — modeled µg/m³.
- **Traffic proximity** — vehicle-count-weighted distance.
- **Lead paint indicator** — % of housing built pre-1960.
- **Superfund / TRI / RMP / TSDF / wastewater discharger proximity** — count × inverse distance.
- **Underground storage tanks** — count within buffer.

### 2. Demographic indicators
Per-block-group ACS-derived demographics, including the EJScreen "demographic index" (a simple average of "% low income" and "% people of color").

### 3. EJ Indices and Supplemental Indices
For **each environmental burden**, EJScreen computes:
- **EJ Index** = environmental indicator × demographic index. Captures "where is this burden co-located with the populations EJ policy is meant to consider".
- **Supplemental Index** = environmental indicator × supplemental demographic index (broader: low-income + minority + linguistic isolation + less than HS education + under age 5 + over age 64). EPA introduced these alongside the original EJ index.

So for PM2.5 alone you'll see: raw PM2.5, PM2.5 EJ Index, PM2.5 Supplemental Index — and percentile versions of each.

## Percentiles: state-relative vs national

Every EJScreen value is also published as a **percentile**, computed two ways:
- **State percentile** — block group's rank among block groups *in that state*.
- **National percentile** — block group's rank among all US block groups.

These answer different questions. A Texas block group at the 95th state percentile for PM2.5 is "near the top of TX". A Texas block group at the 95th national percentile is "near the top of the country" — much more extreme. **Atlas TX should pin which mode it uses on each call.** State-relative is generally what we want for intra-Texas county comparison; national matters for "where in the country does TX rank".

## What goes into Atlas TX

The EJ Burden Overlap score (per the contract) uses the **demographic-burden percentile**, multiplied by **permit density within an N-mile buffer**.

- "Demographic-burden percentile" maps to EJScreen's demographic-index percentile (state-relative is the safer default).
- The score is a *co-location* signal — high demographic burden × high regulated-activity density. It is not a claim of harm, and not a substitute for any specific EJ Index for a specific pollutant.

## Caveats

- **EJScreen is screening-grade.** EPA itself describes it as a screening tool, not a regulatory determination.
- **Block-group resolution is coarse.** Burden inside a block group is not uniform; people inside the same block group can have different exposures.
- **The indices are products, not sums.** A block group can have a very high EJ Index because of an extreme environmental indicator paired with a moderate demographic index, or vice versa. Always look at both axes.
- **State vs national percentiles are not interchangeable.** Mixing them silently within a single product surface produces meaningless comparisons.

## See also

- [EJScreen 2024 dataset](../datasets/epa-ejscreen-2024.md)
- [Burden vs Harm](burden-vs-harm.md) — the product-stance page that governs how indices are surfaced.
