---
name: atlas-tx-mcp-pipeline-automation
description: Extend Atlas TX's MCP surface to mirror filing-level permit workflows and plan/ship snapshot-pipeline automation without splitting web and MCP data paths.
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [atlas-tx, mcp, pipeline, cid, permits, nextjs, automation]
    related_skills: [build-mcp-server, writing-plans, atlas-tx-permit-red-flags-protest-helper]
---

# Atlas TX MCP + pipeline automation

Use when Atlas TX needs MCP tools added for new permit workflows, or when the refresh pipeline needs to be unified/automated.

## When this applies
- User wants Atlas TX's MCP server to expose the same filing/protest workflows as the UI.
- User wants a plan or implementation for automated refresh orchestration.
- README needs to reflect new MCP commands and operator workflows.

## Proven MCP augmentation pattern

Current MCP entrypoint:
- `packages/mcp-server/src/index.js`

Root script added:
- `package.json`
  - `"mcp": "tsx packages/mcp-server/src/index.js"`

Why `tsx`, not `node`:
- Atlas TX MCP imports project `.ts` files directly.
- Some of those files use TS path aliases like `@/lib/...`.
- Running the MCP entrypoint with plain `node` caused CLI/runtime failures even when unit tests passed.
- `tsx` is the reliable runner for Atlas TX's current MCP setup.

### Key rule
Do not build a separate data path for MCP if the web workflow already has a reliable aggregator.

For Atlas TX, the fastest honest pattern was:
1. reuse `getTceqPendingPermitsPageData()` from `src/lib/tceq-permits.ts`
2. normalize it in MCP as a permit-context loader
3. layer MCP tools on top of that shared permit/CID context

### Loader helpers that worked
Add lazy imports in `packages/mcp-server/src/index.js`:
- `loadScorePermitFilingRedFlags()` → `src/lib/scoring/permit_filing_red_flags.ts`
- `loadPermitHelpers()` → `src/lib/tceq-permits.ts`
  - `buildPermitProtestPrep`
  - `getPermitFilingDetailPageData`
  - `getTceqPendingPermitsPageData`

Add a small normalizer:
```js
function normalizePermitContext(data) {
  return {
    generatedAt: data.generatedAt,
    cacheState: data.cacheState ?? 'snapshot',
    permits: data.permits,
    cidSummary: data.cidSummary,
  };
}
```

Then inject:
```js
const loadPermitPageData = deps.loadPermitPageData ?? (async () => {
  const helpers = await loadPermitHelpers();
  return normalizePermitContext(await helpers.getTceqPendingPermitsPageData());
});
```

## Proven MCP tools

### `list_permit_filing_red_flags`
Inputs:
- `county?`
- `limit?`

Implementation pattern:
- load shared permit page data
- run `scorePermitFilingRedFlags({ permits, cases })`
- optionally filter by county
- map to an MCP-safe shape:
  - `tceq_id`
  - `applicant_name`
  - `county`
  - `program_area`
  - `score`
  - `reasons`
  - `components.procedural_pressure`
  - `components.county_pressure`

Caveats that worked:
- `Filing red flags are public-record leads, not proof that an application is invalid.`
- `This tool currently emphasizes procedural pressure and county permit concentration over full engineering-document analysis.`

### `build_permit_protest_prep`
Input:
- `tceq_id`

Implementation pattern:
- load shared permit page data
- derive filing detail via `getPermitFilingDetailPageData`
- derive prep pack via `buildPermitProtestPrep`
- return:
  - `tceq_id`
  - `participation_status`
  - `evidence_checklist`
  - `draft_text`
  - `export_text`

Caveats that worked:
- `Atlas TX provides drafting support only and does not provide legal advice or submit filings.`
- `No individual commenter names are surfaced; only aggregate filing signals and public-record context.`

## Testing pattern that worked

Update:
- `tests/mcp-server.test.ts`
- `tests/package-scripts.test.ts`

### Good MCP tests
Mock `loadPermitPageData` directly in `createAtlasTxMcpHandlers(deps)`.
This avoids forcing MCP tests to re-run full app data flows.

Test both:
- direct handler call
- `runAtlasTxTool(...)` dispatch path

### Assertions that were useful
For `list_permit_filing_red_flags`:
- `SOAH docket present`
- `1 hearing request filed`
- `2 pending permits in Travis County`

