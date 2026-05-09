# Atlas TX County Explorer + Map Implementation Plan

> For Hermes: execute this slice with TDD. Keep the map honest: centroid dot map first, not fake county polygons.

Goal: ship a county-by-county explorer that exposes statewide county summaries, a map-ready dataset, and a detailed breakdown for a selected county.

Architecture:
- extend the Socrata adapter so it can issue grouped statewide queries, not just single-county filtered queries
- create an explorer service that merges grouped county metrics across the five current Atlas county sources
- render a first-pass Texas county centroid dot map plus a selected-county breakdown on the homepage

Tech stack:
- Next.js 16 app router
- React 19
- TypeScript
- Vitest

---

## Task 1: state-level grouped dataset adapter
- add generic dataset query helpers in `src/lib/texas-open-data.ts`
- support grouped `$select` / `$group` / `$order` / `$limit` queries for statewide county rollups
- keep the existing county-filtered helpers intact

## Task 2: county explorer service
- create `src/lib/atlas-county-explorer.ts`
- define source-specific statewide aggregators for:
  - permits
  - water districts
  - CPI investigations
  - county returns
  - sales tax rates
- merge those into one county overview table
- compute simple statewide rankings and a composite score from source percentiles
- expose a selected-county breakdown that combines overview metrics + detailed source slices

## Task 3: map data
- add `src/lib/texas-county-centroids.ts`
- store county centroid coordinates keyed by normalized county slug
- attach centroid data to overview rows so the UI has immediate map-ready points

## Task 4: API routes
- add `src/app/api/counties/overview/route.ts`
- add `src/app/api/counties/[slug]/route.ts`
- return bounded JSON with county summaries, ranks, selected source metrics, and any source errors

## Task 5: homepage explorer UI
- add a county explorer UI on `src/app/page.tsx`
- render:
  - statewide county dot map
  - county ranking table
  - selected county breakdown cards
- start with a server-rendered default county and map data from the explorer service

## Verification
- red/green tests for new adapter + explorer + API behavior
- `npm test`
- `npm run lint`
- `npm run build`
