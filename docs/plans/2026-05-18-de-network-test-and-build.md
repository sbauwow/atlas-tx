# De-network the test + build path, then hard-gate CI

Status: active engineering-health plan (blocks CI promotion)
Workstream: cross (data + web + docs)
Owns paths it will touch: `src/lib/`, `src/app/`, `tests/`, `vitest.config.ts`, `.github/workflows/ci.yml`

## Problem in one sentence

`npm test` (15 test files / 24 tests failing) and `npm run build` (homepage prerender fails) are both red on `main` for the **same single root cause**: code on the request/build/test path performs **live external fetches with no cached fallback**, which dies in any sandboxed/offline environment and violates AGENTS.md §5 ("never live external API calls — always a cached snapshot").

This is not a data-refresh problem. The `scripts/refresh-*` jobs are *supposed* to hit live APIs. The defect is that the **rendered/SSG/test path** also does.

## Evidence (CI, 2026-05-18)

- Informational CI added in PR #47. First runs: [26014805188](https://github.com/sbauwow/atlas-tx/actions/runs/26014805188) (tests), [26014903876](https://github.com/sbauwow/atlas-tx/actions/runs/26014903876) (build).
- **Build failure is exact and reproducible:**
  ```
  Generating static pages ...
  Failed to set fetch cache https://data.texas.gov/resource/7fq8-wig2.json?... ECONNRESET
  Error occurred prerendering page "/" → getCountyOverview → fetch failed
  Export encountered an error on /page: /, exiting the build.
  ⨯ Next.js build worker exited with code: 1
  ```
  `next build` *compiles* clean (`✓ Compiled successfully`); it dies at static generation of `/`.
- **Build blocker, precisely:** `src/app/page.tsx` (homepage, statically generated) → `getCountyOverview()` in `src/lib/atlas-county-explorer.ts:238` → `fetchDatasetRows("7fq8-wig2", …)` (plus `hr84-s96f`, `tmhs-ahbh`, …) via `@/lib/texas-open-data`. No `safeLoad`/`public/cache` fallback in that file → the rejection propagates and kills prerender.
- **Test failures, same cause:** `vitest.config.ts` has **no `setupFiles` and no network isolation** (only a `server-only` alias stub). Suites that render pages or call composite services reach the open internet and fail with `unable to verify the first certificate`, `TypeError: fetch failed`, `Dataset 8kc5-95uk does not support resource API access`, `USGS site service unreachable`, `alerts API down`. `tests/page.test.tsx` (7/8, fast-fail) is the same `/` → `getCountyOverview` path.
- The remediation pattern **already exists in the codebase**: `safeLoad` is used in `src/lib/water/water-summary-service.ts` to degrade a failed fetcher to a fallback instead of rejecting the whole page. The fix is to apply that existing pattern consistently, not to invent one.

### Failing test files (run 26014805188 — 15 files, 24 tests)

`analytics-page` · `permits-page` · `water-page` · `water-page-map` · `page` · `county-intelligence-page` · `counties-overview-page` · `water-summary-service` · `water-governance-summary` (5s — network timeout) · `city-open-data` · `top-nav` · `glossary-page` · `tracked-link` · `layout-telemetry` · `watchlists-persistence` (3 skipped). The fast-failing render tests fail because the page they render does the live fetch; fix the page path and they go green together.

## Concrete next steps (ordered, each independently shippable)

### Step 1 — Unblock `next build` (P0, smallest change)

1. In `src/lib/atlas-county-explorer.ts`, wrap **every** `fetchDatasetRows(...)` call reachable from `getCountyOverview()` (the `7fq8-wig2`, `hr84-s96f`, `tmhs-ahbh`, and sibling reads) with the existing `safeLoad`-style guard so a failed live fetch returns a committed `public/cache/*.json` snapshot (or a typed empty fallback) instead of rejecting.
2. Generate + commit the snapshot(s) the homepage needs under `public/cache/` (small, demo-budget-aware — mirror the SDWIS-storage precedent).
3. Audit other statically-generated routes for the same anti-pattern: `src/app/counties/page.tsx`, `src/app/api/counties/overview/route.ts`, and any `/water*` page whose data path is in the failing-test list. Same `safeLoad` treatment.
- **Acceptance:** with networking disabled (`unshare -rn` or an offline runner), `DATABASE_URL=file:./prisma/ci.db npm run build` exits 0 and `/` prerenders from cache.

### Step 2 — Make the vitest suite hermetic (P0)

1. Add `tests/setup/network-guard.ts`: replace `globalThis.fetch` with a stub that throws `Unmocked network call in test: <url>` (fail-loud, never silently pass).
2. Add `tests/setup/dataset-fixtures.ts`: mock `@/lib/texas-open-data#fetchDatasetRows` (and the USGS/NWS/CKAN clients) to resolve from `tests/fixtures/` keyed by dataset id. Extend `tests/fixtures/` with the ids the failing suites need: `7fq8-wig2`, `8kc5-95uk`, USGS sites/IV, NWS alerts, CKAN city-open-data. Reuse the existing `tests/fixtures/{sdwis-sample,twdb-hydrology-raw-sample}.json` convention.
3. Wire both via `test.setupFiles` in `vitest.config.ts`.
- **Acceptance:** `npm test` is green offline; zero `[water-summary-service] fetcher failed` lines in output; `water-governance-summary` no longer takes 5s.

### Step 3 — Re-run CI, confirm green

Push the Step 1+2 branch; confirm the informational `verify` job shows `Unit tests` and `Production build` actually passing (check step `outcome`, not just `conclusion`, since `continue-on-error` masks it).

### Step 4 — Promote CI to a hard gate

1. In `.github/workflows/ci.yml`, follow the in-file PROMOTION PATH comment: delete `continue-on-error: true` on `Unit tests` and `Production build`, and the `if: always()` on the build step.
2. Pin Node to match CI: add `"engines": { "node": "20.x" }` to `package.json` and a `.nvmrc` (`20`).
3. Add a GitHub branch-protection rule on `main` requiring the `verify` check to pass before merge (closes the "merged on manual review only" gap from the May triage).

### Step 5 — Regression guard (keep it from rotting back)

- Keep `network-guard` active in CI so any newly-added un-mocked fetcher fails loudly.
- Add one test that asserts `getCountyOverview()` resolves with the live fetcher forced to throw (locks in the cached-fallback contract for the homepage forever).

## Non-goals

- Do **not** change `scripts/refresh-*` to stop hitting live APIs — that is their job. Only the render/build/test path must be cached.
- No feature work, no UI changes, no contract changes. Pure engineering health.
- Do not introduce MSW or a heavy mocking framework if a `fetch` stub + fixture loader suffices.

## Definition of done

- [ ] `npm run build` exits 0 offline; `/` and county routes prerender from cache.
- [ ] `npm test` green offline; no network noise; no 5s network-timeout tests.
- [ ] `ci.yml` `Unit tests` + `Production build` are hard gates (no `continue-on-error`).
- [ ] `main` branch protection requires the `verify` check.
- [ ] Node pinned (`engines` + `.nvmrc`) to the CI version.
- [ ] STATE.md row moved to Recently-done with the PR ref.
