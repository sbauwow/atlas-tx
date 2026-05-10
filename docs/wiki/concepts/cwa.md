---
title: Clean Water Act (CWA)
type: concept
tier: semantic
created: 2026-05-10
updated: 2026-05-10
last_confirmed: 2026-05-10
confidence: 0.75
source_count: 2
decay_profile: slow
tags: [concept, federal, law, water, surface-water]
sources:
  - 33 U.S.C. § 1251 et seq. (Clean Water Act)
  - docs/wiki/datasets/7fq8-wig2-tceq-water-permits.md
relationships:
  - {type: references, target: concepts/npdes.md}
  - {type: references, target: concepts/tpdes.md}
  - {type: references, target: agencies/epa.md}
  - {type: references, target: agencies/tceq.md}
  - {type: references, target: datasets/tceq-swq-segments.md}
  - {type: references, target: comparisons/sdwis-vs-echo.md}
stale: false
---

# Clean Water Act

Federal law (1972, as amended) regulating discharges of pollutants into "waters of the United States" and surface-water quality. Primary mechanism: the [National Pollutant Discharge Elimination System](npdes.md) (NPDES) permit program, administered by EPA or by states with delegated primacy. Texas exercises primacy via [TCEQ](../agencies/tceq.md) under the [TPDES](tpdes.md) name.

## What atlas-tx touches downstream of CWA

| Surface | Connection |
|---|---|
| [TCEQ Water Quality Individual Permits (`7fq8-wig2`)](../datasets/7fq8-wig2-tceq-water-permits.md) | TPDES individual permits — TX's CWA implementation |
| [EPA ECHO violations](../datasets/epa-echo-violations.md) | Federal compliance lane crosswalking back to TPDES facilities |
| [TCEQ Surface Water Quality Segments](../datasets/tceq-swq-segments.md) | § 305(b) integrated reports / § 303(d) impaired-waters listings — both CWA reporting requirements |

## Key sections worth knowing

- **§ 301** — prohibits discharge without a permit.
- **§ 303(d)** — drives the impaired-waters list. A waterbody listed under § 303(d) requires a Total Maximum Daily Load (TMDL) — referenced in TCEQ's surface-water-quality lane.
- **§ 305(b)** — biennial state report on water-body conditions.
- **§ 401** — state water-quality certification of federal permits.
- **§ 402** — establishes [NPDES](npdes.md).

## Caveats

- **CWA is not the SDWA.** Drinking-water rules live under the [Safe Drinking Water Act](sdwa.md). Atlas TX's water lane sits at the intersection — surface water (CWA) feeds public water systems (SDWA).
- **"Waters of the United States" (WOTUS) is contested terrain.** Sackett v. EPA (2023) narrowed the scope. Wiki pages should not assume the pre-2023 reading; cite jurisdiction explicitly when it matters.

## See also

- [NPDES](npdes.md) · [TPDES](tpdes.md) · [SDWA](sdwa.md)
- [SDWA violation types](sdwa-violation-types.md)
