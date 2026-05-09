# Contract — Dataset Registry & Scoring

> Contract version: **0.6.0** — bump on any breaking change to types, fetcher signatures, or scoring outputs. Notify `mcp` and `web` workstreams in `STATE.md` when bumping.
>
> Changelog:
> - 0.6.0 (2026-05-09): add planned weather / hydrologic context contract language for NWS alerts, USGS streamflow, drought status, precipitation totals, and temperature / heat indicators. Clarify these are explanatory context layers for water events, not standalone proof of contamination or infrastructure failure.
> - 0.5.0 (2026-05-09): add planned mismatch-signal contract language for boil-water notices, E2 disinfectant reporting, and biological integrity / aquatic life context. Clarify that notice, treatment-stress, and biology layers are reporter-lead indicators, not direct proof of contamination or harm.
> - 0.4.0 (2026-05-08): add `tceq-swq-segments` as a registered external source for surface-water impairment / use-support context. Clarify platform stance: environmental burden is inferred from indicator layers, not directly observed.
> - 0.3.0 (2026-05-08): add first TWDB hydrology context sources (`twdb-major-aquifers`, `twdb-river-basins`, `twdb-huc8`) plus cached snapshot/normalizer contract in `src/lib/datasets/twdb-hydrology.ts`. Additive only.
> - 0.2.0 (2026-05-08): add CID protest sources (`tceq-cid-search-one`, `tceq-cid-search-two`) and `Active Protest Density` derived signal. See `docs/plans/2026-05-08-protests-extension.md`. Non-breaking for existing fetchers; new entries are additive. MCP gains optional `list_protested_permits` + `score_protest_density`.
> - 0.1.0: initial contract — DWRS, EJ Burden Overlap, Compliance Gap.

This is the cross-workstream API between **data** and its consumers (**mcp**, **web**). Anyone outside `data/` should depend only on what is documented here.

---

## Registry shape

`src/lib/mvp-datasets.ts` exports `MVP_DATASETS: MvpDataset[]`.

```ts
export type MvpDataset = {
  id: string;
  name: string;
  category: "environment" | "infrastructure" | "social" | "fiscal" | "debt" | "demographic" | "compliance";
  publisher: string;
  summary: string;
  keyFields: string[];
  useCase: string;
  accessType: "dataset" | "external";
  // future: source: "socrata" | "epa" | "census" | "twdb" | "rrc" | "brb"
};
```

Rules:
- `id` for Texas Socrata datasets is the 4x4 resource id. For federal sources, use the EPA / Census-stable identifier (e.g. `epa-sdwis-violations`, `epa-ejscreen-2024`, `census-acs5-2023-county`).
- `keyFields` lists the canonical field names the rest of the pipeline relies on. Renaming a field is a breaking change.
- `accessType: "dataset"` ⇒ Texas Socrata (auto-built URL via `texas-open-data.ts`). `"external"` ⇒ has a dedicated fetcher under `src/lib/datasets/`.
- Environmental-burden layers are treated as indicators/proxies. Registry entries and downstream tools must distinguish legal-status or proxy signals (for example "impaired" water segments) from direct measurements of harm.

## Per-source fetcher contract

Each external source gets one file at `src/lib/datasets/<slug>.ts` exporting:

```ts
// Pure fetch — hits the live API. Cache miss path.
export async function fetch<Source>(params: <Source>Params): Promise<<Source>Raw>;

// Normalize raw response to a stable, typed row shape.
export function normalize<Source>(raw: <Source>Raw): <Source>Row[];

// Default loader — reads the cached snapshot. This is the demo path.
// `live: true` forces fetch+normalize+rewrite cache.
export async function load<Source>(opts?: { live?: boolean }): Promise<<Source>Row[]>;
```

Caching rules:
- Snapshot under `public/cache/<slug>-tx.json`.
- Snapshot is committed when small (<5MB). Larger ⇒ `data/<slug>-tx.json` (gitignored) + a script under `scripts/refresh-<slug>.ts`.
- Fetcher must accept and respect a TX-only filter; we do not fetch national snapshots.

