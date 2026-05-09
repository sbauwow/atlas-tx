# Atlas TX — Permit Protests Extension

> **Extends** `2026-05-08-water-risk-refocus.md`. Does not supersede it. The refocus plan still anchors the demo (DWRS + EJ overlap). This plan adds a new derived signal — **Active Protest Density** — and the data layer behind it.

---

## Why add this

The refocus thesis is: "places where drinking-water risk and demographic burden compound." The missing third leg is **community signal** — *places where Texans have already raised hands on a pending permit*. That is gold for the journalist persona because it is:

- **Pre-validated reporter leads.** A protested permit is, by construction, somebody's news tip on the public record.
- **Cross-program.** Rock crushers (APO), chemical plants (Air Quality + TPDES), data centers (water + air), waste sites (IHWHL/MSW) all show up in the same docket.
- **Not pre-joined.** The data lives in the TCEQ Commissioners' Integrated Database (CID), behind a 2004-era ColdFusion form, with no API and no Socrata mirror. Anyone surfacing this aggregated wins on Innovation.

This is *additive*. DWRS + EJ overlap remain the headline. Active Protest Density is the third overlay.

## Headline-metric extension

Add to the refocus plan's headline:

> "...counties/PWSs that don't appear on any single existing ranking, **and where active TCEQ permits are drawing public protest right now.**"

## Anchor user behavior

Reporter at Texas Tribune asks the agent: "Which Texas counties have the worst drinking-water risk *and* an active fight over a new aggregate or chemical permit?" — agent returns ranked counties with protest counts, applicant names, hearing-request status, SOAH docket number when referred, and links to file public comment.

## Scope

### In scope
- All TCEQ permit programs that appear in CID:
  - **APO** (Aggregate Production Operation Registration) — rock crushers
  - **AQ** (Air Quality) — chemical plants, large data-center backup-gen permits
  - **WQ** (Water Quality / TPDES)
  - **PWS** (Public Water System/Supply)
  - **IHWHL** (Industrial and Hazardous Waste)
  - **MSW** (Municipal Solid Waste)
  - **WRHL** (Water Rights)
  - **UIC** / **UICWQ** (Underground Injection Control — water + waste injection)
  - **DIST** (Water Districts)
