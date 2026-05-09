---
title: DWRS — Drinking Water Risk Score
type: concept
tier: semantic
created: 2026-05-08
updated: 2026-05-08
last_confirmed: 2026-05-08
confidence: 0.7
source_count: 1
decay_profile: slow
tags: [concept, score, water, derived-signal]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: derives_from, target: datasets/epa-sdwis-violations.md}
  - {type: derives_from, target: datasets/census-acs5-2023-county.md}
  - {type: depends_on, target: datasets/epa-sdwis-violations.md}
  - {type: depends_on, target: datasets/census-acs5-2023-county.md}
  - {type: published_by, target: agencies/epa.md}
stale: false
---

# DWRS — Drinking Water Risk Score

Atlas TX's primary derived signal for drinking-water risk. The thing the platform exists to compute.

## Definition (per contract)

From `docs/contracts/dataset-registry.md` § Current registered signals:

> **File:** `src/lib/scoring/dwrs.ts`.
> **Inputs:** SDWIS health-based violation rows, ACS population rows.
> **Per-PWS score:** weighted by violation severity tier × population served × recency decay (months).
> **Caveats:** SDWIS is self-reported; coverage gaps in small systems; recency decay window documented in code.

## Shape

Per the per-source scoring contract, every score row carries:
- `id` — PWS ID (or rolled-up county FIPS)
- `score` — normalized 0–100
- `components` — labeled subcomponents (severity, population, recency)
- `caveats` — human-readable, never empty for a score that ships to UI

## What it is *not*

- **Not a harm measurement.** DWRS combines *risk indicators* (violations, population at risk, recency). It is not a claim that any specific population has been harmed.
- **Not a forecast.** DWRS reports the past-window state of compliance, not future risk.
- **Not a substitute for SDWIS itself.** Users who want raw violation history should be linked through to SDWIS.

## Inputs (each is its own page)

- [SDWIS violations](../datasets/epa-sdwis-violations.md) — health-based filter, since 2023-04-01.
- [ACS5 2023 county](../datasets/census-acs5-2023-county.md) — population for weighting (PWS-served population is sourced from SDWIS, not ACS — but ACS provides the county aggregate for fallbacks and roll-ups).

## Caveats (always emit)

- SDWIS is self-reported; small-system coverage gaps.
- Recency decay window is a tuning parameter; document the value next to the score.
- Health-based-only filter excludes monitoring/reporting violations by design — surface this so "no violations" is not misread as "compliance OK".

## Where it lives

- Code: `src/lib/scoring/dwrs.ts`
- Contract: [`docs/contracts/dataset-registry.md`](../../contracts/dataset-registry.md)
- Refocus plan: [`docs/plans/2026-05-08-water-risk-refocus.md`](../../plans/2026-05-08-water-risk-refocus.md)
