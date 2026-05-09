---
title: EPA
type: agency
tier: semantic
created: 2026-05-08
updated: 2026-05-08
last_confirmed: 2026-05-08
confidence: 0.75
source_count: 2
decay_profile: slow
tags: [agency, federal, water, ej, compliance]
sources:
  - docs/research/texas-gis-inventory.md
  - docs/contracts/dataset-registry.md
relationships: []
stale: false
---

# EPA — US Environmental Protection Agency

Federal environmental agency. Publishes the core compliance and exposure datasets that drive Atlas TX scores.

## What it publishes that we use

- **SDWIS** — Safe Drinking Water Information System. Public Water System (PWS) registry + violations history. See [`datasets/epa-sdwis-violations.md`](../datasets/epa-sdwis-violations.md). Drives the [DWRS](../concepts/dwrs-score.md) score.
- **EJScreen 2024** — environmental-justice screening tool. Block-group-level demographic + environmental indicators. See [`datasets/epa-ejscreen-2024.md`](../datasets/epa-ejscreen-2024.md). Drives the EJ Burden Overlap score.
- **ECHO** — Enforcement & Compliance History Online. Per-facility violation history across multiple programs. Registered as `epa-echo-violations`. Secondary; targeted at the Compliance Gap score.
- **TRI** — Toxic Release Inventory. Per-facility self-reported chemical releases. Mentioned as secondary in `README.md`; not registered in the v1 critical path.

## Things to know

- These are *federal* programs. EPA data on TX facilities tells a partially overlapping story with [TCEQ](tceq.md) data on the same facilities — coverage and reporting cadences differ.
- SDWIS is **self-reported by water systems**. Coverage gaps are real, especially among small systems. Always emit the caveat.
- EJScreen percentiles can be **state-relative or national**. Atlas TX should pin which mode it uses on each call. State-relative is generally what we want for intra-TX comparison.
- EPA has not (as of contract v0.4.0) standardized one portal for these — SDWIS Federal Reporting Services, ECHO REST, and EJScreen mapping/API live on separate endpoints.

## Authority

- For PWS compliance status, SDWIS is the authority of record.
- For comparable EJ exposure indicators across geographies, EJScreen is the authority of record. But it is **indicator-grade**, not measurement-grade — surface accordingly.
