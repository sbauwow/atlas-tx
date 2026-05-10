# Atlas TX

Open-source Texas drinking-water-risk and environmental-justice explorer for newsroom investigators and civic-tech analysts.

Atlas TX joins state Texas water permits + water districts with federal SDWIS, EJScreen, ACS, and Texas water-quality context to surface Public Water Systems and counties where drinking-water risk, environmental burden indicators, and official signals disagree — outliers and contradictions that exist in raw public data but no one ships pre-computed.

Built for the [Brainforge / Vicinity Texas Open Data Track](docs/plans/2026-05-08-water-risk-refocus.md). MCP server + agent skill are the centerpiece, but Atlas now also ships map-first county workflows so humans can start on the statewide county view, drill into counties, and test their own correlations against the same cached evidence the agent uses.

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

## Map-first analyst workflows

- `/analytics` is now county-map first. The choropleth is the headliner, and decomposition bars, movers tables, and scatterplots act as correlation-hunting follow-on views rather than the first surface.
- `/water` is also county-map first. Users can switch between operational risk and mismatch severity, then move from the statewide map into county detail and county table views.
- County maps are meant to empower user-led pattern discovery, not force a single narrative. Atlas surfaces grounded county evidence and lets the user test relationships across pressure, risk, mismatch, hydrology, permits, and operator concentration.

## Whitepaper and research artifacts

Atlas TX now includes a paper-style research track inside the repo itself. The current whitepaper-oriented artifacts are:

- `papers/2026-05-10-county-month-water-risk-paper-draft.md` — current paper draft for the Texas county-month open-data water-risk study
- `outputs/thesis-status/2026-05-09-thesis-status-memo.md` — concise thesis-status memo with current empirical read
- `papers/2026-05-09-panel-spec-and-experiment-plan.md` — panel contract and experiment plan
- `papers/2026-05-10-grassroots-strip-validation-preregistration-and-schema.md` — separate preregistration/schema for the grassroots validation lane
- `outputs/thesis-status/2026-05-09-heat-ablation-memo.md` — decomposition of the earlier temperature/heat result
- `outputs/thesis-status/2026-05-10-seasonality-robustness-memo.md` — month-of-year robustness pass showing broad seasonality as a major predictor

Whitepaper summary, in one paragraph:

- the current county-month study asks what contest-relevant Texas open data can and cannot support for next-month SDWIS risk ranking
- chronic county baseline risk and broad month-of-year seasonality dominate the predictive signal
- empirical-Bayes stabilization materially improves county risk ranking
- precipitation, flood-warning, streamflow, and drought layers add limited incremental value at this resolution
- compact temperature-seasonality terms add only a smaller residual refinement after explicit month-of-year controls
- grassroots strip observations remain a separate community-validation lane, not a core supervisory target

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

## MCP server

Atlas TX ships a local MCP tool surface in `packages/mcp-server/`.

Run it directly:

```bash
npm run mcp -- discover_datasets
npm run mcp -- list_permit_filing_red_flags '{"county":"Travis County","limit":5}'
npm run mcp -- get_permit_filing_detail '{"tceq_id":"WQ0000447000"}'
npm run mcp -- build_permit_protest_prep '{"tceq_id":"WQ0000447000"}'
npm run mcp -- list_county_pending_fights '{"county":"Travis County","limit":5}'
npm run mcp -- get_pipeline_health
```

Current MCP surface includes:
- `discover_datasets`
- `get_dataset_schema`
- `score_pws_drinking_water_risk`
- `list_protested_permits`
- `score_protest_density`
- `list_permit_filing_red_flags`
- `get_permit_filing_detail`
- `build_permit_protest_prep`
- `list_county_pending_fights`
- `get_pipeline_health`

Note: filing-detail and protest-prep commands require a CID snapshot row for the requested `tceq_id`. If CID has not been refreshed yet, run `npm run refresh:cid` first.

See `docs/contracts/mcp-tools.md` for the contract.

## CID refresh utility

The repo now includes a CID refresh scaffold runnable with:

```bash
CID_COUNTIES=111111111111156 \
CID_PROGRAM_AREAS='APO;Aggregate Production Operation Registration;NO_PARENT' \
CID_SEARCH_TWO_ORG_NAME='Sierra' \
npm run refresh:cid
```

Current limitation: Search Two works with a seeded organization / permit / person-name query, but live Search One still often returns the upstream TCEQ error page even for chunked county/program requests. The script now fails loud on that condition instead of silently producing misleading case rows. It also exposes a browser-automation fallback hook for Search One so a future browser-driven retriever can be swapped in without changing the refresh pipeline.

Run the staged refresh pipeline:

```bash
npm run refresh:all
```

That command executes the refresh stack in dependency order and writes `public/cache/pipeline-health.json` with per-step status, timing, and overall health.

Automation plan: `docs/plans/2026-05-09-mcp-and-pipeline-automation.md`

## Citizen observation layer (prototype)

A separate, **non-regulatory** lane at [`/citizen`](src/app/citizen/page.tsx)
where users can submit a photograph of a freshwater test strip laid next to
its bottle's color chart. A hybrid pipeline (browser pixel-sampling + Claude
Opus vision sanity-check) produces per-analyte band labels — never numeric
measurements. Results are stored in a local SQLite DB via Prisma.

Strict isolation: this layer does **not** feed DWRS, EJ Burden Overlap, the
mismatch detector, or any other scorer. See
[`docs/contracts/dataset-registry.md`](docs/contracts/dataset-registry.md) §0.7.0
and [`docs/research/smartphone-colorimetry.md`](docs/research/smartphone-colorimetry.md) §17
for the constraints that govern this lane.

It is a UX/architecture prototype, not a validated measurement system. Bands
depend on lighting, strip brand, incubation timing, and the user's in-frame
chart. Treat outputs as approximate, never as compliance or diagnosis.

## For collaborating agents

Read [`AGENTS.md`](AGENTS.md) before opening a PR. It covers Next.js 16 gotchas, workstream ownership, and the no-stomp protocol.

## Constraints

- Public data with attribution. No scraping behind authentication.
- No medical / diagnostic / causal claims about drinking water.
- No investor-grade or rating-agency claims about municipal entities.
- Every score and summary surfaces source datasets, query bounds, and uncertainty.
- EJ overlay is described as *exposure / burden indicators*, not as harm.
- Environmental burden is inferred from indicator layers (for example: impaired surface-water segments, DWRS, permit density, EJScreen), not claimed as a directly observed outcome.
