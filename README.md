# Atlas TX

Atlas TX is an open-source Texas county intelligence platform for public-interest data work.

It combines permit, water, hydrology, governance, environmental, and county-level context into map-first analytical workflows, APIs, cached research artifacts, and a local MCP server. The product is designed for investigators, civic-tech analysts, policy operators, and agentic workflows that need grounded Texas county evidence rather than generic dashboards.

## What Atlas TX is

Atlas TX is not a generic consumer app and not a single-score black box.

It is a governed county-intelligence workspace that helps users:
- start from a statewide county map
- drill into water, permit, operator, and dependency signals
- inspect contradictions and outliers in public data
- open the underlying county, source, permit, and operator surfaces
- use the same cached evidence through UI, API, and MCP tools

## Current product surfaces

### Human-facing routes
- `/` — platform overview
- `/analytics` — statewide analytics terminal with county map headliner, risk / pressure / oil views, movers, scatter, and watchlist-ready lanes
- `/water` — county-map-first water explorer with operational risk, mismatch severity, and TXG31 oil-and-gas extraction footprint
- `/water/network` — county dependency and hydrology relationship workspace
- `/water/counties/[slug]` — county water detail
- `/water/sources/[slug]` — source provenance and anomaly detail
- `/counties` — county explorer
- `/counties/[slug]` — county intelligence page
- `/permits` — permit pressure workspace
- `/permits/[tceqId]` — permit detail
- `/operators` — operator index
- `/operators/[slug]` — operator detail
- `/watchlists` — saved watchlists
- `/map` — interactive map client
- `/citizen` — isolated citizen observation prototype lane
- `/glossary` — term definitions
- `/education` — supporting explainers

### API routes
- `/api/health`
- `/api/beacon` — first-party pageview/click pixel telemetry
- `/api/event` — structured telemetry event ingest
- `/api/counties/overview`
- `/api/counties/[slug]`
- `/api/permits/locations`
- `/api/tiles/[z]/[x]/[y]`
- `/api/watchlists`, `/api/watchlists/*`
- `/api/water/overview`
- `/api/water/counties/[slug]`
- `/api/water/oil-gas-extraction`
- `/api/water/alerts`
- `/api/water/gauges`
- `/api/water/sources/[slug]`
- `/api/water/sources/network`
- `/api/water/sources/network/hydrology`
- `/api/water/fema/nfhl/*`
- `/api/water/lcra/*`
- `/api/water/gbra/*`
- `/api/citizen/observations`, `/api/citizen/observations/[id]`
- `/api/scrape/plan`

## Core workflows

### 1. Map-first county analysis
Atlas leads with county maps, not tables.

- `/analytics` emphasizes statewide county risk, permit pressure, and TXG31 oil extraction density.
- `/water` emphasizes operational water risk, mismatch severity, and oil-and-gas extraction permit footprint.
- Supporting tables, movers, and scatterplots are secondary validation layers.

### 2. County-to-detail drilldown
A user should be able to move from statewide map → county selection → county detail → source / permit / operator evidence without changing mental model.

### 3. Evidence parity across UI, API, and MCP
The same cached and normalized public-data layers are intended to power:
- the Next.js UI
- JSON API routes
- local MCP tools
- scripted refresh / pipeline health utilities

### 4. Watchlist-ready analytical handoff
Atlas includes watchlist and queue-style surfaces so a user or agent can save, rank, and reopen counties, operators, and analytical leads.

## Data lanes

### Texas core sources
- `7fq8-wig2` — TCEQ Water Quality Individual Permits (Active/Pending)
- `6pm5-am5m` — TCEQ General Water Permits
- `hr84-s96f` — Texas Water Districts
- additional TCEQ/TWDB/authority lanes as documented in the repo contracts and wiki

### Federal joins and national context
- EPA SDWIS
- EPA EJScreen
- Census ACS 5-year
- FEMA NFHL
- USGS NWIS
- NOAA/NWS

### Regional authority and basin context
Atlas also includes basin-specific and authority-specific lanes where useful, including LCRA and GBRA integrations, with explicit caveats when a lane is basin-scoped rather than statewide.

