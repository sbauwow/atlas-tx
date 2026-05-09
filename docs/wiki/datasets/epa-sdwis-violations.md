---
title: EPA SDWIS Violations (TX, health-based)
type: dataset
tier: semantic
created: 2026-05-08
updated: 2026-05-08
last_confirmed: 2026-05-08
confidence: 0.8
source_count: 2
decay_profile: medium
tags: [dataset, federal, water, compliance, sdwa]
sources:
  - docs/contracts/dataset-registry.md
  - docs/STATE.md
registry_id: epa-sdwis-violations
relationships:
  - {type: published_by, target: agencies/epa.md}
  - {type: derives_from, target: agencies/epa.md}
stale: false
---

# EPA SDWIS — Drinking Water Violations (TX)

`registry_id: epa-sdwis-violations` · `accessType: external` · category `compliance`.

## What it is

Per-PWS (Public Water System) drinking-water violation records under the federal Safe Drinking Water Act, filtered to Texas health-based violations since 2023-04-01. The atlas-tx cached snapshot is ~4.5 MB, ~11,686 rows (per `STATE.md` recently-done entry).

## Schema (as Atlas TX uses it)

PWSID is the stable join key — federal SDWIS format (state code + 7-digit number, kept as a string). Beyond PWSID, the row carries violation timing, violation category (the *health-based* filter is applied at fetch time), and the system identity needed to roll up to county via the PWS service-area mapping.

Authoritative shape lives in `src/lib/datasets/sdwis-violations.ts` (or equivalent — check the file). Atlas TX `keyFields` discipline applies: renaming a field is a breaking registry change.

## Why it matters

Drives the **[DWRS — Drinking Water Risk Score](../concepts/dwrs-score.md)**. DWRS weights health-based violation severity × population served × recency decay (months). SDWIS is the violation source.

## Caveats (always emit downstream)

- **Self-reported.** Coverage gaps in small systems are real.
- **Health-based filter is opinionated.** Atlas TX intentionally excludes monitoring/reporting violations from the score's risk signal; flag this in product surfaces so users don't misread "no violations" as "compliance OK".
- **Timeliness.** SDWIS submission lag varies by primacy state.
- **Recency decay.** DWRS damps old violations over months — exact window lives in code.

## Refresh

Live fetch via the dedicated fetcher; cached snapshot at `public/cache/<slug>-tx.json` (or `data/` if oversized). Branch `data/sdwis-fetcher` shipped the initial fetcher per `STATE.md`.

## Vintage

This page documents the contract-shape; it is *not* tied to a single SDWIS publish vintage. SDWIS is updated continuously by states. Refresh cadence is set by Atlas TX's snapshot policy.
