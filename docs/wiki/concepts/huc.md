---
title: HUC — Hydrologic Unit Code
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.7
source_count: 1
decay_profile: slow
tags: [concept, hydrology, federal, identifier, schema]
sources:
  - docs/research/texas-gis-inventory.md
relationships:
  - {type: references, target: datasets/twdb-huc8.md}
  - {type: references, target: agencies/usgs.md}
stale: false
---

# HUC — Hydrologic Unit Code

The federal hierarchical scheme for naming and bounding watersheds in the US. Maintained as the **Watershed Boundary Dataset (WBD)** by USGS in cooperation with USDA-NRCS.

## The hierarchy

HUCs nest. Each level adds two digits:

| Level | Digits | Unit | Approx. count (US) | Typical scale |
|---|---|---|---|---|
| HUC2  | 2  | Region        | 21      | sub-continental |
| HUC4  | 4  | Subregion     | ~225    | multi-state river system |
| HUC6  | 6  | Basin         | ~370    | major river basin |
| HUC8  | 8  | Subbasin      | ~2,200  | tributary system / large watershed |
| HUC10 | 10 | Watershed     | ~22,000 | local watershed |
| HUC12 | 12 | Subwatershed  | ~100,000| small drainage |

A HUC8 contains many HUC10s, each containing many HUC12s. Always state the level when discussing "the HUC" — `HUC8 12090301` is a different thing than `HUC12 120903010101`.

## Texas in HUC space

Texas spans portions of multiple HUC2 regions (Texas-Gulf Region 12 dominates; portions of the Rio Grande Region 13 cover the south/west; Mississippi/Red River Region 11 touches the northeast). For atlas-tx-internal work, working at HUC8 is typical — large enough to roll up reliably, small enough to be locally meaningful.

## HUCs vs other water units

Confusion is the default. Atlas-tx touches three different "watershed-ish" units:

| Unit | Source | Atlas-tx role | When to use |
|---|---|---|---|
| **HUC** | USGS WBD | Nationally-comparable hydrology | Cross-state, national comparison, modeling |
| **TWDB river basin** | TWDB | TX state water-planning unit | TX-only water-supply / planning surfaces |
| **NHD catchment** | USGS NHDPlus | Per-flowline drainage area | Fine-grained spatial joins to specific stream segments |

These don't nest neatly. A TWDB river basin can span multiple HUC8s and vice versa. Don't smear the distinction.

## Caveats

- **HUC boundaries are not flow-lines.** A HUC polygon defines an area; the actual stream network inside it is in [NHD](../agencies/usgs.md).
- **Codes are stable but boundaries get revised.** WBD has been refined over decades; old HUC analyses may use a slightly different polygon for "the same" HUC8 code.
- **HUCs do not respect water-rights or jurisdictional boundaries.** They are physical drainage units. A single HUC8 can cover multiple counties, multiple TWDB basins, and multiple groundwater conservation districts.
- **Atlas-tx uses TWDB-attributed HUC8** for friendliness, but the codes are USGS-WBD codes — they cross-walk directly.

## See also

- [TWDB HUC8 dataset](../datasets/twdb-huc8.md)
- [USGS agency](../agencies/usgs.md) — WBD authority.
- [TWDB river basins](../datasets/twdb-river-basins.md) — the TX-state alternative.
