# Atlas TX — judge one-pager

Live product: https://atlastexas.org
GitHub: https://github.com/sbauwow/atlas-tx
Release: https://github.com/sbauwow/atlas-tx/releases/tag/v1.0.0

## What Atlas TX is
Atlas TX is a map-first Texas county-intelligence system for public-interest evidence.

It helps users move from statewide county patterns into real supporting evidence across:
- water and hydrology
- permits and operator pressure
- environmental burden indicators
- source-attributed MCP and agent workflows
- additive field verification through the Android capture lane

## Why it matters
Texas public data is fragmented across agencies, portals, and county-by-county workflows.

Atlas TX turns that fragmented public-record surface into a usable evidence system for:
- journalists
- civic-tech analysts
- local operators
- AI-native workflows

## What makes it different
- county-map-first, not dashboard-first
- live public product at atlastexas.org
- same evidence stack available through web, API, and MCP
- repo-local Atlas TX skill for reusable agent access
- additive Android field-observation lane that stays separate from authoritative records

## Main public surfaces
1. Live site: https://atlastexas.org
2. MCP server: `packages/mcp-server/` via `npm run mcp:stdio`
3. Atlas TX skill: `skills/atlas-tx/SKILL.md`
4. Android capture lane: `android/`

## Judge flow in one sentence
Start at atlastexas.org, drill into one county or permit workflow, then show the same evidence through MCP + skill, and optionally end with the Android field-verification lane.

## Guardrails
- public-record risk is not the same as harm
- community strip/app observations are screening signals, not regulatory truth
- field observations are additive, not replacements for the core evidence stack

## Why this is a strong public-launch project
Atlas TX is not just a demo website. It is a multi-surface evidence system with:
- a live public destination
- reusable MCP access
- agent-skill packaging
- a field-verification extension

That makes it legible to both judges and technical evaluators: they can see the product on the web, then verify that the same evidence system is accessible programmatically and operationally.
