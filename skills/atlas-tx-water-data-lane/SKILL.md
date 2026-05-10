---
name: atlas-tx-water-data-lane
description: Build Atlas TX water/flood intelligence slices using verified public endpoints, county joins, and TDD-first adapters.
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [atlas-tx, water, flood, texas, nextjs, socrata, usgs, nws, tdd]
    related_skills: [writing-plans, test-driven-development]
---

# Atlas TX Water Data Lane

Use when extending `/home/stathis/Projects/atlas-tx` with water/flood features.

## What worked
- Start with structured endpoints, not HTML scraping.
- Prefer this order:
  1. NWS alerts
  2. USGS gauges
  3. TCEQ sewer overflows
  4. TCEQ general permits
  5. governance/utility layers
  6. FEMA polygon-heavy work later
- Use strict TDD. Write failing tests for registry, adapter normalization, summary service, and API routes before implementation.

## Verified sources
- FEMA NFHL ArcGIS REST: `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer?f=pjson`
- USGS Texas stream sites: `https://waterservices.usgs.gov/nwis/site/?format=rdb&stateCd=tx&siteType=ST&siteStatus=active`
- NWS alerts for Texas: `https://api.weather.gov/alerts/active?area=TX`
- TCEQ sewer overflows: `https://data.texas.gov/resource/8kc5-95uk.json?$limit=1`
- TCEQ general water permits: `https://data.texas.gov/resource/6pm5-am5m.json?$limit=1`
- Texas water districts: `https://data.texas.gov/resource/hr84-s96f.json?$limit=1`
- PUCT investor-owned utilities: `https://data.texas.gov/resource/auk8-env9.json?$limit=1`
- PUCT submeter utilities: `https://data.texas.gov/resource/iuez-sv34.json?$limit=1`

Important: `auk8-env9` and `iuez-sv34` are live Socrata resources but are not in the current MVP dataset registry, so `fetchDatasetRows()` from `src/lib/texas-open-data.ts` will reject them. For governance work, fetch them directly from `/resource/<id>.json` instead of routing through the MVP registry helper.

## File pattern
Create under `src/lib/water/`:
- `types.ts`
- `water-source-registry.ts`
- `county-lookup.ts`
- `nws.ts`
- `usgs.ts`
- `tceq-sewer-overflows.ts`
- `tceq-general-permits.ts`
- `water-governance.ts`
- `water-summary-service.ts`

API routes:
- `src/app/api/water/overview/route.ts`
- `src/app/api/water/counties/[slug]/route.ts`
- `src/app/api/water/alerts/route.ts`
- `src/app/api/water/gauges/route.ts`

UI:
- `src/app/water/page.tsx`

Tests:
- `tests/water-source-registry.test.ts`
- `tests/nws-water-alerts.test.ts`
- `tests/usgs-water.test.ts`
- `tests/tceq-sewer-overflows.test.ts`
- `tests/tceq-general-permits.test.ts`
- `tests/water-governance.test.ts`
- `tests/water-governance-summary.test.ts`
- `tests/water-summary-service.test.ts`
- `tests/water-api-routes.test.ts`
- `tests/water-alerts-route.test.ts`
- `tests/water-gauges-route.test.ts`
- `tests/water-page.test.ts`
- `tests/water-page-governance.test.ts`

## County join approach
- Reuse `normalizeCountyName()` and `countySlug()`.
- Add a `county-lookup.ts` helper backed by `src/lib/texas-county-centroids.ts` so county FIPS can resolve to county names/slugs.
- Important bug found: slugs like `travis-county` must normalize back to `Travis County`. Fix by replacing hyphens with spaces inside `normalizeBaseCountyName()` in `src/lib/counties.ts`.

## Adapter specifics
### NWS
- Normalize `areaDesc` by splitting on commas/semicolons.
- Convert county tokens into `Travis County` form.
- Filter to water-relevant events only (Flood Warning, Flash Flood Warning, Flood Advisory, Hydrologic Outlook, Coastal Flood Warning, Flood Watch, Flash Flood Statement).

### USGS
- NWIS site service is tab-delimited RDB, not JSON.
- Skip `#` comment lines.
- First non-comment row = headers, second = schema hints, remaining = data.
- Texas county FIPS from NWIS are 3-digit county codes; prefix with `48`.
- Resolve county name from FIPS using `county-lookup.ts`.

### TCEQ sewer overflows
- Normalize `incident_location_county` through county helpers.
- Convert `amount_unit` to gallons.
- Explicitly handle `MGD` as `value * 1_000_000`.
- Summaries should return both count and gallons by county slug.

### TCEQ general permits
- Add `tceq-general-permits.ts` once the first water slice is green.
- Normalize `county_name` through county helpers.
- Preserve `permit_no`, `permit_status`, `permit_type`, `site_name`, and lat/lon.
- County summaries should at least expose `generalPermitCount` before doing deeper permit-status analytics.

### Governance layers
- Add `water-governance.ts` after permits are stable.
- Normalize TCEQ water districts from `hr84-s96f` into `WaterGovernanceEntity` with:
  - `district_number` -> `entityId`
  - `distict_name` -> `entityName`
  - `district_type` -> `entityType`
  - `activity_status` -> `activityStatus`
- Normalize PUCT utilities from direct Socrata `/resource/*.json` calls, not the MVP registry helper.
- For `puct-water-iou`, set `entityType` to `Investor-Owned Utility`.
- For `puct-water-submeter`, preserve `utility_type` when present and fall back to `Submeter Utility`.
- Use `primary_county` for the first county join; do not explode `all_counties` yet.
- Summary counts should split:
  - `waterDistrictCount` for `tceq-water-districts`
  - `waterUtilityCount` for all PUCT utility records

