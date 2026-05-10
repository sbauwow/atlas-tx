# Atlas TX Agent Build Workflow

This document explains how Atlas TX has been built with Hermes Agent as the orchestration layer, using multiple coding agents and repository-local skills without turning the public README into a model-vendor document.

## Short version

Atlas TX has been developed through a multi-agent workflow centered on:
- Hermes Agent for orchestration, repo inspection, planning, testing, and verification
- Codex for implementation slices, edits, and iterative code changes
- Claude-assisted passes for bounded review, alternative implementation paths, and cross-checking on difficult slices
- additional agent/model assistance where useful for narrow subtasks

The important thing is the workflow shape, not the branding:
- inspect first
- define contracts
- ship narrow slices
- test immediately
- keep map/API/data parity
- commit/push in small verified increments

## Why Atlas used an agent workflow

Atlas TX is a cross-cutting product with:
- route-heavy Next.js work
- API contracts
- public-data ingestion and normalization
- map-first analytical UX
- docs/contracts/wiki state
- MCP server surfaces
- skills and operator workflows

That mix is a strong fit for agent-assisted development because the system benefits from:
- repetitive grounded repo inspection
- fast generation of route/data/test scaffolds
- contract maintenance across surfaces
- frequent verification after each slice
- parallel work on docs, API routes, UI, and data adapters

## Operating model

### 1. Hermes as orchestration spine

Hermes handled the higher-level loop:
- inspect repo state
- load relevant repo-local skills
- identify affected files
- update task/todo state
- run validation commands
- check git state
- rebase/push when origin moved
- keep docs and implementation in sync

### 2. Bounded implementation slices

Work was typically shipped in narrow slices, for example:
- one map improvement
- one API route
- one permit-lane split
- one telemetry slice
- one docs sync pass

Each slice aimed to include:
- code
- tests
- build/lint verification
- commit/push

### 3. Contract-first where possible

Before broad UI work, Atlas leaned on explicit contracts in:
- `docs/contracts/`
- `docs/OWNERSHIP.md`
- `docs/STATE.md`
- repo-local skills in `skills/`

This reduced drift between:
- UI pages
- API responses
- MCP tools
- agent workflows

### 4. Map/API/data parity

A core build rule for Atlas has been that the same evidence should be reusable across:
- UI route surfaces
- JSON API routes
- cached analytical artifacts
- MCP tools

This is why many slices were implemented through shared library/service layers first, then surfaced in routes/pages.

### 5. Verification after every slice

The standard loop has been:
1. inspect current state
2. edit the minimum viable set of files
3. run targeted tests
4. run lint
5. run build
6. inspect git diff/status
7. commit and push

## Common agent roles in practice

Even when one top-level orchestrator drove the work, the repo naturally split into agent-friendly roles:

- data adapter role
  - source normalization
  - county joins
  - cache/freshness logic
- route/runtime role
  - API routes
  - query-state parsing
  - telemetry endpoints
- map/UI role
  - choropleths
  - selected-county panels
  - ranked tables and legends
- contract/docs role
  - README
  - `docs/contracts/*`
  - `docs/STATE.md`
  - `docs/OWNERSHIP.md`
  - repo-local skills
- verification role
  - targeted test runs
  - lint/build
  - regression checks

## What worked well

### Narrow file ownership

Atlas benefited from keeping slices narrow and bounded. A good slice usually touched:
- one page
- one service/helper
- one or two tests
- optional contract/doc updates

### Repo-local skills

The `skills/` directory became procedural memory for repeatable Atlas tasks, especially around:
- water lanes
- permit lanes
- public-data ingestion
- MCP/pipeline automation
- glossary/tooltips

### Docs kept close to execution

Instead of one stale top-level design document, Atlas accumulated:
- contracts
- dated plans
- wiki notes
- ownership maps
- state coordination

That structure works well with agents because each slice has somewhere explicit to record intent and constraints.

### URL-driven route state

Map-first workflows with URL-driven mode/county state made it easier for both humans and agents to reason about navigation, test cases, and linkability.

## Risks and mitigations

### Risk: drift between pages and shared logic
Mitigation:
- shared service layers
- contract docs
- tests updated in same slice

### Risk: documentation lagging implementation
Mitigation:
- docs updated as part of shipping slices
- README and docs treated as first-class deliverables

### Risk: remote branch moving during active work
Mitigation:
- frequent commit/push
- rebase when needed
- verify again after rebase

### Risk: vendor/model-centric documentation
Mitigation:
- public docs focus on architecture and workflow shape
- agent/model details live in internal or design-oriented docs like this file

## Recommended workflow for future contributors

If you are extending Atlas with agent assistance:

1. read:
   - `AGENTS.md`
   - `docs/OWNERSHIP.md`
   - `docs/STATE.md`
   - relevant files in `docs/contracts/`
2. load the relevant repo-local skill if one exists
3. work in a narrow slice
4. update tests in the same slice
5. run:
   - `npm test`
   - `npm run lint`
   - `npm run build`
6. update docs when architecture or workflow meaningfully changed
7. commit and push in small verified increments

## Related files

- `AGENTS.md`
- `README.md`
- `docs/OWNERSHIP.md`
- `docs/STATE.md`
- `docs/contracts/`
- `skills/`
