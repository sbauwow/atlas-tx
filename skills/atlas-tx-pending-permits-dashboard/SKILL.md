---
name: atlas-tx-pending-permits-dashboard
description: Build or extend Atlas TX's /permits page using the stable TCEQ water-quality pending-permits Socrata dataset plus an optional snapshot-backed CID open-cases lane with explicit coverage caveats.
version: 1.0.0
metadata:
  hermes:
    tags: [atlas-tx, permits, tceq, cid, nextjs, socrata]
---

# Atlas TX Pending Permits Dashboard

## When to use
- User wants a Texas-wide permit tracker in Atlas TX.
- Need a stable pending-permits page now, but broader TCEQ workflow coverage later.
- Need to combine a reliable live dataset with a fragile procedural/CID lane.

## Core approach
1. Use `data.texas.gov` dataset `7fq8-wig2` as the stable live source for pending TCEQ water-quality individual permits.
2. Normalize it in `src/lib/tceq-permits.ts`.
3. Render `/permits` from that live Socrata source first.
4. Layer CID open-case context as a second lane only from refresh snapshots (`public/cache/cid-cases-tx.json`, `public/cache/cid-protests-tx.json`).
5. Always label CID as best-effort procedural context because Search One remains fragile.

## Stable lane
Use Socrata queries via `src/lib/texas-open-data.ts`:
- pending permits query: `authorization_status='PENDING'`
- status count query: `$select=authorization_status, count(*) as c` + `$group=authorization_status`

Normalize fields:
- `permit_number` -> `permitNumber`
- `authorization_type` -> `authorizationType`
- `authorization_status` -> `authorizationStatus`
- `permittee_name` -> `permitteeName`
- `facility_county` -> normalized county name
- `nearest_city` -> title-cased city
- `latitude` / `longitude` -> numbers

Useful page metrics:
- pending permit count
- active permit count statewide
- counties represented
- authorization type count
- top counties by pending count

## CID lane
Do not pretend CID is reliably live.

Load only from snapshot files with statically scoped paths to avoid Turbopack NFT warnings:
- `path.join(process.cwd(), "public", "cache", "cid-cases-tx.json")`
- `path.join(process.cwd(), "public", "cache", "cid-protests-tx.json")`

Summarize open cases by:
- filtering `itemStatus === "open"`
- joining protests by `tceqId`
- computing filing counts:
  - comments
  - hearing requests
  - public meeting requests
- latest filed date
- top program areas
- protested case count

If snapshots are missing, return an unavailable CID summary with a caveat instead of failing the page.

## Page structure
Recommended `/permits` sections:
1. Hero + scope statement
2. Stable TCEQ permit stats row
3. CID stats row
4. County permit map
5. Top counties by pending count
6. Pending permit roster
7. CID open-cases summary + caveats
8. CID case roster with filing counts
9. Visible CID snapshot-age badge near the CID lane header

## County map implementation
If the user wants the county visualization "backed" or upgraded from centroid tiles to a real map, prefer a true county choropleth instead of projected centroids.

Recommended implementation:
- keep county aggregation logic in `src/lib/tceq-permits.ts` via `buildPendingPermitCountyMapRows(...)`
- extract a dedicated component such as `src/app/components/texas-county-choropleth.tsx`
- use `us-atlas/counties-albers-10m.json` for geometry
- use `d3-geo` + `topojson-client` to convert TopoJSON into SVG paths
- join permit rows to county polygons through the existing `TEXAS_COUNTY_CENTROIDS[slug].fips` mapping
- render all Texas counties as a muted background layer, then overlay highlighted counties by permit count
- keep the CID overlay as a hatch pattern filled over the same county path
- add `data-county-map-path="<slug>"` attributes in the rendered SVG groups so page tests can assert true path-backed counties rather than tile markers

Suggested visual encoding:
- 1 permit -> emerald
- 2 permits -> cyan
- 3+ permits -> fuchsia
- CID open case / hearing pressure -> white hatch overlay

