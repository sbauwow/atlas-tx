---
name: atlas-tx-public-data-lanes
description: Build Atlas TX county/data feature lanes using structured public endpoints, county-normalized summaries, and honest map layers before heavier geospatial analytics.
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [atlas-tx, texas, public-data, socrata, arcgis, county-explorer, water]
    related_skills: [writing-plans, test-driven-development, polite-web-scraping]
---

# Atlas TX Public Data Lanes

Use when adding a new Atlas TX dataset lane (water, flood, social, fiscal, etc.) that must join cleanly to Texas counties and show up in APIs/UI fast.

## Core approach

1. Prefer machine-readable public endpoints over HTML scraping.
   - First choices: Socrata JSON, ArcGIS REST, USGS/NWS APIs.
   - Treat TWDB/TCEQ hub pages and similar portals as discovery sources first, not primary ingestion targets.

2. Build county summaries before heavy map analytics.
   - Get statewide county rollups working first.
   - Expose county detail + statewide overview APIs.
   - Render honest map layers first (county centroid dot map or point layers), not fake polygons.

3. Normalize county joins aggressively.
   - Reuse `normalizeCountyName()` and `countySlug()`.
   - Support slug inputs like `travis-county` by normalizing hyphens to spaces before title-casing.
   - Do not silently drop unmatched records; keep an unknown/unjoined bucket or note.

4. For Socrata sources, use grouped statewide queries first.
   - Extend query helpers to support `$select`, `$group`, `$order`, `$limit`, `$where`, `$having`.
   - Build county overviews from grouped statewide results, then use county-specific source collectors for detail pages.

5. For spatially heavy sources like FEMA NFHL:
   - Phase 1: metadata + query builder only.
   - Phase 2: county join strategy (county field, point-in-county, or polygon overlay).
   - Do not start with full statewide polygon analytics.

## Proven Atlas TX pattern

### Existing file patterns
- `src/lib/texas-open-data.ts` — grouped Socrata query builder + fetch helpers
- `src/lib/county-data-service.ts` — county detail collector pattern
- `src/lib/atlas-county-explorer.ts` — statewide overview + county breakdown orchestration
- `src/lib/texas-county-centroids.ts` — honest first-pass county map coordinates

### API pattern
Ship two endpoints first:
- `/api/<lane>/overview`
- `/api/<lane>/counties/[slug]`

Overview returns statewide county summaries for map/ranking.
County route returns selected county detail plus source slices/layers.

### UI pattern
- Overview map first
- Ranking table second
- Selected county breakdown cards third

## Implementation order for a new lane

1. Define normalized types in `src/lib/<lane>/types.ts`
2. Add source registry in `src/lib/<lane>/<lane>-source-registry.ts`
3. Add 2-5 adapters for the strongest verified sources
4. Build summary service that merges sources into county summaries
5. Add `/overview` and `/counties/[slug]` routes
6. Add tests before implementation for grouped queries, service merge logic, and routes
7. Add UI after APIs are green

## Water/flood-specific findings

Verified sources that are suitable starting points:
- FEMA NFHL ArcGIS REST: `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer?f=pjson`
- USGS Texas stream sites: `https://waterservices.usgs.gov/nwis/site/?format=rdb&stateCd=tx&siteType=ST&siteStatus=active`
- NWS active alerts TX: `https://api.weather.gov/alerts/active?area=TX`
- TCEQ sanitary sewer overflows: `https://data.texas.gov/resource/8kc5-95uk.json?$limit=1`
- TCEQ general water permits: `https://data.texas.gov/resource/6pm5-am5m.json?$limit=1`
- Texas water districts: `https://data.texas.gov/resource/hr84-s96f.json?$limit=1`
- TCEQ Water Quality Individual Permits Active/Pending: `https://data.texas.gov/resource/7fq8-wig2.json?$limit=1`

### Texas city open-data discovery lesson

When the user wants municipal open-data discovery for Texas cities, do not assume one portal type.

Current verified split:
- Austin — Socrata (`https://data.austintexas.gov/api/search/views.json?limit=1` works)
- Dallas — Socrata (`https://www.dallasopendata.com/api/search/views.json?q=` works)
- Houston — CKAN (`https://data.houstontx.gov/api/3/action/package_search?rows=1` works)
- San Antonio — CKAN (`https://data.sanantonio.gov/api/3/action/package_search?rows=1` works)

