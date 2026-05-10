# @atlas-tx/mcp-server

MCP server for Atlas TX county water-risk + permit-protest intelligence.

Every tool returns the standard envelope:

```ts
{ data, sources, caveats, generated_at, cache_state }
```

Tool surface and response shapes are pinned in [`docs/contracts/mcp-tools.md`](../../docs/contracts/mcp-tools.md). Bump that contract before changing any tool name, param, or return shape.

## Running

```sh
# Stdio transport — connect from Claude Desktop / inspector / any MCP client.
npm run mcp:stdio

# JSON dispatch — handy for scripts and ad-hoc smoke checks.
npm run mcp -- discover_datasets
npm run mcp -- summarize_water_risk_for_county '{"county":"Comal County","include_protest_density":true}'
```

The stdio entry registers every tool listed below. The CLI entry takes a tool name plus an optional JSON params blob and prints the envelope to stdout.

## Tools

Read-only over committed snapshots in `public/cache/`:

- `discover_datasets`, `get_dataset_schema` — registry browse + schema lookup.
- `score_pws_drinking_water_risk` — DWRS per Texas PWS from cached SDWIS rows.
- `get_county_analytics_summary`, `list_county_movers`, `get_pressure_risk_scatter`, `get_county_score_decomposition` — Wave 1/2 analytics-spine views.
- `list_protested_permits`, `score_protest_density` — CID protest aggregation + APD.
- `list_permit_filing_red_flags`, `build_permit_protest_prep`, `get_permit_filing_detail`, `list_county_pending_fights` — filing-level scrutiny + protest-prep workflow.
- `get_pipeline_health` — staged refresh status from `public/cache/pipeline-health.json`.
- `summarize_water_risk_for_county` — composite county screening surface (DWRS top PWS + analytics + optional APD).

Mutations are not allowed.

## Guardrails

- No individual commenter PII — protest tools surface aggregate counts and named filing organizations only.
- DWRS / APD / red flags are screening indicators, not findings of harm or permit invalidity.
- EJ block-group overlay is not yet wired; `summarize_water_risk_for_county.top_block_groups` returns `[]` until `src/lib/scoring/ej_overlap.ts` lands.

## Hacking

- Handlers + JSON CLI dispatch live in [`src/index.js`](src/index.js).
- Stdio transport + tool registry (zod input schemas) live in [`src/server.js`](src/server.js). Add a tool there alongside its handler entry.
- Tests: [`tests/mcp-server.test.ts`](../../tests/mcp-server.test.ts) and [`tests/mcp-server-stdio.test.ts`](../../tests/mcp-server-stdio.test.ts). Run `npx vitest run tests/mcp-server.test.ts tests/mcp-server-stdio.test.ts`.
