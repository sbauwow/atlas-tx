# Atlas TX — Water Risk + EJ Refocus

> Supersedes `2026-05-08-initial-plan.md`. Written after pressure-testing the original plan against the Brainforge / Vicinity Texas Open Data Track rubric (Impact & Clarity, Technical Execution, Innovation — 1-10 each).

---

## Why we re-scoped

Original plan optimized for surface area: 6 datasets, county-comparison UI, MCP, skill, judge demo. Three problems against the rubric:

1. **No named user.** "County intelligence" is a topic, not a user. Impact pillar caps low.
2. **Compare-N-counties is the most-obvious civic-data demo shape.** Innovation pillar caps low.
3. **Weekend scope ate everything.** Half-built UI + half-built MCP loses Technical Execution.

Refocus picks one user, one problem, one composite signal, with the agent surface as the centerpiece (per sponsor brief examples).

## Anchor

- **Primary user (demo persona):** Texas county-newsroom journalist (Texas Tribune / Hearst / community paper investigative desk).
- **Secondary user (post-hackathon market):** Civic-tech policy analyst, county budget officer, lobbyist.
- **Problem:** Texas has ~7,000 Public Water Systems and tens of thousands of regulated facilities. Drinking-water violations, public notices, biological conditions, and environmental burden indicators are knowable from public data but not pre-joined. Reporters and analysts spend days assembling what should be a click.
- **Headline output:** "Top N Texas counties (or PWSs) where drinking-water risk, environmental burden indicators, and official notice signals disagree, with cited rows and a map."

## Headline metric for judges

> Atlas TX surfaces the *N* Texas Public Water Systems and counties where SDWIS risk, nearby impairment context, notice/overflow activity, and demographic burden indicators do not line up cleanly — official-record outliers that do not appear on any single existing ranking.

That is one sentence. It anchors Impact, names the contradiction hunt, and is measurable.

## Datasets

### Core (must work end-to-end for demo)
| Source | Use |
|---|---|
| **TCEQ Water Quality Permits** (`7fq8-wig2`) | Industrial / wastewater permit density per county and per PWS service area |
| **Texas Water Districts** (`hr84-s96f`) | Governance + service-area context for PWSs |
| **EPA SDWIS** (federal API) | Drinking-water health-based violations per Public Water System |
| **EPA EJScreen** (federal API + bulk) | Demographic + environmental indicators per census block group |
| **Census ACS 5-year** (Census API) | Population denominators, demographic context |

### Secondary (load if time)
| Source | Use |
|---|---|
| **EPA ECHO** | Compliance/enforcement history for TCEQ-permitted facilities (fed-level enforcement view) |
| **EPA TRI** | Self-reported pollutant releases by facility |
| **TWDB drought monitor** | Current-events context layer |
| **IBI / biological integrity source** | Detect places where ecological condition disagrees with chemistry/compliance summaries |
| **Boil-water notices** | Compare public notices against DWRS / impairment / overflow indicators |
| **E2 disinfectant reporting** | Treatment-stress / operational anomaly signal |

### Out of scope for this plan
Fiscal/debt datasets (CPI abuse, comptroller returns, sales tax, BRB debt, bond elections). They were in the v1 plan but don't compose with the water-risk story. Keep them in `mvp-datasets.ts` as registered but not surfaced — re-add in a v2 fiscal-stress plan.

## Derived signals

These are the "non-obvious design choices" for Innovation. Spec lives in `docs/contracts/dataset-registry.md` once defined.

1. **Drinking Water Risk Score (DWRS)** — per Public Water System. Weighted SDWIS health-based violations × population served × violation recency.
2. **EJ Burden Overlap** — per block group / PWS service area. Joins EJScreen demographic indicators × TCEQ permit-buffer density.
3. **Surface Water Impairment Context** — additive layer from TCEQ's Surface Water Quality Segments Viewer; use-support / impairment status helps estimate burden around nearby water bodies without overclaiming direct harm.
4. **Official-signal mismatch detector** — compares notices/overflows/operational signals against the apparent water-quality and burden picture to rank journalist-worthy contradictions.
5. **Biological integrity context** — additive IBI-style layer so "what is living in the water" can disagree with chemistry/compliance summaries.
6. **Compliance Gap (secondary)** — TCEQ permits × ECHO violations addressed ratio per county.

## Product principle: outliers first