## Summary service
- Aggregate alerts, gauges, sewer overflows, then general permits, then governance entities into `CountyWaterSummary`.
- Build overview first, then county breakdown from the same raw collections.
- Initial overlays should expose booleans for gauge/alert/sewer layers; leave floodplain false until FEMA work lands.
- Add `generalPermitCount` before attempting a richer permit score.
- Governance should add `waterDistrictCount` and `waterUtilityCount`.
- County breakdown layers should include `permits` and `governance` alongside alerts/gauges/sewer overflows.
- For utility governance, count `tceq-water-districts` separately from PUCT utility sources.
- After FEMA county join lands, wire `metrics.floodplainFeatureCount` from joined NFHL political-jurisdiction counts and set `overlays.hasFloodplainLayer` from that real count.
- If a county only appears through FEMA coverage, use the joined county coverage record as a fallback source of truth so `getCountyWaterBreakdown()` still resolves the county and returns a note like `NFHL political jurisdictions mapped: N`.
- Do not force a composite water score in the first slice.

## EPA + Tap Score expansion
- Add EPA before Tap Score if you need a new serious data lane.
- Best next EPA source is the ECHO SDWA national download, not ad-hoc page scraping:
  - index: `https://echo.epa.gov/tools/data-downloads`
  - ZIP: `https://echo.epa.gov/files/echodownloads/SDWA_latest_downloads.zip`
  - summary/dictionary: `https://echo.epa.gov/tools/data-downloads/sdwa-download-summary`
- Verified SDWA package tables useful for Atlas Texas:
  - `SDWA_PUB_WATER_SYSTEMS.csv`
  - `SDWA_FACILITIES.csv`
  - `SDWA_GEOGRAPHIC_AREAS.csv`
  - `SDWA_EVENTS_MILESTONES.csv`
  - `SDWA_VIOLATIONS_ENFORCEMENT.csv`
- Use SDWA for Texas public-water-system coverage, violations, enforcement, population served, and county joins. This should become the primary drinking-water compliance lane.
- Add EPA WQI as the second EPA lane:
  - archive: `https://echo.epa.gov/files/echodownloads/Data-Analytics/WQI/`
  - homepage: `https://echo.epa.gov/maps/water-quality-indicators`
- Verified WQI archive exposes reusable station/sample bundles such as:
  - `wqi_stations_summary_<timestamp>.zip`
  - `wqi_monthly_sample_data_<timestamp>.zip`
- Use WQI for Texas ambient monitoring context via point-in-county joins; do not confuse it with utility compliance.
- EPA PFAS is useful but phase it after SDWA/WQI:
  - `https://echo.epa.gov/tools/data-downloads/national-pfas-datasets`
- Tap Score is useful as enrichment only, not as a backbone source of truth.
- Verified public Tap Score assets:
  - research page: `https://mytapscore.com/pages/us-water-data`
  - algorithm page: `https://mytapscore.com/pages/tap-score-algorithm`
  - Texas city pages exist for at least Houston, Dallas, Austin, San Antonio, Fort Worth, El Paso, McAllen, Arlington, Corpus Christi, Plano, Lubbock, and Amarillo.
- Important interpretation: Tap Score is sample-based and proprietary. It should not drive county truth or regulatory scoring.
- Good Tap Score use in Atlas Texas:
  - city-level enrichment only
  - nearby utility/test counts and visible city-page contaminant snippets
  - methodology inspiration for future consumer-facing health/aesthetic/pipe framing
- Bad Tap Score use:
  - primary county score backbone
  - compliance truth
  - wide scraping assumptions without explicit API/data-sharing permission
- If researching these sources live, skip Google search in browser mode here; it commonly trips anti-bot blocks. Use direct known URLs, sitemaps, and provider index pages instead.

## LCRA lane
- LCRA is worth adding as a basin-specific operational layer for Atlas Texas, not as a statewide backbone.
- Prioritize LCRA in this order:
  1. Hydromet stage/flow
  2. Hydromet lake levels
  3. ARRP wastewater outfalls
  4. ARRP land application permits
  5. LCRA water-quality site inventory
  6. CRWN volunteer network later
- Verified first implementation slice that shipped cleanly:
  - adapter file: `src/lib/water/lcra-hydromet.ts`
  - route files:
    - `src/app/api/water/lcra/hydromet/stage-flow/route.ts`
    - `src/app/api/water/lcra/hydromet/lake-levels/route.ts`
  - tests:
    - `tests/lcra-hydromet.test.ts`
    - `tests/lcra-hydromet-routes.test.ts`
- Normalization shape that worked well:
  - stage/flow -> `LcraStageFlowReading`
    - `sourceId: 'lcra-hydromet-stageflow'`
    - `siteNumber` as string
    - `stationName` from `location`
    - `observedAt` from `dateTime`
    - `stageFeet`, `flowCfs`, `bankfullFeet`, `floodStageFeet`
  - lake levels -> `LcraLakeLevelReading`
    - `sourceId: 'lcra-hydromet-lakelevels'`
    - `siteNumber` as string
    - `stationName` from `location`
    - `observedAt` from `dateTime`
    - `elevationFeet`
- Route behavior that worked:
  - both routes accept optional `?siteNumber=<id>` and filter server-side
  - response shape should be:
    - `{ readings, freshness }`
  - use `buildWaterFreshness(['lcra-hydromet-stageflow'])` or `buildWaterFreshness(['lcra-hydromet-lakelevels'])`
- Cache/freshness implementation detail worth keeping:
  - map source IDs in `src/lib/water/freshness.ts`
  - cache keys used:
    - `lcra-hydromet-stageflow`
    - `lcra-hydromet-lakelevels`
    - `lcra-arrp-outfalls`
    - `lcra-arrp-land-permits`
  - a 5-minute TTL worked for the first live Hydromet slice and matches operational expectations better than daily-style cadences
  - a 12-hour TTL worked for the first ARRP slice because those permit/outfall inventories are not ultra-realtime
- Registry gotcha:
  - after adding new LCRA source IDs to `src/lib/water/water-source-registry.ts`, update `tests/water-source-registry.test.ts` immediately or the full suite will fail on expected source count/order and source count
- Verified live LCRA endpoints:
  - Hydromet stage/flow: `https://hydromet.lcra.org/api/GetStageFlowForAllSites/`
  - Hydromet lake levels: `https://hydromet.lcra.org/api/GetLakeLevelsForAllSites`
  - Water-quality sites: `https://waterquality.lcra.org/api/Sites/GetSites`
  - ARRP outfalls: `https://waterquality.lcra.org/arrp/api/Outfall`
  - ARRP land permits: `https://waterquality.lcra.org/arrp/api/LandPermit`
