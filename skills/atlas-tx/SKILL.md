---
name: atlas-tx
description: Safe agent workflow for Texas drinking-water-risk and environmental-justice context across state and federal public data.
---

# Atlas TX

Atlas TX surfaces Texas Public Water System drinking-water risk and environmental-justice burden by joining TCEQ permits + Texas Water Districts with EPA SDWIS, EPA EJScreen, and Census ACS. The skill is an agent-safe wrapper around the Atlas TX MCP server.

## When to activate

Use when the user asks about:
- Texas drinking-water risk, violations, or PWS-level water quality context
- environmental-justice burden / exposure indicators in Texas (county or block-group)
- Texas county-level environmental, infrastructure, or permit context

Do **not** activate for:
- Non-Texas geographies
- Health-outcome causation claims
- Investment / municipal-debt advice
- Personally identifying information about individuals

## Guardrails

- **Indicator, not outcome.** Drinking Water Risk Score is a *risk indicator* derived from violation history, not a measurement of present harm. EJ Burden Overlap is *burden / exposure*, not proof of harm.
- **Cite every source.** Surface every `dataset_id` + publisher + URL from each tool's `sources` envelope.
- **Pass caveats verbatim.** Every entry in `caveats` must reach the user without paraphrasing away the qualifier.
- **Stamp the snapshot date.** When `cache_state: "snapshot"`, name the snapshot date.
- **Bound numeric claims.** Never extrapolate beyond returned rows. If a comparison isn't supported by data, say so.
- No medical / diagnostic / causal claims linking a water system or facility to specific health outcomes.
- No investor-grade or rating-agency claims about municipal entities (fiscal/debt is out of scope at v0.1).
- No naming of individuals from any dataset.

## MCP tools

This skill expects the Atlas TX MCP server at `packages/mcp-server/` with the v0.1.0 tool surface defined in [`docs/contracts/mcp-tools.md`](../../docs/contracts/mcp-tools.md):

- `discover_datasets`
- `get_dataset_schema`
- `score_pws_drinking_water_risk`
- `overlay_ej_burden`
- `summarize_water_risk_for_county`

If a required tool is missing, fall back to `discover_datasets` + `get_dataset_schema` and decline the user's request with a clear explanation.

## Example invocation

User: *"What Texas counties have the most overlooked drinking-water risk?"*

1. Call `score_pws_drinking_water_risk` with `{ limit: 25 }`.
2. Aggregate scores by `county`. Identify counties whose mean score is high but who do not appear in well-known rankings (e.g. NRDC, EPA enforcement annual report).
3. For the top 3 counties, call `summarize_water_risk_for_county` with `{ county }`.
4. For at least one of those counties, call `overlay_ej_burden` with `{ county, buffer_miles: 1 }` to add demographic context.
5. Return a sourced response that:
   - names the counties, scores, and population served
   - quotes the `caveats` from each tool envelope
   - lists every `Source` (publisher + URL + retrieved_at)
   - stamps the snapshot date
   - frames the finding as risk *indicators*, not harm

## References

- TCEQ Water Quality Permits — https://www.tceq.texas.gov/permitting/wastewater
- Texas Water Districts (Office of Water) — https://data.texas.gov/dataset/Texas-Water-Districts/hr84-s96f
- EPA SDWIS — https://www.epa.gov/ground-water-and-drinking-water/safe-drinking-water-information-system-sdwis-federal-reporting
- EPA EJScreen — https://www.epa.gov/ejscreen
- EPA ECHO — https://echo.epa.gov/
- Census ACS — https://www.census.gov/programs-surveys/acs

Stable URLs only. Don't link results pages or filtered queries — those rot.

## Reproducing the example

From a clean clone:
```bash
npm install
# (M2+) start MCP server
node packages/mcp-server/src/index.js
# in another shell, run the example invocation against the local MCP
```

If this doesn't reproduce, the skill is not done. See [`docs/contracts/skill-protocol.md`](../../docs/contracts/skill-protocol.md).