Practical approach:
1. Probe the homepage first to identify the portal family (`Powered by Socrata`, `ckan`, etc.).
2. For Socrata portals, ingest catalog metadata from `/api/search/views.json` and normalize fields from `results[].view`.
3. For CKAN portals, ingest catalog metadata from `/api/3/action/package_search` and normalize from `result.results[]`.
4. Commit one statewide Texas-city snapshot if the file stays under ~5 MB compressed/minified enough for the repo budget.
5. Treat this as catalog metadata only, not row-level dataset ingestion.

Important caveats:
- Socrata catalog counts can include non-tabular assets (views, measures, files, filters), so downstream consumers may need to filter by `assetType`.
- CKAN timestamps may be timezone-qualified and normalize to UTC; expect apparent hour shifts in tests if you compare raw strings.
- Hosted meta-layers like tryopendata.ai may expose docs/UI but still block unauthenticated API probing; fall back to the city portals directly when that happens.

### City open-data curation lesson

After pulling the full portal catalogs, create a second curated snapshot for Atlas TX triage instead of jumping straight into row-level ingestion.

Recommended pattern:
1. Keep the raw all-catalog snapshot committed as `public/cache/city-open-data-tx.json`.
2. Build a second committed snapshot like `public/cache/city-open-data-curated-tx.json`.
3. Curate by keyword/theme matching across at least:
   - `name`
   - `description`
   - `category`
   - `organization`
4. Tag each curated row with:
   - `matchedThemes` (for example `water`, `permits`, `infrastructure`)
   - `matchReasons` as `field:keyword` strings for auditability
5. Add a separate refresh script (`refresh:city-open-data-curated`) so the curation step is reproducible and can evolve independently from raw catalog ingest.

Use this as a triage layer, not a truth layer:
- it is meant to shrink thousands of portal entries into a shortlist for follow-on ingestion;
- expect noisy matches, especially from generic words like `utilities`, `repair`, or `permit`;
- tests should assert theme presence and representative reasons, not brittle exact full reason arrays unless the classifier is intentionally fixed.

### Permit-lane lesson

For a stable Texas-wide pending-permits page, prefer the Socrata permit inventory first:
- dataset: `7fq8-wig2`
- useful fields: `permit_number`, `authorization_type`, `authorization_status`, `permittee_name`, `facility_county`, `nearest_city`, `latitude`, `longitude`
- statewide status counts can be pulled with grouped Socrata queries (`$select=authorization_status, count(*) as c` + `$group=authorization_status`)
- the pending-only roster can be pulled with `$where=authorization_status='PENDING'`

Do **not** start the first pending-permits UI from CID Search One if the goal is a reliable statewide tracker. CID is better treated as a secondary procedural lane because Search One is operationally fragile here. Use CID later for docket/protest overlays and caveat it clearly.

### City open-data ranking lesson

After the curated snapshot exists, add a third ranked snapshot instead of hand-picking rows ad hoc.

### Permit county-map backing lesson

When the user asks to "back" a county visualization before true polygon geometry exists, use the existing Texas county centroids to ship an honest interim map fast.

Recommended pattern for `/permits`-style pages:
1. Keep the page data loader simple (`getTceqPendingPermitsPageData`) and derive map rows separately.
2. Add a deterministic county aggregator in the data module that combines:
   - pending permit counts by county
   - CID open-case counts by county
   - hearing/public-meeting counts by county
3. Normalize county names with `normalizeCountyName()` and emit `slug` via `countySlug()` so the map joins directly against `TEXAS_COUNTY_CENTROIDS`.
4. In the page layer, project centroid lat/lon into a fixed SVG viewport with the same lightweight projection used on `/water`:
   - hard-coded Texas lat/lon bounds
   - `projectPoint()` + `clamp()` helpers
5. Render county-centroid tiles, not pretend polygons:
   - color band by permit count
   - hatch overlay when CID procedural pressure exists
   - include a title/tooltip string per county tile
6. Test both layers:
   - data test for county aggregation shape/order
   - page render test for presence of the map section and county tile markers (for example `data-county-map-tile="travis-county"`)

