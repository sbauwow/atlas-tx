# Official County Weather Context — Execution Plan

> For Hermes: use subagent-driven-development if executing this. Keep this slice additive. Official weather context explains water anomalies; it does not replace or silently rewrite the core water-risk logic.

Goal: ship a stable county-level official weather-context block that plugs into Atlas TX water summaries and mismatch explanations using official sources first.

Architecture: keep the first slice county-summary-centric rather than building a giant generic weather platform. Normalize official-source inputs into one county weather-context shape, cache refresh results, and wire the summary block into `src/lib/water/water-summary-service.ts` before asking the UI to do more than render it.

Tech stack: TypeScript, Next.js 16 app/router conventions, existing water-summary architecture under `src/lib/water/`, Vitest, cached JSON refresh scripts.

Assumed active neighbors:
- Feynman owns the live research/data implementation lane for weather context and backtesting
- UI work is active separately; do not create UI-driven scope in this plan

---

## Scope guardrails

In scope:
- county-level official weather/hydrologic context
- cached refresh pipeline
- source provenance and caveats
- water-summary wiring
- mismatch explanation helpers that use weather as context

Out of scope for this slice:
- private weather station ingest
- Nubila integration
- Android strip readings
- bird / bat overlays
- broad climate products
- UI invention of weather logic

---

## Target file map

Primary implementation files:
- `src/lib/datasets/county-weather-context.ts`
- `scripts/refresh-county-weather-context.ts`
- `src/lib/water/types.ts`
- `src/lib/water/water-summary-service.ts`
- `tests/county-weather-context.test.ts`
- `tests/refresh-county-weather-context.test.ts`
- `tests/water-summary-service.test.ts`
- `tests/package-scripts.test.ts`

Likely docs/contract touchpoints:
- `docs/contracts/dataset-registry.md`
- `docs/STATE.md`
- optionally `README.md` only if the shipped behavior materially changes user-facing capability

Likely package touchpoint:
- `package.json`

---

## Desired output shape

The first shipped shape should stay compact and county-friendly.

Recommended type name:
- `CountyWeatherContext`

Recommended fields:
- `county`: `{ name, slug, fips? }`
- `generatedAt`: ISO string
- `sources`: array of source ids used
- `alerts`:
  - `activeAlertCount`
  - `recentAlertTypes: string[]`
- `streamflow`:
  - `gaugeCount`
  - `flowStatusSummary: "low" | "normal" | "high" | "mixed" | "unknown"`
  - `highFlowGaugeCount`
  - `lowFlowGaugeCount`
- `drought`:
  - `droughtCategory: "none" | "D0" | "D1" | "D2" | "D3" | "D4" | "unknown"`
  - `validAt`
- `precipitation`:
  - `precip24hInches`
  - `precip72hInches`
  - `precip7dInches`
  - `observationWindowEndedAt`
- `heat`:
  - `heatFlag`
  - `tempAnomalyF`
  - `observedAt`
- `caveats: string[]`

Notes:
- use `null` rather than invented numbers when a field is unavailable
- preserve enough provenance so downstream consumers know whether a field came from alerts, gauges, drought products, gridded precip, etc.
- do not overfit the type to a single source if the long-term plan is source substitution

---

## Execution order

### Task 1: lock the contract in docs before widening implementation

Objective: make the intended county weather-context shape explicit so data and UI do not drift apart.

Files:
- Modify: `docs/contracts/dataset-registry.md`
- Reference: `docs/plans/2026-05-09-additive-weather-community-roadmap.md`

Steps:
1. add one concise subsection for a county weather-context summary block
2. define the intended summary-level fields and explain that they are assembled from official-source rows
3. state that this block is explanatory context for water summaries and mismatch interpretation
4. avoid introducing a breaking change unless existing contract consumers already depend on a conflicting shape

Verification:
- re-read the added section and confirm it says county summary block, not generic statewide weather platform

### Task 2: add a failing unit test for the aggregate county weather shape

Objective: pin the first expected aggregate shape before filling in implementation.

Files:
- Test: `tests/county-weather-context.test.ts`
- Create/modify: `src/lib/datasets/county-weather-context.ts`

TDD steps:
1. write one failing test for a county with representative official-source inputs
2. run only that test and verify the failure is the expected missing export/shape failure
3. implement the smallest aggregator/helper to satisfy the test
4. rerun the single test until green

Recommended first test target:
- one county with:
  - two alert rows
  - three streamflow rows including one high and one low
  - one drought row
  - one precipitation summary input
  - one heat input
- expected output should prove:
  - mixed flow status is possible
  - alert type deduping works
  - drought category is carried through
  - precip windows survive unchanged
  - caveats exist

### Task 3: add failing tests for edge cases in county weather aggregation

Objective: keep the county weather block honest under incomplete official data.

