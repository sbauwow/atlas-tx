---
name: atlas-tx-bootstrap
description: "Bootstrap the Atlas TX project from zero: create public GitHub repo, scaffold Next.js app, lock MVP Texas datasets, add county normalization, and add initial Socrata adapter helpers with TDD."
version: 1.0.0
author: Hermes Agent
metadata:
  hermes:
    tags: [atlas-tx, texas-open-data, nextjs, github, vitest, socrata, county-normalization]
---

# Atlas TX bootstrap

Use when working on `~/Projects/atlas-tx` or recreating the same setup elsewhere.

## What this establishes
- Public GitHub repo
- Next.js 16 + TypeScript app scaffold
- README and implementation plan
- MVP dataset registry for Texas county intelligence
- County normalization helpers
- Initial Texas Open Data / Socrata adapter helpers
- Vitest test harness for utility-layer TDD

## Proven workflow

1. Create repo first
- Repo name used: `atlas-tx`
- Public description:
  - `Atlas TX - Texas county intelligence for environment, social strain, and local fiscal capacity`
- Command pattern:
  - `gh repo create sbauwow/atlas-tx --public --description "..."`

2. Scaffold app locally
- Create under `~/Projects/atlas-tx`
- Use Next app router + TS + npm:
  - `npx create-next-app@latest /home/stathis/Projects/atlas-tx --ts --eslint --app --src-dir --use-npm --import-alias '@/*' --yes`
- Add origin and push after first meaningful commit.

3. Replace boilerplate immediately
- Rewrite `README.md` with:
  - product framing
  - MVP dataset list
  - architecture sections
  - constraints / caveats
- Add plan doc under:
  - `docs/plans/YYYY-MM-DD-initial-plan.md`
- Replace default landing page and metadata in:
  - `src/app/page.tsx`
  - `src/app/layout.tsx`
- Add simple health route:
  - `src/app/api/health/route.ts`

4. Lock MVP datasets in code
- Create `src/lib/mvp-datasets.ts`
- Include at least these IDs:
  - `7fq8-wig2` TCEQ Water Quality Individual Permits Active/Pending
  - `hr84-s96f` Texas Water Districts
  - `waxz-c9q5` CPI Completed Abuse/Neglect Investigations by County and Region FY2016-FY2025
  - `u3nh-2phm` Local Government Debt Report (HB 1378) FY 2023
  - `ctj5-pypw` County Returns
  - `tmhs-ahbh` Sales Tax Allocation, Tax Rates
  - `xdwx-843n` Debt Outstanding by Local Government (external/href)
  - `djkj-euda` Local Debt Bond Election Results (external/href)
- Model each entry with:
  - id
  - name
  - category
  - publisher
  - summary
  - keyFields
  - useCase
  - accessType (`dataset` or `external`)

5. Add MCP + skill placeholders early
- Create:
  - `packages/mcp-server/package.json`
  - `packages/mcp-server/src/index.js`
  - `packages/mcp-server/README.md`
  - `skills/atlas-tx/SKILL.md`
- Keep these small; goal is visible technical direction, not full implementation yet.

## Utility layer that worked

### County normalization
Create `src/lib/counties.ts` with:
- `normalizeCountyName(input)`
- `countySlug(input)`
- `sameCounty(left, right)`

Normalization findings:
- treat missing suffix as county name (`Travis` -> `Travis County`)
- normalize case
- normalize `st.` / `st` to `saint`
- strip punctuation before slugging
- stable slug format:
  - lowercase
  - non-alnum -> `-`
  - trim edges

### Texas Open Data adapters
Create `src/lib/texas-open-data.ts` with:
- `getDatasetById(id)`
- `getTabularDatasetIds()`
- `datasetResourceUrl(id)`
- `buildCountyDatasetUrl(id, county)`

Important findings:
- Socrata tabular base:
  - `https://data.texas.gov/resource/<id>.json`
- Only build resource URLs for `accessType === 'dataset'`
- `href` assets like Bond Review Board microsite pages must return `undefined` from `datasetResourceUrl`
- County field names differ by dataset; hardcode a map initially:
  - `7fq8-wig2` -> `facility_county`
  - `hr84-s96f` -> `county`
  - `waxz-c9q5` -> `county`
  - `ctj5-pypw` -> `county_name`
  - `tmhs-ahbh` -> `county_name`
- For initial filtering, uppercase the county base name without ` County` suffix (`Travis County` -> `TRAVIS`)

## Test setup that worked

1. Install Vitest
- `npm install -D vitest`

2. Add script
- in `package.json`:
  - `"test": "vitest run"`

3. Add `vitest.config.ts`
- Alias `@` -> `src`
- Use `environment: 'node'`

4. Initial tests
- `tests/county.test.ts`
- `tests/texas-open-data.test.ts`
- `tests/texas-open-data-fetch.test.ts`

5. TDD sequence that worked
- Write tests first
- Observe failure due to missing modules/functions
- Implement smallest utility functions
- Re-run focused tests
- Then run:
  - `npm run lint`
  - `npm run build`

## Verification commands
- `npm test -- tests/county.test.ts tests/texas-open-data.test.ts tests/texas-open-data-fetch.test.ts`
- `npm run lint`
- `npm run build`
- For local API health after `npm run dev`:
  - if `3000` is occupied, Next may move to `3001`
  - verify `/api/health` on actual port

## Pitfalls discovered
- `create-next-app` can infer the wrong workspace root when multiple `package-lock.json` files exist up-tree.
- Fix with `next.config.ts`:
  - set `turbopack.root` to project directory.
- Tooling quirk:
  - targeted patch tool syntax-check noise may be broader than actual project build state; trust `npm run build` over generic patch-time TS noise.
- Local port `3000` may already be owned by another Express app; when verifying health, probe `3001` if needed.

## Good next slice after bootstrap
1. county comparison service
2. dataset fetch adapters for the 6 core tabular datasets
3. `/api/compare/counties`
4. compare UI cards
5. MCP tool contracts
