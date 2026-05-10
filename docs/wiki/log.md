# Wiki Log

Append-only chronological record of wiki operations. Most recent first. One entry per session or schema change.

Schema for entries:

```
## YYYY-MM-DD — short slug
- agent: <name>
- action: created | updated | superseded | linted | schema-change | crystallized
- pages touched: <relative paths>
- notes: terse free-form
```

---

## 2026-05-10 — first lint pass + 8 new concept pages

- agent: claude-opus-4-7
- action: linted, created, updated, schema-tooling
- pages touched:
  - **Tooling**: `scripts/lint-wiki.ts` — first executable linter implementing the schema's lint workflow. Walks pages, builds `graph.md` (deduped edge list per relationship type), computes decay analytically (not iteratively — frontmatter `confidence` stays at the `last_confirmed` value; the lint report shows what it would be after decay). Surfaces orphans, dangling links, registry drift (best-effort regex), missing concepts (heuristic gated against existing slugs/titles), low-confidence pages.
  - **New concepts (8)**: `concepts/cwa.md`, `concepts/sdwa.md`, `concepts/npdes.md`, `concepts/tpdes.md`, `concepts/cid.md`, `concepts/soah.md`, `concepts/tri.md`, `concepts/acs.md` — all surfaced by the first lint as terms mentioned ≥ 3 times across non-concept pages without their own page.
  - **Relationship updates**: 13 dataset / agency / concept pages gained inbound links to previously-orphaned pages (LSLI, NRI, NHD, USGS-NWIS, NOAA Storm Events, NFHL, comparisons trio, sources/texas-gis-inventory, projects/refresh-cached-snapshot, projects/author-an-svg-viz-primitive). Wiki now reads as a connected graph instead of star-shaped clusters.
  - **Auto-rebuilt**: `graph.md`, `lint-report.md`. Both deterministic — re-running on an unchanged tree produces no diff.
- notes: First-run lint surfaced 19 orphans, 14 missing-concept candidates, and 3 dangling links (false-positive on root meta files). After fixes + new pages: **2 orphans (both episodes — end-state by design), 0 dangling, 0 missing concepts, 0 low-confidence**. The decay logic is now idempotent: `confidence` in frontmatter is the value at `last_confirmed`; the lint report shows the analytically-decayed value as a separate column. Re-running the linter doesn't compound. Registry drift surfaces 2 false positives (`epa-echo-violations`, `hr84-s96f`) where the regex scan can't find the IDs in `dataset-registry.md`'s tables — flagged as "best-effort, cross-check by hand."

## 2026-05-10 — Tufte primitives, Marey unblock, eye-candy

- agent: claude-opus-4-7
- action: created, updated, crystallized
- pages touched:
  - **Concepts (2)**: `concepts/marey-chart.md`, `concepts/sankey-flow.md`
  - **Procedural (1)**: `projects/author-an-svg-viz-primitive.md` — second tier-4 page; promotion bar met by six primitives shipped on PR #16
  - **Datasets (1)**: `datasets/7fq8-wig2-tceq-water-permits.md` — added "Date columns — asymmetric across status" subsection. `last_confirmed` 2026-05-09 → 2026-05-10. `confidence` 0.7 → 0.8 (+0.1 for live Socrata third-source confirmation). `source_count` 2 → 3.
  - **Housekeeping**: `index.md`, `log.md`, `episodes/2026-05-10-tufte-marey-eyecandy.md`
- notes: Live-curl against `https://data.texas.gov/resource/7fq8-wig2.json` confirmed `date_coverage_began` exists on ACTIVE rows only — not on PENDING. This was previously undocumented in the wiki. Drives both the dataset page update and the Marey concept's caveat. Six SVG primitives (`Sparkline`, `MicroBar`, `MismatchStrip`, `TileCartogram`, `Sankey`, `MareyChart`) all shipped on `web/tufte-marey` (PR #16, merged 2026-05-10) share an authoring pattern, earning the second tier-4 page. No contracts touched.

## 2026-05-09 — concepts + first procedural

- agent: claude-opus-4-7
- action: created, updated, crystallized
- pages touched:
  - **Concepts (7)**: `concepts/sfha.md`, `concepts/firm.md`, `concepts/nhd.md`, `concepts/pfas.md`, `concepts/frs-id.md`, `concepts/lsli.md`, `concepts/nri.md`
  - **Comparisons (2)**: `comparisons/twdb-huc8-vs-usgs-wbd.md`, `comparisons/twdb-river-basins-vs-huc.md`
  - **Datasets (1)**: `datasets/usgs-nwis.md` (unregistered; first measurement-grade source page)
  - **Procedural (1, first)**: `projects/refresh-cached-snapshot.md` — distilled pattern across SDWIS / CID / TWDB hydrology refreshes
  - **Housekeeping**: `index.md`, `log.md`, `graph.md`, `lint-report.md`, `overview.md`, `episodes/2026-05-09-concepts-and-procedural.md`
