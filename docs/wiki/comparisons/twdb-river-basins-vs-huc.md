---
title: TWDB River Basins vs HUC — different things named "basin"
type: comparison
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.7
source_count: 1
decay_profile: slow
tags: [comparison, hydrology, twdb, huc, basin, watershed]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: references, target: datasets/twdb-river-basins.md}
  - {type: references, target: datasets/twdb-huc8.md}
  - {type: references, target: concepts/huc.md}
stale: false
---

# TWDB River Basins vs HUC

Both are called "basins". They divide Texas differently. They are not interchangeable.

## At a glance

| Axis | [TWDB river basins](../datasets/twdb-river-basins.md) | [HUC](../concepts/huc.md) (any level) |
|---|---|---|
| **What it is** | TX state water-planning unit | Federal hydrologic-unit-code physical drainage area |
| **Authority** | TWDB (state) | USGS WBD (federal) |
| **Number in TX** | ~23 major basins | Many: 7+ HUC2 regions, 30+ HUC4 subregions, ~250 HUC8 subbasins |
| **Defined by** | TX water-rights history + agency administrative boundaries | Physical drainage divides |
| **Use** | TX water-supply planning, water-rights administration, regional water plans | Federal hydrologic analysis, modeling, cross-state comparison |
| **Atlas-tx access** | Registered `twdb-river-basins`, `accessType: external` | Registered `twdb-huc8` (HUC8 only) |
| **Hierarchy** | Flat | Nested (HUC2 → 4 → 6 → 8 → 10 → 12) |

## They don't nest

A TWDB river basin is **not** a roll-up of HUC8s, and vice versa.

- The Brazos River Basin (TWDB) covers a big swath of central TX. It contains parts of multiple HUC8s, but a single HUC8 can also span multiple TWDB basins, and the boundaries between TWDB basins do not always align with HUC8 boundaries.
- The boundaries differ because:
  - TWDB basins follow **streams** as they're administratively defined (river-rights history, gauging stations, planning conventions).
  - HUCs follow **physical drainage divides** (the ridge between two watersheds).

These are mostly the same idea, but they're not the same delineation.

## When to use which

| Question | Right unit |
|---|---|
| "Which water-rights administration applies here?" | TWDB river basin |
| "What's TWDB's regional water plan call this area?" | TWDB river basin |
| "Where does this stream's water actually drain to?" | HUC (specifically: trace by NHDPlus, then identify the HUC) |
| "Compare a TX basin to a non-TX basin" | HUC (TWDB basins are TX-only) |
| "Roll up SDWIS / TCEQ permits by water management area" | TWDB river basin |
| "Roll up by physical watershed for hydrologic modeling" | HUC8 (or finer) |
| "Match drought polygons to water supply planning units" | TWDB river basin |
| "Match drought polygons to physical watersheds" | HUC8 |

For atlas-tx's water-risk story, **TWDB river basins are usually the right unit** when the analytical frame is "water management" — i.e. tracking which planning region carries which compliance / scoring story. **HUCs are right when the frame is physical drainage** — i.e. "what's upstream of this PWS intake".

## Caveats

- **Don't smear in metrics.** A statistic computed by TWDB basin and one computed by HUC8 will not be comparable, even when the labels look similar.
- **Both atlas-tx layers are bbox-only snapshots.** True polygon-vs-polygon overlap requires geometry refresh; current centroid × bbox math is approximate.
- **Sub-basin resolution differs.** TWDB has ~23 basins; the HUC system can go down to ~100,000 HUC12 subwatersheds. Whichever you choose, pick the resolution that matches your question.

## See also

- [TWDB river basins dataset](../datasets/twdb-river-basins.md)
- [TWDB HUC8 dataset](../datasets/twdb-huc8.md)
- [HUC concept](../concepts/huc.md)
- [TWDB HUC8 vs USGS WBD](twdb-huc8-vs-usgs-wbd.md) — companion comparison on the federal-vs-TX side of HUC.
