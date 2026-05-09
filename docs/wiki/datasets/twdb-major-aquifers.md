---
title: TWDB Major Aquifers
type: dataset
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.65
source_count: 1
decay_profile: slow
tags: [dataset, twdb, water, hydrology, aquifer, gis-extent]
sources:
  - docs/contracts/dataset-registry.md
registry_id: twdb-major-aquifers
relationships:
  - {type: published_by, target: agencies/twdb.md}
  - {type: references, target: datasets/usdm-drought-monitor.md}
stale: false
---

# TWDB Major Aquifers

`registry_id: twdb-major-aquifers` · `accessType: external` · added in dataset-registry v0.3.0.

## What it is

Polygons of TWDB-classified major aquifers in Texas — the regional groundwater units that supply most of TX's drinking-water and agricultural pumping. Examples: Ogallala, Edwards, Trinity, Carrizo-Wilcox, Gulf Coast, Hueco-Mesilla Bolson.

In atlas-tx, currently cached as a **compact statewide extent snapshot** — layer metadata + per-feature bounding box + name codes — **not full polygon geometry**.

## Why it matters here

Aquifer context for the water-risk story:

- A PWS that depends on a single major aquifer carries source-aquifer-specific risk (depletion, contamination plume, drought stress).
- [USDM drought](usdm-drought-monitor.md) overlay on aquifer extent is the natural "which aquifers are stressed right now" surface.
- Spatial join with [permits](7fq8-wig2-tceq-water-permits.md) gives "regulated activity over a major aquifer" — relevant for groundwater-quality concerns.

## Schema notes

Per the contract's shared `TwdbHydrologyRow`:

```ts
{
  layerId: "twdb-major-aquifers";
  layerName: string;
  primaryCode: string | null;     // AQUIFER
  name: string | null;            // AQ_NAME
  bbox: [number, number, number, number];
  geometryType: "polygon" | "other";
  sourceUrl: string;
  // basin/region/subregion null for this layer
}
```

Field mapping: `AQUIFER` → `primaryCode`, `AQ_NAME` → `name`. `bbox` and `geometryType` are populated; full geometry is **not** in the snapshot.

## Caveats (always emit downstream)

- **Bbox-only snapshot.** Atlas-tx hydrology context uses **county centroid × cached bbox** overlap as an *approximate* signal. Not a polygon intersection. Surface this — a county centroid outside an aquifer bbox does not prove the county doesn't sit over the aquifer.
- **Major aquifers only.** TWDB also classifies *minor aquifers*; those are not in this layer. Many TX PWSs draw from minor aquifers.
- **Aquifers overlap vertically.** Multiple aquifers can underlie the same surface point at different depths. The polygon doesn't tell you which aquifer a specific well taps.

## Refresh

- Shared loader: `src/lib/datasets/twdb-hydrology.ts`.
- Refresh: `npm run refresh:twdb-hydrology` (`scripts/refresh-twdb-hydrology.ts`).
- Snapshot: `public/cache/twdb-hydrology-tx.json` (shared across all three TWDB layers).

Follow-on work can add fuller polygon geometry once atlas-tx needs map rendering or true spatial joins.

## See also

- [TWDB agency](../agencies/twdb.md)
- [TWDB river basins](twdb-river-basins.md), [TWDB HUC8](twdb-huc8.md) — sibling layers in the same snapshot.
