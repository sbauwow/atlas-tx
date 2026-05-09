# Atlas TX

Open-source Texas drinking-water-risk and environmental-justice explorer for newsroom investigators and civic-tech analysts.

Atlas TX joins state Texas water permits + water districts with federal SDWIS, EJScreen, ACS, and Texas water-quality context to surface Public Water Systems and counties where drinking-water risk, environmental burden indicators, and official signals disagree — outliers and contradictions that exist in raw public data but no one ships pre-computed.

Built for the [Brainforge / Vicinity Texas Open Data Track](docs/plans/2026-05-08-water-risk-refocus.md). MCP server + agent skill are the centerpiece; the web UI exists to make the agent's output legible to humans.

## Who it's for

- **Texas county-newsroom journalists** — surface overlooked drinking-water-risk stories, official-data mismatches, and outliers with cited rows.
- **Civic-tech policy analysts, county budget officers, lobbyists** — county-level briefings on water infrastructure risk + EJ exposure.

## Datasets

### Texas core (Socrata, `data.texas.gov`)
- `7fq8-wig2` — TCEQ Water Quality Individual Permits (Active/Pending)
- `hr84-s96f` — Texas Water Districts

### Federal joins
- **EPA SDWIS** — drinking-water health-based violations per Public Water System
- **EPA EJScreen** — demographic + environmental indicators per census block group
- **Census ACS 5-year** — population denominators and demographics

### Secondary (load if scope allows)
- EPA ECHO (compliance/enforcement), EPA TRI (toxics releases)
- TCEQ Surface Water Quality Segments Viewer — surface-water impairment / use-support context for water bodies
- TCEQ boil-water / public-notice sources — public-facing service disruption context for Public Water Systems
- TCEQ E2 / disinfectant residual reporting — operational treatment-stress context for drinking-water systems
- TCEQ aquatic-life / biological integrity sources — ecology signals that can disagree with compliance summaries
- Weather / hydrologic context sources — NWS alerts, USGS streamflow, drought status, precipitation, and heat indicators for explaining event-driven water anomalies

### Registered but out-of-scope for v1
Fiscal/debt datasets (CPI investigations, Comptroller returns, sales tax, BRB debt, bond elections) remain in `src/lib/mvp-datasets.ts` for a future fiscal-stress angle.

## Derived signals

- **Drinking Water Risk Score (DWRS)** per Public Water System — weighted SDWIS health-based violations × population served × recency.
- **EJ Burden Overlap** per block group / PWS service area — EJScreen demographic indicators × TCEQ permit-buffer density.
- **Surface Water Impairment Context** (additive) — TCEQ segment-level use-support / impairment status for nearby water bodies.
- **Notice / Treatment Stress Context** (planned) — boil-water notices plus disinfectant residual reporting as public-notice and operational-stress indicators.
- **Weather / Hydrologic Context** (planned) — flood alerts, streamflow, drought, rainfall, and heat indicators that help explain when water events are weather-driven versus structurally unusual.
- **Official-Signal Mismatch Detector** (planned) — outlier ranking for counties/PWSs where notices, overflows, burden indicators, and water-quality context do not line up cleanly.
- **Compliance Gap** (secondary) — TCEQ permits × ECHO violations addressed ratio.

## Journalist-first anomaly workflow

Atlas TX should prioritize outliers over generic correlation hunting. The best stories are often places where official indicators do not line up cleanly.

Current anomaly directions to build toward:
- **Notice mismatch detection** — flag places where sanitary sewer overflows, boil-water notices, or future public-notice streams do not match the apparent water-quality / impairment / compliance picture.
- **Biological integrity context** — add Index of Biotic Integrity (IBI) style signals so biology can disagree with chemistry/compliance and create a reporter lead.
- **Treatment-stress indicators** — add E2 disinfectant reporting as an operational water-quality signal.
- **Weather normalization** — attach rainfall, flood alerts, streamflow, drought, and heat context so Atlas TX can distinguish storm-driven anomalies from chronic governance or infrastructure patterns.
- **Distributed submission / tip intake** — treat community-reported or reporter-submitted outliers as a first-class workflow, especially when they contradict the baseline data stack.

Spec lives in `docs/contracts/dataset-registry.md`.

## Architecture

