# Lint Report

Auto-generated health snapshot. Rebuilt by lint. Do not hand-edit between rebuilds.

Last rebuilt: 2026-05-08 (manual seed pass; full lint not yet run).

---

## Orphans

Pages with no inbound `relationships` (excluding `index.md` / `overview.md` / `log.md` / `graph.md` / this file):

- `agencies/twdb.md` — referenced from `sources/texas-gis-inventory.md` only via `references`, which is intentionally weak. Acceptable at seed time; reinforce when TWDB datasets are added.
- `concepts/dwrs-score.md` — has no inbound; the score is the *root* of derivation. Acceptable.

## Dangling

Relationships pointing at nonexistent pages:

- `graph.md` references `agencies/census-bureau.md` (created in this seed pass — verify file exists at next lint).

_(otherwise none)_

## Stale

_(none — wiki initialized today)_

## Contradictions

_(none)_

## Registry drift

`datasets/` pages whose `registry_id` should match `docs/contracts/dataset-registry.md`:

| Page | registry_id | In registry? |
|---|---|---|
| `datasets/epa-sdwis-violations.md` | `epa-sdwis-violations` | ✅ (registry v0.4.0) |
| `datasets/epa-ejscreen-2024.md` | `epa-ejscreen-2024` | ✅ |
| `datasets/census-acs5-2023-county.md` | `census-acs5-2023-county` | ✅ |

Registered datasets without a wiki page yet:
- `7fq8-wig2` (TCEQ Water Quality Individual Permits)
- `hr84-s96f` (Texas Water Districts)
- `epa-echo-violations`
- `tceq-cid-search-one`, `tceq-cid-search-two`
- `twdb-major-aquifers`, `twdb-river-basins`, `twdb-huc8`
- `tceq-swq-segments`

These are queued for follow-on.

## Missing concepts

Terms mentioned in seed pages that may warrant their own page (best-effort):

- `socrata-soql` (referenced from `portals/data-texas-gov.md`)
- `huc` (referenced from `agencies/twdb.md`)
- `mcl` (referenced from `datasets/epa-sdwis-violations.md`)
- `ej-index` (referenced from `datasets/epa-ejscreen-2024.md`)
- `sdwa-violation-types` (referenced from `datasets/epa-sdwis-violations.md`)

## Low-confidence clusters

_(none — all seed pages start at 0.5–0.7)_

## Promotion candidates

_(none yet)_
