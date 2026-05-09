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
