# STATE — Atlas TX live coordination

> Single source of truth for who-is-doing-what right now. Updated by every agent before and after work. Keep entries terse.

Schema for every row: `workstream | agent | branch | intent | started | ref`

---

## In-progress

| workstream | agent | branch | intent | started |
|---|---|---|---|---|
| docs | hermes | `data/sdwis-fetcher` | Live-verify AKVO/WaterScope/Hach references and Texas community-monitoring programs for smartphone colorimetry memo | 2026-05-08T21:03:03-05:00 |

---

## Blocked

_(empty)_

---

## Recently done

| workstream | agent | intent | ref |
|---|---|---|---|
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
| data | `src/lib/datasets/acs.ts` fetcher | Census ACS 5-year, county + block-group population/demographics |
| data | `src/lib/scoring/dwrs.ts` Drinking Water Risk Score | Per `docs/contracts/dataset-registry.md`. Consume `loadSdwis()` rows; weight `populationServed × recency × violation severity tier`. |
| data | `src/lib/scoring/ej_overlap.ts` EJ Burden Overlap | Per `docs/contracts/dataset-registry.md` |
| data | (follow-on) Wider SDWIS analysis snapshot in `data/sdwis-tx-full.json` | Current `public/cache/sdwis-tx.json` is filtered to health-based ≥ 2023-04-01 to fit the 5 MB committed budget. For a longer recency window (DWRS sensitivity analysis, demo "what we found" research), call `fetchSdwis({since: undefined})` and write to gitignored `data/`. |
| data | (follow-on) Add `pws_name` + `county` to `mvp-datasets.ts` SDWIS keyFields | Currently lists raw API columns only; the normalized loader exposes joined `pwsName` + `county` from WATER_SYSTEM and GEOGRAPHIC_AREA — keyFields should reflect what consumers actually see. |

### Milestone 2 — MCP tools

| workstream | task | notes |
|---|---|---|
| mcp | Implement `discover_datasets` | Return registered MVP_DATASETS with provenance |
| mcp | Implement `get_dataset_schema` | Per dataset id, return key fields + caveats |
| mcp | Implement `score_pws_drinking_water_risk` | Wraps `src/lib/scoring/dwrs.ts` |
| mcp | Implement `overlay_ej_burden` | Wraps `src/lib/scoring/ej_overlap.ts` |
| mcp | Implement `summarize_water_risk_for_county` | Composite output, structured envelope |

### Milestone 3 — skill

| workstream | task | notes |
|---|---|---|
| skill | Refocus `SKILL.md` around water-risk + EJ workflow | EJ guardrails: burden/exposure language, not harm |
| skill | Add references section linking SDWIS, EJScreen, TCEQ docs | Stable URLs only |
| skill | End-to-end example invocation that runs against the MCP server | Must be reproducible |

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
