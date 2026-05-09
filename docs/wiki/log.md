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
