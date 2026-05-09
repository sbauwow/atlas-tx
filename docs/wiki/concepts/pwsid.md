---
title: PWSID — Public Water System Identifier
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.7
source_count: 1
decay_profile: slow
tags: [concept, water, sdwa, identifier, schema]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: references, target: datasets/epa-sdwis-violations.md}
stale: false
---

# PWSID — Public Water System Identifier

The federal SDWIS identifier for a Public Water System. The single most important join key in the drinking-water side of Atlas TX.

## Format

Two-letter state primacy code + seven-digit number. Texas PWSIDs start with `TX`. Examples: `TX0010001`, `TX2270001`.

**Atlas TX must keep PWSIDs as strings.** Numericizing drops the `TX` prefix and the leading-zero significance — this is in the registry contract's "Field-name discipline" section for a reason.

## What it identifies

A "public water system" under SDWA: any system that provides water for human consumption to ≥25 people or has ≥15 service connections, ≥60 days/year. PWSIDs come in three subtypes:

- **CWS** — Community Water System. Serves the same population year-round (cities, towns, mobile-home parks, regulated water utilities).
- **NTNCWS** — Non-Transient Non-Community. Serves the same non-resident population ≥6 months/year (schools, factories, large workplaces with their own wells).
- **TNCWS** — Transient Non-Community. Serves a transient population (gas stations, campgrounds, restaurants on private wells).

Atlas TX's water-risk story centers **CWSs** — that's the population served at home. NTNCWS and TNCWS appear in SDWIS but carry different risk semantics (occasional exposure vs daily residential exposure).

## What's attached to a PWSID

In SDWIS:
- **Identity**: name, type, primary source (groundwater / surface water / purchased), population served, primacy agency.
- **Service area**: county lists, city lists. *Not always geographic polygons* — service areas are often imputed from city/county joins, not from real distribution-network geometry.
- **Violations history**: keyed by PWSID + violation ID + date.
- **Site visits / sanitary surveys**: per-PWS records of state inspections.

## Joining PWSID to other things

| Target | How |
|---|---|
| **County** (for atlas-tx aggregation) | SDWIS PWS table carries county list; one PWS can serve multiple counties, and one county hosts many PWSs. Many-to-many. Roll up violations by county requires fan-out. |
| **ECHO facility ID** | Some but not all PWSs carry an FRS facility ID cross-reference. Spatial / name fuzzy-join is the fallback; messy. |
| **EJScreen block group** | No direct join. Goes through service-area geography or county-level smear. |
| **TCEQ permit / facility records** | TCEQ uses its own Regulated Entity Number (RN) and Customer Number (CN). PWS↔RN cross-walk exists in TCEQ data but is not 1:1. |

## Things to know

- **TX is a primacy state.** TCEQ runs SDWA implementation in Texas; data still flows up to federal SDWIS.
- **A PWS can change PWSID** in rare cases (mergers, takeovers). This breaks longitudinal joins. SDWIS attempts to maintain history; verify if a longitudinal score changes unexpectedly.
- **Population-served fields** in SDWIS are infrequently updated and often round numbers — treat them as indicative, not precise.

## See also

- [SDWIS dataset](../datasets/epa-sdwis-violations.md)
- [DWRS score](dwrs-score.md)
- Contract § "Field-name discipline" — keep PWSIDs as strings.