For the journalist persona, Atlas TX should prefer outlier detection over generic correlation hunting.

The best leads are often:
- places where public notices and monitoring/regulatory summaries disagree
- places where biological integrity looks worse than standard compliance metrics imply
- places where disinfectant/treatment reporting looks stressed even when the broader official picture appears quiet
- places where a distributed reporter/community submission points to a mismatch worth checking against the baseline data stack

Score formulas live in code under `src/lib/scoring/` — each gets one TS file, one test file, one section in `docs/contracts/dataset-registry.md` describing inputs/outputs/caveats.

## Demo flow (for the judge)

Two surfaces, both must work:

**A. Live agent in Claude (centerpiece — MCP + skill)**
1. Judge: "Show me the most overlooked drinking-water-risk counties in Texas."
2. Skill invokes MCP `score_pws_drinking_water_risk` → returns ranked PWSs with citations.
3. Judge: "Now overlay environmental-justice burden."
4. Skill invokes `overlay_ej_burden` → returns block-group scores with EJScreen sources.
5. Skill returns sourced summary with caveats.

**B. Web UI (decoration — makes it legible to in-room judges who don't open Claude)**
1. Texas county map, choropleth = Drinking Water Risk Score.
2. Click county → drills to PWS list with violations + EJ overlay.
3. "Generated by atlas-tx skill" panel showing the same answer the agent gave above.

UI is build-after-MCP. If UI runs out of time, the agent demo alone can satisfy the technical requirement.

## Milestones (rescoped)

### M0 — foundation [partially done]
- Repo, README, scaffold, mvp-datasets, county normalizer, Socrata fetch helpers, MCP package skeleton, skill placeholder. ✅ already in tree.
- This plan + contracts + STATE.md + OWNERSHIP.md. ⏳ this PR.

### M1 — data layer for water risk
- `src/lib/datasets/sdwis.ts` — fetch + normalize SDWIS violations by PWS.
- `src/lib/datasets/ejscreen.ts` — fetch EJScreen by block group + buffer query around lat/long.
- `src/lib/datasets/acs.ts` — minimal county/block-group population + demographics.
- `src/lib/datasets/surface-water-quality.ts` — fetch + normalize impaired/use-support segment context.
- Pre-cache Texas snapshots to `public/cache/` or `data/` so demo never hits live APIs.
- `src/lib/scoring/dwrs.ts` + tests.
- `src/lib/scoring/ej_overlap.ts` + tests.
- Spike/queue anomaly inputs: boil-water notices, IBI, E2 disinfectant reporting.

### M2 — MCP tools
Per `docs/contracts/mcp-tools.md`, ship at minimum:
- `discover_datasets`
- `get_dataset_schema`
- `score_pws_drinking_water_risk`
- `overlay_ej_burden`
- `summarize_water_risk_for_county`

Each returns a structured envelope with `data`, `sources`, `caveats`.

### M3 — skill
Refocused `skills/atlas-tx/SKILL.md`. EJ-specific guardrails. References → SDWIS, EJScreen, TCEQ docs. End-to-end run-through that an external agent can execute without prior context.

### M4 — UI (only if M1-M3 are green)
- Texas choropleth (use `react-simple-maps` or pre-rendered SVG; topojson from Census).
- County drilldown panel.
- "Agent answer" panel showing the same skill output.
- Cite-row footer.

### M5 — demo dry run
- Pre-cache snapshot regenerated.
- 3-minute demo script written and rehearsed.
- One overlooked-county finding written up as a 200-word "what we found" panel.

## Risks

- **Live federal API flakiness.** Mitigation: pre-cache to disk, fetcher reads cache by default, `--live` flag for explicit refresh.
- **EJScreen geocoding.** Block-group joins require a buffer query around facility lat/long. Time-box to spike before committing.
- **Next.js 16 unfamiliarity.** AGENTS.md already flags. Read `node_modules/next/dist/docs/` before writing route handlers.
- **Scope creep into fiscal.** Anyone adding debt/tax UI in M1-M4 is reverting to v1 plan. Hold the line.

## Open questions

- Which Texas counties (or PWSs) are the headline finding? Need a research spike before the demo script can be written.
- Does the sponsor expect a hosted URL or local-only? Default to local (`npm run dev`) unless we hear otherwise.
- Is there a target word count / time limit for the demo? Plan assumes 3 minutes.