## Scoring functions

Each derived signal lives at `src/lib/scoring/<slug>.ts` and exports:

```ts
export type <Slug>Input = { /* explicit, narrow */ };
export type <Slug>Row = { /* one row per scored entity */
  id: string;             // PWS id, county FIPS, block group GEOID, etc.
  score: number;          // normalized 0-100
  components: Record<string, number>;
  caveats: string[];      // human-readable
};

export function score<Slug>(input: <Slug>Input): <Slug>Row[];
```

Rules:
- Pure functions. No I/O. Caller passes already-loaded rows from `load*()`.
- Always return `caveats`. Empty array is acceptable but the field must be present.
- Score normalization: 0-100 unless explicitly documented otherwise. Document the formula at the top of the file in 5 lines or fewer.

## Current registered signals

Atlas TX's journalist-facing scoring model should prefer anomaly and contradiction detection over simple correlation ranking whenever the data supports it. Derived signals should be designed so downstream tools can ask both:
- "what is high?"
- and "what is weird relative to the rest of the official record?"

### Drinking Water Risk Score (DWRS)
File: `src/lib/scoring/dwrs.ts` (TBD).
Inputs: SDWIS health-based violation rows, ACS population rows.
Per-PWS score: weighted by violation severity tier × population served × recency decay (months).
Caveats: SDWIS is self-reported; coverage gaps in small systems; recency decay window documented in code.

### EJ Burden Overlap
File: `src/lib/scoring/ej_overlap.ts` (TBD).
Inputs: EJScreen block-group indicators, TCEQ permit rows with lat/long.
Per-block-group score: EJScreen demographic-burden percentile × permit density within N-mile buffer.
Caveats: buffer-based exposure is a proxy, not a measured impact; EJScreen percentiles are state-relative.

### Surface Water Impairment Context (additive)
File: `src/lib/datasets/surface-water-quality.ts` (future).
Inputs: TCEQ Surface Water Quality Segment Viewer rows, hydrologic joins, county/PWS geometry joins.
Purpose: classify nearby water bodies by use-support / impairment status so Atlas TX can treat them as burden indicators inside a larger probabilistic analysis, not as direct proof of harm to a community or water system.
Caveats: "Impaired" is a legal-use-support classification for the intended use of the water body; it is not by itself a causal statement about downstream human health outcomes.

### Compliance Gap (secondary)
File: `src/lib/scoring/compliance_gap.ts` (TBD, M2+).
Inputs: TCEQ permit rows, EPA ECHO violation rows.
Per-county score: log(permits) × (1 − resolved_violations / total_violations).

### Official-signal mismatch detector (planned)
File: `src/lib/scoring/official_signal_mismatch.ts` (future).
Inputs: DWRS rows, surface-water impairment rows, sanitary sewer overflow/public-notice rows, boil-water notices (future), E2 disinfectant reporting rows (future).
Purpose: rank counties/PWSs where the public-notice footprint and the apparent regulatory / monitoring picture disagree enough to deserve reporter attention.
Examples:
- repeated sewer overflows or boil-water notices with weak corresponding burden/compliance indicators
- elevated DWRS or impaired nearby waters with unusually little notice/public escalation
- treatment-stress indicators that do not line up with the rest of the official picture
Caveats: mismatch is a reporter lead, not proof that any one source is wrong.

### Boil-water notice context (planned)
File: `src/lib/datasets/boil-water-notices.ts` (future).
Inputs: TCEQ boil-water and related consumer notice rows for Texas public water systems.
Purpose: identify PWSs and counties with repeated public-notice events and compare them against DWRS, sewer overflows, and treatment-stress indicators.
Recommended joins: `pws_id` where available; fallback to normalized utility/PWS name + county + notice date window.
Caveats:
- public notice issuance practices may vary across systems and incidents;
- a boil-water notice is a strong service-disruption / precautionary signal, not by itself proof of confirmed contamination;
- historical completeness may differ from current notices depending on the source path used.

