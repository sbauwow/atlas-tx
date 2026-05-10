---
name: atlas-tx-glossary-tooltips
description: Add approachable acronym definitions and lightweight glossary tooltips to Atlas TX without changing the product tone or introducing heavy client-side UI.
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [atlas-tx, glossary, tooltips, ux, accessibility, nextjs]
    related_skills: [test-driven-development, atlas-tx-pending-permits-dashboard]
---

# Atlas TX glossary tooltips

Use when Atlas TX pages feel too acronym-heavy for new users and need approachable definitions without turning the site into a beginner tutorial.

## When this applies
- Users say the site needs to be more approachable.
- Acronyms like `TCEQ`, `CID`, `SOAH`, `DWRS`, `NFHL`, `LCRA`, `GBRA`, `TWDB`, `SDWIS`, or `ACS` are visible on public-facing pages.
- You want hover/focus definitions with minimal implementation weight.

## Proven approach

Do not scatter one-off `title=` strings everywhere.

Instead:
1. create one shared glossary source file
2. create one reusable tooltip/expansion component
3. use it at first mention and in a small “Common terms” strip near the top of key pages
4. keep the interaction server-rendered and native via `<abbr title=...>`

This kept Atlas TX approachable without adding a JS-heavy tooltip library.

## Files that worked
- `src/lib/glossary.ts`
- `src/app/components/glossary-tooltip.tsx`

## Shared glossary pattern

Create `src/lib/glossary.ts` with a compact source of truth:
- key = acronym token
- value = `{ short, long }`

Example entries that were useful:
- `TCEQ` → `Texas Commission on Environmental Quality`
- `CID` → `Commissioners’ Integrated Database`
- `SOAH` → `State Office of Administrative Hearings`
- `DWRS` → `Drinking Water Risk Score`
- `EJ` → `environmental justice`
- `SDWIS` → `Safe Drinking Water Information System`
- `ACS` → `American Community Survey`
- `NFHL` → `National Flood Hazard Layer`
- `LCRA` → `Lower Colorado River Authority`
- `GBRA` → `Guadalupe-Blanco River Authority`
- `TWDB` → `Texas Water Development Board`
- `PWS` → `Public Water System`
- `APO` → `Aggregate Production Operation`
- `EJScreen` → `EPA Environmental Justice Screening and Mapping Tool`
- `FEMA` / `EPA` where needed

## Reusable component pattern

Create `src/app/components/glossary-tooltip.tsx` with two exports:

### `GlossaryTooltip`
Props:
- `term`
- `expand?`
- `className?`

Behavior:
- default mode renders the acronym only as:
  - `<abbr title="...">TCEQ</abbr>`
- expanded mode renders:
  - `Texas Commission on Environmental Quality (TCEQ)`
- add:
  - dotted underline
  - `cursor-help`
  - `aria-label`

### `GlossaryInlineList`
Props:
- `label`
- `terms`

Behavior:
- renders a compact chip list of expanded glossary items
- good for a “Common terms” strip near the top of a page

## Placement pattern that worked

### Homepage
Use expanded first mention inside explanatory copy:
- `SDWIS`
- `EJScreen`
- `ACS`
- `DWRS`
- `EJ`

Then add a `Common terms` strip with:
- `TCEQ`
- `DWRS`
- `EJ`
- `SDWIS`
- `ACS`

### Permits page
Use tooltip/expansion in:
- hero eyebrow / hero copy for `TCEQ`
- sidebar copy for `TCEQ`
- section headers / descriptions for `CID`
- references to `SOAH`

Then add a `Common permit terms` strip with:
- `TCEQ`
- `CID`
- `SOAH`
- `APO`

### Water page
Use expansion in hero copy for:
- `FEMA`
- `NFHL`

Then add a `Common water terms` strip with:
- `NFHL`
- `LCRA`
- `GBRA`
- `TWDB`
- `PWS`

## Tone rule
Expand terms without dumbing down the page.

Good:
- `Safe Drinking Water Information System (SDWIS)`
- `State Office of Administrative Hearings (SOAH)`

Avoid:
- long educational digressions in the middle of operator workflows
- popover essays
- activist or editorialized explanations inside tooltip copy

## Why this approach worked
- native browser tooltip on hover/focus
- accessible enough for a first pass
- no client-only dependency
- one source of truth for definitions
- easy to reuse across pages
- easier to test than rich floating UI

