# Lint Report

Auto-generated health snapshot. Rebuilt by lint. Do not hand-edit between rebuilds.

Last rebuilt: 2026-05-09 (manual pass after water/env/weather expansion; full lint not yet run).

---

## Orphans

Pages with no inbound `relationships` (excluding `index.md` / `overview.md` / `log.md` / `graph.md` / this file):

- `agencies/twdb.md` — only inbound is `agencies/usgs.md -> references` (weak). Acceptable until TWDB datasets get pages.
- `agencies/usgs.md` — no inbound. Acceptable; agency page authored ahead of dataset/layer pages that will reference it.
- `agencies/noaa.md` — only inbound is `agencies/fema.md -> references` (weak) and the dataset-side `published_by` edges. Acceptable.
- `agencies/fema.md` — only inbound is `datasets/fema-nfhl.md -> published_by`. Acceptable.
- `agencies/census-bureau.md` — only inbound is `datasets/census-acs5-2023-county.md -> published_by`. Acceptable.
- `comparisons/sdwis-vs-echo.md` — no inbound. Comparisons commonly orphan-ish; consider adding `references` from `datasets/epa-sdwis-violations.md` / `datasets/epa-echo-violations.md` next pass.
- `concepts/dwrs-score.md` — root of derivation; intentionally has no inbound `derives_from`. Inbound `references` from `concepts/burden-vs-harm.md` is sufficient.
- `concepts/pwsid.md` — only inbound is its own outbound back-reference. Reinforce when more SDWIS-context pages exist.
- `episodes/*` — by convention episodes are leaf nodes, not orphans-of-concern.

## Dangling

Relationships pointing at nonexistent pages: **none.** Verified by markdown link scan on 2026-05-09.

(One CLAUDE.md occurrence of `[TCEQ](../agencies/tceq.md)` is wrapped in inline-code backticks as a documentation example — not a real link, ignore.)

## Stale

_(none — wiki is recent, no decay-driven moves yet)_

## Contradictions

_(none)_

## Registry drift

`datasets/` pages whose `registry_id` should match `docs/contracts/dataset-registry.md` (v0.4.0):

| Page | registry_id | In registry? |
|---|---|---|
| `datasets/epa-sdwis-violations.md` | `epa-sdwis-violations` | ✅ |
| `datasets/epa-echo-violations.md` | `epa-echo-violations` | ✅ |
| `datasets/epa-ejscreen-2024.md` | `epa-ejscreen-2024` | ✅ |
| `datasets/census-acs5-2023-county.md` | `census-acs5-2023-county` | ✅ |
| `datasets/epa-tri-tx.md` | `null` | ⏳ unregistered (intentional — not in v1 critical path) |
| `datasets/fema-nfhl.md` | `null` | ⏳ unregistered (queued candidate) |
| `datasets/noaa-storm-events.md` | `null` | ⏳ unregistered (queued candidate) |
| `datasets/usdm-drought-monitor.md` | `null` | ⏳ unregistered (queued candidate) |

Registered datasets without a wiki page yet:
- `7fq8-wig2` (TCEQ Water Quality Individual Permits)
- `hr84-s96f` (Texas Water Districts)
- `tceq-cid-search-one`, `tceq-cid-search-two`
- `twdb-major-aquifers`, `twdb-river-basins`, `twdb-huc8`
- `tceq-swq-segments`

## Missing concepts

Terms mentioned in pages that may warrant their own page (best-effort):

- `socrata-soql` (referenced from `portals/data-texas-gov.md`)
- `huc` (referenced from `agencies/twdb.md`, `agencies/usgs.md`, `datasets/usdm-drought-monitor.md` indirectly)
- `nhd` / `nhdplus` (referenced from `agencies/usgs.md`)
- `lcr` / `lead-and-copper-rule` (referenced from `concepts/mcl.md`, `concepts/sdwa-violation-types.md`)
- `pfas` / `ucmr5` (referenced from `concepts/mcl.md`)
- `frs-facility-id` (referenced from `concepts/pwsid.md`, `datasets/epa-echo-violations.md`)
- `naics` (referenced from `datasets/epa-tri-tx.md`)
- `rsei` (referenced from `datasets/epa-tri-tx.md`)
- `sfha` (referenced from `agencies/fema.md`, `datasets/fema-nfhl.md`)
- `firm` / `dfirm` (referenced from `agencies/fema.md`, `datasets/fema-nfhl.md`)
- `nri` (referenced from `agencies/fema.md`)
- `nwis` (referenced from `agencies/usgs.md`)
- `hurdat2` (referenced from `agencies/noaa.md`)
- `compound-risk` / `indicator-stacking` (mentioned implicitly in episode 2026-05-09)

## Low-confidence clusters

The weather bucket is a small low-confidence cluster (most pages 0.55–0.6) because nothing is repo-anchored beyond `docs/research/texas-gis-inventory.md`. Lift after live-verification pass against NOAA / FEMA portals, or when one of these datasets gets registered.

## Promotion candidates

- `concepts/burden-vs-harm.md` already at 0.8 — would promote to procedural if it accumulates ≥3 semantic-page references that cite it as "see also". Currently has 4 inbound `references` edges; ready for re-evaluation next session.