### Biological integrity context (planned)
File: `src/lib/datasets/ibi.ts` (future).
Inputs: Index of Biotic Integrity, aquatic-life-use attainment rows, or equivalent biological-condition rows.
Purpose: let living-system condition disagree with chemistry/compliance summaries and create a stronger burden/outlier narrative.
Recommended joins: segment ID / assessment unit first; county overlay second; preserve basin/watershed context when available.
Caveats:
- biological integrity is still an indicator/proxy layer and should be joined carefully by watershed/segment geography;
- poor aquatic-life condition is evidence of ecological stress, not a standalone causal statement about human-health outcomes;
- if multiple biological programs are combined, the row shape must preserve method/source provenance.

### E2 disinfectant reporting context (planned)
File: `src/lib/datasets/e2-disinfectants.ts` (future).
Inputs: disinfectant/treatment reporting rows from the E2 Reporting System.
Purpose: provide an operational water-treatment stress signal that can be compared against notices, DWRS, and impairment context.
Caveats: operational anomalies do not automatically imply public-health harm.

### Weather / hydrologic context (planned)
These are explanatory layers for why a notice, overflow, or water-quality signal may have occurred. They should be attached to event windows and county/PWS summaries as context, not presented as standalone evidence of contamination or system failure.

### NWS alert context (planned)
File: `src/lib/datasets/nws-alerts.ts` (future).
Inputs: NWS alerts API rows filtered to Texas.
Recommended normalized row shape:
```ts
export type NwsAlertRow = {
  alertId: string;
  event: string;                      // e.g. Flood Warning, Flash Flood Warning
  severity: string | null;
  certainty: string | null;
  urgency: string | null;
  sentAt: string | null;
  onsetAt: string | null;
  endsAt: string | null;
  countyNames: string[];
  sameAsUrl: string | null;
  sourceUrl: string;
};
```
Purpose: provide event-window context for floods, flash flooding, and severe storms that may explain notices, overflows, or sudden water-quality deterioration.
Caveats:
- alerts are hazard communications, not observed contamination measurements;
- county targeting may be broad and should not be over-interpreted as parcel- or facility-specific impact.

### USGS streamflow context (planned)
File: `src/lib/datasets/usgs-streamflow.ts` (future).
Inputs: Texas USGS current conditions / NWIS streamflow rows.
Recommended normalized row shape:
```ts
export type UsgsStreamflowRow = {
  siteNumber: string;
  stationName: string;
  countyName: string | null;
  countyFips: string | null;
  basinCode: string | null;
  observedAt: string;
  dischargeCfs: number | null;
  gageHeightFt: number | null;
  flowStatus: "low" | "normal" | "high" | "unknown";
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
};
```
Purpose: capture dilution / concentration / flood-transport context through high-flow and low-flow conditions.
Caveats:
- many counties have multiple gauges or none nearby; county rollups must preserve the chosen aggregation rule;
- provisional real-time values may later be revised.

### Drought status context (planned)
File: `src/lib/datasets/drought.ts` (future).
Inputs: Drought.gov / U.S. Drought Monitor Texas rows.
Recommended normalized row shape:
```ts
export type DroughtStatusRow = {
  geographyId: string;                // county FIPS or regional ID
  geographyType: "county" | "region" | "state";
  geographyName: string;
  validAt: string;
  droughtCategory: "none" | "D0" | "D1" | "D2" | "D3" | "D4";
  impactType: "short" | "long" | "both" | "unknown";
  sourceUrl: string;
};
```
Purpose: provide chronic hydrologic-stress context that can explain concentration effects, low flows, and repeated infrastructure stress.
Caveats:
- drought classes are broad-scale indicators and may not reflect micro-local conditions.

