---
title: FEMA NFHL — National Flood Hazard Layer
type: dataset
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.55
source_count: 1
decay_profile: slow
tags: [dataset, federal, flood, regulatory, gis, layer]
sources:
  - docs/research/texas-gis-inventory.md
registry_id: null
relationships:
  - {type: published_by, target: agencies/fema.md}
  - {type: references, target: concepts/firm.md}
  - {type: references, target: concepts/sfha.md}
stale: false
---

# FEMA NFHL — National Flood Hazard Layer

Regulatory flood-hazard polygons. Probably what people mean when they say "the floodplain" or "the 100-year flood zone".

## What it is

A nationwide compilation of effective FEMA Flood Insurance Rate Map (FIRM) data, published as an ArcGIS feature service. Polygon layers include:

- **Flood Hazard Zones** — zones A, AE, AH, AO (SFHA, 1% annual chance), V/VE (coastal SFHA with wave action), X (0.2% annual chance / minimal risk), D (undetermined), areas of reduced risk due to levees.
- **Floodway** — the regulatory channel that must be kept open to convey the 1% flood without raising flood elevations.
- **Base Flood Elevations (BFEs)** — the elevation the 1%-annual-chance flood reaches (where studied).
- **Cross sections, hydraulic structures, profile baselines** — the engineering scaffolding underneath the zones.

## Why it matters here

Floodplain × atlas-tx data is a strong overlay story:

- **PWS service area or treatment plant in SFHA** — flooding can knock out drinking water during exactly the moments people most need it.
- **EJ-vulnerable block groups in SFHA** — flood vulnerability + pre-existing burden is a textbook compound-risk story.
- **TCEQ permitted discharger in floodway** — flood mobilization of contaminated material is a real concern.

None of this is a current atlas-tx-registered signal. NFHL is listed here as a high-value next-layer candidate.

## Schema notes

- **DFIRM_ID** identifies a study; **FLD_ZONE** is the zone code; **STATIC_BFE** is the BFE where studied; **ZONE_SUBTY** carries subtype detail.
- Geometry is polygons in NAD83 / web-Mercator depending on service.
- **Effective date** per FIRM panel matters — NFHL has features tagged with the panel they came from.

## How it's served

- **NFHL Map Service** (ArcGIS REST). Layer-by-layer queries.
- **NFHL Map Viewer** for human use.
- **MSC** (Map Service Center) for bulk FIRM panel downloads.

For atlas-tx, an ArcGIS feature-service fetcher is the natural pattern. Cache statewide TX features (large; likely `data/` not `public/cache/` per the >5MB rule).

## Caveats (always emit downstream)

- **Regulatory, not predictive.** "Outside SFHA" ≠ "low flood risk". Atlas-tx must not phrase NFHL queries as "this property is safe / unsafe from flooding" — only "this property is / is not in the 1%-annual-chance regulatory floodplain".
- **Map vintage drives confidence.** A 1985 FIRM does not reflect 40 years of urban development or climate change. Surface the effective date.
- **Post-Harvey TX context.** Hurricane Harvey (2017) and several subsequent events demonstrated extensive flooding outside SFHAs in TX. NFHL alone systematically under-counts contemporary flood risk — overlay it with NOAA storm events / surface-water levels for a fuller story.
- **Levees** are notoriously messy in NFHL — "areas with reduced flood risk due to levee" zones are conditional on the levee being accredited, and accreditation has lapsed in some TX systems.

## Status in atlas-tx

Not currently registered. Likely future `registry_id: fema-nfhl-tx` with `accessType: external`. Could also live as a layer page (`layers/fema-nfhl-flood-zones.md`) once geometry is cached.

## See also

- [FEMA agency](../agencies/fema.md)
- [Burden vs Harm](../concepts/burden-vs-harm.md) — the indicator-vs-measurement framing applies hard to flood-zone language.
