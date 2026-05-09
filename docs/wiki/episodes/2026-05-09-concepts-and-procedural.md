---
title: Concepts + first procedural page
type: episode
tier: episodic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.7
source_count: 2
decay_profile: medium
tags: [episode, meta, concepts, procedural]
sources:
  - docs/contracts/dataset-registry.md
  - AGENTS.md
relationships:
  - {type: references, target: episodes/2026-05-09-close-registry-drift.md}
stale: false
---

# 2026-05-09 — Concepts + first procedural page

## Question

Continue the wiki expansion. After round 3 closed registry drift, the highest-leverage next slice was the long tail of concept pages (terms referenced from existing pages with no target — [`lint-report.md`](../lint-report.md) § Missing concepts had ~14 entries) plus the first procedural-tier page.

## Findings

- **The flood-vocab cluster was the highest-impact concept gap.** SFHA and FIRM are referenced together throughout the FEMA / NFHL pages, and atlas-tx's flood-overlap product story can't speak intelligibly without them. Both pages explicitly call out the "regulatory ≠ predictive" gotcha — Hurricane Harvey (2017) is the canonical TX example where SFHA-based language failed.
- **PFAS is mid-transition.** UCMR5 (2023–2025) provided pre-rule baseline; the 2024 MCL rule turns PFAS detections into SDWIS violations starting in compliance year 2027 (with caveats — the rule has been litigated). Atlas-tx's DWRS will start picking up PFAS impacts gradually. Page documents this clearly so future agents don't conflate "no PFAS violations today" with "no PFAS issue".
- **LSLI is queued infrastructure.** Initial inventories were due Oct 2024; aggregated TX LSLI data is not yet broadly accessible in atlas-tx-friendly form. The page anticipates a future `tceq-lsli-tx` registered dataset.
- **NWIS is the first measurement-grade dataset page.** Everything else atlas-tx consumes is regulatory / indicator / inventory. NWIS gives streamflow and groundwater observations — the physical-reality counterpart to the indicator stack. Pairs especially well with USDM drought and TWDB aquifers.
- **First procedural page met the promotion bar.** `projects/refresh-cached-snapshot.md` distills the pattern shared by SDWIS, CID, and TWDB hydrology refreshes (≥3 implementing semantic pages, the schema's threshold). Document covers Socrata / federal / ColdFusion / shared-loader variants explicitly.
- **The two watershed-unit comparisons close a real gap.** Multiple pages had been gesturing at the HUC8-vs-WBD and TWDB-river-basin-vs-HUC distinctions in prose. Now there are dedicated answers.

## Pages touched

Created (11):

- **Concepts (7)**: `concepts/{sfha, firm, nhd, pfas, frs-id, lsli, nri}.md`
- **Comparisons (2)**: `comparisons/{twdb-huc8-vs-usgs-wbd, twdb-river-basins-vs-huc}.md`
- **Datasets (1)**: `datasets/usgs-nwis.md`
- **Procedural (1, FIRST tier-4 page)**: `projects/refresh-cached-snapshot.md`

Updated:

- `index.md` — datasets table gains NWIS, concepts gain 7, comparisons gain 2, procedural gains its first entry
- `log.md` — appends round-4 entry
- `graph.md` — rebuilt; 7 new `references` clusters, first `implements` edges (procedural → datasets it implements), first procedural `depends_on` edges (project → agencies it touches)
- `lint-report.md` — § Missing concepts crosses out 7 entries; § Promotion candidates updated
- `overview.md` § Cross-cutting axes — DWQ / env / weather paragraphs gain links to LCR / LSLI / PFAS / FRS-ID / SFHA / FIRM / NRI / NWIS

## Lessons (candidates for future promotion)

- **Burden-vs-harm reaches saturation.** It's now linked from 5 pages including 3 from this round. As the most-cited concept page, it's the strongest candidate for any future "atlas-tx product principles" project page.
- **The "rule is moving" cluster** — both [LCR](../concepts/lcr.md) and [PFAS](../concepts/pfas.md) explicitly note that the regulatory framework is in active revision, with compliance-date implications for atlas-tx scoring. Worth tracking as a category — when EPA / Congress shifts a rule, atlas-tx's score can shift downstream without code changes.
- **Measurement-grade vs indicator-grade is now a real wiki axis.** NWIS is the first measurement-grade dataset page. As atlas-tx adds more direct-observation sources (water-quality monitoring, real-time streamflow) the wiki should track this distinction.

## Next-up (queued for later sessions)

- **Comparison pages still missing**: `comparisons/sdwis-vs-tceq-cid.md` (federal SDWA compliance vs state-side regulatory friction), `comparisons/ejscreen-vs-nri.md` (two composite indicators with very different methodologies). Both are gestured at in body text without dedicated pages.
- **Layers/** — first geometry-first page when NFHL or NHD actually get cached as feature services.
- **Live-verification pass** — weather / flood / NWIS / LSLI pages are repo-grounded only. WebFetch lift would push 0.55–0.65 confidences toward 0.85.
- **Procedural pages** — `projects/{register-a-new-dataset, compose-a-derived-score}.md` are the natural follow-ons to refresh-cached-snapshot. Both have ≥2 implementing examples (SDWIS, ECHO, EJScreen, ACS for register-a-new-dataset; DWRS, APD for compose-a-derived-score) — almost at the promotion bar of 3.
- **Dataset pages for unregistered queued sources** — NRI, HURDAT2 — when those become candidates for actual atlas-tx ingestion.
- **`hurdat2`, `naics`, `rsei`, `compound-risk` concepts** — lower priority; only worth writing when actively referenced by ≥2 pages.