### Precipitation totals context (planned)
File: `src/lib/datasets/precipitation.ts` (future).
Inputs: official NOAA/NWS/NCEI precipitation observations or analyses.
Recommended normalized row shape:
```ts
export type PrecipitationRow = {
  stationId: string;
  stationName: string | null;
  countyName: string | null;
  observedAt: string;
  precipitationInches: number;
  accumulationWindow: "1h" | "24h" | "72h" | "7d";
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
};
```
Purpose: provide runoff and storm-intensity context for notice spikes, sewer overflows, turbidity surges, and short-lived water-quality events.
Caveats:
- precipitation products differ between station observations and gridded/radar estimates; provenance must be preserved in the row/source metadata.

### Temperature / heat context (planned)
File: `src/lib/datasets/temperature.ts` (future).
Inputs: official NOAA daily summaries or normals-derived anomaly context.
Recommended normalized row shape:
```ts
export type TemperatureContextRow = {
  stationId: string;
  stationName: string | null;
  countyName: string | null;
  observedAt: string;
  maxTempF: number | null;
  minTempF: number | null;
  meanTempF: number | null;
  tempAnomalyF: number | null;
  heatwaveFlag: boolean;
  sourceUrl: string;
};
```
Purpose: capture heat-driven stress that can worsen water temperature, lower dissolved oxygen, and increase bloom/treatment stress risk.
Caveats:
- air temperature is an explanatory proxy, not the same thing as stream or reservoir temperature.

### Active Protest Density (APD)
File: `src/lib/scoring/protest_density.ts` (TBD, see `docs/plans/2026-05-08-protests-extension.md`).
Inputs: CID Search One rows (case metadata + SOAH cross-ref), CID Search Two rows (comment / hearing-request / public-meeting-request filings), county population (ACS).
Per-county score:
```
filing_pressure_per_item = (
    1.0                                          # base: a pending permit exists
  + 0.35 * log1p(comment_count)                  # comments matter, but are flood-prone
  + 0.75 * public_meeting_request_count          # stronger than comments, weaker than hearing requests
  + 1.25 * hearing_request_count                 # stronger procedural escalation
  + 2.5  * (soah_docket_number != null ? 1 : 0) # contested-case referral is the hardest signal
)
APD_raw = sum(filing_pressure_per_item in county)
APD_per_1k = APD_raw / (county_population / 1000)
APD_normalized = min-max scale of APD_per_1k to 0..100 statewide
```
Caveats (always emitted):
- Reflects only currently-open CID items; historical protests excluded.
- Filing counts come from CID Search Two and may include duplicate people, repeat submissions, or organization campaigns.
- `comment_count` is log-damped intentionally so high-volume comment blasts do not dominate the score.
- Hearing request ≠ contested case granted. SOAH docket # is the harder signal.
- Per-capita normalization brightens rural counties; emit both raw and per-capita columns, never per-capita alone.

## CID protest sources (added 0.2.0)

Both entries register as `accessType: "external"` with a single fetcher at `src/lib/datasets/cid.ts` returning two normalized row types:

```ts
export type CidCaseRow = {        // Search One
  tceqId: string;
  applicantName: string;
  county: string | null;          // normalized via counties.ts
  programArea: string;            // e.g. "APO", "AQ", "WQ", "IHWHL"
  itemStatus: "open" | "closed";
  tceqDocketNumber: string | null;
  soahDocketNumber: string | null;
  regulatedEntityNumber: string | null;
  customerNumber: string | null;
};

export type CidProtestRow = {     // Search Two
  tceqId: string;                 // joins to CidCaseRow.tceqId
  filingType: "comment" | "hearing_request" | "public_meeting_request";
  filerOrganization: string | null;
  filedAt: string;                // ISO date
  // No filer name fields are normalized — see protests-extension plan guardrails.
};
```

