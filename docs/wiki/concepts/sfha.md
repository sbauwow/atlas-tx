---
title: SFHA — Special Flood Hazard Area
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.7
source_count: 1
decay_profile: slow
tags: [concept, flood, fema, regulatory]
sources:
  - docs/research/texas-gis-inventory.md
relationships:
  - {type: references, target: datasets/fema-nfhl.md}
  - {type: references, target: agencies/fema.md}
  - {type: references, target: concepts/burden-vs-harm.md}
stale: false
---

# SFHA — Special Flood Hazard Area

The regulatory term for "the 1%-annual-chance flood zone" — the floodplain that triggers federal flood-insurance requirements and most local floodplain regulation.

## Definition

An SFHA is the area subject to inundation by the **base flood** — the flood with a 1% probability of being equaled or exceeded in any given year (the "100-year flood"). On a [FEMA FIRM](firm.md), SFHAs are the zones lettered with **A** or **V**:

| Zone | Type | Notes |
|---|---|---|
| A | SFHA, no BFE published | Approximate study; no engineered base flood elevation |
| AE | SFHA, BFE published | Detailed study; numbered base flood elevation |
| AH | SFHA, shallow flooding 1–3 ft | Ponding, flat areas |
| AO | SFHA, sheet flow 1–3 ft | Sloped surfaces, flow direction |
| AR | SFHA, restored to land behind a decertified levee | Rare, transitional |
| A99 | SFHA protected by federally-funded levee under construction | Rare |
| V  | SFHA, coastal high-hazard, no BFE | Wave action ≥3 ft |
| VE | SFHA, coastal high-hazard, BFE published | Wave action; engineered |

Outside the SFHA but still in the 0.2%-annual-chance ("500-year") floodplain is **Zone X (shaded)**. Outside both is **Zone X (unshaded)** or **Zone D** (undetermined). None of these are SFHA.

## Regulatory consequences of being in an SFHA

- **Federally-backed mortgages** require flood insurance.
- **Local floodplain ordinances** apply — typically restrictions on building elevation, fill, etc.
- **NFIP (National Flood Insurance Program)** rates kick in.

So SFHA membership has real legal and financial weight even when the *physical* flood risk turns out to be different.

## Why this matters here

Atlas-tx's flood overlap story (queued, not yet implemented) cares about SFHA membership for:

- **PWS service areas in SFHA** — flood disruption to drinking water during exactly the moments people most need it.
- **Treatment plants in SFHA** — single point of failure if the plant floods.
- **EJ-vulnerable block groups in SFHA** — compound risk of flooding + pre-existing burden.
- **Permitted dischargers in floodway** — flood mobilization of contaminated material.

## Caveats

- **Regulatory ≠ predictive.** "Outside SFHA" does NOT mean "low flood risk". Climate-change-driven rainfall, urban development, and storm surge regularly produce flooding outside SFHAs. (Hurricane Harvey 2017 was the canonical TX example — 70%+ of inundated structures were outside SFHA.)
- **Zone A vs AE matters for analysis quality.** Zone A is approximate; Zone AE is engineered. A study based on Zone A SFHAs is doing rougher math than one using AE.
- **Coastal V/VE zones are different physics.** Wave action and coastal storm surge, not riverine flooding. Don't smear with inland A/AE in the same statistic.
- **SFHA boundaries shift** when FIRMs are revised. A property's SFHA status today may not have been its status a decade ago, and may not be a decade from now.

## See also

- [FIRM](firm.md) — the map product where SFHAs live.
- [NFHL dataset](../datasets/fema-nfhl.md) — the digital geometry layer.
- [FEMA agency](../agencies/fema.md).
- [Burden vs Harm](burden-vs-harm.md) — SFHA membership is a *legal* status, not a measured exposure.
