---
title: TWDB HUC8 Sub-basins
type: dataset
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.65
source_count: 1
decay_profile: slow
tags: [dataset, twdb, water, hydrology, huc, watershed, gis-extent]
sources:
  - docs/contracts/dataset-registry.md
registry_id: twdb-huc8
relationships:
  - {type: published_by, target: agencies/twdb.md}
  - {type: references, target: agencies/usgs.md}
stale: false
---

# TWDB HUC8 Sub-basins

`registry_id: twdb-huc8` · `accessType: external` · added in dataset-registry v0.3.0.

## What it is

Polygons of **Hydrologic Unit Code level 8** (HUC8) sub-basins — the federal USGS Watershed Boundary Dataset (WBD) at the 8-digit level — clipped to / attributed for Texas by TWDB.

The codes are the same as USGS WBD; the **attribution** is friendlier for TX-specific analysis (TWDB-named subbasins, basin/region/subregion roll-ups).

## Why it matters here

- **Nationally-comparable hydrology unit.** Unlike [TWDB river basins](twdb-river-basins.md), HUC8 lets atlas-tx compare TX numbers to non-TX peers when (someday) the platform extends past Texas.
- **HUC8 × SDWIS surface-water PWS** — useful for "this surface-water PWS draws from this watershed" framing.
- **HUC8 × storm events / drought** — coarse enough to be statistically meaningful, fine enough to be locally relevant.

## Schema notes

Per the shared `TwdbHydrologyRow`:

```ts
{
  layerId: "twdb-huc8";
  layerName: string;
  primaryCode: string | null;     // HUC_8
  name: string | null;            // SUBBASIN
  basin: string | null;           // BASIN
  region: string | null;          // REGION
  subregion: string | null;       // SUBREGION
  bbox: [number, number, number, number];
  geometryType: "polygon" | "other";
  sourceUrl: string;
}
```

Field mapping: `HUC_8` → `primaryCode`, plus `SUBBASIN` / `BASIN` / `REGION` / `SUBREGION` for hierarchical roll-ups. Bbox-only snapshot.

## Caveats (always emit downstream)

- **Bbox-only snapshot.** Same approximate-signal rule as the rest of the TWDB hydrology trio.
- **HUC8 is a coarse hydrologic unit.** Most TX HUC8s are very large; sub-county analyses need HUC10 or HUC12 (not currently in atlas-tx).
- **HUC codes vs WBD codes.** HUCs nest hierarchically (HUC2 → HUC4 → HUC6 → HUC8 → HUC10 → HUC12). Always specify the level.
- **TWDB attribution may lag USGS WBD revisions.** When USGS publishes a WBD revision, TWDB updates downstream — there can be a window where they disagree on edge-case boundaries. For nationally-comparable joins, prefer USGS WBD directly. See [USGS](../agencies/usgs.md).

## Refresh

Same shared loader / snapshot as the other TWDB hydrology layers.

## See also

- [TWDB agency](../agencies/twdb.md)
- [USGS](../agencies/usgs.md) — authoritative WBD source.
- [HUC concept](../concepts/huc.md) — the scheme itself.
- [TWDB river basins](twdb-river-basins.md) — TX-state alternative for non-comparative work.