Useful details:
- use `mesh(...)` for internal county borders and statewide outline strokes
- compute the SVG viewBox from `geoPath().bounds(...)` on the Texas county feature collection, then add padding
- keep the page copy explicit that this is a `true county polygon view`
- if the user wants drill-down, wrap highlighted county shapes in SVG `<a href="/permits?county=<slug>">` links rather than trying to bolt on client-side map handlers first
- keep the county `<title>` text explicit that the shape is clickable for the filtered permit view
- add a small companion link strip under the map with direct `Permits` and `Water` links per highlighted county so the workflow is visible even without hover support
- if the water drill-down page does not exist yet, add `src/app/water/counties/[slug]/page.tsx` as a server-rendered county profile backed by `getDefaultAtlasWaterSummaryService().getCountyWaterBreakdown(slug)`
- on that county profile, include a return link to `/permits?county=<slug>` so the permits and water pages behave like a connected operator workflow
- once both filtered `/permits?county=<slug>` and `/water/counties/[slug]` exist, extract a shared `src/app/components/county-workspace-header.tsx`
- the shared header should show:
  - `County workspace` label
  - county name + slug
  - direct links to `Permit view` and `Water profile`
  - previous/next county navigation pills
- add adjacency helpers in `src/lib/water/county-lookup.ts` rather than recomputing list order in page files:
  - `listCountyRefs()`
  - `getAdjacentCountyRefs(input)`
- on `/permits`, only render the shared county workspace header when a county filter is active
- on `/water/counties/[slug]`, always render the shared county workspace header at the top
- add a third county-workspace surface at `src/app/counties/[slug]/page.tsx` backed by `getDefaultAtlasCountyExplorerService().getCountyBreakdown(slug)`
- the county intelligence page should reuse the same header and expose:
  - composite score / rank context
  - county highlight lanes
  - hydrology context / caveats
- keep the navigation target aligned with the current workflow:
  - from filtered permits, prev/next should stay in `/permits?county=...`
  - from county water pages, prev/next should stay in `/water/counties/...`
  - from county intelligence pages, prev/next should stay in `/counties/...`
- after the county intelligence page exists, upgrade the `/permits` county action strip and the `Top counties by pending count` list to include direct `/counties/<slug>` links labeled `County intelligence`
- add a statewide county-workspace entry page at `src/app/counties/page.tsx`
- back it with `getDefaultAtlasCountyExplorerService().getCountyOverview()`
- keep the page simple and operator-oriented:
  - county workspace intro
  - ranked county count
  - source-lane count
  - generated date
  - top ranked county list
  - direct links per county to `County intelligence`, `Permits`, and `Water`
- this gives `/counties` a natural role as the statewide landing page for the county workflow instead of forcing entry through `/permits`
- once `/counties` exists, expose it in the global shell so users do not have to discover county workflow accidentally:
  - add `Counties` to `src/app/components/top-nav.tsx`
  - add a homepage CTA labeled `County workspace overview` alongside the existing Water / Education actions
  - cover both with render tests so discoverability does not regress
- if the homepage still feels like navigation is scattered, add a dedicated operator-facing entry-paths module near the top of `src/app/page.tsx`
- keep it as three explicit cards so the workflow is obvious at a glance:
  - `Water explorer`
  - `County workspace overview`
  - `Permit tracker`
- each card should include:
  - an eyebrow like `Entry paths`
  - a short operational description
  - a direct CTA link (`/water`, `/counties`, `/permits`)
- prefer a small reusable helper like `EntryPathCard(...)` inside `src/app/page.tsx` unless the pattern spreads further
- add page-test assertions for the new strings `Entry paths`, `Permit tracker`, and `href="/permits"` so the grouped workflow surface does not regress

For the snapshot-age badge:
- derive from `cidSummary.generatedAt`
- compute a freshness band in `src/lib/tceq-permits.ts`
  - `fresh`: 0–1 days
  - `aging`: 2–7 days
  - `stale`: 8+ days
- return all three values from the formatter/helper:
  - compact age label
  - refresh stamp
  - freshness band
- render an explicit status label plus color treatment on the page:
  - `Fresh` -> emerald badge
  - `Aging` -> amber badge
  - `Stale` -> rose badge
- example display: `Fresh · 1d old · Refreshed May 9, 2026`
- if no snapshot timestamp exists, show `Unavailable`
- keep the badge on the page itself so users can assess CID staleness without reading caveats