- ARRP slice that shipped cleanly:
  - adapter file: `src/lib/water/lcra-arrp.ts`
  - route files:
    - `src/app/api/water/lcra/arrp/outfalls/route.ts`
    - `src/app/api/water/lcra/arrp/land-permits/route.ts`
  - tests:
    - `tests/lcra-arrp.test.ts`
    - `tests/lcra-arrp-routes.test.ts`
- Important ARRP normalization detail:
  - both ARRP endpoints return an ASP.NET-style task envelope, not a bare array
  - shape observed live: `{ result: [...], id, exception, status, isCompleted, ... }`
  - extract `payload.result` first, then normalize records
- Normalization shape that worked for ARRP:
  - outfalls -> `LcraArrpOutfall`
    - `sourceId: 'lcra-arrp-outfalls'`
    - `recordId` from `objectid`
    - `permitNumber` from `permitNum`
    - `permitteeName` from `permittee`
    - `countyName` normalized via `normalizeCountyName()`
    - `status`, `segmentId`, `basinId`, `outfallNumber`, `latitude`, `longitude`
  - land permits -> `LcraArrpLandPermit`
    - `sourceId: 'lcra-arrp-land-permits'`
    - `recordId` from `recordId`
    - `permitNumber` from `permitNum`
    - `permitteeName` from `permittee`
    - `countyName` normalized via `normalizeCountyName()`
    - `status`, `segmentId`, `basinId`, `permitType` from `permittype`, `reviewType` from `revtype`, `latitude`, `longitude`
- Route behavior that worked for ARRP:
  - `/api/water/lcra/arrp/outfalls?county=<slug>` returns `{ outfalls, freshness }`
  - `/api/water/lcra/arrp/land-permits?county=<slug>` returns `{ permits, freshness }`
  - county filtering is server-side via slug comparison using `countySlug()`
- Verified live shape of the LCRA data during research:
  - Hydromet stage/flow returned 68 rows
  - Hydromet lake levels returned 24 rows
  - Water-quality sites returned 654 rows, including 343 active rows, 194 `Agency='LCRA'` rows, and 169 `ImpairedSegment=true` rows
  - ARRP outfalls returned 156 rows, with 147 `Current` and 9 `Pending`
  - ARRP land permits returned 204 rows, with 195 `Current` and 9 `Pending`
- Hydromet useful fields:
  - `siteNumber`, `location`, `dateTime`, `stage`, `flow`, `bankfull`, `floodStage`, `elevation`
- Water-quality site useful fields:
  - `SiteId`, `SiteName`, `SegmentId`, `SegmentName`, `RootSegmentId`, `Latitude`, `Longitude`, `LastDate`, `Agency`, `IsActive`, `ImpairedSegment`
- ARRP useful fields:
  - `permitNum`, `permittee`, `status`, `county`, `latDd`, `longDd`, `segment`, `basin`
  - outfalls also expose `outfall`
- Product fit:
  - use LCRA for Colorado-basin county intelligence, especially Travis/Burnet/Llano/Bastrop/Fayette/Colorado/Wharton/Matagorda and upper-basin segment-14 counties
  - do not present LCRA as a uniform statewide source
- Modeling recommendation:
  - source IDs: `lcra-hydromet-stageflow`, `lcra-hydromet-lakelevels`, `lcra-water-quality-sites`, `lcra-arrp-outfalls`, `lcra-arrp-land-permits`, `lcra-crwn`
  - entity types: `hydromet_gauge`, `lake_level_station`, `basin_water_quality_site`, `wastewater_outfall`, `land_application_permit`
  - county metrics: `hydrometGaugeCount`, `activeFloodGaugeCount`, `reservoirStationCount`, `waterQualitySiteCount`, `activeWaterQualitySiteCount`, `impairedSegmentSiteCount`, `wastewaterOutfallCount`, `landApplicationPermitCount`
- Important caveat: LCRA’s water-quality site portal explicitly points users to TCEQ for assessment/publication/regulatory use. Treat LCRA water-quality records as monitoring/discovery/context unless you later anchor them to TCEQ final datasets.
- Discovery trick that worked: browser network/resource inspection exposed the hidden JSON endpoints faster than page scraping. For LCRA-style portals, inspect `performance.getEntriesByType('resource')` or page JS first, then hit discovered `/api/...` URLs directly.
- Verified deeper LCRA quality endpoints behind `waterquality.lcra.org`:
  - site metadata: `https://waterquality.lcra.org/api/Sites/GetSite/<siteId>`
  - site parameter catalog: `https://waterquality.lcra.org/api/Sites/GetSiteParameters/<siteId>`
  - site observations: `https://waterquality.lcra.org/api/Sites/GetSiteData/<siteId>`
  - site observations with profile rows: `https://waterquality.lcra.org/api/Sites/GetSiteData/<siteId>?IncludeProfile=true`
  - segment metadata: `https://waterquality.lcra.org/api/Segments/GetSegment/<segmentId>`
  - segment parameter catalog: `https://waterquality.lcra.org/api/Segments/GetSegmentParameters/<segmentId>`
  - segment observations: `https://waterquality.lcra.org/api/Segments/GetSegmentData/<segmentId>`
- Verified live shapes from those endpoints:
  - `GetSite` returns `SiteId`, `SiteName`, `SegmentId`, `SegmentName`, `RootSegmentId`, `RootSegmentName`, `Latitude`, `Longitude`, `LastDate`, `Agency`, `IsActive`, `ImpairedSegment`, `SurfaceDataOverride`
  - `GetSiteParameters` rows return `SiteId`, `SegmentId`, `StoretCode`, `StoretName`, `StoretCategory`, `HasSurfaceData`
  - `GetSiteData` rows return `SiteId`, `SegmentId`, `StoretCode`, `StoretName`, `StoretCategory`, `Depth`, `Agency`, `Symbol`, `Value`, `Date`
  - `GetSegment` returns `SegmentId`, `SegmentName`, `RootSegmentId`, `RootSegmentName`, `SiteIds`, `Agencies`, `ImpairedSegment`, `Sites[]`
