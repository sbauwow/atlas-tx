---
title: NHD / NHDPlus — National Hydrography Dataset
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.7
source_count: 1
decay_profile: slow
tags: [concept, hydrology, federal, gis, schema]
sources:
  - docs/research/texas-gis-inventory.md
relationships:
  - {type: references, target: agencies/usgs.md}
  - {type: references, target: concepts/huc.md}
stale: false
---

# NHD / NHDPlus — National Hydrography Dataset

The federal stream-network and waterbody dataset for the US. Maintained by USGS. The vector hydrography backbone for any nationally-comparable water analysis.

## The three feature classes (at minimum)

- **NHDFlowline** — line geometry. Every named or unnamed stream, river, canal, ditch, artificial path. Each flowline has a `COMID` (common identifier).
- **NHDWaterbody** — polygon geometry. Lakes, ponds, reservoirs, swamps. Has its own COMIDs.
- **NHDArea** — polygon geometry for wide rivers / channels / inundation areas where a line isn't enough.

Plus point classes for hydrography points (springs, gauges), and various reference layers.

## NHD vs NHDPlus

- **NHD** is the geometric base — flowlines, waterbodies, areas, with attribute tables.
- **NHDPlus** is NHD with **value-added attributes**:
  - `FromNode` / `ToNode` — connectivity for routing.
  - **Mean annual flow** estimates per flowline.
  - **Catchment polygons** — the local drainage area to each flowline (one polygon per COMID).
  - **VAA tables** — value-added attribute roll-ups (stream order, level path, drainage area).
  - **NHDPlusV2** is the current production version. **NHDPlus HR** (high-resolution) is the more recent successor at ~1:24,000 scale.

For atlas-tx, NHDPlus is what makes spatial analysis tractable. Just NHD geometry without VAAs and catchments doesn't let you say "what's upstream of X" without re-deriving connectivity.

## Resolution

- **NHD Medium Resolution** — ~1:100,000 scale. Older. Coarser stream network.
- **NHD High Resolution / NHDPlus HR** — ~1:24,000 scale. Modern. Captures small streams.

For TX-specific work where small streams matter (PWS intakes on tributaries, permit discharges to local creeks), HR is the preferred resolution.

## What COMIDs do

A `COMID` is the stable join key for the NHD universe. Useful for:

- Cross-referencing **NWIS gauges** (each gauge has an NHD COMID).
- Cross-referencing **TCEQ permits** to specific receiving stream segments via spatial join.
- Tracing upstream / downstream — given a COMID and the routing tables, you can walk the network in either direction.

## Atlas-tx context

Not currently registered. Strong candidate for the first `layers/` page when geometry caching lands. The natural use is:

- "TPDES discharge at lat/long X" → snap to nearest NHD flowline → find which COMID → use NHDPlus VAA to identify downstream PWS surface-water intakes.
- "EJScreen block group at lat/long Y" → which NHD waterbody is closest? → cross-reference to TCEQ SWQ segment for impairment status.

## Caveats

- **NHD is geometry + attribution; it is not water-quality data.** A flowline is a stream; whether the stream is impaired comes from [TCEQ SWQ Segments](../datasets/tceq-swq-segments.md) or analogous datasets joined by spatial overlap or segment ID cross-walk.
- **NHD updates iteratively.** A COMID can be split, merged, or have geometry refined between releases. Long-trend analyses must pin a release.
- **NHD ≠ TCEQ stream segments.** TCEQ Surface Water Quality segments are state-defined assessment units, often coarser than NHD flowlines and not always directly cross-walkable. Spatial intersection is the workable path.
- **Connectivity is not always perfect.** Edge cases (braided channels, distributary networks, ditches) can have ambiguous topology. NHDPlus VAAs encode the canonical interpretation.

## See also

- [USGS agency](../agencies/usgs.md) — NHD authority.
- [HUC](huc.md) — the watershed boundaries that contain NHD flowlines.
- [TCEQ SWQ Segments](../datasets/tceq-swq-segments.md) — the impairment-classification layer that conceptually overlays NHD.