- notes: All 7 concepts close inbound `references` from prior pages — `lint-report.md` § Missing concepts shrinks substantially. PFAS page documents the 2024-rule transition (UCMR5 → MCLs); LSLI page anticipates a future TX dataset. NWIS is the first measurement-grade dataset in the wiki — pairs with USDM and TWDB aquifers to close the climatic-stress → physical-response loop. First procedural page (tier 4) lands; promotion bar met (≥3 semantic pages share the refresh pattern). Confidence cap 0.7 (project page sits at 0.75 because it distills from already-shipped code). No contracts touched.

## 2026-05-09 — close registry drift

- agent: claude-opus-4-7
- action: created, updated, crystallized
- pages touched:
  - **TCEQ datasets (5)**: `datasets/7fq8-wig2-tceq-water-permits.md`, `datasets/hr84-s96f-tx-water-districts.md`, `datasets/tceq-cid-search-one.md`, `datasets/tceq-cid-search-two.md`, `datasets/tceq-swq-segments.md`
  - **TWDB hydrology datasets (3)**: `datasets/twdb-major-aquifers.md`, `datasets/twdb-river-basins.md`, `datasets/twdb-huc8.md`
  - **Concepts (4)**: `concepts/huc.md`, `concepts/socrata-soql.md`, `concepts/lcr.md`, `concepts/apd-score.md`
  - **Housekeeping**: `index.md`, `log.md`, `graph.md`, `lint-report.md`, `overview.md`, `episodes/2026-05-09-close-registry-drift.md`
- notes: All 8 already-registered-but-unwritten dataset IDs from `dataset-registry.md` v0.4.0 now have wiki pages — registry drift goes from 8 to 0. APD score (the second derived signal in the contract) is now wikified alongside DWRS. HUC + SoQL are foundational concept pages that other pages have been pointing at since round 1. Confidence cap 0.7; repo-grounded only.

## 2026-05-09 — water / env / weather expansion

- agent: claude-opus-4-7
- action: created, updated, crystallized
- pages touched:
  - **DWQ (5)**: `datasets/epa-echo-violations.md`, `concepts/sdwa-violation-types.md`, `concepts/mcl.md`, `concepts/pwsid.md`, `comparisons/sdwis-vs-echo.md`
  - **Env (4)**: `agencies/usgs.md`, `datasets/epa-tri-tx.md`, `concepts/ej-index.md`, `concepts/burden-vs-harm.md`
  - **Weather (5)**: `agencies/noaa.md`, `agencies/fema.md`, `datasets/fema-nfhl.md`, `datasets/noaa-storm-events.md`, `datasets/usdm-drought-monitor.md`
  - **Housekeeping**: `index.md`, `log.md`, `graph.md`, `lint-report.md`, `overview.md`, `episodes/2026-05-09-water-env-weather.md`
- notes: Repo-grounded only (no live WebFetch); confidence cap 0.7. Five new dataset pages have `registry_id: null` because the underlying sources are not yet registered (NFHL, TRI, NOAA Storm Events, USDM Drought, USGS NHD). Burden-vs-harm promoted to `confidence: 0.8` because it's mirrored in `AGENTS.md` § 5 and the dataset-registry contract. No contracts touched. PR #2 grows.

## 2026-05-08 — wiki init

- agent: claude-opus-4-7
- action: schema-change, created
- pages touched:
  - `CLAUDE.md` (new schema, ported from `~/trading-wiki/CLAUDE.md`, retuned for govt-data domain — most pages decay slowly; relationship vocab gains `published_by`, `lives_on`, `derives_from`; `type` field gains `agency`, `portal`, `dataset`, `layer`)
  - `index.md`, `overview.md`, `graph.md`, `lint-report.md` (skeletons)
  - `agencies/{tceq,twdb,epa}.md` (seed)
  - `portals/data-texas-gov.md` (seed)
  - `datasets/{epa-sdwis-violations,epa-ejscreen-2024,census-acs5-2023-county}.md` (seed, all `registry_id` matched against `docs/contracts/dataset-registry.md` v0.4.0)
  - `concepts/dwrs-score.md` (seed — describes the derived signal, not the implementation)
  - `sources/texas-gis-inventory.md` (seed — summary of `docs/research/texas-gis-inventory.md`)
  - `episodes/2026-05-08-wiki-init.md` (crystallization of this session)
- notes: scope is TX state agencies + EPA + adjacent fed (Census, USGS, NOAA, FEMA per their relevance to current registry). Branch `docs/wiki-init`. No contracts touched.