## Derived / normalized signals

Current and planned signal families include:
- county risk signals
- permit pressure signals
- TXG31 oil-and-gas extraction permit counts
- TXG34 petroleum bulk permit counts
- county mismatch signals
- source dependency signals
- downstream hydrology dependency scores
- governance density
- floodplain coverage proxies
- stream gauge and alert context
- county-month research artifacts for water-risk modeling

Atlas treats these as evidence layers, not final causal verdicts.

## Architecture

### App/runtime
- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind
- Prisma
- SQLite for local app/stateful prototype lanes

### Major directories
- `src/app/` — Next.js routes, pages, API endpoints
- `src/lib/` — normalization, fetchers, scoring, telemetry, query helpers, county logic, water services
- `src/app/components/` — reusable app UI and chart shells
- `packages/mcp-server/` — local MCP surface
- `scripts/` — refresh pipelines and dataset builders
- `public/cache/` — committed or generated cache artifacts used by the app
- `docs/` — contracts, plans, design, wiki, state, ownership, research
- `skills/` — repo-local agent skills
- `tests/` — Vitest coverage

### Important internal modules
- `src/lib/water/water-summary-service.ts` — water overview + county breakdown orchestration
- `src/lib/water/tceq-general-permits.ts` — permit normalization and lane classification (`TXG31`, `TXG34`, residual)
- `src/lib/query-params.ts` — shared parsing for route-state parameters
- `src/lib/telemetry/*` — local telemetry envelope and client helpers
- `src/app/components/track.ts` — pixel-style beacon tracking
- `src/app/components/tracked-link.tsx` — structured event tracking on link interactions
- `src/app/components/page-view-beacon.tsx` — pageview beacon client hook

## Telemetry model

Atlas now ships two first-party telemetry paths:

### 1. Beacon path
- route: `/api/beacon`
- purpose: low-friction pageview/click-style tracking via image pixel
- current usage: pageview and lightweight link/event emission

### 2. Structured event path
- route: `/api/event`
- purpose: normalized event ingestion with session ID and envelope metadata
- envelope fields:
  - `app`
  - `env`
  - `release`
  - `user_id`
  - `session_id`
  - `event_name`
  - `props`
  - `ts`

This split preserves fail-open beacon tracking while enabling richer product telemetry across map mode, county selection, watchlists, and drilldowns.

## Query-state model

Atlas uses URL-driven analytical state heavily.

Shared helpers now live in:
- `src/lib/query-params.ts`

Current helper set:
- `getFirstQueryParam`
- `parseEnumQueryParam`
- `resolveAllowedQueryParam`
- `clampQueryText`
- `parsePositiveIntQueryParam`

These are used to stabilize mode/county parsing across analytics and water surfaces and are intended to expand to permits, operators, and map routes.

## MCP server

Atlas ships a local MCP surface in `packages/mcp-server/`.

Run it with:

```bash
npm run mcp -- discover_datasets
npm run mcp -- list_permit_filing_red_flags '{"county":"Travis County","limit":5}'
npm run mcp -- get_permit_filing_detail '{"tceq_id":"WQ0000447000"}'
npm run mcp -- build_permit_protest_prep '{"tceq_id":"WQ0000447000"}'
npm run mcp -- list_county_pending_fights '{"county":"Travis County","limit":5}'
npm run mcp -- get_pipeline_health
```

See:
- `docs/contracts/mcp-tools.md`
- `docs/contracts/skill-protocol.md`

## Refresh and pipeline operations

### Local development
```bash
npm install
npm run dev
```

### Build/test/lint
```bash
npm test
npm run lint
npm run build
```

### Data refresh entrypoints
```bash
npm run refresh:all
npm run refresh:cid
npm run refresh:surface-water-quality
npm run refresh:city-open-data
npm run refresh:city-open-data-curated
npm run refresh:city-open-data-ranked
npm run refresh:twdb-hydrology
npm run refresh:county-month-precipitation
npm run refresh:county-month-streamflow
npm run refresh:county-month-drought
npm run refresh:county-month-temperature
npm run refresh:county-month-nws-flood-alerts
```

