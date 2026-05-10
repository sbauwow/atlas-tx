---
title: TCEQ Water Quality Individual Permits (7fq8-wig2)
type: dataset
tier: semantic
created: 2026-05-09
updated: 2026-05-10
last_confirmed: 2026-05-10
confidence: 0.8
source_count: 3
decay_profile: medium
tags: [dataset, tceq, water, permit, socrata, environment]
sources:
  - docs/contracts/dataset-registry.md
  - README.md
  - https://data.texas.gov/resource/7fq8-wig2.json
registry_id: 7fq8-wig2
relationships:
  - {type: published_by, target: agencies/tceq.md}
  - {type: lives_on, target: portals/data-texas-gov.md}
  - {type: depends_on, target: concepts/socrata-soql.md}
  - {type: depends_on, target: concepts/marey-chart.md}
stale: false
---

# TCEQ Water Quality Individual Permits

`registry_id: 7fq8-wig2` · `accessType: dataset` (Socrata, auto-built URL via `src/lib/texas-open-data.ts`) · category `environment`.

## What it is

Active and pending TPDES (Texas Pollutant Discharge Elimination System — TX's primacy implementation of CWA NPDES) wastewater discharge individual permits, plus state-only water-quality permits. One row per permit. Lives on [`data.texas.gov`](../portals/data-texas-gov.md) under the canonical 4×4 ID `7fq8-wig2`.

## Why it matters here

The **regulated-entity exposure surface** for atlas-tx. Multiple downstream uses:

- **EJ Burden Overlap score** — buffer-density of permits within N miles around an EJScreen block group is the score's "regulated-activity intensity" axis (per the contract — score uses EJScreen demographic-burden percentile × permit density).
- **Compliance Gap secondary score** — permit count is the "amount of regulated activity" denominator; ECHO violations are the "trouble" numerator.
- **CID protest cross-walk** — TCEQ Central Index ([Search One](tceq-cid-search-one.md)) records protests against specific permits keyed by TCEQ ID; this dataset is one of the things being protested.

## Schema notes

Atlas-tx accesses through the Socrata `texas-open-data.ts` URL builder. Canonical `keyFields` per the registry; renaming a field is a breaking change. Lat/long are present and used for spatial buffer joins. **County strings are messy** — always normalize through `src/lib/counties.ts`.

### Date columns — asymmetric across status

The dataset's **only** date field is `date_coverage_began` and it is populated **on ACTIVE rows only**. PENDING rows ship without any date column (no application-received, no submission, no decision). Confirmed by direct Socrata query 2026-05-10:

- `?authorization_status=ACTIVE&$limit=1` → returns `date_coverage_began: "1962-10-04T00:00:00.000"` (or similar).
- `?authorization_status=PENDING&$limit=3` → no `date_coverage_began` key on any row.

Implication for time-series visualizations: a Marey-style train chart (see [Marey chart concept](../concepts/marey-chart.md)) can render ACTIVE permits as diagonals from `date_coverage_began` → today, but PENDING rows have to be omitted (or rendered as a flat tick at "now" with an honest caption). There is no path inside this dataset to recover an application-received date for pending permits — that would require a different TCEQ surface (e.g. Central Index).

Filter the obvious sentinel: `date_coverage_began: "1800-01-01T00:00:00.000"` is a TCEQ legacy placeholder for permits that pre-date the recording system. Drop rows where `startYear < 1950`.

### Other relationships

- A permit is held by a **regulated entity** (TCEQ RN); RN is also the join key into TCEQ Central Index records.
- A permit is **not** the same as a facility — a facility may hold multiple permits across programs.

## Caveats (always emit downstream)

- **"Active/Pending" only.** Historical permits that have lapsed or been withdrawn are not in this slice; trend analysis needs another source.
- **Lat/long quality varies.** Older entries can be address-geocoded rather than surveyed. Buffer-based exposure scores accumulate this error.
- **Permit ≠ pollution.** A permitted discharge is, by design, regulated and (ideally) compliant. Treat density-of-permits as *density of regulated activity*, not *density of pollution*. (Mirrors [Burden vs Harm](../concepts/burden-vs-harm.md).)
- **Texas is a primacy state for TPDES** — TCEQ runs the program; submission to federal ECHO is the cross-walk path.

## Refresh

`accessType: "dataset"` ⇒ no dedicated fetcher; Socrata URL is auto-built. SoQL filters apply per the [SoQL concept](../concepts/socrata-soql.md). Cached snapshot policy follows the standard size threshold.

## See also

- [TCEQ agency](../agencies/tceq.md)
- [data.texas.gov portal](../portals/data-texas-gov.md)
- [SDWIS vs ECHO](../comparisons/sdwis-vs-echo.md) — ECHO is the federal compliance overlay for these same TX facilities.