- First reusable adapter slice that shipped cleanly:
  - adapter file: `src/lib/water/lcra-water-quality.ts`
  - route files:
    - `src/app/api/water/lcra/quality/sites/route.ts`
    - `src/app/api/water/lcra/quality/sites/[siteId]/route.ts`
    - `src/app/api/water/lcra/quality/sites/[siteId]/parameters/route.ts`
    - `src/app/api/water/lcra/quality/sites/[siteId]/observations/route.ts`
  - tests:
    - `tests/lcra-water-quality.test.ts`
    - `tests/lcra-water-quality-routes.test.ts`
- Normalization shape that worked:
  - `LcraWaterQualitySite`
    - `sourceId: 'lcra-water-quality-sites'`
    - `siteId`, `siteName`, `segmentId`, `segmentName`, `rootSegmentId`, `rootSegmentName`, `latitude`, `longitude`, `lastObservedAt`, `agency`, `isActive`, `impairedSegment`, `surfaceDataOverride`
  - `LcraWaterQualityParameter`
    - `sourceId: 'lcra-water-quality-parameters'`
    - `siteId`, `segmentId`, `storetCode`, `storetName`, `storetCategory`, `hasSurfaceData`
  - `LcraWaterQualityObservation`
    - `sourceId: 'lcra-water-quality-observations'`
    - `siteId`, `segmentId`, `storetCode`, `storetName`, `storetCategory`, `depth`, `agency`, `symbol`, `value`, `observedAt`
- Route behavior that worked:
  - `/api/water/lcra/quality/sites` returns `{ sites, freshness }`
  - `/api/water/lcra/quality/sites/[siteId]` returns `{ site }`
  - `/api/water/lcra/quality/sites/[siteId]/parameters` returns `{ parameters }`
  - `/api/water/lcra/quality/sites/[siteId]/observations` returns `{ observations }` with optional `?storetCode=` and `?includeProfile=true`
- Segment slice that shipped cleanly:
  - route files:
    - `src/app/api/water/lcra/quality/segments/[segmentId]/route.ts`
    - `src/app/api/water/lcra/quality/segments/[segmentId]/parameters/route.ts`
    - `src/app/api/water/lcra/quality/segments/[segmentId]/observations/route.ts`
  - route behavior:
    - `/api/water/lcra/quality/segments/[segmentId]` returns `{ segment }`
    - `/api/water/lcra/quality/segments/[segmentId]/parameters` returns `{ parameters }`
    - `/api/water/lcra/quality/segments/[segmentId]/observations` returns `{ observations }` with optional `?storetCode=` and `?includeProfile=true`
- Segment normalization shape that worked:
  - `LcraWaterQualitySegment`
    - `sourceId: 'lcra-water-quality-segments'`
    - `segmentId`, `segmentName`, `rootSegmentId`, `rootSegmentName`
    - `siteIds` from both `SiteIds` CSV and `Sites[]` merged + deduped
    - `agencies` from CSV split
    - `impairedSegment`, `siteCount`
- Important segment implementation pitfall:
  - `GetSegment` can expose both a `SiteIds` CSV string and a `Sites[]` array.
  - Do not choose one or the other; merge both sources and dedupe, or tests/live payloads will disagree on site coverage.
- Caching detail:
  - cache key `lcra-water-quality-sites` should be wired into `src/lib/water/freshness.ts`
  - site metadata, parameter catalogs, and observation histories can use per-site keys like:
    - `lcra-water-quality-site:<siteId>`
    - `lcra-water-quality-parameters:<siteId>`
    - `lcra-water-quality-observations:<siteId>:surface|profile`
  - a 12-hour TTL worked fine for this first slice
- Important environment quirk discovered during research:
  - `waterquality.lcra.org` TLS verification can fail in some local Python/Node contexts on this machine (`unable to verify the first certificate` / `UNABLE_TO_VERIFY_LEAF_SIGNATURE`)
  - browser access works; tests should stay mocked/offline
  - do not write live network tests against these endpoints in this environment
  - when wiring LCRA quality into the shared summary service, fail soft instead of letting these TLS errors break unrelated county summaries or page tests. A small helper like `safeLoad(() => fetcher(), fallback)` worked well for optional LCRA enrichment.
- LCRA county aggregation slice that shipped cleanly:
  - county assignment: use site coordinates with a nearest-county fallback from `src/lib/texas-county-centroids.ts`
  - summary metrics that proved useful:
    - `activeLcraQualitySiteCount`
    - `latestLcraObservationAt`
    - `availableLcraParameterCount`
    - `impairedLcraMonitoringSiteCount`
  - county-detail notes that proved useful:
    - total / active / impaired site counts
    - latest observation timestamp
    - top STORET summary such as `DO (2), Temperature (1), Phosphorus (1)`
- Important performance/scoping lesson for county aggregation:
  - do not fan out per-site parameter/observation fetches in the statewide overview path unless you really need them.
  - a better split is:
    - overview: derive lightweight counts from site inventory only (`IsActive`, `ImpairedSegment`, `LastDate`)
    - county detail: fan out parameter + observation fetches only for the selected county, then compute `availableLcraParameterCount` and top STORET summaries there.
  - this keeps the overview fast and avoids turning optional basin enrichment into a global latency bottleneck.

## Cache layer
- Add a shared in-memory TTL cache at `src/lib/water/cache.ts` with `createWaterDataCache()` and `getGlobalWaterDataCache()`.
- Use `getOrLoad(key, ttlMs, loader)` so concurrent callers share the same pending Promise and repeated calls inside the TTL do not re-fetch.
- Good default TTLs from this implementation:
  - NWS alerts: 15 minutes
  - USGS gauges: 6 hours
  - TCEQ sewer overflows: 6 hours
  - TCEQ general permits: 12 hours
  - Water districts/utilities: 24 hours
  - FEMA metadata/political jurisdictions/levees: 24 hours
  - LCRA Hydromet: 15-60 minutes depending on UI expectations
  - LCRA ARRP + water-quality inventories: 12-24 hours