- Per-permit metadata: TCEQ ID, applicant/respondent, county, program area, item status (open/closed), TCEQ docket #, SOAH docket # when referred, regulated entity #.
- Per-permit protest signal: count of comments + hearing requests filed in CID Search Two.
- SOAH contested-case status, derived from presence of SOAH Docket Number on the CID Search One row (referred = has SOAH#; pending/decided = inferred from item status).

### Out of scope (this plan)
- Full text of protest letters / public comments. Search Two returns commenter metadata only on the result page; comment PDFs live in the eFilings archive. PDF download + OCR + chunking is a v2 lift.
- Commenter PII surfacing. Names are publicly filed but we display **counts and orgs**, not individuals, in the agent output. (See Guardrails.)
- Direct SOAH scrape. SOAH search is behind re:SearchTX (Tyler court records). Cross-reference via CID's SOAH Docket Number column is sufficient for v1.
- Full text of permit applications.

## Data sources

| Source | URL | Access | Used for |
|---|---|---|---|
| TCEQ CID Search One | `https://www14.tceq.texas.gov/epic/eCID/index.cfm` form `CCD` POST `?fuseaction=main.reportResults` | HTML scrape, ColdFusion form | Permit/case metadata, SOAH cross-ref |
| TCEQ CID Search Two | same endpoint, form `CCD1` | HTML scrape | Protest filings (comments + hearing requests + public-meeting requests) |
| TCEQ Central Registry (existing) | already in `mvp-datasets.ts` | Socrata `7fq8-wig2` | Existing permit metadata (water-quality only) |

CID quirks confirmed in pre-flight (2026-05-08):
- Form is ColdFusion, POST. Requires `Content-Type: application/x-www-form-urlencoded` and a Referer header from the form page; first call should warm a session cookie. A naked POST returns "An unexpected error has occurred" inline.
- Program area, county, and region selects use sentinel value `none` (not empty string) for "any."
- Result page is HTML with no machine-readable export. Parser must walk a CF-generated table.
- No CSRF token. No auth.

## Derived signal — Active Protest Density (APD)

Spec land: `docs/contracts/dataset-registry.md` (bumped to **0.2.0**, see PR).

```
filing_pressure_per_item = (
    1.0                                          # base: a pending permit exists
  + 0.35 * log1p(comment_count)                  # comments matter, but are flood-prone
  + 0.75 * public_meeting_request_count          # stronger than comments, weaker than hearing requests
  + 1.25 * hearing_request_count                 # stronger procedural escalation
  + 2.5  * (soah_docket_number != null ? 1 : 0) # SOAH-referred → contested-case
)
APD_raw = sum(filing_pressure_per_item in county)
APD_per_1k = APD_raw / county_population_thousands
```

Then min-max normalized 0-100 statewide for ranking. `components` in the score envelope retains raw counts for the reporter to cite. Caveats (always emitted):

- Reflects only *currently open* CID items. Historical protests not included.
- Filing counts come from CID Search Two and may include duplicate people, repeat submissions, or organization campaigns.
- `comment_count` is log-damped intentionally so high-volume comment floods do not dominate the score.
- "Hearing-request" in CID is not the same as "contested case granted." Use SOAH docket # for the latter.
- Per-capita normalization makes rural counties disproportionately bright. Provide raw and per-capita columns side-by-side; do not make per-capita the only ranking.

## Milestones (slot into refocus plan)

### M1.5 — protest data layer (new, parallel to refocus M1)
- `src/lib/datasets/cid.ts` — fetcher hitting CID, parser for Search One + Search Two HTML tables.
- `public/cache/cid-tx.json` — committed snapshot, all open items across all program areas.
- `src/lib/scoring/protest_density.ts` — APD per county.
- Tests: parser fixtures from a frozen HTML response in `tests/fixtures/cid/`.

### M2.5 — MCP additions
Add to `mcp-tools.md`:
- `list_protested_permits(filters: { county?, programArea?, minHearingRequests? })`
- `score_protest_density(scope: "county")`
- Update `summarize_water_risk_for_county` to optionally fold APD as a third axis.

### M3 — skill addition (no new milestone)
Add to existing `SKILL.md`:
- One example invocation: "What permits are being protested in Comal County right now?"
- Guardrail block: do not name individual commenters; report counts + filing orgs only.

### M4 — UI (post-MCP, optional for demo)
- County drilldown gains a "Pending fights" panel listing permits with comment_count and hearing_request_count.
- Agent-answer panel updates to mirror the new tool output.

## Definition of done (per workstream)

- **data**: CID fetcher + Search One/Two parsers, snapshot, APD score function, fixture-based tests, dataset-registry contract bumped, two new entries in `MVP_DATASETS`.
- **mcp**: `list_protested_permits` + `score_protest_density` registered in `mcp-tools.md`, smoke test exercises both.
- **skill**: SKILL.md updated with example + commenter-PII guardrail, end-to-end run-through still reproducible.
- **docs**: this plan committed, contract version bumped, STATE.md updated with new in-progress + next-up rows, OWNERSHIP.md unchanged (CID lives in `data` workstream by default).

## Guardrails (don't trip these)

- **No individual-commenter naming in agent output.** Aggregate counts and named filing orgs only. The data is public; the editorial framing is "X comments and Y hearing requests filed," not "Jane Doe of 123 Main St protested."
- **Don't conflate hearing request with contested case.** A hearing request is a citizen filing; a contested case is an executive action that refers to SOAH. The latter is the harder signal.
- **Pre-cache always.** CID is a 21-year-old ColdFusion app. Demo must read from snapshot, never live.
- **No claims about legal merit of protests.** Surface that they exist; do not characterize them as valid/frivolous.

## Risks

- **CID parser fragility.** ColdFusion-rendered tables with no class hooks. Mitigation: pin parser to fixture HTML, fail loud on schema drift, test against a checked-in copy.
- **Snapshot freshness vs cache size.** Open items across all program areas may exceed 5MB. If so: redirect to `data/cid-tx.json` (gitignored) + a `scripts/refresh-cid.ts`.
- **Scope creep into eFilings PDF parsing.** Tempting because the actual letters are gold. Holds for v2 — explicit out-of-scope above. If we cave, the demo slips.

## Open questions

- Do we want APD baked into the existing `summarize_water_risk_for_county` envelope or as a peer tool the agent decides whether to call? Default: peer tool. Reporter-style queries about "fights right now" don't always want a DWRS overlay.
- Per-capita-only or raw counts in the headline? See APD caveats. Default: emit both, let the skill template choose.
