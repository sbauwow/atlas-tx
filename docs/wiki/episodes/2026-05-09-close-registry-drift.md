---
title: Close registry drift + foundational concepts
type: episode
tier: episodic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.7
source_count: 1
decay_profile: medium
tags: [episode, meta, registry, concepts]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: references, target: episodes/2026-05-09-water-env-weather.md}
stale: false
---

# 2026-05-09 — Close registry drift + foundational concepts

## Question

Continue the wiki expansion. Highest-leverage next slice: close all the registered-but-unwritten dataset drift (8 IDs from `dataset-registry.md` v0.4.0 had no wiki page) and stand up the foundational concept pages that other pages had been pointing at since round 1 (HUC, SoQL, LCR, APD score).

## Findings

- **All 8 registry-drift dataset pages are now written.** Registry-drift count goes from 8 to 0. The 8 IDs were: `7fq8-wig2`, `hr84-s96f`, `tceq-cid-search-one`, `tceq-cid-search-two`, `tceq-swq-segments`, `twdb-major-aquifers`, `twdb-river-basins`, `twdb-huc8`.
- **APD score now wikified alongside DWRS.** The contract documents two derived signals. DWRS got a concept page in round 1; APD only had data-side coverage. Now `concepts/apd-score.md` exists with the full formula breakdown. The pair forms the spine of "signals atlas-tx computes".
- **HUC and SoQL were the highest-pull foundational concepts.** Multiple existing pages had been gesturing at them in prose without a target page. Now they're proper anchors.
- **LCR is the trickiest concept page so far.** Lead doesn't follow the standard MCL pattern — action levels, sampling-pool semantics, ongoing rule-revision (LCRR / LCRI) all matter for any product surface that mentions lead. Confidence 0.65 and explicitly notes the rule is moving.
- **`epa-tri-tx` is intentionally still unregistered.** The contract treats TRI as secondary; EJScreen folds in TRI-derived burden indicators transitively. Direct TRI ingestion is a future call.

## Pages touched

Created (12):

- **TCEQ datasets**: `datasets/{7fq8-wig2-tceq-water-permits, hr84-s96f-tx-water-districts, tceq-cid-search-one, tceq-cid-search-two, tceq-swq-segments}.md`
- **TWDB hydrology datasets**: `datasets/{twdb-major-aquifers, twdb-river-basins, twdb-huc8}.md`
- **Concepts**: `concepts/{huc, socrata-soql, lcr, apd-score}.md`

Updated:
- `index.md` — datasets table now lists all 16 registered + unregistered pages; concepts table gains 4 entries
- `log.md` — appends round-3 entry
- `graph.md` — rebuilt edge list now includes Socrata `lives_on` edges, TCEQ-published edges for CID/SWQ, TWDB-published edges for the hydrology trio, and APD's three `derives_from` edges
- `lint-report.md` — registry drift table shows 0 unwritten registered datasets; orphans / missing-concepts lists pruned
- `overview.md` — APD added to the derived-signals lead paragraph; v1-scope list now links every entry to its dataset page
- `STATE.md` (will move to Recently-done at session end)

## Lessons (candidates for future promotion)

- **`concepts/socrata-soql.md` is now a high-traffic foundational page.** Every Socrata-fed dataset `depends_on` it; the more Socrata sources atlas-tx adds, the heavier this page gets. Strong promotion candidate to procedural the next round it's referenced by ≥3 new dataset pages.
- **TWDB hydrology trio share one snapshot, one loader, one refresh script.** This is a *projects/* candidate ("hydrology-trio refresh pattern") if/when a second multi-layer batch ingestion lands.
- **CID Search One reliability is a live concern** baked into the wiki — `datasets/tceq-cid-search-one.md` notes the 2026-05-08 fail-loud status. Worth re-checking next session if there have been retry-pattern improvements.
- **LCR is moving.** LCRI (finalized 2024) tightens the rule. Atlas-tx's lead-violation handling may need re-tuning as the underlying SDWIS coding shifts. Tracked.

## Next-up (queued for later sessions)

- **Comparison pages** — `comparisons/twdb-huc8-vs-usgs-wbd.md`, `comparisons/twdb-river-basins-vs-huc.md` would clean up the "which watershed unit do I use" question. Both are foreshadowed in current pages.
- **Concepts still missing** — `nhd` / `nhdplus`, `pfas` / `ucmr5`, `frs-id`, `naics`, `rsei`, `sfha`, `firm` / `dfirm`, `nri`, `nwis`, `hurdat2`, `lsli`. See `lint-report.md`.
- **First `layers/` pages** — when NFHL or NHD actually get cached as feature services, geometry-first pages can land.
- **Live-verification pass on weather datasets** — current weather-bucket pages are 0.55–0.6 because nothing is repo-anchored. WebFetch lift would push them to ~0.85.
- **Procedural pages** — at least one (`projects/refresh-cached-snapshot.md`) could land now that the pattern is shared by multiple datasets (TWDB hydrology trio, SDWIS, CID).