- If a fetch function receives an explicit `AbortSignal`, bypass the cache and call the uncached loader directly.
- Cache only broad statewide fetches. If a function accepts bounded params like `limit`, do not reuse the generic cached entry for those parameterized calls.
- Extend the cache with `getFreshness(key)` returning `{ cached, cachedAt, expiresAt, ttlMs }` so API routes can expose cache state without re-fetching.
- Add a `src/lib/water/freshness.ts` helper that maps public `sourceId`s to cache keys and builds a `{ generatedAt, sources }` freshness payload for API responses.
- Good first freshness surfaces: `/api/water/overview`, `/api/water/alerts`, `/api/water/gauges`, and `/api/water/fema/nfhl/levees`.
- After freshness lands, expose it in the UI as a dedicated `Source freshness` section on `/water` with one badge/card per source showing `Cached until <timestamp>` and TTL in minutes. This makes live-demo reliability visible without opening APIs.
- Once levee filtering works, add `/api/water/fema/nfhl/levees-by-county` that summarizes levees into `{ county, leveeCount, leveeNames, leveeIds }` and attach freshness metadata there too.

## Source provenance anomaly + dependency network lane
- Water source provenance route can safely support month-level evidence drilldown without breaking existing consumers:
  - `GET /api/water/sources/[slug]?month=YYYY-MM`
  - return full profile plus `evidenceWindow: { month, timelinePoint, communitySamples }`
  - validate month format with `^\d{4}-\d{2}$`; return `400` for invalid input
- In `/water/sources/[slug]`, anomaly cards should deep-link to evidence and exact timeline rows:
  - API link: `/api/water/sources/<slug>?month=<YYYY-MM>`
  - row anchor id pattern: `timeline-<YYYY-MM>`
- First county dependency graph slice that shipped cleanly:
  - adapter/service: `src/lib/water/source-network.ts`
  - route: `src/app/api/water/sources/network/route.ts`
  - tests:
    - `tests/water-source-network.test.ts`
    - `tests/water-source-network-route.test.ts`
- Reusable v1 dependency schema that worked:
  - `nodes[]`: `countySlug`, `countyName`, `lat`, `lon`, `multiCountySourceCount`, `contagionScore`
  - `edges[]`: undirected shared-provider links with `sharedSourceCount` + sample `sharedSources`
  - `directedEdges[]`: `upstreamCountySlug`, `downstreamCountySlug`, `sharedSourceCount`, `sharedSources`
  - `flowDirectionMethod`: explicitly label heuristic, e.g. `centroid-gulf-proxy-v1`
- Hydrology-directed bootstrap lane that shipped cleanly:
  - seed file: `src/lib/water/hydrology-seed-edges.ts`
  - service: `src/lib/water/hydrology-dependencies.ts`
  - route: `src/app/api/water/sources/network/hydrology/route.ts`
  - tests:
    - `tests/water-hydrology-dependencies.test.ts`
    - `tests/water-hydrology-dependencies-route.test.ts`
  - stable method label: `seeded-river-network-v1`
  - node metrics that proved useful in UI:
    - `upstreamContributionScore`
    - `downstreamDependencyScore`
    - `contagionScore`
- Network UI lane that shipped cleanly:
  - page route: `src/app/water/network/page.tsx`
  - nav entry from `/water` via `RoutePill` to `/water/network`
  - tests:
    - `tests/water-network-page.test.tsx`
    - `tests/water-network-scatter.test.tsx`
    - `tests/water-network-neighbors.test.tsx`
    - `tests/water-page-network-link.test.tsx`
  - high-signal UX pattern:
    1. map + scatter on same page
    2. URL-driven brush state: `?county=<slug>&scope=<all|top10>#network-workspace`
    3. deep-link every node/point to that brush permalink
    4. expose stable test hooks: `data-selected-county`, `data-selected-scatter`, `data-scatter-county`
    5. add selected-county neighborhood panel with `Upstream counties` / `Downstream counties` lists and edge `evidence`
    6. include direct drill links to `/water/counties/<slug>` and `/water/sources/<slug>`
- Correlation analytics lane that shipped cleanly:
  - helper: `src/lib/water/network-analytics.ts`
  - first metrics: Pearson correlations for
    - upstream ↔ downstream
    - downstream ↔ contagion
    - upstream ↔ contagion
  - keep correlation cards deterministic and test-backed before adding more complex stats
- Important honesty constraint:
  - shared-provider direction is NOT real hydrology; treat as dependency proxy only
  - always ship method metadata (`flowDirectionMethod`) so UI/API consumers know whether flow direction is inferred or physically modeled

## Hydrology dependency map + correlation lane
- After shipping proxy `source-network` direction, add a separate hydrology-specific graph route and keep method labels explicit.
- First clean slice that worked:
  - seed edge dataset: `src/lib/water/hydrology-seed-edges.ts`
  - graph service: `src/lib/water/hydrology-dependencies.ts`
  - API route: `src/app/api/water/sources/network/hydrology/route.ts`
  - page: `src/app/water/network/page.tsx`
  - tests:
    - `tests/water-hydrology-dependencies.test.ts`
    - `tests/water-hydrology-dependencies-route.test.ts`
    - `tests/water-network-page.test.tsx`
    - `tests/water-network-scatter.test.tsx`
    - `tests/water-network-analytics.test.ts`
- Reusable schema that worked:
  - `flowDirectionMethod: 'seeded-river-network-v1'`
  - `nodes[]` with `upstreamContributionScore`, `downstreamDependencyScore`, `contagionScore`, and centroid fields
  - `edges[]` with directed `upstreamCountySlug`, `downstreamCountySlug`, `weight`, `evidence`
- Scoring approach that produced useful ranking behavior:
  - `downstreamDependencyScore` = weighted incoming edges
  - `upstreamContributionScore` = weighted outgoing edges
  - `contagionScore` = blend of downstream-heavy + upstream contribution (first pass used 0.7 / 0.3)
- UI pattern that shipped cleanly and is easy to test:
  1. map panel with line segments + node circles (centroid projection)
  2. ranked table for top downstream dependency counties
  3. correlation KPI strip (`Upstream↔Downstream`, `Downstream↔Contagion`, `Upstream↔Contagion`)
  4. scatter plot (`x=upstream`, `y=downstream`, `bubble size=contagion`) with URL-scoped mode toggle (`scope=all|top10`)