Fetcher contract notes specific to CID:
- ColdFusion form, no API. Fetcher must warm a session cookie (GET the form page first), then POST with `Content-Type: application/x-www-form-urlencoded` and a `Referer` header.
- Program Area uses sentinel value `"none"` for "any". County and Region use the blank/`ALL` option rather than `"none"`.
- Search Two has been live-verified with scripted POST. Search One broad queries are fragile; statewide refresh logic should chunk by county and/or program area instead of issuing one giant query.
- As of 2026-05-08 live testing in this repo, scripted Search One POSTs still return the upstream "An unexpected error has occurred" page even for county/program chunks. Treat full Search One refresh as a retry/manual-debug path, not a guaranteed unattended scrape yet.
- `scripts/refresh-cid.ts` now exists as the executable planning/execution scaffold. It builds chunked Search One request plans, builds the broad Search Two query, executes via injected fetch/parse functions, resolves size-based snapshot targets, can write snapshot payloads, and supports a browser-automation fallback hook for Search One chunks.
- Snapshot files: `public/cache/cid-cases-tx.json` and `public/cache/cid-protests-tx.json`. If either exceeds 5 MB, redirect to `data/` (gitignored) and keep the same script as the refresh entrypoint.
- Parser must be pinned to fixture HTML in `tests/fixtures/cid/` and fail loud on schema drift.

## Surface-water impairment context source (added 0.4.0)

Registered external dataset:

```ts
{
  id: "tceq-swq-segments",
  name: "TCEQ Surface Water Quality Segments Viewer",
  category: "environment",
  publisher: "Texas Commission on Environmental Quality",
  keyFields: ["segmentId", "segmentName", "assessmentUnit", "waterBodyType", "status", "designatedUse"],
  accessType: "external",
}
```

Contract notes:
- Atlas TX should treat this source as a context/indicator layer around counties, PWSs, and facilities.
- The user-provided interpretation to preserve in product language is: a water source labeled `impaired` does not meet the legal water-quality standards for its intended use.
- This source is best used inside a probabilistic burden story alongside DWRS, permit density, EJScreen, and similar indicators rather than as a standalone burden verdict.
- Because the source is an ArcGIS experience/viewer, a stable loader may require ArcGIS layer/service discovery before a dedicated fetcher is implemented.

## TWDB hydrology context sources (added 0.3.0)

These entries register as `accessType: "external"` and currently share one cached-snapshot loader at `src/lib/datasets/twdb-hydrology.ts`.

Normalized row shape:

```ts
export type TwdbHydrologyRow = {
  layerId: "twdb-major-aquifers" | "twdb-river-basins" | "twdb-huc8";
  layerName: string;
  primaryCode: string | null;
  name: string | null;
  basin: string | null;
  region: string | null;
  subregion: string | null;
  bbox: [number, number, number, number];
  geometryType: "polygon" | "other";
  sourceUrl: string;
};
```

Current layer-specific field mapping:
- `twdb-major-aquifers` → `AQUIFER`, `AQ_NAME`, `bbox`, `geometryType`
- `twdb-river-basins` → `basin_num`, `basin_name`, `bbox`, `geometryType`
- `twdb-huc8` → `HUC_8`, `SUBBASIN`, `BASIN`, `REGION`, `SUBREGION`, `bbox`, `geometryType`

Caching notes:
- Snapshot file: `public/cache/twdb-hydrology-tx.json`
- Refresh entrypoint: `npm run refresh:twdb-hydrology` (`scripts/refresh-twdb-hydrology.ts`)
- Current slice is intentionally a compact statewide extent snapshot (layer metadata + per-feature bounding boxes), not a full polygon-geometry cache.
- County summary wiring currently uses county centroid overlap against cached feature bounding boxes as an approximate hydrology-context signal, not full polygon intersection.
- Follow-on work can add fuller geometry export once Atlas TX needs map rendering or spatial joins beyond extents.

## Adding a new source or signal

1. Add an entry to `MVP_DATASETS` (data workstream).
2. Add fetcher + normalizer + load* + tests + cached snapshot (data workstream).
3. Update this contract with the new entry under "Current registered signals" or a new Sources section.
4. If a downstream MCP tool needs to expose it, mention in `mcp-tools.md` and `STATE.md`.

## Field-name discipline

Texas county fields vary (`county`, `county_name`, `facility_county`) — `src/lib/counties.ts` exists to normalize. Always run county strings through `normalizeCountyName()` before joining. PWS IDs are the federal SDWIS PWSID (state code + 7-digit number) — keep them as strings; never numericize.
