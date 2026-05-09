---
title: SDWIS vs ECHO — when to use which
type: comparison
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.6
source_count: 1
decay_profile: medium
tags: [comparison, water, compliance, federal, epa]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: references, target: datasets/epa-sdwis-violations.md}
  - {type: references, target: datasets/epa-echo-violations.md}
stale: false
---

# SDWIS vs ECHO — when to use which

Both are EPA. Both report violations on TX facilities. They overlap, but they answer different questions.

## At a glance

| Axis | [SDWIS](../datasets/epa-sdwis-violations.md) | [ECHO](../datasets/epa-echo-violations.md) |
|---|---|---|
| **Scope** | SDWA only (drinking water) | Cross-program (SDWA, CWA/NPDES, CAA, RCRA, ...) |
| **Unit** | Public Water System (PWS) | Facility (FRS ID) |
| **Join key** | [PWSID](../concepts/pwsid.md) | FRS facility ID |
| **What "violation" means** | A specific SDWA non-compliance event keyed to PWSID + date + violation type | An aggregated record across programs; semantics depend on program |
| **Granularity** | Per-violation rows with type codes ([SDWA violation types](../concepts/sdwa-violation-types.md)) | Per-facility status + counts + formal enforcement actions |
| **Authoritative for** | "Did this water system fail SDWA, when, how?" | "Is this facility a chronic non-complier across EPA programs?" |
| **Atlas TX role** | Drives [DWRS](../concepts/dwrs-score.md) (primary water-risk signal) | Drives Compliance Gap (M2+ secondary) |

## The big "they tell different stories" moment

A PWS that has an MCL violation in SDWIS may also appear in ECHO — but the ECHO record will fold in CWA permit exceedances (if the facility also has an NPDES permit), formal enforcement actions, penalties, and program-cross compliance status. Conversely, a TX facility with severe NPDES (wastewater discharge) violations shows up in ECHO but is **invisible to SDWIS** because it's not a drinking-water provider.

So:

- **For "is this water safe to drink"** — use SDWIS, filtered to health-based violations. ECHO will mislead because it bundles non-drinking-water signals.
- **For "is this regulated entity a bad actor across the board"** — use ECHO. SDWIS is too narrow.
- **For Atlas TX's primary product (drinking-water risk)** — SDWIS is the spine. ECHO is context for the secondary "Compliance Gap" story.

## Joining them

When you need to map ECHO findings back to a specific PWS, the path is:

1. Try the FRS ID ↔ PWSID cross-reference fields if present in ECHO output.
2. If absent, fall back to spatial / name-fuzzy join. Document the join confidence; don't smear it into the score.
3. Never assume one ECHO facility = one PWSID without verifying.

## Where this comparison gets sharper

When Compliance Gap actually ships (post-M1), this page should be revisited with concrete TX examples: a county where SDWIS says "a few violations" but ECHO says "these facilities are chronic non-compliers" — the diff is the signal. Until then, this is a structural comparison, not an empirical one.

## Confidence

`0.6` — the structural distinctions are well-documented in EPA materials and the contract, but the specific join-quality + per-program semantics are best confirmed against live data. Reinforce when Compliance Gap lands.