- Testing/stability details worth preserving:
  - give server page components default props when adding optional `searchParams` (e.g. `function Page({searchParams} = {})`) so existing tests calling `pageModule.default()` do not crash
  - add stable DOM hooks for scatter points (`data-scatter-county=<slug>`) for resilient tests
  - keep route/page copy assertions focused on semantic labels (`Dependency scatter`, axis text, flow method) rather than brittle coordinate values
- Product honesty rule:
  - seeded edges are a bootstrap, not full reach-level truth; keep `flowDirectionMethod` visible in UI copy and API payload until NHDPlus/USGS connectivity replaces seeds.

## Hydrology dependency map lane (seeded DAG bootstrap)
- For "who depends on who downstream" UX, a practical first slice is a seeded directed county graph before full NHDPlus ingest.
- Files that shipped cleanly:
  - `src/lib/water/hydrology-seed-edges.ts`
  - `src/lib/water/hydrology-dependencies.ts`
  - `src/app/api/water/sources/network/hydrology/route.ts`
  - `src/app/water/network/page.tsx`
- Route contract that worked:
  - `GET /api/water/sources/network/hydrology`
  - payload: `{ generatedAt, schemaVersion, flowDirectionMethod, nodes, edges }`
  - `flowDirectionMethod` value: `seeded-river-network-v1`
- Node scoring that worked for county ranking:
  - `upstreamContributionScore`: sum of outgoing edge weights
  - `downstreamDependencyScore`: sum of incoming edge weights
  - `contagionScore`: weighted blend (first pass used `0.7*downstream + 0.3*upstream`)
- UI pattern that worked for fast demoability:
  - add `/water/network` as a dedicated map-first route
  - draw lines from `upstreamCountySlug -> downstreamCountySlug`
  - draw centroid circles sized by `contagionScore`
  - include a ranked table (`Top downstream dependency counties`)
  - add a shortcut pill from `/water` to `/water/network`
- Test pattern that worked:
  - page test with mocked hydrology service (`renderToStaticMarkup`) asserting:
    - route title text
    - flow method label
    - county names
    - ranking section label
  - route test asserting API passthrough shape
- Scope guardrail:
  - keep this lane explicitly labeled as seeded/proxy until NHDPlus/USGS reach connectivity is integrated.
  - do not imply regulatory or physically exact downstream routing while on seed edges.

## Route and UI lessons
- `/api/water/alerts` and `/api/water/gauges` should accept optional `?county=` and filter server-side.
- A first useful UI is `src/app/water/page.tsx` with a county table + selected-county detail panel; do this before maps if the API surface is still moving.
- Add governance counts directly to the county table and county detail once the governance adapter lands; this gives useful value before map work.
- After FEMA county coverage is real, add a simple SVG centroid map before chasing true county polygons. This is fast, demoable, and enough to visualize relative county risk.
- For the centroid map, derive points from `src/lib/texas-county-centroids.ts` and project lat/lon into a fixed SVG box; style counties by a simple heuristic combining `floodplainFeatureCount`, alert count, sewer-overflow count, and gauge count.
- Render selected county gauges as separate overlay markers and expose stable `data-county-slug` / `data-gauge-site` attributes so page tests can assert on map content without brittle pixel checks.
- Add a direct link to `/api/water/fema/nfhl/counties` from the `/water` page once the FEMA county join route exists.
- For server-component page tests, render the returned element with `renderToStaticMarkup()` instead of `JSON.stringify()` or `util.inspect()` if you need to assert on real text content.
- Next.js lint catches `module` as a forbidden variable name in tests (`@next/next/no-assign-module-variable`). Use names like `pageModule` instead.
- Avoid `any` in mocked route tests; use small inline structural types so `npm run lint` stays green.
- For `/water/sources/[slug]` analytical UX, a high-signal pattern is:
  1. compute monthly anomaly score from timeline rows with `openSignal = alerts + sewerOverflows + permits`
  2. compute `coverageRatio = communitySampleCount / openSignal` (0 when openSignal is 0)
  3. blend normalized pressure and coverage gap into a 0-100 score (e.g., pressure-heavy weighting)
  4. bucket severity (`low`, `moderate`, `high`) and color timeline rows + badges by severity
  5. add a ranked `Top anomalous months` panel with jump links into anchored timeline rows (`id=timeline-YYYY-MM`) and an evidence API link
- Keep anomaly panel deterministic and testable: derive it entirely from `profile.timeline`, sort by score descending, slice top N, and assert rendered labels/links in `tests/water-source-page.test.tsx`.
- When expanding `WaterBreakdown.layers`, update all test fixtures immediately or page tests will fail on missing properties like `governance.length`.
- When `/water` starts reading `overview.freshness`, update all mocked `getWaterOverview()` fixtures in page tests to include at least `freshness: { generatedAt, sources: {} }`, otherwise server-component tests will crash before assertions.
- When adding a new lane after another lane has already evolved `CountyWaterSummary` or `WaterBreakdown` (for example LCRA after surface-water-quality), re-read and merge the latest `src/lib/water/types.ts` and `src/lib/water/water-summary-service.ts` before editing. These files are active integration hubs and are likely to diverge on `metrics`, `overlays`, and `layers`.
- Specifically, LCRA county-detail/UI work must preserve newer surface-water fields while adding:
  - metrics: `lcraArrpOutfallCount`, `lcraArrpLandPermitCount`
  - layers: `lcraArrpOutfalls`, `lcraArrpLandPermits`
  - notes: append LCRA ARRP counts without removing existing FEMA or surface-water notes
- If a rebase conflict hits `types.ts` or `water-summary-service.ts`, do not pick one side. Manually merge both feature sets, then rerun the full verification loop before pushing.

## Verification
Run:
- `npm test`
- `npm run lint`
- `npm run build`

Expected first useful routes:
- `/api/water/overview`
- `/api/water/counties/[slug]`