Files:
- Test: `tests/county-weather-context.test.ts`
- Modify: `src/lib/datasets/county-weather-context.ts`

TDD slices:
1. county with no gauges
2. county with no drought row
3. county with no precip summary
4. county with only low-flow gauges
5. county with duplicate alert event names

Rules:
- one failing test at a time
- minimal implementation each time
- keep caveat behavior explicit rather than inferred by consumers

### Task 4: pin refresh-script behavior with tests

Objective: define how the cached county-weather refresh entrypoint behaves before changing script internals.

Files:
- Test: `tests/refresh-county-weather-context.test.ts`
- Create/modify: `scripts/refresh-county-weather-context.ts`
- Test: `tests/package-scripts.test.ts`
- Modify: `package.json`

TDD slices:
1. test default output path
2. test summary metadata written to disk
3. test that source ids / generatedAt are present
4. test package script registration if not already present

Expected deliverable:
- a script callable from `package.json`
- stable output path under `public/cache/` or documented larger-file fallback path if needed

### Task 5: define `CountyWeatherContext` in shared water types if the summary service needs it

Objective: avoid duplicate ad hoc type shapes between dataset logic and water summary service.

Files:
- Modify: `src/lib/water/types.ts`
- Modify: `src/lib/datasets/county-weather-context.ts`
- Test: whichever test first forces the shared type to exist

Guideline:
- if only the water summary service consumes the type, put the shared exported type where other water summary shapes already live
- if the dataset file can keep a local type without cross-file duplication, prefer smaller scope

### Task 6: add the first failing summary-service regression test for weather wiring

Objective: prove weather context reaches county summaries before touching production summary code.

Files:
- Test: `tests/water-summary-service.test.ts`
- Modify: `src/lib/water/water-summary-service.ts`

TDD slice:
1. add one failing test that injects a fake county weather loader/context and expects the county summary to expose it
2. run just that test and confirm the failure is the missing field/wiring
3. implement the minimal plumbing to pass
4. rerun single test, then targeted suite

Design note:
- weather context should enter summary outputs as a dedicated block, not as flattened top-level metric sprawl unless that already matches current summary style

### Task 7: add failing tests for mismatch explanation behavior using weather context

Objective: use weather for explanation first, not direct scoring mutation.

Files:
- Test: `tests/water-summary-service.test.ts`
- Modify: `src/lib/water/water-summary-service.ts`

Suggested first explanation cases:
1. recent alerts + high precip + overflow activity -> explanation mentions storm-driven context
2. drought + low-flow conditions + stressed water indicators -> explanation mentions concentration/chronic stress context
3. elevated water stress with no obvious weather trigger -> explanation flags unexplained or less weather-driven behavior

Guidelines:
- keep wording caveated
- do not claim causality
- do not silently alter mismatch score formula unless a separate plan explicitly calls for it

### Task 8: expose summary consumers to the new block, but keep UI thin

Objective: make the new data available without forcing a UI rescope.

Files:
- Modify only if needed: summary route files or existing data-returning surfaces
- Avoid broad UI churn in `src/app/water/page.tsx` until summary shape is stable

Guideline:
- data lane ships the block first
- web lane consumes the block second
- if a UI touch is unavoidable, keep it to a small explanatory panel/badge set

### Task 9: run verification commands

Objective: confirm the slice is stable before handoff to other workstreams.

Run, in order:
- `npm test -- tests/county-weather-context.test.ts`
- `npm test -- tests/refresh-county-weather-context.test.ts`
- `npm test -- tests/water-summary-service.test.ts`
- `npm test -- tests/package-scripts.test.ts`
- `npm run lint`
- `npm run build`

If the repo’s test runner syntax differs, preserve the spirit: smallest target first, then broader confidence checks.

### Task 10: doc the shipped reality, not the imagined future

Objective: keep planning/docs in sync with what actually landed.

Files:
- `docs/STATE.md`
- maybe `README.md`
- maybe `docs/contracts/dataset-registry.md`

Checklist:
1. update STATE done rows clearly
2. if shipped behavior is still county-summary-only, say that plainly
3. if any source is approximate or cached-only, say so plainly
4. keep hobbyist weather and community observation explicitly deferred

---

## Handoff notes for the UI lane

Once the county weather-context block is stable, UI can safely do a thin rendering pass.

Preferred first UI surfaces:
- compact county weather-context card
- small badge/summary row near mismatch explanation
- tooltip or caveat panel

Avoid first:
- big new weather home page
- speculative charts before data semantics are stable
- custom UI-only weather computations

---

## Handoff notes for later community-observation work

This execution plan is intentionally official-source-first.
The Android color-strip MVP and any hobbyist weather ingest should wait until this county weather-context slice is green and documented.

That later work should plug into a separate community-observation contract, not leak into this slice.