- `src/app/` — Next.js 16 frontend + API routes (UI is decoration; agent is centerpiece — see [`AGENTS.md`](AGENTS.md))
- `src/lib/` — dataset registry, fetchers, county normalization, scoring functions
- `packages/mcp-server/` — MCP server exposing discovery / scoring / summary tools
- `scripts/refresh-cid.ts` — executable CID refresh scaffold for chunked Search One planning/execution + Search Two snapshot generation
- `skills/atlas-tx/` — agent skill doc + references for safe use
- `docs/plans/` — dated implementation plans
- `docs/contracts/` — cross-workstream API surfaces (dataset registry, MCP tools, skill protocol)
- `docs/STATE.md` — live coordination state for collaborating agents
- `docs/OWNERSHIP.md` — path → workstream map

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## CID refresh utility

The repo now includes a CID refresh scaffold runnable with:

```bash
CID_COUNTIES=111111111111156 \
CID_PROGRAM_AREAS='APO;Aggregate Production Operation Registration;NO_PARENT' \
CID_SEARCH_TWO_ORG_NAME='Sierra' \
npm run refresh:cid
```

Current limitation: Search Two works with a seeded organization / permit / person-name query, but live Search One still often returns the upstream TCEQ error page even for chunked county/program requests. The script now fails loud on that condition instead of silently producing misleading case rows. It also exposes a browser-automation fallback hook for Search One so a future browser-driven retriever can be swapped in without changing the refresh pipeline.

## Adjacent Texas open-data problem spaces

Atlas TX is currently focused on drinking-water risk, burden indicators, and official-signal mismatch detection. But the same investigative/open-data pattern appears in several nearby Texas problem areas worth keeping on the roadmap.

### Highest-potential follow-on problems

1. **Flood-risk governance mismatch**
   - User: county reporters, floodplain managers, residents
   - Core question: where do flood exposure, repeated alerts, flood-control context, and growth pressure not line up cleanly?
   - Likely sources: FEMA NFHL, NWS flood alerts, USGS/NOAA hydrologic context, county growth/housing layers
   - Why it matters: strong public-service value, easy map story, naturally adjacent to Atlas TX weather/hydrology work

2. **Permit protest / environmental conflict monitor**
   - User: environmental reporters, advocacy groups, local-government watchers
   - Core question: where are permits drawing unusually high protest pressure, and which project types escalate most often?
   - Likely sources: TCEQ CID protest data, permit datasets, ACS demographics, county context layers
   - Why it matters: Atlas TX already has partial CID/protest momentum, so this is a natural extension

3. **Groundwater dependency watch**
   - User: rural reporters, water planners, ag policy analysts
   - Core question: which counties or aquifer areas appear most exposed to groundwater dependence, depletion risk, or reporting gaps?
   - Likely sources: TWDB Groundwater Database, Submitted Drillers Reports, aquifer layers, drought context
   - Why it matters: highly Texas-specific, under-covered, and well aligned with the Texas Water Data Hub ecosystem

### Additional promising problem areas

- **Road safety outlier finder** — use TxDOT crash/roadway data to surface counties, corridors, and intersections with worse-than-peer serious crash patterns
- **Housing-growth vs infrastructure stress** — compare population/development pressure against utility, flood, transportation, and hazard-planning capacity
- **Reservoir and drought stress dashboard** — track where storage conditions, drought, and growth pressure diverge in ways simple drought labels miss
- **Regulatory transparency / lag monitor** — detect unusual delays, incomplete records, or inconsistent public-notice behavior across agencies or permit classes
- **Public-health environment mismatch finder** — screen for places where environmental burden indicators and social vulnerability cluster unusually strongly, while preserving non-causal guardrails

### Product selection rule

A follow-on problem is worth building when Atlas TX can answer all three:

1. **Who urgently needs this?**
2. **What contradiction or blind spot does the data reveal that a normal dashboard misses?**
3. **Can a defensible first version be built from official public data without fragile scraping?**

This keeps the project focused on sourced outlier detection instead of generic civic-data dashboards.

## For collaborating agents

Read [`AGENTS.md`](AGENTS.md) before opening a PR. It covers Next.js 16 gotchas, workstream ownership, and the no-stomp protocol.

## Constraints

- Public data with attribution. No scraping behind authentication.
- No medical / diagnostic / causal claims about drinking water.
- No investor-grade or rating-agency claims about municipal entities.
- Every score and summary surfaces source datasets, query bounds, and uncertainty.
- EJ overlay is described as *exposure / burden indicators*, not as harm.
- Environmental burden is inferred from indicator layers (for example: impaired surface-water segments, DWRS, permit density, EJScreen), not claimed as a directly observed outcome.
