---
title: EPA ECHO — Violations (TX)
type: dataset
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.6
source_count: 1
decay_profile: medium
tags: [dataset, federal, water, compliance, cross-program]
sources:
  - docs/contracts/dataset-registry.md
registry_id: epa-echo-violations
relationships:
  - {type: published_by, target: agencies/epa.md}
  - {type: references, target: datasets/epa-sdwis-violations.md}
  - {type: depends_on, target: concepts/cwa.md}
  - {type: depends_on, target: concepts/npdes.md}
stale: false
---

# EPA ECHO — Violations (TX)

`registry_id: epa-echo-violations` · `accessType: external` · category `compliance` · secondary in v1.

## What it is

Enforcement and Compliance History Online — EPA's cross-program facility-level compliance database. Aggregates violations across SDWA, CWA (Clean Water Act / NPDES), CAA (Clean Air Act), RCRA (waste), and others. Per-facility view; one facility can carry violations from multiple programs.

## How it differs from SDWIS

[SDWIS](epa-sdwis-violations.md) is **PWS-centric and SDWA-only**. ECHO is **facility-centric and cross-program**. They overlap on SDWA facilities but tell partially different stories — SDWIS tracks PWSs as systems with violation timelines; ECHO tracks facilities (which include PWSs and many non-PWS regulated entities) with broader compliance signals (formal enforcement actions, penalties, non-compliance status).

See [SDWIS vs ECHO](../comparisons/sdwis-vs-echo.md) for the full comparison.

## Why it matters here

Drives the **Compliance Gap** secondary score (M2+):

> Per-county score = log(permits) × (1 − resolved_violations / total_violations).

ECHO is the violation source for that formula. Permit counts come from TCEQ (state) — so the score implicitly compares "how much regulated activity is happening" (TCEQ permits) against "how much of it is in trouble" (ECHO unresolved violations).

## Schema notes (Atlas TX usage)

Per registry contract, `keyFields` per the fetcher under `src/lib/datasets/`. Facility-level join keys are EPA Facility Registry Service (FRS) IDs. Linking ECHO facilities back to PWS rows requires either a PWSID cross-reference (when present in ECHO) or a spatial / name-fuzzy join, both of which are messy.

## Caveats (always emit downstream)

- **Facility ≠ PWS.** Don't roll ECHO violation counts up by treating a facility as one PWS without checking the join key.
- **Self-reported, with EPA QC layered on top.** Less raw than SDWIS but still incomplete; EPA itself flags coverage gaps in published methodology.
- **"Violation" semantics differ across programs.** A reported SDWA monitoring lapse and a CWA NPDES exceedance are both "violations" in ECHO. Filtering by program is mandatory before any compliance-rate math.
- **State-vs-federal reporting lag.** Texas is a primacy state for several programs; submission lag varies.

## Refresh

External fetcher under `src/lib/datasets/` (TBD per contract). Snapshot under `public/cache/` or `data/` per size policy.

## See also

- [`epa-sdwis-violations`](epa-sdwis-violations.md) — drinking-water-only, PWS-centric counterpart.
- Contract § Compliance Gap signal.