## FEMA discovery stub
- Add `src/lib/water/fema-nfhl.ts` before any polygon-heavy ingest.
- Keep the first FEMA slice to discovery only, then a thin live query route:
  - `fetchNfhlServiceMetadata()`
  - `normalizeNfhlServiceMetadata(...)`
  - `extractCountyRelevantNfhlLayers(...)`
  - `buildNfhlLayerQueryUrl(...)`
  - `fetchNfhlDiscoveryBundle()`
  - `buildTexasPoliticalJurisdictionsQueryUrl(limit?)`
  - `normalizeNfhlPoliticalJurisdictionsResponse(...)`
  - `fetchTexasNfhlPoliticalJurisdictions(limit?)`
- Verified current county-relevant discovery targets from live metadata:
  - `Political Jurisdictions` (layer 22)
  - `Levees` (layer 23)
  - `Water Lines` (layer 20)
- Verified live Texas starter query for `Political Jurisdictions`:
  - `where=ST_FIPS='48'`
  - `outFields=OBJECTID,DFIRM_ID,POL_NAME1,POL_NAME2,POL_NAME3,CO_FIPS,ST_FIPS,COMM_NO,CID`
  - `returnGeometry=false`
  - optional `resultRecordCount=<limit>`
- Verified live Texas starter query for `Levees`:
  - `where=DFIRM_ID LIKE '48%'`
  - `outFields=OBJECTID,DFIRM_ID,LEVEE_ID,LEVEE_NM,LEVEE_TYP,WTR_NM,LEVEE_STAT,OWNER,DISTRICT`
  - `returnGeometry=false`
  - optional `resultRecordCount=<limit>`
- Expose the first useful API routes immediately after the adapter lands:
  - `src/app/api/water/fema/nfhl/route.ts`
  - `src/app/api/water/fema/nfhl/political-jurisdictions/route.ts`
  - `src/app/api/water/fema/nfhl/levees/route.ts`
  - `src/app/api/water/fema/nfhl/counties/route.ts`
- Route behavior:
  - `/api/water/fema/nfhl` returns normalized metadata plus county-relevant layers
  - `/api/water/fema/nfhl/political-jurisdictions?limit=N` returns the first live Texas jurisdiction slice
  - `/api/water/fema/nfhl/levees?limit=N` returns the first live Texas levee slice
  - `/api/water/fema/nfhl/levees?county=<slug>` filters levees by Atlas county using NFHL political-jurisdiction `dfirmIds`; this is a practical first county filter before polygon math
  - `/api/water/fema/nfhl/counties` returns Atlas county joins built from political jurisdictions
- Use a plain ArcGIS REST query URL builder with bounded options:
  - `where`
  - `outFields`
  - `returnGeometry`
  - optional `resultRecordCount`
  - always `f=pjson`
- Test the adapter with compact sample metadata and mocked route tests instead of live network fixtures.
- Before hardcoding a Texas query, verify the live layer metadata once; layer 22 currently exposes `POL_NAME1/2/3`, `CO_FIPS`, `ST_FIPS`, `COMM_NO`, and `CID`; layer 23 currently exposes `LEVEE_ID`, `LEVEE_NM`, `LEVEE_TYP`, `WTR_NM`, `LEVEE_STAT`, `OWNER`, and `DISTRICT`.
- The first useful county join is not geometry-heavy: map NFHL political-jurisdiction records onto Atlas counties by combining `ST_FIPS + CO_FIPS`, padding `CO_FIPS` to 3 digits, then resolving that full FIPS through `county-lookup.ts`.
- Do not start with real polygon overlay math; use joined jurisdiction counts as the first county-level floodplain footprint proxy.

## Regional authority scouting beyond LCRA
- When expanding beyond LCRA, prioritize authorities that already expose one of these surfaces:
  - ArcGIS Open Data / Hub
  - ArcGIS Experience or WebMap viewers that likely sit on queryable layers
  - OneRain dashboards
  - explicit lake-level / stream-level / rainfall / water-quality endpoints or tables
- Verified strong next targets for Atlas Texas, in practical ingest order:
  1. GBRA — verified ArcGIS Hub (`opengbra-gbra.hub.arcgis.com`), Hydrolakes, water-quality and Clean Rivers surfaces
  2. SARA — verified ArcGIS Open Data (`sariverauthority-sara-tx.opendata.arcgis.com`), Floodplain Viewer, Water Quality Viewer, Watershed Master Plan Viewer, River Basin Report Card
  3. Edwards Aquifer Authority — not a river authority, but highly relevant; verified Environmental Data Portal (`data.edwardsaquifer.org`) and aquifer-conditions surface
  4. TRA — verified Clean Rivers, lake/river data, flood-planning, water-storage, and ArcGIS experience surfaces
  5. SJRA — verified OneRain dashboards plus flood-management and lake-condition pages
  6. SRA — verified SE Texas rain, lake levels, stream levels, water-quality monitoring, and Clean Rivers pages
  7. LNVA — verified canal-water-quality, Clean Rivers, and OneRain surfaces
  8. TRWD — not a river authority, but operationally similar; verified OneRain dashboards, lake-level resources, and ArcGIS map app
  9. BRA — reservoir/lake maps verified, but machine-readable surface still needs a deeper pass
  10. UCRA — relevant by basin, but public machine-readable surface not yet confirmed
- First GBRA slice that shipped cleanly:
  - adapter file: `src/lib/water/gbra-hydrology.ts`
  - route files:
    - `src/app/api/water/gbra/hydrology/major-rivers/route.ts`
    - `src/app/api/water/gbra/hydrology/gvhs-lakes/route.ts`
  - tests:
    - `tests/gbra-hydrology.test.ts`
    - `tests/gbra-hydrology-routes.test.ts`
- Verified GBRA machine-readable source that worked best first:
  - ArcGIS Hub DCAT feed: `https://opengbra-gbra.hub.arcgis.com/api/feed/dcat-us/1.1.json`
  - service root discovered from the feed: `https://services7.arcgis.com/Q6vsXnxTnYcWB7qg/arcgis/rest/services/GBRA_Hydrology/FeatureServer`
  - useful first sublayers:
    - `1` = Major Rivers
    - `2` = GVHS Lakes
- Live counts verified from the FeatureServer:
  - Major Rivers: 7 features
  - GVHS Lakes: 7 features
