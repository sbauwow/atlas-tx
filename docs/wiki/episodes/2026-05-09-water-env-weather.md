---
title: Water/env/weather wiki expansion
type: episode
tier: episodic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.7
source_count: 2
decay_profile: medium
tags: [episode, meta, water, environment, weather]
sources:
  - docs/contracts/dataset-registry.md
  - docs/research/texas-gis-inventory.md
relationships:
  - {type: references, target: episodes/2026-05-08-wiki-init.md}
stale: false
---

# 2026-05-09 — Water / environmental / weather expansion

## Question

Extend the wiki past the seed pages with three buckets: drinking-water quality (deeper SDWA / SDWIS / ECHO coverage), environmental factors (USGS, TRI, EJ index methodology, the burden-vs-harm product stance), and weather-related impacts (NOAA, FEMA, flood layer, drought, storm events). Constraint: repo-grounded only, confidence cap 0.7. PR #2 grows.

## Findings

- **DWQ bucket already had hooks.** SDWIS and ECHO are both registered; the wiki gap was concept-level (violation types, MCLs, PWSID semantics) and the comparison was missing. Added five pages, all citable to the contract.
- **The burden-vs-harm rule is the most load-bearing piece of the wiki.** It is not just a stylistic preference — it is encoded in `AGENTS.md` § 5 and the dataset-registry contract. Every other page should reference it on first mention of "score" or "indicator". Promoted to its own concept page (`concepts/burden-vs-harm.md`) at confidence 0.8 because it is mirrored in two authoritative repo files.
- **Weather bucket is genuinely new ground.** No NOAA, FEMA, or USGS page existed before this session, and no related dataset is registered. The pages are scaffolding for likely future signals (drought stress on aquifers, flood overlap with PWS service areas, hurricane history on Gulf Coast counties) — confidence floors are deliberately 0.55 because none of these are repo-verified.
- **EJScreen has more index complexity than the seed page captured.** The `concepts/ej-index.md` page now distinguishes raw indicators / demographic indicators / EJ Index / Supplemental Index, and pins the state-vs-national percentile question — that distinction matters product-side.

## Pages touched

Created (14):

- `datasets/epa-echo-violations.md`, `datasets/epa-tri-tx.md`, `datasets/fema-nfhl.md`, `datasets/noaa-storm-events.md`, `datasets/usdm-drought-monitor.md`
- `agencies/usgs.md`, `agencies/noaa.md`, `agencies/fema.md`
- `concepts/sdwa-violation-types.md`, `concepts/mcl.md`, `concepts/pwsid.md`, `concepts/ej-index.md`, `concepts/burden-vs-harm.md`
- `comparisons/sdwis-vs-echo.md`

Updated:
- `index.md` (all new pages registered)
- `log.md` (this session)
- `graph.md` (edge list rebuilt)
- `lint-report.md` (new orphan / drift / missing-concept entries)
- `overview.md` (mention drought + flood + cross-program compliance + burden-vs-harm)
- `STATE.md` (claim row, will be moved to Recently-done)

## Lessons (candidates for future promotion)

- **`epa-tri-tx`, `fema-nfhl`, `noaa-storm-events`, `usdm-drought-tx` are likely future registrations.** The wiki pages currently carry `registry_id: null` — when these get registered, set the field and bump confidence. (Encoded in each page's "Status in atlas-tx" section.)
- **NFHL alone systematically under-counts current TX flood risk.** Post-Harvey context. Atlas TX must not rely on NFHL alone for "flood-affected" claims. (Encoded in `datasets/fema-nfhl.md`.)
- **USDM is expert-classified, not measured.** Pairs cleanly with the burden-vs-harm rule. (Encoded in `datasets/usdm-drought-monitor.md`.)
- **State vs national EJScreen percentiles answer different questions.** Pin one per call. (Encoded in `concepts/ej-index.md`, repeating the seed-page caveat.)

## Next-up (queued for later sessions)

- Datasets pages for the registered-but-still-unwritten Socrata sources: `7fq8-wig2` (TCEQ Water Quality Permits), `hr84-s96f` (Texas Water Districts), `tceq-cid-search-{one,two}`, `tceq-swq-segments`, `twdb-major-aquifers`, `twdb-river-basins`, `twdb-huc8`.
- Concept pages for `huc`, `socrata-soql`, the LCR action-level mechanics, `pfas-ucmr5`.
- First `layers/` pages once a feature service actually lands (NFHL or NHD).
- A `concepts/compound-risk.md` page describing the indicator-stacking pattern (water risk × flood overlap × drought × demographic burden) once that surfaces in atlas-tx code.
- Live-verification pass on weather-bucket dataset endpoints (current pages are repo-grounded only; lift confidence after WebFetch).
