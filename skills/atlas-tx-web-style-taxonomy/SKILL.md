---
name: atlas-tx-web-style-taxonomy
description: Update Atlas TX homepage or education-facing web copy while preserving the current visual system, taxonomy language, and validation workflow.
version: 1.0.0
metadata:
  hermes:
    tags: [atlas-tx, nextjs, homepage, education, design-system, taxonomy, copywriting]
---

# Atlas TX web style + taxonomy workflow

Use this when editing `~/Projects/atlas-tx` homepage or education-facing pages.

## When this matters
- User asks for homepage-ready copy
- User asks to align copy with "new styles" or "taxonomy"
- Need to add education/explainer sections without breaking the current polished UI
- Need to push directly to `main` while other branches/users may also be updating remote

## Source-of-truth style cues
Atlas TX currently uses a polished dark UI, not the older plain Tailwind shell.

Prefer these patterns:
- hero with radial cyan glow background
- rounded cards with `bg-slate-900/40` or similar
- `ring-1 ring-white/5` / `ring-white/10`
- compact uppercase eyebrow labels with tracking
- concise, governed-decision-support framing
- CTAs as rounded pills

## Taxonomy conventions
Use Atlas TX vocabulary consistently:
- source systems
- environmental burden
- infrastructure / fiscal capacity
- community context
- water risk
- governed decision-support

Do not drift into vague generic civic-tech copy.

## Color/category system
Before adding taxonomy chips or category pills, check:
- `src/app/design/categories.ts`
- `src/app/globals.css`

If missing, add shared category token helpers instead of hardcoding one-off colors into components.

Typical shared exports:
- `CATEGORY_BORDER_CLASS`
- `CATEGORY_TEXT_CLASS`
- `DATASET_CATEGORY_TOKEN`
- `DATASET_CATEGORY_LABEL`
- `DATASET_CATEGORY_GLYPH`

Keep taxonomy styling reusable across homepage, `/education`, and future pages.

## Education-content pattern
If homepage and `/education` both need similar explainer content:
- extract shared content into `src/app/education/content.ts`
- keep page components mostly presentational

Good candidates for shared content:
- primer cards
- source comparison blocks
- governance layers
- flow steps
- county risk signal lists

## Important testing constraint
Homepage copy may have existing tests asserting legacy product language.
Before rewriting copy, inspect:
- `tests/page.test.tsx`
- any page-specific tests you are touching

If product direction changes but old strings are still part of the contract, preserve those anchor phrases somewhere in the rendered page unless the tests are intentionally being rewritten.

Examples of strings that may still be expected:
- `Atlas TX · Texas water risk explorer`
- `Water-risk thesis`
- `Headline signals: DWRS, EJ overlap, protest density`
- `Atlas TX dataset registry`

## Dedicated education page workflow
If user says yes to a next-step education slice, default to creating a dedicated route:
- `src/app/education/page.tsx`

Then:
1. keep a teaser/preview on homepage
2. add CTA from homepage to `/education`
3. add a test file like `tests/education-page.test.tsx`

## Homepage operator-workflow cards
When the homepage needs to surface the main Atlas TX operator paths, prefer a grouped module near the top of `src/app/page.tsx` with 3 explicit cards:
- `Water explorer`
- `County workspace overview`
- `Permit tracker`

Each card should include:
- eyebrow like `Entry paths`
- short operational description
- direct CTA link
- small live metric line when useful
- optional secondary deep link on the metric row when the count should act as a mini-status surface

Good live metrics:
- Water: total `activeWaterAlertCount` and `streamGaugeCount`
- Counties: `countyOverview.countyCount`
- Permits: `permitData.summary.pendingPermitCount`

Good secondary deep links:
- Water metric row → `/water?mode=mismatch`
- Counties metric row → `/counties#top-counties`
- Permits metric row → `/permits#top-counties`

Implementation pattern:
- make `src/app/page.tsx` an async server component
- fetch homepage counts with `Promise.all([...])`
- use existing services rather than inventing homepage-only loaders:
  - `getDefaultAtlasCountyExplorerService().getCountyOverview()`
  - `getDefaultAtlasWaterSummaryService().getWaterOverview()`
  - `getTceqPendingPermitsPageData()`
- aggregate water metrics on the page with a simple reduce, e.g. summing county-level `activeWaterAlertCount` and `streamGaugeCount`
- keep the card helper local unless it spreads beyond the homepage
- if the metric row deep-links into a subsection, add a stable anchor id on the destination page (`id="top-counties"` worked for both `/counties` and `/permits`)

## Testing async homepage pages
If `src/app/page.tsx` becomes async, update tests accordingly:
- mock the service modules directly with `vi.mock(...)`
- return minimal async objects for the counts you need
- render with `renderToStaticMarkup(await Home())`, not `<Home />`
- assert the metric strings directly so homepage workflow counts do not silently regress

## Visual explainer pattern
For compare/contrast explainers like surface water vs groundwater:
- render side-by-side cards on `/education`
- include:
  - definition/body
  - examples
  - strengths
  - watchouts
- optionally add a lighter teaser version on homepage

Store the compare data in shared content, not inline in both pages.

## Git workflow for Atlas TX main
Atlas TX `main` may move while you work.
Use this exact finish sequence:
1. `git fetch origin`
2. if needed, `git rebase --autostash origin/main`
3. run full validation
4. commit
5. push
6. if push is rejected, fetch + rebase again, then push

## Required validation
Always run all three before pushing:
- `npm test`
- `npm run lint`
- `npm run build`

Do not rely on partial test runs only.

## Good outcome shape
A strong Atlas TX web update should:
- read cleanly for judges/non-experts
- preserve Atlas TX’s governed, risk-aware framing
- reuse shared taxonomy tokens/content
- keep homepage and education content aligned
- pass full test/lint/build