### Pipeline outputs
- `public/cache/pipeline-health.json` — refresh pipeline health/status
- `public/cache/*` — analytics and dataset artifacts consumed by pages and APIs

## Technical documentation index

### Primary operational docs
- `AGENTS.md` — development guide for agents and contributors
- `docs/STATE.md` — current operational/project state
- `docs/OWNERSHIP.md` — path and workstream ownership
- `docs/plans/README.md` — plan index

### Contracts
- `docs/contracts/dataset-registry.md`
- `docs/contracts/mcp-tools.md`
- `docs/contracts/skill-protocol.md`
- `docs/contracts/community-observation.md`
- `docs/contracts/county-month-water-risk-panel.md`

### Design and execution plans
- `docs/design/atlas-missions-design-memo.md`
- `docs/plans/2026-05-09-atlas-of-maps-reframe.md`
- `docs/plans/2026-05-09-mcp-and-pipeline-automation.md`
- `docs/plans/2026-05-10-county-dataset-roadmap.md`
- additional dated plans under `docs/plans/`

### Research and wiki
- `docs/research/` — method and source research
- `docs/wiki/index.md` — wiki index
- `docs/wiki/datasets/` — per-dataset notes
- `docs/wiki/concepts/` — domain vocabulary
- `docs/wiki/agencies/` — agency references
- `docs/wiki/comparisons/` — source comparisons
- `docs/wiki/episodes/` — execution log slices

### Repo-local skills
- `skills/atlas-tx-bootstrap/SKILL.md`
- `skills/atlas-tx-public-data-lanes/SKILL.md`
- `skills/atlas-tx-water-data-lane/SKILL.md`
- `skills/atlas-tx-mcp-pipeline-automation/SKILL.md`
- `skills/atlas-tx-pending-permits-dashboard/SKILL.md`
- `skills/atlas-tx-permit-red-flags-protest-helper/SKILL.md`
- `skills/atlas-tx-regional-water-authority-ingestion/SKILL.md`
- `skills/atlas-tx-glossary-tooltips/SKILL.md`
- `skills/atlas-tx-web-style-taxonomy/SKILL.md`
- `skills/atlas-tx/SKILL.md`

## Documentation completeness checklist

This README is intended to cover the platform at the level of a public technical overview.

Covered here:
- product purpose
- route surfaces
- API surfaces
- data lanes
- architecture
- telemetry model
- query-state model
- MCP surface
- refresh/pipeline commands
- documentation index
- testing/build workflow
- guardrails and constraints

Canonical deeper docs live in `docs/`, `skills/`, and `AGENTS.md`.

## Citizen observation lane

Atlas includes a separate, non-regulatory citizen observation prototype at `/citizen`.

Important constraints:
- it is isolated from the main scoring stack
- it does not feed county risk scoring or water mismatch scoring
- it is a prototype workflow for strip-photo observation capture and review
- it should not be interpreted as a compliance, diagnostic, or regulatory measurement system

See:
- `docs/contracts/community-observation.md`
- `docs/research/smartphone-colorimetry.md`

## Development workflow

Atlas has been built through an agent-assisted workflow centered on Hermes Agent as the orchestration layer, with repo-local skills, MCP tooling, and iterative map/API/test slices inside this repository.

Public README copy intentionally stays focused on the platform and its technical surfaces rather than on specific model-vendor branding.

## Constraints and product guardrails

- public/open data only, with source attribution
- no medical or diagnostic claims
- no unsupported causal claims
- no investor-grade or ratings-agency claims
- burden/exposure indicators are described as indicators, not proof of harm
- every serious score or summary should remain explainable by source datasets, joins, and caveats
- basin-specific lanes must stay clearly labeled as basin-specific, not statewide truth

## Contributing

Start with:
- `AGENTS.md`
- `docs/OWNERSHIP.md`
- `docs/STATE.md`

Then run:
```bash
npm install
npm test
npm run lint
npm run build
```

If you are touching route-state, telemetry, map modes, or water summary logic, update the relevant tests in `tests/` in the same slice.