Important caveats:
- call it a projected county-centroid or county-tile map, not a full choropleth;
- use real county geometry later when available, but do not block shipping on that dependency;
- if build/test suddenly fail after rebasing because other work landed new dependencies, run `npm install` before treating it as a code bug.

Recommended pattern:
1. Keep three layers:
   - raw catalog: `public/cache/city-open-data-tx.json`
   - curated theme filter: `public/cache/city-open-data-curated-tx.json`
   - ranked ingest shortlist: `public/cache/city-open-data-ranked-tx.json`
2. Score curated rows into explicit Atlas lanes:
   - `water-utility-ops`
   - `flood-drainage`
   - `building-development-permits`
   - `sewer-wastewater`
   - `infrastructure-projects`
   - `deprioritized`
3. Use heuristic scoring from multiple signals, not theme labels alone:
   - positive signals: `water main`, `stormwater`, `drainage`, `outfall`, `permit`, `inspection`, `public works`, `capital project`
   - operational asset bonus for `assetType=dataset`
   - downrankers for noisy catalog artifacts like `measure`, `rating`, and `green building`
4. Persist per-row auditability:
   - `priorityLane`
   - `priorityScore`
   - `priorityReasons`
5. Emit a shortlist in the ranked snapshot (for example `priorityTop25`) so downstream Atlas planning can consume the queue directly.

Important findings:
- broad curated keywords massively over-match utility-adjacent Austin Energy content; ranking is the cleanup layer.
- theme-filtered rows should still be retained in the ranked snapshot even when deprioritized, so analysts can inspect what got pushed down.
- tests for ranking should assert lane assignment, relative ordering, and shortlist membership — not brittle exact top-1 expectations when several rows can land on similar scores.

Discovery-only initially:
- TWDB flood planning page
- TWDB GIS data page
- TCEQ GIS hub
- National Levee Database

## Scrape-planner lane (schema/hierarchy first)

When adding agentic scraping workflows, lock structure before execution concurrency.

Recommended reusable pattern (implemented in Atlas TX as `buildAtlasParallelScrapePlan`):
1. Build a source hierarchy first (`critical` / `supporting` / `context`) from dataset category + reliability.
2. Define one canonical row schema before any scrape run budgeting.
3. Only then compute per-source parallelism and request budgets from:
   - aggressiveness mode (`conservative` / `balanced` / `aggressive`)
   - source reliability score (0..1)
   - collection type penalty (`html-scrape` lower than structured APIs)
   - tier weight (critical > supporting > context)
4. Emit both global and per-source execution caps:
   - `maxGlobalParallelRequests`
   - `targetRequestsPerMinute`
   - `maxParallelRequests`

Why this matters:
- avoids over-optimizing concurrency before data contracts exist;
- makes scrape behavior tunable without changing ingest schema;
- de-risks fragile sources (especially browser/HTML lanes) by design.

Test expectations:
- verify hierarchy ordering and canonical schema presence independently of aggressiveness;
- verify aggressive mode increases total capacity versus conservative;
- verify lower-reliability HTML sources remain throttled relative to reliable API sources.

## TDD notes

For each new source:
1. Write a failing parser/normalizer test first.
2. Verify RED with the specific test file.
3. Implement the narrowest adapter possible.
4. Verify GREEN.
5. Run full suite.

Good first tests:
- grouped statewide query URL generation
- source parser normalization
- county summary merge logic
- route JSON shape

## Pitfalls hit and fixes

- Socrata grouped query URLs: URL encoding/order mattered in tests. Build query strings deterministically instead of relying on `URLSearchParams` ordering/encoding defaults.
- County slugs as inputs: `normalizeCountyName("travis-county")` originally failed; normalize hyphens to spaces before suffix handling.
- Local Next dev verification: API routes may work while homepage fails due to county slug normalization issues. Check both `/api/...` and `/` when validating.
- Browser automation against local Next dev can show HMR cross-origin warnings from `127.0.0.1`; prefer direct HTTP checks plus server logs for debugging local app issues.

## Rule of thumb

If a source can power a county summary without geometry-heavy joins, ship it now.
If it needs polygon math or brittle scraping, register it, document it, and defer it to phase 2.
