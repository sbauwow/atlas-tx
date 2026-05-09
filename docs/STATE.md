# STATE — Atlas TX live coordination

> Single source of truth for who-is-doing-what right now. Updated by every agent before and after work. Keep entries terse.

Schema for every row: `workstream | agent | branch | intent | started | ref`

---

## In-progress

| workstream | agent | branch | intent | started | ref |
|---|---|---|---|---|---|
| docs | hermes | web/color-tokens | Review all plan docs, align additive weather/community roadmap to current repo state, and add coordination-aware implementation checklist around active feynman/UI work | 2026-05-09T05:52:00Z | working tree |

---

## Blocked

_(empty)_

---

## Recently done

| workstream | agent | intent | ref |
|---|---|---|---|
| cross (web→data) | claude-opus-4-7 | Fix prod /water 500: wrap every external fetcher in `getWaterOverview` and `getCountyWaterBreakdown` with the existing `safeLoad` helper so a single rejecting fetcher (e.g. live Socrata `8kc5-95uk` sewer-overflows or `6pm5-am5m` general-permits) degrades that one layer instead of failing the entire page. Added `EMPTY_FLOODPLAIN_COVERAGE` fallback so the floodplain coverage type stays satisfied. Added `tests/water-summary-service-fail-soft.test.ts` regression. Branch `cross/water-overview-fail-soft`. NOTE for **data**: the underlying live-Socrata calls (sewer-overflows + general-permits) need cached snapshots — both Socrata dataset IDs return "does not support resource API access". Cert-validation errors on the dev box also surfaced; production Vercel runtime should be fine. | working tree |
| cross (web→data) | hermes | Back /permits with a true Texas county choropleth using county polygons from `us-atlas`, permit-count color bands, CID hatch overlays, clickable county drill-down into filtered permits, a new `/water/counties/[slug]` profile page, a shared county workspace header with next/prev county navigation across views, a new `/counties/[slug]` county intelligence page backed by the Atlas explorer service, direct county-intelligence links from permit county chips/footer, a statewide `/counties` ranked overview page as the county-workspace entry surface, top-nav/homepage links so county workflow is directly discoverable, and a homepage entry-paths module for Water / Counties / Permits. | working tree |
| web | hermes | Add live workflow counts to the homepage entry-path cards so Water / Counties / Permits now expose active alerts + gauges, ranked counties, and pending permit counts directly on the landing page. | working tree |
| web | hermes | Turn homepage workflow counts into clickable mini-status surfaces that deep-link into mismatch mode, ranked counties, and permit hotspots. | working tree |
| docs | hermes | Add implementation plan `docs/plans/2026-05-09-red-flags-and-protest-helper.md` for filing-level red-flag scoring plus a non-legal protest-helper workflow on top of `/permits`, CID, and county workspaces. | working tree |
| web | hermes | Ship Phase 1 of filing-level scrutiny on `/permits`: pure red-flag scorer + "Filings that need scrutiny" section driven by CID pressure and county permit concentration. | working tree |
| web | hermes | Ship Phase 2 filing detail workflow: `/permits/[tceqId]` with county workspace links, procedural status, red-flag breakdown, related permits, and caveats. | working tree |
| web | hermes | Ship Phase 3 protest-prep layer on filing detail pages: participation status, evidence checklist, draft-from-facts text, and export-ready submission pack. | working tree |
| mcp+docs | hermes | Augment Atlas TX MCP with filing red-flag + protest-prep tools, add root `npm run mcp`, update MCP contract/README, and write the automated pipeline plan. | working tree |
| data | hermes | Pull Austin, Dallas, Houston, and San Antonio open-data portal catalogs into a committed Texas-city snapshot with `refresh:city-open-data`, tests, and additive dataset-registry contract docs (v0.7.0). Snapshot now covers 5,065 catalog entries across the four portals. | working tree |
| data | hermes | Add curated `city-open-data-curated-tx.json` snapshot for likely water / permits / infrastructure datasets with theme-match metadata and `refresh:city-open-data-curated`. Current curated pass surfaces 897 candidate datasets across the four city portals. | working tree |
| data | hermes | Rank the 897 curated city datasets into Atlas ingest lanes with heuristic scores, `priorityTop25`, and `refresh:city-open-data-ranked`. Current lane counts: water-utility-ops 124, flood-drainage 49, building-development-permits 52, sewer-wastewater 5, infrastructure-projects 144, deprioritized 523. | working tree |
| data | hermes | Add GBRA watershed/subwatershed polygon routes and normalized hydrology types after the GVHS county-join slice | working tree |
| data | hermes | Add GBRA GVHS lake county-join route using Census county overlay and cover it with hydrology + route tests | working tree |
| docs | hermes | Record the GBRA next-step sequence in the water ingest plan after shipping the first hydrology slice | working tree |
| cross (web + data + docs) | claude-opus-4-7 | Stage 1 prototype of citizen water-strip submissions per `docs/research/smartphone-colorimetry.md`: `/citizen` lane, hybrid client-sampling + Claude vision, SQLite via Prisma, contract-enforced isolation from regulatory scorers (dataset-registry → 0.9.0) | branch `cross/citizen-strips-prototype` (PR #4) |
| data | hermes | Add first GBRA slice with tested hydrology adapters/routes for major rivers + GVHS lakes and wire freshness/registry/page link | working tree |
| data | hermes | Add LCRA quality county aggregation metrics/notes to water summaries and water page; degrade gracefully when LCRA TLS fetch fails | working tree |
| docs | hermes | Add regional water-authority ingest matrix and record the post-LCRA county aggregation next move in the water ingest plan | working tree |
| docs | feynman | Update README to reflect planned mismatch-signal and weather / hydrologic context layers for Atlas TX | working tree |
| docs | feynman | Add weather / hydrologic contract language and draft normalized row shapes for NWS alerts, USGS streamflow, drought, precipitation, and temperature context | working tree |
| docs | feynman | Add Milestone 1.2 weather / hydrologic context planning rows for alerts, streamflow, drought, precipitation, temperature, and county-summary follow-on contract work | working tree |
| docs | feynman | Add Milestone 1.1 mismatch-signal planning rows and dataset-registry contract language for boil notices, disinfectant residuals, and biological integrity | working tree |
| docs | claude-opus-4-7 | Round 4: 7 concept pages (SFHA, FIRM, NHD, PFAS, FRS-ID, LSLI, NRI), 2 watershed-unit comparisons (HUC8 vs WBD, TWDB river basins vs HUC), USGS NWIS dataset (first measurement-grade source), first tier-4 procedural page (`projects/refresh-cached-snapshot`). No contract changes. | branch `docs/wiki-init` (PR #2) |
| docs | claude-opus-4-7 | Close `docs/wiki/` registry drift: 8 dataset pages for already-registered IDs (TCEQ `7fq8-wig2`/`hr84-s96f`/CID-one/CID-two/SWQ + TWDB aquifers/basins/HUC8) + 4 foundational concept pages (HUC, SoQL, LCR, APD score). Registry drift goes from 8 → 0. No contract changes. | branch `docs/wiki-init` (PR #2) |
| docs | claude-opus-4-7 | Extend `docs/wiki/` with 14 new pages across drinking-water-quality (5), environmental-factors (4), and weather-related impacts (5); housekeeping pass on index/log/graph/lint-report/overview. Repo-grounded only, confidence cap 0.7. No contract changes. | branch `docs/wiki-init` (PR #2) |
| docs | claude-opus-4-7 | Initialize `docs/wiki/` Karpathy-style LLM wiki (schema + skeleton + 11 seed pages: 4 agencies, 1 portal, 3 datasets, 1 concept, 1 source, 1 episode). No contract changes. | branch `docs/wiki-init` |
| data | hermes | Add TWDB hydrology refresh script and wire centroid-based hydrology context into county breakdowns | working tree |
| data | hermes | Add first TWDB hydrology ingestion slice with tested normalizer, compact cached snapshot, and dataset registry entries | working tree |
| docs | hermes | Document browser-fallback hook and current Search One automation limits in README/contracts/plan docs | working tree |
| data | hermes | Add browser-fallback hook plus fail-loud Search One handling in CID refresh runtime | working tree |
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
| data | Add live refresh/conversion path for `src/lib/datasets/twdb-hydrology.ts` | Current slice is a compact cached extent snapshot with per-feature bounding boxes only. Follow-on should automate TWDB zip download + conversion and decide when full polygon geometry is worth committing. |
| data | `src/lib/scoring/dwrs.ts` Drinking Water Risk Score | Per `docs/contracts/dataset-registry.md`. Consume `loadSdwis()` rows; weight `populationServed × recency × violation severity tier`. |
| data | `src/lib/scoring/ej_overlap.ts` EJ Burden Overlap | Per `docs/contracts/dataset-registry.md` |
| data | Discover/normalize `tceq-swq-segments` surface-water impairment context source | Use TCEQ Surface Water Quality Segments Viewer as an additive burden-indicator layer; preserve the guardrail that "impaired" is a legal-use-support status, not a direct harm claim. |
| data | Build official-signal mismatch / outlier scorer | Core journalist workflow: rank counties/PWSs where notices, overflows, burden indicators, and water-quality signals do not line up. |
| product | Design distributed submission workflow for outlier tips | Treat reporter/community-submitted anomalies as first-class leads to compare against the baseline official data stack. |
| data | (follow-on) Wider SDWIS analysis snapshot in `data/sdwis-tx-full.json` | Current `public/cache/sdwis-tx.json` is filtered to health-based ≥ 2023-04-01 to fit the 5 MB committed budget. For a longer recency window (DWRS sensitivity analysis, demo "what we found" research), call `fetchSdwis({since: undefined})` and write to gitignored `data/`. |
| data | (follow-on) Add `pws_name` + `county` to `mvp-datasets.ts` SDWIS keyFields | Currently lists raw API columns only; the normalized loader exposes joined `pwsName` + `county` from WATER_SYSTEM and GEOGRAPHIC_AREA — keyFields should reflect what consumers actually see. |

### Milestone 1.1 — mismatch / contradiction signals

| workstream | task | notes |
|---|---|---|
| data | Add boil-water notice source | Highest-value public-notice signal. Join by `pws_id` when available; fallback to utility/PWS name + county + notice date. Primary use: mismatch detection against DWRS, sewer overflows, and public-notice frequency. |
| data | Add E2 disinfectant reporting source | Add operational/treatment-stress context for drinking-water systems. Join by `pws_id` + reporting quarter/date. Treat as an additive indicator, not a direct harm signal. |
| data | Add IBI / biological integrity source | Add segment-level biological/ecological condition context. Join by segment/assessment-unit geography and county overlay to surface places where ecosystem condition disagrees with compliance summaries. |
| mcp | Design `summarize_water_mismatches` tool contract | Depends on boil notices + disinfectant residuals + surface-water / biological context. Return sourced outlier rows and caveats, not causal claims. |
| docs | Add contract language for notice / stress / biology signals | Clarify these are indicators and mismatch leads, not proof of contamination or harm. |

### Milestone 1.2 — weather / hydrologic context

| workstream | task | notes |
|---|---|---|
| data | Add `nws-alerts` weather-event source | Use NWS alerts API; prioritize flood / flash flood warning context by county and date window. Fastest event-context layer for notice and overflow analysis. |
| data | Add `usgs-streamflow` source | Join active Texas stream gauges to county / basin and derive low-flow / high-flow anomaly flags. Strongest hydrologic context layer for dilution / concentration analysis. |
| data | Add drought status source | Use Drought.gov / U.S. Drought Monitor Texas data for county/regional chronic stress context. Track drought category, duration, and hydrologic-stress framing. |
| data | Add precipitation totals source | Compute 24h / 72h / 7d rain context for notices, overflows, and short-term water-quality events. Prefer official NOAA/NWS or NCEI pathways that can be cached. |
| data | Add temperature / heat context source | Add air-temperature anomaly and heatwave flags as seasonal water-stress indicators for bloom / oxygen / treatment-stress interpretation. |
| mcp | Extend county summary contract with weather context | Add event, flow, drought, rainfall, and heat context fields to county summaries and caveats. |
| docs | Add contract language for weather-derived indicators | Clarify that weather layers are explanatory context for water events, not standalone proof of contamination or infrastructure failure. |

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