- Normalization shape that worked:
  - `GbraHydrologyMajorRiver`
    - `sourceId: 'gbra-hydrology-major-rivers'`
    - `objectId` from `OBJECTID`
    - `name` from `GNIS_Name`
    - `miles` from `Miles`
    - `shapeLength` from `Shape__Length`
  - `GbraHydrologyLake`
    - `sourceId: 'gbra-hydrology-gvhs-lakes'`
    - `objectId` from `OBJECTID`
    - `name` from `NAME`
    - `areaAcres` from `AREA`
    - `shapeArea` from `Shape__Area`
    - `shapeLength` from `Shape__Length`
- Route behavior that worked:
  - `/api/water/gbra/hydrology/major-rivers` returns `{ sourceId, featureCount, rivers, freshness }`
  - `/api/water/gbra/hydrology/gvhs-lakes` returns `{ sourceId, featureCount, lakes, freshness }`
  - both routes accept optional `?name=` and filter case-insensitively on the normalized `name` field
- Freshness/cache wiring that must be updated together:
  - `src/lib/water/water-source-registry.ts`
  - `src/lib/water/freshness.ts`
  - `tests/water-source-registry.test.ts`
- Practical GBRA discovery lesson:
  - GBRA's Hub `api/v3/datasets` endpoint can return noisy cross-tenant/public datasets that are not actually GBRA-specific enough to trust as your first selector.
  - The ArcGIS Hub DCAT feed was a cleaner path for discovering the real GBRA-owned hydrology service and sublayer URLs.
  - When a Hub looks noisy, pivot from `/api/v3/datasets` to the domain DCAT feed and then hit the discovered FeatureServer directly.
- Recommended ingestion categories across these authorities:
  - rainfall / stage / flow / reservoir levels
  - water-quality monitoring and Clean Rivers outputs
  - floodplain / watershed / master-plan GIS layers
  - basin report cards or summary indicators

## GBRA water-quality lane
- Best reusable finding: do not treat GBRA's ArcGIS water-quality service as the current source of truth for live monitoring.
- Verified ArcGIS service:
  - item id: `d27bbbc66f8e448e8505ac14742c83fa`
  - service: `https://services7.arcgis.com/Q6vsXnxTnYcWB7qg/ArcGIS/rest/services/Water_Quality_Sample_Stations/FeatureServer`
  - layer `0` = `CRP Water Quality Monitoring Sites (2019)`
  - layer `1` = `Surface Water Quality Monitoring Stations (TCEQ)`
- Important reality check from live metadata:
  - ArcGIS item modified timestamp is from 2020
  - both layer edit dates are from 2020
  - layer 0 is explicitly labeled `(2019)`
  - use this service only as a legacy inventory / geometry supplement, not as the live program truth
- Better live source that worked:
  - county monitoring pages under `https://www.gbra.org/environmental/water-quality/sites/<county>/`
  - current observation files under `https://waterservices.gbra.org/crp/*.csv`
  - historical files under `https://waterservices.gbra.org/crp/*.xls`
- Example live county page that exposes authoritative links:
  - `https://www.gbra.org/environmental/water-quality/sites/hays/`
- Example live CSV:
  - `https://waterservices.gbra.org/crp/12672.csv`
  - verified `Last-Modified` was current in 2026 while ArcGIS metadata was still stale
- Best implementation pattern:
  1. scrape GBRA county monitoring pages for station metadata
  2. extract station id, description, lat/lon, parameter-frequency text, monitoring type, historical XLS URL, current CSV URL
  3. use the extracted current CSV URL as the observation source
  4. normalize observations from CSV rows into structured records
  5. keep ArcGIS inventory optional/secondary for cross-checks only
- Important pitfall discovered through trial and error:
  - do not guess CSV URLs from `stationId.csv` alone
  - some active stations return `200`, others `404`
  - the county page table is the authoritative source for whether a current CSV link exists
- HTML structure that worked for parsing:
  - restrict parsing to the GBRA section between:
    - `Guadalupe River Basin Surface Water Quality Monitoring Program GBRA Monitoring Locations`
    - `Guadalupe River Basin Surface Water Quality Monitoring Program TCEQ Monitoring Locations`
  - parse `<tr id="<stationId>">` rows and table cells rather than trying to infer data from prose
- Observation CSV shape that worked:
  - first line contains station id + station name
  - header row starts with `Collect Date,Collect Time,Parameter,Reported Result,Units,Parameter Code`
  - normalize fields into:
    - `collectedAt`
    - `parameter`
    - `reportedResult`
    - `units`
    - `parameterCode`
    - `stationName`
- Route set that proved useful:
  - `/api/water/gbra/quality/sites`
  - `/api/water/gbra/quality/sites/[stationId]`
  - `/api/water/gbra/quality/sites/[stationId]/observations`
- Test lesson:
  - `fetchGbraWaterQualitySite()` re-fetches county pages through `fetchGbraWaterQualitySites()`, so mocked fetch sequences must include the county-page responses again before the CSV response
- County slug lesson:
  - `getCountyBySlugOrName()` can return slugs like `hays-county`; normalize them before storing water-quality site `countySlug` values so API/tests stay on Atlas short slugs like `hays`
- Scouting method that worked here:
  1. Skip Google browser search; it is prone to anti-bot blocks in this environment.
  2. Use direct authority homepages and known likely org domains first.
  3. Pull links from the homepage and filter for `data|map|dashboard|quality|flood|rain|level|flow|arcgis|onerain|monitor`.
  4. If a site blocks raw terminal fetches (for example Cloudflare), use `browser_navigate` + `browser_console` to enumerate links in-page.
  5. Rank sources by two axes: machine-readable likelihood and county-joinable usefulness.
- Practical finding: some authority sites hide the best ingest surfaces behind branded viewers rather than obvious APIs. ArcGIS hub/viewer URLs and OneRain dashboards are often the fastest route to a usable next endpoint.

## Don’t do first
- Don’t start with FEMA statewide polygon ingestion.
- Don’t scrape TWDB/TCEQ HTML hubs before enumerating machine-usable sublayers/downloads.
- Don’t silently drop unknown-county records; keep them out of county rollups explicitly.
