# Atlas TX Initial Implementation Plan

> ⚠️ **SUPERSEDED 2026-05-08** by [`2026-05-08-water-risk-refocus.md`](./2026-05-08-water-risk-refocus.md).
> Kept for history. Do not use this doc as a basis for new work — the project narrowed to a drinking-water-risk + environmental-justice angle for one named persona instead of a 6-dataset compare-counties shell.

> For Hermes: use this as the working scaffold plan for the first weekend build.

Goal: create a public, open-source base for Atlas TX with a visible product shell, a canonical MVP dataset registry, and scaffolding for both an MCP server and an agent skill.

Architecture:
- Next.js app for the public explorer and lightweight API routes
- dataset registry in `src/lib/`
- future MCP server in `packages/mcp-server/`
- future agent skill in `skills/atlas-tx/`

Tech stack:
- Next.js 16
- React 19
- TypeScript
- Tailwind 4
- npm

---

## Milestone 0: foundation

Deliverables:
- public GitHub repo
- local Next.js app scaffold
- product README
- initial landing page
- health endpoint
- MVP dataset registry
- MCP server placeholder
- agent skill placeholder

## Milestone 1: county explorer shell

Build:
- county selector
- dataset cards from registry
- comparison view shell
- citations panel
- methodology / caveats panel

## Milestone 2: data access layer

Build:
- Texas Socrata fetch helpers
- county normalization helpers
- bounded query layer
- server-side caching strategy

## Milestone 3: MCP + skill requirement

Build at least these tools:
- `discover_datasets`
- `get_dataset_schema`
- `compare_counties`
- `summarize_county_signals`

Skill should document:
- safe use
- attribution
- uncertainty
- prohibited claims

## Milestone 4: judge demo

Demo flow:
1. compare 2-4 counties
2. show environment + social + fiscal cards
3. ask a natural-language question
4. return bounded cited summary
5. show MCP / skill technical requirement satisfied

## Immediate next tasks

1. replace default app shell with Atlas TX landing page
2. lock MVP datasets in code
3. define county metric contracts
4. scaffold MCP package
5. scaffold skill doc
6. push first commit
