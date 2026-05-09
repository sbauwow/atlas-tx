---
title: LSLI — Lead Service Line Inventory
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.6
source_count: 1
decay_profile: medium
tags: [concept, water, lead, sdwa, lcr, inventory]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: references, target: concepts/lcr.md}
  - {type: references, target: concepts/pwsid.md}
stale: false
---

# LSLI — Lead Service Line Inventory

A federally-mandated inventory of lead service lines (LSLs) maintained by every Public Water System under the [Lead and Copper Rule Revisions (LCRR)](lcr.md) and tightened further under the LCRI (2024).

## What an LSL is

A **service line** is the pipe that connects a public water main to a customer's plumbing. Some of those service lines are made of lead. **Lead service lines are the dominant source of lead in drinking water in most US homes** — much more than internal plumbing or solder, which more recent housing has eliminated.

A service line typically has two segments:

- **System-side** — from the water main to the property line / curb stop. Water utility owns and maintains.
- **Customer-side** — from the property line to the home. Property owner owns.

Either side can be lead. LCRR/LCRI require inventories of *both* sides.

## What an LSLI must contain

Per LCRR (compliance date October 2024 for the initial inventory):

- Every service line classified as one of:
  - **Lead** — confirmed lead.
  - **Galvanized requiring replacement (GRR)** — galvanized iron downstream of lead.
  - **Non-lead** — confirmed not lead.
  - **Unknown / Lead Status Unknown (LSU)** — not yet investigated.
- Material classification for **both** the system side and the customer side.
- **Public access** — the inventory must be accessible to consumers.
- **Updates** — annual updates as material info improves through investigations and replacements.

LCRI (2024) further requires:

- Full LSL replacement (system AND customer side) within 10 years for most systems.
- Lower threshold action levels (10 µg/L proposed; phased in).
- Mandatory replacement triggers when action levels are exceeded.

## Why this matters here

Atlas-tx's water risk story is currently violation-driven (DWRS). LSLI data, when broadly available, could shift this:

- **LSLs are a leading indicator.** A system with many unreplaced LSLs has elevated lead exposure risk *before* any action-level exceedance shows up in the violations data.
- **Atlas-tx's burden-vs-harm framing** survives — LSL count is itself an *indicator* of risk, not a measurement of harm. But it's a stronger indicator than current violation counts because it captures the long tail of low-level chronic exposure.
- **EJ overlap is sharp.** Low-income / older neighborhoods systematically have more LSLs. LSLI × EJScreen = a much sharper signal than violations × EJScreen.

## Status of TX LSLI data

- TX PWSs should have submitted initial inventories in late 2024.
- Aggregated state-level data is **not yet broadly accessible** in a clean machine-readable form. TCEQ has an LSL portal, but coverage and accessibility for atlas-tx-style ingestion is unclear.
- A future `tceq-lsli-tx` registered dataset is plausible. Status of any cached snapshot: not started.

## Caveats

- **Self-reported by water systems.** Like SDWIS, LSLI quality varies — particularly in the customer-side classifications (PWSs may not have records of customer-side material).
- **"Unknown" is a real category.** Many initial inventories will have a high % unknown; treat as "monitoring lower bound", not "no LSLs here".
- **Replacement is in progress.** A 2024 inventory is not the 2027 inventory. LSLI is a *living* dataset.
- **Spatial granularity of public LSLI data varies.** Some PWSs publish per-address; others publish system totals. Atlas-tx's ability to do block-group-level overlap depends on what's published.

## See also

- [LCR](lcr.md) — the rule that mandates LSLIs.
- [PWSID](pwsid.md) — every LSLI is keyed to a PWS.
- [Burden vs Harm](burden-vs-harm.md) — applies hard to "this neighborhood has lots of LSLs".
