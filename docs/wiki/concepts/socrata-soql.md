---
title: Socrata + SoQL — querying data.texas.gov
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.7
source_count: 1
decay_profile: slow
tags: [concept, api, socrata, soql, query, opendata]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: references, target: portals/data-texas-gov.md}
stale: false
---

# Socrata + SoQL — querying data.texas.gov

`data.texas.gov` is a Socrata-backed catalog. **Socrata** is the platform; **SoQL** is the SQL-like query language Socrata exposes through its **SODA** (Socrata Open Data API) endpoints.

## URL shape

For dataset 4×4 ID `xxxx-yyyy`:

```
https://data.texas.gov/resource/xxxx-yyyy.json[?$<param>=...]
```

`.json` is the standard atlas-tx access type; `.csv`, `.geojson` are also supported. JSON returns an array of objects keyed by Socrata column field names (note: these are the underscore-cased field names, not the human-readable column titles shown in the catalog UI).

## SoQL parameters

| Parameter | Purpose | Example |
|---|---|---|
| `$select` | Project columns | `$select=county_name,permit_type,issued_date` |
| `$where` | Filter rows | `$where=county_name='HARRIS' AND issued_date > '2024-01-01'` |
| `$order` | Sort | `$order=issued_date DESC` |
| `$limit` | Cap rows (default 1000) | `$limit=50000` |
| `$offset` | Pagination | `$offset=50000` |
| `$group` / aggregates | SQL-like aggregations | `$select=county_name,count(*)&$group=county_name` |
| `$q` | Free-text search | `$q=permit` |

The `$where` clause supports operators (`=`, `!=`, `<`, `>`, `IN(...)`, `LIKE`, `IS NULL`), boolean combinators (`AND`, `OR`, `NOT`), and date arithmetic. Dates are ISO-8601; date literals must be quoted.

## Pagination

Socrata defaults to a 1000-row response. For larger pulls:

- Set `$limit` up to the documented cap (typically 50,000 per request) and paginate with `$offset`.
- Always use `$order` when paginating — without an ordering, row stability across pages is not guaranteed.

## Auth + rate limits

- **No auth required** for read access to public datasets.
- **App tokens** are optional but **strongly recommended** — without one, requests share an anonymous IP-based rate-limit pool (small; can throttle quickly during refreshes).
- App token goes in the `X-App-Token` header, or as `$$app_token=...` query param.

## In atlas-tx

- `accessType: "dataset"` registry entries auto-build Socrata URLs via `src/lib/texas-open-data.ts`. The shape of the registered `id` field is the 4×4.
- Cached snapshots under `public/cache/<slug>-tx.json` (or `data/` if oversized). Refresh cadence per-dataset.
- An app token, if set in env, lifts rate limits during refresh runs.

## Caveats

- **Field names drift** between dataset views. Use the underscore-cased field name from the resource API (`?$select=*` against the `.json` endpoint), not the catalog column title.
- **`$limit` cap is per-request, not per-pull.** Large statewide pulls require many paginated requests.
- **SoQL `$where` is more permissive than strict SQL** in some places (string concat, function names) and stricter in others (no JOINs across resources). Read the SODA docs for edge cases.
- **Some datasets are kept "external"** even though they're on data.texas.gov — when atlas-tx needs preprocessing the auto-built URL pattern can't express, the source migrates to a dedicated fetcher under `src/lib/datasets/`.

## See also

- [data.texas.gov portal](../portals/data-texas-gov.md)
- [TCEQ Water Quality Permits](../datasets/7fq8-wig2-tceq-water-permits.md) — example Socrata source.
- [Texas Water Districts](../datasets/hr84-s96f-tx-water-districts.md) — another example.
