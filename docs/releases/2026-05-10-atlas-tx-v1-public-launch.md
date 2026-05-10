# Atlas TX v1.0.0 — Public launch candidate

Primary live destination: https://atlastexas.org

## Release headline
Atlas TX is a map-first Texas public-interest intelligence system with a live public site, a local MCP server, and repo-local agent skills that expose the same evidence stack to AI-native workflows.

## What this release is for
- public launch prep
- judge-facing demo readiness
- GitHub release drafting
- Freshcrate submission / announcement

## Announce these surfaces together
1. atlastexas.org — the live product
2. county-map-first web workflows — the human-facing intelligence surface
3. `packages/mcp-server/` — MCP access to the same evidence
4. `skills/atlas-tx/SKILL.md` — agent skill wrapper around the MCP surface

## Suggested GitHub release title
Atlas TX v1.0.0 — public launch candidate

## Suggested release body
Atlas TX is now being prepared for live public consumption at https://atlastexas.org.

This release packages Atlas TX as more than a map demo:
- a county-map-first Texas intelligence product
- a reproducible public-data evidence stack
- a local MCP server for agent/tool use
- repo-local Atlas TX skills for safe agent invocation

### Highlights
- Live public web destination: https://atlastexas.org
- MCP server entrypoint: `npm run mcp:stdio`
- JSON MCP/CLI dispatch for scripting: `npm run mcp -- <tool> <json>`
- Atlas TX skill docs under `skills/atlas-tx/`
- Texas county evidence workflows across water, permits, maps, analytics, watchlists, and field-observation lanes

### Recommended judge flow
1. Start at atlastexas.org
2. Show county maps and one concrete permit/water investigation path
3. Demonstrate the same evidence through the Atlas TX MCP server
4. Show the Atlas TX skill as the reusable agent interface

### Freshcrate positioning
Atlas TX should be framed as an MCP-enabled open-source agent package/project with a live public destination, not only as a website.
