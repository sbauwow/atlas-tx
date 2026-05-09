---
title: FIRM / DFIRM — Flood Insurance Rate Map
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.65
source_count: 1
decay_profile: slow
tags: [concept, flood, fema, regulatory, mapping]
sources:
  - docs/research/texas-gis-inventory.md
relationships:
  - {type: references, target: concepts/sfha.md}
  - {type: references, target: datasets/fema-nfhl.md}
  - {type: references, target: agencies/fema.md}
stale: false
---

# FIRM / DFIRM — Flood Insurance Rate Map

The regulatory map product where [SFHAs](sfha.md) live. FIRMs are the "official map" of flood hazard for the National Flood Insurance Program.

## The two terms

- **FIRM** — Flood Insurance Rate Map. The original term. Historically printed on paper.
- **DFIRM** — Digital Flood Insurance Rate Map. The same product in digital form. Modern usage often just says "FIRM" even when meaning the digital version.

The [NFHL](../datasets/fema-nfhl.md) is the *nationwide compilation* of effective DFIRMs as a single ArcGIS feature service.

## What a FIRM contains

- **Flood hazard zones** — the SFHA / non-SFHA classification per area (zones A, AE, AH, AO, V, VE, X-shaded, X-unshaded, D).
- **Base Flood Elevations (BFEs)** — the elevation the 1% flood reaches, where studied.
- **Floodway** — the regulatory channel that must be kept open.
- **Cross-sections, profile baselines, hydraulic structures** — the engineering scaffolding.
- **Map effective date** — when this revision became regulatory.
- **Panel grid** — FIRMs are tiled into numbered panels per community.

## How FIRMs come into being

A FIRM is the regulatory output of a **Flood Insurance Study (FIS)** — typically a multi-year process by USGS, USACE, or contracted engineering firms. Flow frequency, hydraulic modeling, and topographic data feed in; the floodplain comes out. Communities formally adopt a new FIRM through local ordinance.

## Why the vintage matters

- FIRMs are revised on multi-year-to-decade cycles. Some TX communities have FIRMs from the 1980s; others have post-2017 (post-Harvey) revisions.
- An old FIRM may not reflect:
  - 30+ years of urban development (more impervious surface = more runoff).
  - Climate change (heavier rainfall events).
  - Better topographic data (modern lidar reveals features old DEMs missed).
  - Levee status changes (levees can be decertified).
- **A property's SFHA classification is determined by the *effective* FIRM**, not necessarily the most accurate one.

## Letter of Map Change (LOMC)

Property owners can petition FEMA to amend a FIRM:

- **LOMA** — Letter of Map Amendment. Removes a property from SFHA based on existing data (typically: structure is on natural high ground above BFE).
- **LOMR** — Letter of Map Revision. Revises FIRM based on new data (filled lot, new levee, channel improvement).
- **LOMR-F** — LOMR based on fill (lot was filled to elevate above BFE).

LOMCs incrementally shift SFHA boundaries between full FIRM revisions. The NFHL incorporates effective LOMCs.

## Caveats

- **Effective FIRM ≠ best available flood-risk data.** USGS-modeled flood inundation, NOAA atlas-14 precipitation updates, and post-storm observed-flooding studies often disagree with effective FIRMs. Atlas-tx must surface FIRM effective date so consumers can judge.
- **Communities without participating NFIP coverage may have very stale FIRMs** or no FIRM at all (Zone D).
- **FIRMs do not address pluvial flooding** (rainfall-driven flooding away from streams). They are riverine + coastal products. Urban pluvial flooding in TX cities is invisible to FIRMs by design.

## See also

- [SFHA concept](sfha.md) — the zone classification on a FIRM.
- [NFHL dataset](../datasets/fema-nfhl.md) — the digital nationwide layer.
- [FEMA agency](../agencies/fema.md).
