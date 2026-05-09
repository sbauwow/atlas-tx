# Atlas TX — MCP Augmentation + Automated Pipeline Plan

> For Hermes: this is an implementation plan for the next automation slice, not a request to ship the entire pipeline in this commit.

Goal
- Turn Atlas TX’s MCP layer into a first-class operator interface for filing scrutiny and protest-prep workflows, then automate the data-refresh pipeline so MCP/web surfaces stay current without manual heroics.

Architecture
- Keep one source of truth: snapshot-driven refresh scripts write normalized artifacts; web pages and MCP tools consume the same artifacts.
- Prefer deterministic staged refreshes over one giant fragile job.
- Treat CID as the riskiest source in the pipeline and isolate it behind explicit freshness, fallback, and failure reporting.

Already shipped
- Filing-level red-flag scoring on `/permits`
- Filing detail pages at `/permits/[tceqId]`
- Protest-prep panel on filing detail pages
- MCP tool scaffold with DWRS + protest-density tools
- CID refresh scaffold with browser fallback hook and snapshot target resolution

Desired end state
- A refresh pipeline that can rebuild all committed/public cache artifacts in a predictable order
- MCP tools that expose the same filing/protest workflows the UI now supports
- README instructions that let operators run the MCP server and understand the refresh stack

---

## Part 1 — MCP augmentation plan

### New tools to keep
1. `list_permit_filing_red_flags`
- Inputs:
  - `county?`
  - `limit?`
- Output:
  - filing-level red-flag rows with score, county, program area, and reason strings

2. `build_permit_protest_prep`
- Inputs:
  - `tceq_id`
- Output:
  - participation status
  - evidence checklist
  - draft text
  - export text

### Next MCP additions
3. `get_permit_filing_detail`
- Same source context as `/permits/[tceqId]`
- Returns:
  - procedural status
  - county permit count
  - related permits
  - red-flag row
  - caveats

4. `list_county_pending_fights`
- Inputs:
  - `county`
  - `limit?`
- Purpose:
  - back the future county-level “Pending fights” panel

5. `get_pipeline_health`
- Inputs: none
- Returns:
  - snapshot freshness per source
  - last successful run
  - stale / aging / missing states
  - whether browser fallback was used for CID

---

## Part 2 — automated refresh pipeline plan

### Problem
Current refresh scripts are individually runnable, but Atlas lacks a single, audited orchestration path that:
- runs refreshes in the right order
- writes artifacts to expected targets
- records freshness
- fails loudly when one source breaks
- still lets healthy sources proceed when appropriate

### Proposed orchestrator
Create:
- `scripts/refresh-all.ts`

Responsibilities:
1. run refreshes in dependency order
2. collect per-step status
3. write a machine-readable run report
4. optionally stop on critical failures
5. emit a concise operator summary

### Suggested order
1. `refresh:twdb-hydrology`
2. `refresh:surface-water-quality`
3. `refresh:city-open-data`
4. `refresh:city-open-data-curated`
5. `refresh:city-open-data-ranked`
6. `refresh:cid`

Reasoning:
- city-ranked depends on city-curated, which depends on city-open-data
- CID should run late because it is the most failure-prone and should not block simpler static/source catalog refreshes

### Run report artifact
Create:
- `public/cache/pipeline-health.json`

Shape:
```ts
{
  generatedAt: string;
  overallStatus: "ok" | "degraded" | "failed";
  steps: Array<{
    stepId: string;
    status: "ok" | "failed" | "skipped";
    startedAt: string;
    endedAt: string;
    durationMs: number;
    outputPath?: string | null;
    notes: string[];
  }>;
}
```

This artifact should later feed:
- MCP `get_pipeline_health`
- homepage/admin-ish operator status strip
- CI or cron notifications

### Failure policy
- static/source-discovery slices may continue after non-critical failures
- CID failure should mark pipeline `degraded`, not silently succeed
- when a step fails, the report must capture:
  - command
  - high-level error
  - whether a fallback path ran

---

## Part 3 — automation execution targets

### Manual operator path
- `npm run refresh:cid`
- `npm run refresh:city-open-data-ranked`
- `npm run mcp -- <tool>`

### New operator path
- `npm run refresh:all`
- `npm run mcp -- get_pipeline_health`

### Future cron/CI path
1. scheduled local/CI job runs `npm run refresh:all`
2. commit/public-cache update policy decided separately
3. notify only on status change or hard failure

---

## Part 4 — exact implementation slices

### Slice A — MCP surface hardening
Files:
- `packages/mcp-server/src/index.js`
- `tests/mcp-server.test.ts`
- `docs/contracts/mcp-tools.md`
- `README.md`

Ship:
- filing red flags tool
- protest prep tool
- root `npm run mcp` script
- README usage

### Slice B — orchestrator skeleton
Files:
- `scripts/refresh-all.ts`
- `tests/package-scripts.test.ts`
- `tests/refresh-all.test.ts`
- `public/cache/pipeline-health.json` (generated or fixture shape)
- `README.md`

Ship:
- run-command orchestration
- status aggregation
- JSON health report

### Slice C — pipeline health MCP tool
Files:
- `packages/mcp-server/src/index.js`
- `tests/mcp-server.test.ts`
- `docs/contracts/mcp-tools.md`

Ship:
- `get_pipeline_health`

### Slice D — county pending fights MCP/UI alignment
Files:
- `packages/mcp-server/src/index.js`
- `src/app/counties/[slug]/page.tsx`
- tests for both

Ship:
- `list_county_pending_fights`
- county panel fed by same logic

---

## Verification commands

Per slice:
```bash
npm test -- tests/mcp-server.test.ts
npm test -- tests/package-scripts.test.ts
npm run lint
npm run build
npm test
```

---

## README changes that should exist by the end
- how to run the MCP server
- current MCP tool list
- how to run the full refresh pipeline
- what artifacts are written
- what “degraded” means, especially for CID

---

## Guardrails
- Do not auto-submit protests
- Do not present draft text as legal advice
- Do not let MCP tools leak commenter PII
- Do not silently mask stale/missing pipeline data
- Do not let CID fragility be mistaken for clean health

---

## Best next implementation order
1. MCP tools for filing red flags + protest prep
2. README update
3. refresh-all orchestrator skeleton
4. pipeline-health artifact
5. MCP pipeline health tool
6. county pending fights alignment
