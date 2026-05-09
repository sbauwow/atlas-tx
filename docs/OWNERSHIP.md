# OWNERSHIP — path → workstream

> Edit this when a new top-level directory or contract appears. Workstreams are defined in [`AGENTS.md`](../AGENTS.md).

## Workstreams

| Workstream | Mission |
|---|---|
| **data** | Source data, normalize, score. Owns the dataset registry and scoring functions. |
| **web** | Next.js app + UI. Renders against cached fixtures, never live federal APIs in the demo path. |
| **mcp** | MCP server exposing tools the agent skill calls. Returns structured envelopes per `mcp-tools.md`. |
| **skill** | Agent skill doc, references, guardrails. End-to-end runnable against the MCP server. |
| **docs** | Plans, contracts, state, ownership, README, AGENTS.md. |

## Path map

| Path | Owner | Notes |
|---|---|---|
| `src/app/` | web | Next.js 16 — read `node_modules/next/dist/docs/` first |
| `src/app/api/` | web | API routes are still web; if they expose data shapes also used by mcp, document in `dataset-registry.md` |
| `src/lib/` | data | Dataset registry, fetchers, normalizers, scoring |
| `src/lib/datasets/` | data | One file per source (sdwis.ts, ejscreen.ts, acs.ts, ...) |
| `src/lib/scoring/` | data | One file per derived signal (dwrs.ts, ej_overlap.ts, ...) |
| `tests/` | data | Vitest. Fetcher tests live here; UI tests would live in `src/app/` adjacent |
| `tests/fixtures/` | data | Small canned API responses for unit tests |
| `public/` | web | Static assets |
| `public/cache/` | data | Pre-cached external API snapshots (committed). Demo path reads here. |
| `data/` | data | **gitignored**. Raw downloads, working scratch, intermediate joins. Never the demo path. |
| `packages/mcp-server/` | mcp | MCP scaffold |
| `packages/mcp-server/src/` | mcp | Tool implementations + dispatcher |
| `skills/atlas-tx/` | skill | SKILL.md + references |
| `docs/plans/` | docs | Dated implementation plans (latest = canonical, mark older as superseded) |
| `docs/contracts/` | docs (cross) | Cross-workstream APIs. Any workstream may propose a change; **must** notify dependent workstreams in `STATE.md` |
| `docs/research/` | docs | Exploratory background notes. Not contracts, not plans. Cite from a plan when they graduate into committed scope. |
| `docs/STATE.md` | all | Live coordination — every agent edits |
| `docs/OWNERSHIP.md` | docs | This file |
| `README.md` | docs | Outward-facing |
| `AGENTS.md` | docs | Inward-facing collab spine. Top block is auto-managed (see markers). |
| `package.json`, `tsconfig.json`, `next.config.ts`, configs | web (default) | Cross-cutting changes (e.g. adding a workspace) need a `cross:` PR |

## Cross-boundary rules

- **data ↔ mcp**: data exposes typed scoring functions; mcp imports and wraps. The function signatures + return shapes are documented in `docs/contracts/dataset-registry.md`. Changing a signature → bump that contract + post in STATE.md.
- **mcp ↔ skill**: mcp publishes a tool catalog (name, params, response envelope) in `docs/contracts/mcp-tools.md`. Skill consumes that catalog. New tool → add to contract first, then implement.
- **mcp ↔ web**: web may call MCP tools directly (server route handlers) or replicate the underlying data calls. Either is fine, but if web duplicates logic, document the duplication in the route handler comment.
- **skill ↔ everything**: skill is read-only consumer. It never writes data, never fetches outside the MCP surface.

## When ownership is unclear

Default to the workstream whose path it lives under. If it crosses two paths, it crosses two workstreams — open a `cross:` PR. If you can't tell, file a question in `docs/STATE.md` under Blocked.