For `build_permit_protest_prep`:
- `Request a contested case hearing`
- `Describe how the filing affects Travis County or nearby neighborhoods.`
- `I am submitting this comment regarding TCEQ ID WQ0000447000`
- `Top visible red flags:`

For scripts:
- assert `pkg.scripts["mcp"] === "tsx packages/mcp-server/src/index.js"`

## Docs pattern that worked

### README
Update `README.md` with a dedicated MCP section:
- how to run `npm run mcp -- <tool>`
- example calls
- current tool list
- pointer to `docs/contracts/mcp-tools.md`
- pointer to automation plan once written

### MCP contract
Update:
- `docs/contracts/mcp-tools.md`

When adding tools:
1. bump version
2. add changelog line
3. update tool-catalog version header
4. document params/data shape for each new tool

## Proven automation-planning pattern

When the user wants the pipeline automated but not fully shipped in the same slice, write a concrete implementation plan instead of hand-waving.

Plan file that worked:
- `docs/plans/2026-05-09-mcp-and-pipeline-automation.md`

### Best architecture call
Keep one snapshot pipeline and let both web + MCP consume the same artifacts.
Do not create MCP-only refresh logic.

### Recommended orchestrator target
Create later:
- `scripts/refresh-all.ts`

### Recommended order
1. `refresh:twdb-hydrology`
2. `refresh:surface-water-quality`
3. `refresh:city-open-data`
4. `refresh:city-open-data-curated`
5. `refresh:city-open-data-ranked`
6. `refresh:cid`

Reason:
- city-ranked depends on curated depends on open-data
- CID is the most failure-prone; run it late so easier refreshes still complete

### Recommended health artifact
Create later:
- `public/cache/pipeline-health.json`

Use it to back:
- MCP `get_pipeline_health`
- operator visibility in UI
- cron/CI notification logic

## Gotchas / experiential findings
- MCP augmentation was easiest when built on `getTceqPendingPermitsPageData()` instead of inventing a separate permit-context API first.
- For Atlas TX, project-specific MCP tools belong in `packages/mcp-server/src/index.js` for now; do not over-modularize prematurely.
- Contract + README + root script must move together. If you add tools but do not add `npm run mcp`, operator UX stays confusing.
- `tests/package-scripts.test.ts` is a cheap regression tripwire for CLI ergonomics; update it whenever root scripts change.
- Keep MCP response fields snake_case and envelope-wrapped to match existing Atlas TX MCP conventions.

## Validation commands
Run in `~/Projects/atlas-tx`:
```bash
npm test -- tests/mcp-server.test.ts tests/package-scripts.test.ts
npm run lint
npm run build
npm test
```

## Proven follow-on: `get_pipeline_health`

After `refresh:all` exists, the next clean slice is exposing the staged health artifact directly through MCP.

### Implementation pattern that worked
In `packages/mcp-server/src/index.js`:
1. add a snapshot loader using Node fs/path:
   - read `public/cache/pipeline-health.json`
2. inject it through deps:
   - `const loadPipelineHealthReport = deps.loadPipelineHealthReport ?? loadPipelineHealthReportFromSnapshot`
3. add a small normalizer/summary builder that returns:
   - `overall_status`
   - `last_successful_run_at`
   - `stale_steps`
   - `cid.status`
   - `cid.browser_fallback_used`
   - `cid.last_error`
   - normalized `steps[]` with snake_case keys
4. infer CID browser fallback from recorded step notes using a case-insensitive `browser fallback` match
5. return the normal MCP envelope with `cache_state: 'snapshot'`

### Test pattern that worked
Add the failing test first in `tests/mcp-server.test.ts`.
Mock `loadPipelineHealthReport` directly via `createAtlasTxMcpHandlers(deps)`.
Assert both:
- direct handler call: `handlers.get_pipeline_health()`
- dispatcher path: `runAtlasTxTool('get_pipeline_health', {}, deps)`

Useful assertions:
- `overall_status === 'degraded'`
- `stale_steps === ['refresh-cid']`
- `cid.browser_fallback_used === true`
- `cid.last_error === 'CID Search One returned the upstream error page'`

