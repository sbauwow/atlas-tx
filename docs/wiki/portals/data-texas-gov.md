---
title: data.texas.gov
type: portal
tier: semantic
created: 2026-05-08
updated: 2026-05-08
last_confirmed: 2026-05-08
confidence: 0.7
source_count: 2
decay_profile: slow
tags: [portal, texas, socrata, opendata]
sources:
  - docs/research/texas-gis-inventory.md
  - docs/contracts/dataset-registry.md
relationships:
  - {type: published_by, target: agencies/tceq.md}
stale: false
---

# data.texas.gov

Texas Open Data Portal. Socrata-backed catalog. Primary route for TX state-agency tabular datasets.

## How it works

- Each dataset has a stable **4×4 ID** (e.g. `7fq8-wig2`). That ID is the canonical handle and goes in the Atlas TX registry's `id` field for any Socrata source.
- API access via SODA. Atlas TX builds Socrata URLs through `src/lib/texas-open-data.ts`; `accessType: "dataset"` in the registry triggers the auto-built URL path.
- Query language is **SoQL** — SQL-like, with `$select`, `$where`, `$limit`, `$offset`, `$order`. Hard limits on result size; paginate explicitly for full pulls.
- App tokens are optional but raise rate limits. Atlas TX should set one in env if available.

## What lives here that we use

- TCEQ Water Quality Individual Permits (`7fq8-wig2`)
- Texas Water Districts (`hr84-s96f`)
- Various other state-agency datasets discoverable from the catalog

## What does NOT live here

- TCEQ Central Index (CID) — separate ColdFusion site, no API.
- TWDB hydrology layers — separate GIS endpoints (TWDB GIS downloads).
- EPA / Census data — separate federal endpoints.
- Most spatial layers — those live on agency GIS hubs (TCEQ GIS Data Hub, StratMap, TWDB).

## Things to know

- 4×4 IDs are durable but the underlying schema can drift. Pin to canonical `keyFields` per the registry contract; renaming a field is a breaking change.
- A redirected 4×4 ID is rare but possible — if it happens, `supersedes` the old dataset page with the new one.

## See also

- Atlas TX entry point: `src/lib/texas-open-data.ts` (URL builder).
- Inventory: [Texas GIS Inventory](../sources/texas-gis-inventory.md).
