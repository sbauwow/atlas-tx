# Atlas TX

Open-source Texas drinking-water-risk and environmental-justice explorer for newsroom investigators and civic-tech analysts.

Atlas TX joins state Texas water permits + water districts with federal SDWIS, EJScreen, and ACS data to surface Public Water Systems and counties where drinking-water risk and demographic burden compound — joins that exist in raw public data but no one ships pre-computed.

Built for the [Brainforge / Vicinity Texas Open Data Track](docs/plans/2026-05-08-water-risk-refocus.md). MCP server + agent skill are the centerpiece; the web UI exists to make the agent's output legible to humans.

## Who it's for

- **Texas county-newsroom journalists** — surface overlooked drinking-water-risk stories with cited rows.
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
- EPA ECHO (compliance/enforcement), EPA TRI (toxics releases), TWDB drought monitor

### Registered but out-of-scope for v1
Fiscal/debt datasets (CPI investigations, Comptroller returns, sales tax, BRB debt, bond elections) remain in `src/lib/mvp-datasets.ts` for a future fiscal-stress angle.

## Derived signals

- **Drinking Water Risk Score (DWRS)** per Public Water System — weighted SDWIS health-based violations × population served × recency.
- **EJ Burden Overlap** per block group / PWS service area — EJScreen demographic indicators × TCEQ permit-buffer density.
- **Compliance Gap** (secondary) — TCEQ permits × ECHO violations addressed ratio.

Spec lives in `docs/contracts/dataset-registry.md`.

## Architecture

- `src/app/` — Next.js 16 frontend + API routes (UI is decoration; agent is centerpiece — see [`AGENTS.md`](AGENTS.md))
- `src/lib/` — dataset registry, fetchers, county normalization, scoring functions
- `packages/mcp-server/` — MCP server exposing discovery / scoring / summary tools
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

## For collaborating agents

Read [`AGENTS.md`](AGENTS.md) before opening a PR. It covers Next.js 16 gotchas, workstream ownership, and the no-stomp protocol.

## Constraints

- Public data with attribution. No scraping behind authentication.
- No medical / diagnostic / causal claims about drinking water.
- No investor-grade or rating-agency claims about municipal entities.
- Every score and summary surfaces source datasets, query bounds, and uncertainty.
- EJ overlay is described as *exposure / burden indicators*, not as harm.