### Artifact pattern that worked
Commit a representative `public/cache/pipeline-health.json` shape to keep the MCP path runnable immediately and to document the expected operator artifact structure.

### Docs updates required together
When adding `get_pipeline_health`, update all of:
- `README.md` tool list + example command
- `docs/contracts/mcp-tools.md` version/changelog/tool schema
- `docs/STATE.md`

## Proven follow-on: `get_permit_filing_detail` + `list_county_pending_fights`

After `get_pipeline_health`, the next clean Atlas TX MCP slice is exposing the same filing-detail and county-fights lane the UI already uses.

### Implementation pattern that worked
Reuse `src/lib/tceq-permits.ts` instead of inventing a second county-fights model:
- keep `getPermitFilingDetailPageData(...)` as the single filing-detail aggregator
- add `listCountyPendingFights(permits, cases, county?)` in `src/lib/tceq-permits.ts`
- lazy-load that helper through `loadPermitHelpers()` in `packages/mcp-server/src/index.js`

#### `get_permit_filing_detail`
Return:
- `tceq_id`
- `procedural_status`
  - `county`
  - `program_area`
  - `item_status`
  - `tceq_docket_number`
  - `soah_docket_number`
  - `latest_filed_at`
  - `filing_counts`
- `county_permit_count`
- `related_permits`
- `red_flag`

#### `list_county_pending_fights`
Return county-filterable open fights ranked by a simple procedural-pressure heuristic:
- `hearingRequests * 5`
- `publicMeetingRequests * 4`
- `comments * 1`

Expose:
- `tceq_id`
- `applicant_name`
- `county`
- `county_slug`
- `program_area`
- `procedural_pressure_score`
- `county_permit_count`
- `item_status`
- `tceq_docket_number`
- `soah_docket_number`
- `latest_filed_at`
- `filing_counts`
- `named_filing_orgs` (empty array for now; do not backfill individual-filer PII)

### Test pattern that worked
Add failing tests first in `tests/mcp-server.test.ts`.
Mock `loadPermitPageData` via deps and verify both:
- direct handler call
- `runAtlasTxTool(...)` dispatch path

Useful assertions:
- `get_permit_filing_detail` returns 2 related permits for the mocked applicant/county case
- `red_flag.reasons` includes `SOAH docket present`
- `list_county_pending_fights` sorts highest procedural-pressure row first
- `named_filing_orgs` stays `[]`

### CLI/runtime findings
- Unit tests passing was not enough; direct CLI verification exposed real runtime issues.
- Always run at least:
  - `npm run mcp -- discover_datasets`
  - `npm run mcp -- get_pipeline_health`
  - one newly added permit tool command
- In this repo, plain `node` for the MCP entrypoint failed on TS path aliases; switching the root script to `tsx` fixed the runtime.

### Dataset-loading finding
For `discover_datasets` / `get_dataset_schema`, dynamic import inside the handler path was safer than relying only on the top-level imported dataset array during `tsx` CLI execution.

### CID snapshot reality
- `get_permit_filing_detail` and `build_permit_protest_prep` require the requested `tceq_id` to exist in the current CID snapshot.
- If CID snapshots are missing/stale, fail with a clear operator message telling the user to run `npm run refresh:cid` or confirm the filing exists in the snapshot.
- `list_county_pending_fights` can legitimately return an empty list even when permits exist if CID case rows are absent; document that in README/operator expectations.
## Additional experiential findings
- If `npm run build` or water-page tests suddenly fail on `@visx/geo` even though it is declared in `package.json`, check whether `node_modules` drifted before debugging app code. In this repo, `npm install` restored the missing package and cleared both build and test failures.
- `npm run mcp -- get_pipeline_health` is a useful post-implementation verification step because it proves the artifact path, CLI dispatch path, and JSON envelope all work together.
- For Atlas TX MCP work, runtime verification matters as much as tests. A tool can pass mocked tests and still fail under the real `npm run mcp -- ...` path because of ts/esm/path-alias behavior.

## Best next move after this skill
If user says “automate the pipeline” next, implement in this order:
1. `scripts/refresh-all.ts`
2. `refresh:all` package script
3. `pipeline-health.json` output
4. MCP `get_pipeline_health`
5. README operator instructions for degraded vs failed runs
6. `get_permit_filing_detail`
7. `list_county_pending_fights`
