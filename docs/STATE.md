# STATE — Atlas TX live coordination

> Single source of truth for who-is-doing-what right now. Updated by every agent before and after work. Keep entries terse.

Schema for every row: `workstream | agent | branch | intent | started | ref`

---

## In-progress

_(empty)_

---

## Blocked

_(empty)_

---

## Recently done

| workstream | agent | intent | ref |
|---|---|---|---|
| docs | hermes | Document `refresh:cid` usage and fail-loud Search One behavior in README/contracts/plan docs | working tree |
| data | hermes | Add CID runtime/env options and fail-loud handling for upstream Search One error pages | working tree |
| docs | hermes | Document executable CID refresh flow and note live Search One fragility in contracts/plan docs | working tree |
| data | hermes | Add executable CID refresh scaffold with snapshot payload writing + size-based fallback rules | working tree |
| data | hermes | Add chunked CID refresh script scaffold and tests for statewide Search One planning | working tree |
| mcp | hermes | Make the MCP scaffold directly callable via tool dispatch (`runAtlasTxTool` / CLI JSON args) and wire protest handlers | working tree |
| data | hermes | Add ACS county population loader snapshot and wire it into protest-density flows | working tree |
| data | hermes | Implement `src/lib/scoring/protest_density.ts` and pin APD behavior with scorer tests | working tree |
| data | hermes | Implement `src/lib/datasets/cid.ts` parsers + live POST helpers and pin them to fixture tests | working tree |
| docs | hermes | Tune APD formula and draft protest/CID MCP tool signatures | working tree |
| web | hermes | Refocus landing page copy around Texas water risk + EJ and add regression tests for the new messaging | working tree |
| docs | hermes | Live-verify AKVO/WaterScope/Hach references and Texas Stream Team / AgriLife program claims; update smartphone docs accordingly | working tree |
| data | hermes | SDWIS fetcher + normalizer + cached snapshot (4.5 MB, 11,686 rows, TX health-based since 2023-04-01) | branch `data/sdwis-fetcher` |
| docs | hermes | Tighten smartphone colorimetry memo with explicit honest gaps, Texas program research caveats, and pre-plan open questions | working tree |
| docs | hermes | Add smartphone colorimetry research note + target-state architecture for non-regulatory community screening | working tree |
| docs | claude-opus-4-7 | Initial plan + collab spine (refocus to drinking-water-risk + EJ; add OWNERSHIP/STATE/contracts) | this PR |
| data | hermes (prior session) | Scaffold mvp-datasets, county normalizer, Socrata URL builder | commit `015e656` |
| mcp | hermes (prior session) | MCP package skeleton with placeholder index.js | commit `015e656` |
| skill | hermes (prior session) | Skill placeholder doc | commit `ac7daeb` |
| web | hermes (prior session) | Health endpoint + Atlas TX landing page | commit `ac7daeb` |

---

## Next up — claim from here

Listed in the order the refocus plan (`docs/plans/2026-05-08-water-risk-refocus.md`) needs them. Claim by moving a row to In-progress.

### Milestone 1 — data layer

| workstream | task | notes |
|---|---|---|
| data | Add federal-source dataset entries to `mvp-datasets.ts` | EJScreen, ECHO, SDWIS, ACS — `accessType: "external"`. May already be partially done in this PR; verify before claiming. |
| data | `src/lib/datasets/ejscreen.ts` fetcher | EPA EJScreen by block group + buffer query around lat/long; spike geocoding first |
| data | Expand `src/lib/datasets/acs.ts` beyond county population snapshot | Current loader only covers county-level `B01003_001E` from committed snapshot for APD. Extend to live fetch + block-group demographics for EJ work. |
| data | `src/lib/scoring/dwrs.ts` Drinking Water Risk Score | Per `docs/contracts/dataset-registry.md`. Consume `loadSdwis()` rows; weight `populationServed × recency × violation severity tier`. |
| data | `src/lib/scoring/ej_overlap.ts` EJ Burden Overlap | Per `docs/contracts/dataset-registry.md` |
| data | (follow-on) Wider SDWIS analysis snapshot in `data/sdwis-tx-full.json` | Current `public/cache/sdwis-tx.json` is filtered to health-based ≥ 2023-04-01 to fit the 5 MB committed budget. For a longer recency window (DWRS sensitivity analysis, demo "what we found" research), call `fetchSdwis({since: undefined})` and write to gitignored `data/`. |
| data | (follow-on) Add `pws_name` + `county` to `mvp-datasets.ts` SDWIS keyFields | Currently lists raw API columns only; the normalized loader exposes joined `pwsName` + `county` from WATER_SYSTEM and GEOGRAPHIC_AREA — keyFields should reflect what consumers actually see. |

