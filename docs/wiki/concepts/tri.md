---
title: TRI — Toxics Release Inventory
type: concept
tier: semantic
created: 2026-05-10
updated: 2026-05-10
last_confirmed: 2026-05-10
confidence: 0.7
source_count: 2
decay_profile: medium
tags: [concept, federal, environment, chemical, reporting]
sources:
  - https://www.epa.gov/toxics-release-inventory-tri-program
  - docs/wiki/datasets/epa-tri-tx.md
relationships:
  - {type: references, target: agencies/epa.md}
  - {type: references, target: datasets/epa-tri-tx.md}
  - {type: references, target: concepts/burden-vs-harm.md}
  - {type: references, target: concepts/frs-id.md}
stale: false
---

# TRI — Toxics Release Inventory

EPA program established under EPCRA § 313 (Emergency Planning and Community Right-to-Know Act, 1986). Industrial and federal facilities meeting size + sector + chemical-volume thresholds must annually self-report releases of [a fixed list of TRI-listed chemicals](https://www.epa.gov/toxics-release-inventory-tri-program/tri-listed-chemicals) to air, water, land, and underground injection — plus off-site transfers.

The TRI is **self-reported**, not measured. Each facility's TRI form is its own claim about what it released; EPA hosts and aggregates rather than verifies.

## Why it matters here

- **Co-located stress signal.** TRI-reporting facilities cluster in industrial corridors that overlap heavily with environmental-justice communities. Useful as an *exposure / burden indicator*, not a *harm claim*.
- **Cross-program join.** Many TRI facilities also carry [TPDES](tpdes.md) permits and [FRS IDs](frs-id.md) — TRI is one axis of a multi-program facility view.

## Schema notes

- Reporting year is the calendar year covered. EPA publishes preliminary data ~6 months after the reporting deadline; final data lags ~1 year.
- Releases are categorized by media (Air-Stack, Air-Fugitive, Water, Land, UIC, Off-site Transfer) and by chemical (CAS number).
- "Quantity reported" is not a toxicity-weighted exposure score. EPA publishes the **Risk-Screening Environmental Indicators (RSEI)** model for that — a separate dataset.

## Caveats

- **Self-reported, threshold-gated.** Below-threshold facilities don't appear at all. Comparing facility counts across years requires care if thresholds changed.
- **Releases ≠ exposure ≠ harm.** TRI volume × chemical doesn't predict adverse health outcomes without dispersion, fate, and population-density modeling. Cf. [Burden vs Harm](burden-vs-harm.md).
- **Not a permit dataset.** A TRI report doesn't imply a violation; it implies coverage by the program.

## See also

- [`epa-tri-tx`](../datasets/epa-tri-tx.md)
- [Burden vs Harm](burden-vs-harm.md) · [FRS-ID](frs-id.md)
