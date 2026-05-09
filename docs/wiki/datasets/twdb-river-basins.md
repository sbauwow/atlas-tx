---
title: TWDB River Basins
type: dataset
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.65
source_count: 1
decay_profile: slow
tags: [dataset, twdb, water, hydrology, basin, gis-extent]
sources:
  - docs/contracts/dataset-registry.md
registry_id: twdb-river-basins
relationships:
  - {type: published_by, target: agencies/twdb.md}
stale: false
---

# TWDB River Basins

`registry_id: twdb-river-basins` · `accessType: external` · added in dataset-registry v0.3.0.

## What it is

Polygons of the major **Texas river basins** as defined by TWDB for state water-planning purposes. ~23 basins covering TX, e.g. Brazos, Trinity, Colorado, Rio Grande, San Jacinto, Sabine, Neches, Guadalupe, Nueces.

These are TWDB's **state planning units** — *not* USGS hydrologic-unit-code (HUC) basins. The two systems divide Texas differently. TWDB river basins are the right unit for state-level water-supply / planning questions; USGS HUCs are the right unit for nationally-comparable hydrologic analysis.

## Why it matters here

- **Surface-water source attribution** for TX PWSs that draw from a river — the basin says "where the water comes from upstream".
- **Drought × basin** — USDM drought polygons clipped to TWDB basins give a basin-level water-supply stress story.
- **Basin × permit density** — a high-permit basin under sustained drought is a compound-risk picture.

## Schema notes

Per the shared `TwdbHydrologyRow`:

```ts
{
  layerId: "twdb-river-basins";
  layerName: string;
  primaryCode: string | null;     // basin_num
  name: string | null;            // basin_name
  basin: string | null;
  bbox: [number, number, number, number];
  geometryType: "polygon" | "other";
  sourceUrl: string;
}
```

Field mapping: `basin_num` → `primaryCode`, `basin_name` → `name`, `basin` field also populated. Bbox-only.

## Caveats (always emit downstream)

- **TWDB basins ≠ USGS HUCs.** Don't treat them as interchangeable. See [HUC concept](../concepts/huc.md).
- **Bbox-only snapshot.** Same approximate-signal rule as the [aquifers layer](twdb-major-aquifers.md) — county centroid × bbox overlap, not full polygon intersection.
- **Basin boundaries are political-historical as much as hydrologic.** They reflect TX water-rights history; minor stream networks may flow across basin boundaries (rare but it happens).

## Refresh

Same shared loader / refresh script / snapshot file as the other TWDB hydrology layers. See [TWDB Major Aquifers](twdb-major-aquifers.md) § Refresh.

## See also

- [TWDB agency](../agencies/twdb.md)
- [TWDB HUC8](twdb-huc8.md) — the USGS-aligned alternative.
- [HUC](../concepts/huc.md) — the federal hydrologic-unit-code scheme.
