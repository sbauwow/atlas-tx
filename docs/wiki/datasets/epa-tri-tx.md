---
title: EPA TRI — Toxic Release Inventory (TX)
type: dataset
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.55
source_count: 1
decay_profile: medium
tags: [dataset, federal, environment, exposure, indicator]
sources:
  - docs/contracts/dataset-registry.md
registry_id: null
relationships:
  - {type: published_by, target: agencies/epa.md}
  - {type: references, target: datasets/epa-ejscreen-2024.md}
  - {type: implements, target: concepts/tri.md}
stale: false
---

# EPA TRI — Toxic Release Inventory (TX)

Per-facility self-reported releases of ~770 toxic chemicals. Reported as "secondary" in Atlas TX `README.md`; **not currently in the registered v1 dataset list** (no `registry_id` value yet).

## What it is

Section 313 of EPCRA requires industrial facilities above size and chemical-usage thresholds to annually report releases of listed toxic chemicals to air, water, land (on-site), plus off-site transfers. Reporting year is the calendar year; data lands ~1 year later.

## What's in a TRI record

- **Facility identity** — TRI Facility ID, FRS cross-reference, name, address, lat/long, parent company, primary NAICS.
- **Chemical** — CAS number, name, regulatory category (PBT, dioxin, lead, mercury, etc.).
- **Release pathway** — air (stack vs fugitive), water (named receiving waterbody), on-site land disposal (landfill / land treatment / surface impoundment / underground injection), plus off-site transfers.
- **Quantity** — pounds per year, with grams used for the most-toxic categories.

## Why it's useful

EJScreen already incorporates TRI-derived burden indicators (proximity to TRI sites). So in v1 Atlas TX gets TRI signal *transitively* through EJScreen percentiles. Direct TRI ingestion would add:

1. **Per-chemical specificity** — EJScreen flattens; TRI tells you exactly which chemicals.
2. **Per-pathway specificity** — water releases vs air vs land; matters for which atlas-tx surface (water risk vs air-quality story) cares.
3. **Trend** — TRI has a long time-series; "rising vs falling releases over 5 years" is a real signal.

## Caveats

- **Self-reported.** Industries below thresholds are invisible. Reported figures are *engineering estimates*, not metered.
- **Pounds is not toxicity.** 100 lb of mercury is not 100 lb of ammonia. EPA's RSEI score (Risk-Screening Environmental Indicators) re-weights TRI by toxicity + fate-and-transport — when atlas-tx eventually ingests TRI, RSEI is the natural normalization. Until then, raw pounds is misleading.
- **Reporting changes over time.** New chemicals get added; thresholds change. Long-trend math must hold the chemical list constant.
- **NAICS-driven coverage.** Many TX-relevant non-industrial pollution sources (oil-and-gas wells outside reportable thresholds, agricultural runoff) are **not** in TRI by design.

## Status in atlas-tx

Listed in `README.md` as secondary. No fetcher, no registry entry, no cached snapshot. Live TRI access is via EPA Envirofacts REST or the TRI Search portal; bulk downloads are also published annually.

If/when this is registered, the natural ID is `epa-tri-tx` (EPA-stable convention per the registry rules). RSEI re-weighting belongs as a separate downstream concept page once ingestion lands.

## See also

- [EJScreen 2024](epa-ejscreen-2024.md) — current source of TRI-derived burden signal in atlas-tx.
- [EPA agency page](../agencies/epa.md).