## Testing pattern that worked

Update render tests for pages that gained glossary copy:
- `tests/page.test.tsx`
- `tests/permits-page.test.tsx`
- `tests/water-page.test.ts`

### Good assertions
Assert the expanded long-form term appears in markup, for example:
- `Safe Drinking Water Information System`
- `American Community Survey`
- `Texas Commission on Environmental Quality`
- `Commissioners’ Integrated Database`
- `State Office of Administrative Hearings`
- `National Flood Hazard Layer`
- `Lower Colorado River Authority`
- `Guadalupe-Blanco River Authority`

Also assert a representative tooltip title is present, for example:
- `title="Texas Commission on Environmental Quality"`
- `title="Commissioners’ Integrated Database"`
- `title="National Flood Hazard Layer"`

## Validation commands
Run in `~/Projects/atlas-tx`:
```bash
npm test -- tests/page.test.tsx tests/permits-page.test.tsx tests/water-page.test.ts
npm run lint
npm run build
npm test
```

## Pitfalls / findings
- Do not rely only on acronyms in hero copy; first mention should usually be expanded.
- Do not hardcode definitions in multiple pages; drift will happen.
- Native `<abbr title>` was enough for this stage; do not overbuild with a custom floating system unless users need richer glossary content.
- Keep glossary strips small and page-specific; too many terms at once becomes visual clutter.
- Test expectations often need to shift from acronym-only strings to expanded long-form copy once tooltips are introduced.

## Extension pattern that also worked

The same lightweight approach extended cleanly to deeper learning/detail surfaces:

### Permit detail page
Apply glossary help to:
- intro copy for `TCEQ`
- a `Common filing terms` strip with:
  - `TCEQ`
  - `CID`
  - `SOAH`
- procedural-status labels where acronym context matters
  - for example, adding `title="State Office of Administrative Hearings"` on the `SOAH docket` label worked without adding more UI chrome

### County intelligence page
Apply glossary help to:
- a `Common county terms` strip with:
  - `TWDB`
  - `HUC`
  - `PWS`
- hydrology-context copy that explicitly says the page is built from `TWDB` hydrology layers and `HUC` geography

### Education page
Apply glossary help to:
- hero copy for first-use expansions of:
  - `TCEQ`
  - `TWDB`
  - `PWS`
- a `Common education terms` strip with:
  - `TCEQ`
  - `TWDB`
  - `PWS`
  - `NFHL`
  - `HUC`

## Additional glossary entries that became necessary
- `HUC` → `Hydrologic Unit Code`

## Extra testing pattern that proved useful
Update page tests for deeper surfaces too:
- `tests/permit-detail-page.test.tsx`
- `tests/county-intelligence-page.test.tsx`
- `tests/education-page.test.tsx`

Useful assertions:
- long-form expansion text exists in rendered markup
- representative `title="..."` tooltips exist on the page
- page-specific glossary strips render the expected concepts

## Dedicated glossary page pattern

Once inline tooltips exist across the main learning and workflow pages, add a canonical glossary destination instead of making each tooltip richer.

### Route
Create:
- `src/app/glossary/page.tsx`

Recommended behavior:
- render a simple glossary list from `src/lib/glossary.ts`
- sort entries alphabetically by acronym key
- show:
  - acronym
  - plain-English definition
- add practical jump-back links near the top, e.g.:
  - `/education`
  - `/water`
  - `/permits`

### Shared chrome links that worked
Add `Glossary` to the top nav in:
- `src/app/components/top-nav.tsx`

Also add a lightweight footer entry point in:
- `src/app/layout.tsx`

A small footer with:
- product identity text
- `Glossary`
- `Education`

worked well as a persistent learning path without cluttering the main nav too much.

### Tests to add/update
- `tests/top-nav.test.tsx`
  - assert `href="/glossary"`
- `tests/layout-telemetry.test.tsx`
  - assert footer glossary link appears
- `tests/glossary-page.test.tsx`
  - assert glossary page renders title, representative acronym/definition pairs, and route links back into product surfaces

### Important implementation note
The glossary page should consume `GLOSSARY` directly. Do not duplicate definitions again in page-local arrays.

## Best next move
After homepage, permits, water, permit-detail, county-intelligence, education, and `/glossary` are covered, make inline tooltip terms linkable to `/glossary#TERM` anchors if users need a faster path from abbreviation to deeper definition.
