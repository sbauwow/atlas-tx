---
title: NRI — National Risk Index (FEMA)
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.6
source_count: 1
decay_profile: medium
tags: [concept, hazard, fema, composite-index, indicator]
sources:
  - docs/research/texas-gis-inventory.md
relationships:
  - {type: references, target: agencies/fema.md}
  - {type: references, target: concepts/burden-vs-harm.md}
  - {type: references, target: datasets/epa-ejscreen-2024.md}
stale: false
---

# NRI — National Risk Index

FEMA's composite county-level (and tract-level) natural-hazard risk index. Combines 18 hazard types with social vulnerability and community resilience to produce a single risk score per county or tract.

## What's in it

Three multiplicative components per area, per hazard:

1. **Expected annual loss (EAL)** — modeled $-loss-per-year for each hazard, computed from frequency × exposure × historic loss ratio. Computed for buildings, population, and agriculture separately, then summed.
2. **Social vulnerability** — a composite of CDC SVI-style demographic indicators. Multiplier (≥1.0) representing how vulnerable the community is to harm given a given hazard event.
3. **Community resilience** — multiplier (≤1.0) representing institutional / social capacity to absorb and recover.

Final per-hazard risk score = `EAL × Social Vulnerability ÷ Community Resilience` (roughly). Then aggregated across hazards into a **composite NRI** score per area.

## The 18 hazards

A non-exhaustive selection: avalanche, coastal flooding, cold wave, drought, earthquake, hail, heat wave, hurricane, ice storm, landslide, lightning, riverine flooding, strong wind, tornado, tsunami, volcanic activity, wildfire, winter weather. Texas has nontrivial exposure to roughly 8–10 of these (no avalanches; coastal flooding only on the Gulf).

## Why this matters here

NRI is the federal "all-hazards composite for counties" — a natural overlay candidate for atlas-tx's water-risk story:

- **NRI × DWRS** — a county with high water-risk *and* high natural-hazard risk has compound vulnerability. The DWRS-troubled PWS in a high-NRI county is more concerning than the same PWS in a low-NRI county.
- **NRI × EJScreen** — both are co-located indicator products. Comparing NRI's social vulnerability multiplier to EJScreen's demographic burden index is interesting but treacherous (different methodologies, different inputs).
- **Per-hazard scores** — atlas-tx can pull the **drought** and **riverine flooding** sub-scores specifically, rather than the composite, when building the weather-impact axis.

## Status in atlas-tx

Not currently registered. Listed as adjacent context. Likely future ID: `fema-nri-tx-county` or `-tract`, `accessType: external`. Bulk CSV / GeoJSON downloads are available from FEMA NRI; no auth required.

## Caveats

- **NRI is screening-grade.** FEMA explicitly positions it as a tool for prioritization, not for actuarial or insurance decisions.
- **Methodology layers compound uncertainty.** EAL × Social Vulnerability ÷ Community Resilience multiplies three modeled quantities, each with its own error.
- **County / tract resolution.** Tract-level is sub-county but still coarse for atlas-tx's natural unit-of-analysis.
- **NRI updates lag.** Major refreshes are years apart; atlas-tx should pin the NRI version in use.
- **Composite score hides the story.** A high composite NRI county might be "high drought" or "high tornado" — very different operational implications. Always be ready to disaggregate by hazard.
- **Burden-vs-harm applies.** NRI is an *indicator of expected loss + vulnerability*, not a measurement of past or future harm.

## See also

- [FEMA agency](../agencies/fema.md).
- [Burden vs Harm](burden-vs-harm.md) — composite-index pitfalls.
- [EJ Index](ej-index.md) — the EJScreen analogue (different methodology, sometimes compared).