## Caveat language
Keep this explicit:
- Stable lane tracks pending TCEQ water-quality individual permits, not every TCEQ program.
- CID lane is cross-program procedural context.
- CID Search One remains fragile; treat CID as best-effort procedural context, not guaranteed live statewide coverage.
- Pending status is procedural context, not proof of harm or permit outcome.

## Filing-level scrutiny / red flags
When the user wants Atlas TX to move from county-level permit pressure to filing-level scrutiny, add a pure scorer first before building any filing detail page.

Recommended first slice:
1. Create `src/lib/scoring/permit_filing_red_flags.ts` as a pure scorer.
2. Feed it only existing `data.permits` + `data.cidSummary.cases` from `getTceqPendingPermitsPageData(...)`.
3. Render a new `/permits` section titled `Filings that need scrutiny` before deeper filing-workspace routes exist.
4. Keep the first version narrow and procedural:
   - SOAH docket present
   - hearing requests
   - public meeting requests
   - comment volume
   - county permit concentration
5. Do not block on document OCR, filing detail pages, or a legal/protest helper panel.

Suggested scorer shape:
- one row per open CID case
- fields:
  - `tceqId`
  - `applicantName`
  - `county`
  - `programArea`
  - `score`
  - `components.proceduralPressure`
  - `components.countyPressure`
  - `reasons[]`
  - `caveats[]`

Good initial reasons to emit as literal strings so tests can assert them:
- `SOAH docket present`
- `1 hearing request filed`
- `1 public meeting request filed`
- `N public comments filed`
- `N pending permits in <County>`

Recommended scoring stance:
- keep it explainable, not clever
- additive points are fine for v1
- sort by total score descending, then stable tie-breaker on `tceqId`
- caveats must explicitly say these are public-record leads, not proof of invalidity or legal merit

Recommended `/permits` section layout for v1:
- section title: `Filings that need scrutiny`
- subtitle clarifying these are `Best-effort filing-level red flags derived from CID procedural pressure plus county permit concentration.`
- one compact card per flagged filing showing:
  - applicant
  - program area / county / TCEQ ID
  - score pill
  - explicit reason bullets

This slice should stay server-rendered and dependency-light. Do not add a new route until the scorer and section are stable.

## Tests to add
- unit tests for permit normalization and county filtering
- unit tests for CID summary/join logic
- unit tests for snapshot-age badge formatting, including freshness bands (`fresh`, `aging`, `stale`)
- page render test for `/permits`
- page render coverage for badge label/class output on at least fresh and aging states
- ensure `/water` can link to `/permits` if surfaced there
- for filing-level scrutiny, add:
  - pure scorer test asserting rank order + explicit reason strings
  - `/permits` page render assertions for `Filings that need scrutiny` plus at least one emitted reason string

When the page imports helper exports from `@/lib/tceq-permits`, prefer a partial Vitest mock:
- `vi.mock("@/lib/tceq-permits", async (importOriginal) => ({ ...await importOriginal(), getTceqPendingPermitsPageData: ... }))`
- this avoids breaking page tests when new helper exports like `formatCidSnapshotAgeBadge` are imported alongside the main loader
- if badge behavior depends on snapshot age, keep the mock timestamp overrideable via a top-level mutable test variable plus `beforeEach` reset

## Validation
Run:
- `npm test -- tests/permits-page.test.tsx`
- `npm test -- tests/tceq-permits.test.ts`
- `npm run lint`
- `npm run build`
- `npm test`

## Dependency notes
If you add a true county choropleth, install and commit the resulting lockfile updates for:
- `d3-geo`
- `topojson-client`
- `us-atlas`
- `@types/d3-geo`
- `@types/topojson-client`

TypeScript gotcha:
- `us-atlas` JSON often needs a double cast for the imported Topology object:
  - `const countyAtlas = countiesAtlas as unknown as Topology<{ counties: GeometryCollection }>`
- without the `unknown as` bridge, Next/TypeScript may fail on tuple typing for `transform.scale`

## Pitfalls
- Do not rely on live CID Search One for page rendering.
- Do not use dynamically unconstrained `process.cwd()` path joins; scope them to `public/cache/...`.
- Do not overstate CID freshness or completeness.
- Do not call the broader CID lane simply "live" unless a robust refresh path is actually in place.
