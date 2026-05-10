---
title: NPDES — National Pollutant Discharge Elimination System
type: concept
tier: semantic
created: 2026-05-10
updated: 2026-05-10
last_confirmed: 2026-05-10
confidence: 0.75
source_count: 2
decay_profile: slow
tags: [concept, federal, water, permit, surface-water]
sources:
  - 33 U.S.C. § 1342 (CWA § 402)
  - docs/wiki/datasets/7fq8-wig2-tceq-water-permits.md
relationships:
  - {type: references, target: concepts/cwa.md}
  - {type: references, target: concepts/tpdes.md}
  - {type: references, target: agencies/epa.md}
stale: false
---

# NPDES — National Pollutant Discharge Elimination System

The federal permit program established under [Clean Water Act](cwa.md) § 402. Any "discharge of a pollutant" from a point source to waters of the U.S. requires an NPDES permit specifying allowable concentrations / loads of named pollutants, monitoring/reporting cadence, and conditions.

EPA runs NPDES nationally; states with delegated primacy run their own equivalents. Texas's primacy implementation is [TPDES](tpdes.md). The two are functionally the same permit type, but Texas's TPDES is the authoritative permit identity in [`7fq8-wig2`](../datasets/7fq8-wig2-tceq-water-permits.md).

## Permit types

- **Individual permits** — facility-specific, written from scratch. The "WQ…" entries in the TCEQ dataset.
- **General permits** — coverage-by-application under a master permit (stormwater, CAFO, construction).
- **Stormwater permits (MS4)** — Phase I / II construction and municipal separate storm sewer systems.

## Why it matters here

- The TCEQ Water Quality Individual Permits dataset is, structurally, the TX implementation of NPDES § 402.
- [EPA ECHO](../datasets/epa-echo-violations.md) is the federal compliance crosswalk back to NPDES facilities — including those administered by primacy states.
- A TPDES individual permit and a federal NPDES individual permit refer to the same regulatory thing in TX.

## Caveats

- **NPDES covers point sources only.** Nonpoint pollution (agricultural runoff, urban runoff outside MS4) is largely outside this lane.
- **The FEDERAL NPDES dataset and the STATE TPDES dataset are not auto-synced.** Treat ECHO as the federal compliance lane and `7fq8-wig2` as the state permit lane; cross-reference by facility identifiers, not by assumption.

## See also

- [CWA](cwa.md) · [TPDES](tpdes.md)
- [SDWIS vs ECHO](../comparisons/sdwis-vs-echo.md)
