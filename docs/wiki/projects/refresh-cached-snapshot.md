---
title: Refresh a cached snapshot — atlas-tx pattern
type: project
tier: procedural
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.75
source_count: 1
decay_profile: slow
tags: [project, procedural, pattern, ingestion, cache]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: implements, target: datasets/epa-sdwis-violations.md}
  - {type: implements, target: datasets/twdb-major-aquifers.md}
  - {type: implements, target: datasets/twdb-river-basins.md}
  - {type: implements, target: datasets/twdb-huc8.md}
  - {type: implements, target: datasets/tceq-cid-search-one.md}
  - {type: implements, target: datasets/tceq-cid-search-two.md}
  - {type: depends_on, target: agencies/tceq.md}
  - {type: depends_on, target: agencies/epa.md}
  - {type: depends_on, target: agencies/twdb.md}
stale: false
---

# Refresh a cached snapshot

The repeatable pattern atlas-tx uses every time it pulls fresh data from an external source and updates the committed cache. Distilled from the SDWIS, TCEQ CID, and TWDB hydrology refreshes already in the repo.

This is a **procedural** page — it describes "how to do it the atlas-tx way". The dataset pages are descriptive ("what the data is"); this page is prescriptive ("how to refresh it").

## When this pattern applies

- An `accessType: "external"` dataset registered in [`docs/contracts/dataset-registry.md`](../../contracts/dataset-registry.md).
- A fetcher under `src/lib/datasets/<slug>.ts` that exports `fetch*`, `normalize*`, `load*` per the per-source fetcher contract.
- A snapshot living at `public/cache/<slug>-tx.json` (small enough) or `data/<slug>-tx.json` (gitignored, oversized).
- A refresh entrypoint at `scripts/refresh-<slug>.ts` exposed via `npm run refresh:<slug>`.

If any of these are missing, the new dataset hasn't been registered properly yet — fix that first.

## The pattern, step by step

### 1. Pre-flight check

```sh
git status            # working tree should be clean (or you should know why it isn't)
git pull              # be on latest main / your refresh branch
```

The refresh writes a snapshot that will land in a commit. Don't fold it into unrelated WIP.

### 2. Run the refresh

```sh
npm run refresh:<slug>
```

The script:

1. Calls `fetch<Source>()` against the live API.
2. Normalizes through `normalize<Source>()`.
3. Writes the snapshot to the canonical location (`public/cache/<slug>-tx.json` or `data/<slug>-tx.json`).
4. Validates: row count is non-zero, schema matches, keyFields are present.
5. Fails loud on schema drift (parser is pinned to fixtures in `tests/fixtures/<slug>/`).

### 3. Inspect the diff

```sh
git diff --stat public/cache/<slug>-tx.json   # if committed
# or
ls -la data/<slug>-tx.json                    # if gitignored
```

Sanity-check:
- File size in the expected ballpark.
- Row count moved as expected (not catastrophically smaller — that's typically an upstream filter / outage, not a real change).
- Spot-check a few rows of the JSON.

### 4. Run the test suite

```sh
npm run test -- <slug>
```

The fetcher tests verify normalization against fixture HTML / JSON. They should pass. **If they fail, the upstream schema drifted** — investigate before committing.

### 5. Commit

```sh
git add public/cache/<slug>-tx.json src/lib/datasets/<slug>.ts tests/fixtures/<slug>/
git commit -m "data: refresh <slug> snapshot

- Row count: <before> → <after>
- File size: <before> → <after>
- Notes: <anything notable, e.g. fail-loud cases handled, source quirks>
"
```

Per `AGENTS.md` § 4: prefix is `data:` (workstream), one concept per commit. Don't fold a fetcher change and a snapshot refresh into the same commit unless the change *is* the refresh.

### 6. Update STATE.md

Per `AGENTS.md` § 3: add a Recently-done row.

```
| data | <agent> | Refresh <slug> snapshot (rows: A→B; size: X→Y MB). | working tree |
```

## Variants by source

### Texas Open Data (Socrata)

`accessType: "dataset"` sources route through the auto-built Socrata URL in `src/lib/texas-open-data.ts`. There is **no per-source fetcher under `src/lib/datasets/`**. The "refresh" is implicit at request time; if a snapshot is desired (e.g. demo path), wrap the Socrata loader and write to `public/cache/`. Apply the same SoQL pagination concerns from [`concepts/socrata-soql.md`](../concepts/socrata-soql.md).

### Federal stable APIs (EPA SDWIS / ACS / EJScreen)

Standard pattern. Fetcher hits the program's stable endpoint. Snapshot policy follows the size threshold.

### TCEQ Central Index (ColdFusion form)

Search Two: standard pattern, broad query works.
Search One: **fail-loud is the rule.** Statewide POSTs return upstream "An unexpected error has occurred" pages. The refresh script chunks by county / program and includes a browser-automation fallback hook. As of 2026-05-08 even chunked POSTs are unreliable — treat as a manual / retry path, not unattended.

### TWDB hydrology (shared loader)

The three TWDB layers (`twdb-major-aquifers`, `twdb-river-basins`, `twdb-huc8`) **share** one snapshot file (`public/cache/twdb-hydrology-tx.json`) and one loader (`src/lib/datasets/twdb-hydrology.ts`) and one refresh entrypoint (`npm run refresh:twdb-hydrology`). Do not split. When adding a fourth TWDB layer, extend the existing trio's loader.

### Future weather / drought / flood sources

Not yet implemented. Anticipated patterns:

- **NOAA Storm Events / USDM** — bulk CSV / GeoJSON. Standard pattern with size threshold.
- **FEMA NFHL** — ArcGIS REST feature service. New pattern; first source to need ArcGIS-feature-layer fetcher under `src/lib/datasets/`.

When you're the first to add an ArcGIS-feature-layer source, document the pattern here.

## Caveats / gotchas

- **`public/cache/` is committed; `data/` is gitignored.** Pick by size, not by convenience. The 5MB rule is in the contract.
- **Don't pull national datasets and filter at runtime.** TX-only fetch at the source if the API supports it. For SoQL, use `$where` clause; for EPA REST, use the state filter parameter.
- **Cached snapshot is the demo path.** The fetcher live-hits the API only on cache miss or when `live: true` is forced. Don't ship demo paths that depend on live federal APIs (`AGENTS.md` § 5).
- **Fixture-pinned parsing.** Every fetcher must have fixture HTML / JSON in `tests/fixtures/<slug>/`. The parser is pinned and fails loud on schema drift. Don't loosen this.
- **App tokens for Socrata.** If `SOCRATA_APP_TOKEN` env is set, refresh runs use it. Without it, you share the anonymous IP rate-limit pool — refreshes can throttle.

## See also

- [Per-source fetcher contract](../../contracts/dataset-registry.md) — the canonical spec.
- [SDWIS dataset](../datasets/epa-sdwis-violations.md) — first major refresh implementation.
- [CID Search One dataset](../datasets/tceq-cid-search-one.md) — fragile-source variant of the pattern.
- [TWDB Major Aquifers](../datasets/twdb-major-aquifers.md) — shared-loader variant.
