---
title: TWDB
type: agency
tier: semantic
created: 2026-05-08
updated: 2026-05-08
last_confirmed: 2026-05-08
confidence: 0.65
source_count: 2
decay_profile: slow
tags: [agency, texas, water, hydrology, gis]
sources:
  - docs/research/texas-gis-inventory.md
  - docs/contracts/dataset-registry.md
relationships:
  - {type: references, target: agencies/tceq.md}
stale: false
---

# TWDB — Texas Water Development Board

State water-planning agency. Owns the canonical TX hydrology layers Atlas TX uses for context.

## What it publishes that we use

- **Major aquifers** — registered `twdb-major-aquifers`. Polygon layer of named aquifers. Atlas TX caches a compact statewide extent (layer metadata + per-feature bbox), not full polygons.
- **River basins** — registered `twdb-river-basins`. Polygons keyed by `basin_num` / `basin_name`.
- **HUC8 sub-basins** — registered `twdb-huc8`. Mirrors USGS hydrologic unit code level 8 with TWDB attribution.

All three currently flow through one snapshot loader at `src/lib/datasets/twdb-hydrology.ts` and one refresh entrypoint (`npm run refresh:twdb-hydrology`).

## Things to know

- Current snapshot is **bbox-only**, not full geometry. County hydrology context uses county centroid × cached feature bbox overlap as an approximate signal — *not* polygon intersection. Upgrade to real geometry when map rendering or spatial joins demand it.
- TWDB also publishes wells, reservoirs, and planning-region geometry. Those are **not** registered yet; they are the natural next layer.
- TWDB HUC8 ≈ USGS NHD HUC8 by definition, but attribute fields differ. If Atlas TX needs national HUC join keys later, prefer the USGS source. For Texas-only, TWDB's attribution is friendlier.

## Authority

- TWDB is authoritative for Texas state-relative aquifer / basin / planning-region delineations.
- For nationally-comparable hydrography (NHD flowlines, watershed boundaries), USGS is authoritative.

## See also

- Contract section: TWDB hydrology context sources (`docs/contracts/dataset-registry.md` v0.3.0).