### Milestone 1.5 — protest data layer (additive — see `docs/plans/2026-05-08-protests-extension.md`)

| workstream | task | notes |
|---|---|---|
| data | Freeze first real `cid-cases` / `cid-protests` snapshot files | Search Two live POST works; Search One still errors in scripted runs even with chunks. Next step is deciding whether to tolerate partial Search Two-only outputs, add retries/browser automation, or keep manual operator refresh for cases. |
| mcp | Replace CLI/tool-dispatch scaffold with actual MCP transport/tool registry | `packages/mcp-server/src/index.js` now supports JSON tool dispatch, but it is still not a full MCP transport/server implementation. |
| mcp | Implement `summarize_water_risk_for_county` protest-density folding | Contract supports `include_protest_density`; wire it once county summary tools exist. |

### Milestone 2 — MCP tools

| workstream | task | notes |
|---|---|---|
| mcp | Implement `discover_datasets` | Return registered MVP_DATASETS with provenance |
| mcp | Implement `get_dataset_schema` | Per dataset id, return key fields + caveats |
| mcp | Implement `score_pws_drinking_water_risk` | Wraps `src/lib/scoring/dwrs.ts` |
| mcp | Implement `overlay_ej_burden` | Wraps `src/lib/scoring/ej_overlap.ts` |
| mcp | Implement `summarize_water_risk_for_county` | Composite output, structured envelope |

### Milestone 2.5 — protest MCP tools (additive)

| workstream | task | notes |
|---|---|---|
| mcp | Implement `list_protested_permits` | Filters: county, programArea, minHearingRequests. Wraps cid.ts + Search Two. PII guardrail: never surface individual filer names. |
| mcp | Implement `score_protest_density` | Wraps `src/lib/scoring/protest_density.ts`. County scope. |
| mcp | (optional) extend `summarize_water_risk_for_county` | Add APD as a third axis alongside DWRS + EJ overlay. |

### Milestone 3 — skill

| workstream | task | notes |
|---|---|---|
| skill | Refocus `SKILL.md` around water-risk + EJ workflow | EJ guardrails: burden/exposure language, not harm |
| skill | Add references section linking SDWIS, EJScreen, TCEQ docs | Stable URLs only |
| skill | End-to-end example invocation that runs against the MCP server | Must be reproducible |
| skill | Add protests example invocation | "What permits are being protested in Comal County right now?" Add commenter-PII guardrail block: aggregate counts + named filing orgs only, never individual filer names. |

### Milestone 4 — web (only after M1-M3 green)

| workstream | task | notes |
|---|---|---|
| web | Texas county choropleth using cached DWRS scores | `react-simple-maps` candidate; topojson from Census |
| web | County → PWS drilldown panel | EJ overlay overlay |
| web | "Agent answer" panel mirroring skill output | Same answer the agent would give |

### Milestone 5 — demo prep

| workstream | task | notes |
|---|---|---|
| docs | 3-min demo script | Live agent flow + UI flow |
| data | Regenerate cached snapshot for demo | Freeze right before demo |
| docs | "What we found" 200-word writeup of one overlooked county / PWS | Headline finding |

---

## Conventions reminder

- One row per task. Pre-fill the workstream column if it's obvious; the claiming agent fills the rest.
- Move rows up or down sections rather than deleting. Recently-done is a journal; keep ~20 most recent rows then prune.
- If a task fans out into multiple sub-tasks, replace the parent row with the children.
