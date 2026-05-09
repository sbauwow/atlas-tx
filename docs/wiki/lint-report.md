# Lint Report

Auto-generated health snapshot. Rebuilt by lint. Do not hand-edit between rebuilds.

Last rebuilt: 2026-05-09 (manual pass after concepts + first procedural; full lint not yet run).

---

## Orphans

Pages with no inbound `relationships` (excluding `index.md` / `overview.md` / `log.md` / `graph.md` / this file):

- `agencies/twdb.md` — inbound: multiple `published_by` from TWDB hydrology trio + NWIS `references`. Healthy.
- `agencies/usgs.md` — inbound: `concepts/huc.md`, `concepts/nhd.md`, `comparisons/twdb-huc8-vs-usgs-wbd.md`, `datasets/twdb-huc8.md`, `datasets/usgs-nwis.md`. Healthy.
- `agencies/noaa.md` — inbound: `agencies/fema.md` + `datasets/{noaa-storm-events, usdm-drought-monitor} -> published_by`. Healthy.
- `agencies/fema.md` — inbound: `datasets/fema-nfhl.md`, `concepts/{sfha, firm, nri}.md`. Healthy.
- `agencies/census-bureau.md` — inbound: only `datasets/census-acs5-2023-county.md -> published_by`. Acceptable.
- `comparisons/sdwis-vs-echo.md` — still no inbound. Carry-over orphan; add `references` from the two comparison datasets next pass.
- `comparisons/twdb-huc8-vs-usgs-wbd.md` — no inbound. Comparison pages tend to orphan; acceptable.
- `comparisons/twdb-river-basins-vs-huc.md` — no inbound. Acceptable.
- `concepts/dwrs-score.md` — root of derivation; intentionally no inbound `derives_from`. Inbound `references` from `concepts/burden-vs-harm.md`. Healthy.
- `concepts/apd-score.md` — root of own derivation. No formal inbound. Add `references` from CID datasets next pass.
- `concepts/pwsid.md` — inbound: `concepts/{frs-id, lsli}.md -> references`. Healthy.
- `concepts/lcr.md` — inbound: `concepts/lsli.md -> references`. Healthy.
- `concepts/burden-vs-harm.md` — strong inbound (5 references). High-traffic.
- `concepts/socrata-soql.md` — inbound: 2 `depends_on` (Socrata datasets). Healthy.
- `concepts/huc.md` — inbound: 2 comparisons + `concepts/nhd.md`. Healthy.

## Dangling

Relationships pointing at nonexistent pages: **none.** Verified by markdown link scan (with inline-code stripping) on 2026-05-09.

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
| `datasets/tceq-cid-search-one.md` | `tceq-cid-search-one` | ✅ |
| `datasets/tceq-cid-search-two.md` | `tceq-cid-search-two` | ✅ |
| `datasets/tceq-swq-segments.md` | `tceq-swq-segments` | ✅ |
| `datasets/twdb-major-aquifers.md` | `twdb-major-aquifers` | ✅ |
| `datasets/twdb-river-basins.md` | `twdb-river-basins` | ✅ |
| `datasets/twdb-huc8.md` | `twdb-huc8` | ✅ |
| `datasets/epa-sdwis-violations.md` | `epa-sdwis-violations` | ✅ |
| `datasets/epa-echo-violations.md` | `epa-echo-violations` | ✅ |
| `datasets/epa-ejscreen-2024.md` | `epa-ejscreen-2024` | ✅ |
| `datasets/census-acs5-2023-county.md` | `census-acs5-2023-county` | ✅ |
| `datasets/epa-tri-tx.md` | `null` | ⏳ unregistered |
| `datasets/fema-nfhl.md` | `null` | ⏳ unregistered (queued) |
| `datasets/noaa-storm-events.md` | `null` | ⏳ unregistered (queued) |
| `datasets/usdm-drought-monitor.md` | `null` | ⏳ unregistered (queued) |
| `datasets/usgs-nwis.md` | `null` | ⏳ unregistered (queued — first measurement-grade source) |

**Registered datasets without a wiki page yet: 0.**

## Missing concepts

Terms mentioned in pages that may warrant their own page (best-effort):

- ~~`socrata-soql`~~ — added (round 3).
- ~~`huc`~~ — added (round 3).
- ~~`lcr`~~ — added (round 3).
- ~~`apd-score`~~ — added (round 3).
- ~~`nhd` / `nhdplus`~~ — added.
- ~~`pfas` / `ucmr5`~~ — added.
- ~~`frs-facility-id`~~ — added.
- ~~`sfha`~~ — added.
- ~~`firm` / `dfirm`~~ — added.
- ~~`nri`~~ — added.
- ~~`lsli`~~ — added.
- `naics` — referenced from `datasets/epa-tri-tx.md`. Generic. Skip unless TRI lands.
- `rsei` — referenced from `datasets/epa-tri-tx.md`. Specialized; only matters if TRI lands.
- `nwis` — has its own dataset page now (`datasets/usgs-nwis.md`); concept page not separately needed.
- `hurdat2` — referenced from `agencies/noaa.md`. Tropical cyclone tracks; could be a future dataset page if TX hurricane analysis lands.
- `compound-risk` / `indicator-stacking` — mentioned in `overview.md`. Concept page becomes worthwhile once atlas-tx code actually composes multiple indicators.

## Low-confidence clusters

The weather bucket (NOAA/FEMA pages 0.55–0.6) remains the lowest-confidence cluster. Lifted slightly with the SFHA / FIRM / NRI concept additions because those reinforce the FEMA agency page. Lift further after live-verification pass against actual FEMA / NOAA portals.

## Promotion candidates

- `concepts/burden-vs-harm.md` (0.8) is now linked-to by 5 pages including `concepts/{nri, sfha, apd-score, ej-index}` and a dataset (`tceq-swq-segments`). Promotion-to-procedural threshold (≥3 procedural-pattern citations) is not yet met — burden-vs-harm is a stance, not a workflow. Stays semantic.
- `projects/refresh-cached-snapshot.md` (0.75) — first procedural page. Healthy at promotion-bar (≥3 implementing dataset pages).
- `concepts/socrata-soql.md` will promote toward procedural the next round it adds ≥1 implementing dataset page.
