# Lint Report

Auto-generated health snapshot. Rebuilt by lint. Do not hand-edit between rebuilds.

Last rebuilt: 2026-05-09 (manual pass after registry-drift close; full lint not yet run).

---

## Orphans

Pages with no inbound `relationships` (excluding `index.md` / `overview.md` / `log.md` / `graph.md` / this file):

- `agencies/twdb.md` — inbound: `agencies/usgs.md -> references` plus the new `datasets/twdb-*.md -> published_by` edges. Healthy.
- `agencies/usgs.md` — inbound: `concepts/huc.md -> references`, `datasets/twdb-huc8.md -> references`. Healthy.
- `agencies/noaa.md` — inbound: `agencies/fema.md -> references` plus `datasets/{noaa-storm-events, usdm-drought-monitor} -> published_by`. Healthy.
- `agencies/fema.md` — inbound: `datasets/fema-nfhl.md -> published_by`. Acceptable.
- `agencies/census-bureau.md` — inbound: `datasets/census-acs5-2023-county.md -> published_by`. Acceptable.
- `comparisons/sdwis-vs-echo.md` — no inbound. Comparisons commonly orphan-ish; consider adding `references` from the two datasets it compares next pass.
- `concepts/dwrs-score.md` — root of derivation; intentionally has no inbound `derives_from`. Inbound `references` from `concepts/burden-vs-harm.md` is sufficient.
- `concepts/apd-score.md` — same — root of its own derivation tree. Inbound from `datasets/tceq-cid-search-{one,two}.md` body text via see-also; no formal relationship edge. Add `references` next pass.
- `concepts/pwsid.md` — referenced from prose in many pages but no formal `relationships` edges back. Add `references` from the SDWIS / ECHO comparisons.
- `concepts/huc.md` — inbound `references` from `datasets/twdb-huc8.md`. Healthy.
- `concepts/socrata-soql.md` — inbound `depends_on` from `datasets/7fq8-wig2-*` and `datasets/hr84-s96f-*`. Healthy.
- `concepts/lcr.md` — no inbound formal edges yet. References from `concepts/{mcl, sdwa-violation-types}` body text only; add `references` edges next pass.

## Dangling

Relationships pointing at nonexistent pages: **none.** Verified by markdown link scan on 2026-05-09.

(Two CLAUDE.md / lint-report.md occurrences of `[TCEQ](../agencies/tceq.md)` are wrapped in inline-code backticks as documentation examples — not real links, ignore.)

## Stale

_(none)_

## Contradictions

_(none)_

## Registry drift

`datasets/` pages whose `registry_id` should match `docs/contracts/dataset-registry.md` (v0.4.0):

| Page | registry_id | In registry? |
|---|---|---|
| `datasets/7fq8-wig2-tceq-water-permits.md` | `7fq8-wig2` | ✅ |
| `datasets/hr84-s96f-tx-water-districts.md` | `hr84-s96f` | ✅ |
| `datasets/tceq-cid-search-one.md` | `tceq-cid-search-one` | ✅ (v0.2.0) |
| `datasets/tceq-cid-search-two.md` | `tceq-cid-search-two` | ✅ (v0.2.0) |
| `datasets/tceq-swq-segments.md` | `tceq-swq-segments` | ✅ (v0.4.0) |
| `datasets/twdb-major-aquifers.md` | `twdb-major-aquifers` | ✅ (v0.3.0) |
| `datasets/twdb-river-basins.md` | `twdb-river-basins` | ✅ (v0.3.0) |
| `datasets/twdb-huc8.md` | `twdb-huc8` | ✅ (v0.3.0) |
| `datasets/epa-sdwis-violations.md` | `epa-sdwis-violations` | ✅ |
| `datasets/epa-echo-violations.md` | `epa-echo-violations` | ✅ |
| `datasets/epa-ejscreen-2024.md` | `epa-ejscreen-2024` | ✅ |
| `datasets/census-acs5-2023-county.md` | `census-acs5-2023-county` | ✅ |
| `datasets/epa-tri-tx.md` | `null` | ⏳ unregistered (not in v1 critical path) |
| `datasets/fema-nfhl.md` | `null` | ⏳ unregistered (queued candidate) |
| `datasets/noaa-storm-events.md` | `null` | ⏳ unregistered (queued candidate) |
| `datasets/usdm-drought-monitor.md` | `null` | ⏳ unregistered (queued candidate) |

**Registered datasets without a wiki page yet: 0.** (Drift closed this pass.)

## Missing concepts

Terms mentioned in pages that may warrant their own page (best-effort):

- ~~`socrata-soql`~~ — added.
- ~~`huc`~~ — added.
- ~~`lcr`~~ — added.
- ~~`apd-score`~~ — added.
- `nhd` / `nhdplus` (referenced from `agencies/usgs.md`, `concepts/huc.md`)
- `pfas` / `ucmr5` (referenced from `concepts/mcl.md`, `concepts/lcr.md`)
- `frs-facility-id` (referenced from `concepts/pwsid.md`, `datasets/epa-echo-violations.md`)
- `naics` (referenced from `datasets/epa-tri-tx.md`)
- `rsei` (referenced from `datasets/epa-tri-tx.md`)
- `sfha` (referenced from `agencies/fema.md`, `datasets/fema-nfhl.md`)
- `firm` / `dfirm` (referenced from `agencies/fema.md`, `datasets/fema-nfhl.md`)
- `nri` (referenced from `agencies/fema.md`)
- `nwis` (referenced from `agencies/usgs.md`)
- `hurdat2` (referenced from `agencies/noaa.md`)
- `lsli` (referenced from `concepts/lcr.md`)
- `compound-risk` / `indicator-stacking` (mentioned in `overview.md` § cross-cutting axes)

## Low-confidence clusters

The weather bucket (NOAA/FEMA pages 0.55–0.6) is the lowest-confidence cluster. TCEQ CID pages added this round sit at 0.65–0.7 because the contract has live-verification status notes (Search One scraping is fragile; Search Two is verified). Lift after a live-verification pass against the actual portals.

## Promotion candidates

- `concepts/burden-vs-harm.md` (0.8) — would promote toward procedural if it accumulates ≥3 procedural-pattern citations. Currently 4 inbound `references`, 1 from this round (`datasets/tceq-swq-segments.md`).
- `concepts/socrata-soql.md` — strong promotion candidate next session if more Socrata datasets are registered (every additional dataset that `depends_on` SoQL strengthens it).
