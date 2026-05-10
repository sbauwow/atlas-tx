# Contract — Dataset Registry & Scoring

> Contract version: **0.10.0** — bump on any breaking change to types, fetcher signatures, or scoring outputs. Notify `mcp` and `web` workstreams in `STATE.md` when bumping.
>
> Changelog:
> - 0.10.0 (2026-05-09): register planned data-center water-pressure (DCWP) sources and scorer per `docs/plans/2026-05-09-data-center-water-pressure.md`. Additive only. New planned source ids: `ercot-lfl`, `twdb-water-use-manufacturing`, `austin-top-commercial-water`, `city-building-permits-tx` (composed from the existing ranked city-open-data snapshot). New planned scorer: `data-center-water-pressure` (per-county DCWP). New planned mismatch hooks for `official_signal_mismatch.ts`: ESG-vs-permits, queue-vs-baseline, stress co-incidence, EJ co-incidence. Standard guardrails apply: queued ≠ commissioned, water-intensity bounds must be reported, no row ships without TX or federal open-data attribution.
> - 0.9.0 (2026-05-09): add ranked `city-open-data` snapshot contract for Atlas ingest prioritization (`public/cache/city-open-data-ranked-tx.json`) with lane, score, reasons, and `priorityTop25` shortlist.
> - 0.9.0 (2026-05-09): add `citizen-strips` as a separate, **non-regulatory** community-observation source under a strict isolation contract — does NOT feed DWRS, EJ Overlap, or any regulatory scorer. Lives behind `/citizen` and the new `WaterObservation` Prisma model. See "Citizen observation layer" section below.
> - 0.8.0 (2026-05-09): add curated `city-open-data` snapshot contract for water / permits / infrastructure source triage (`public/cache/city-open-data-curated-tx.json`) plus theme-match metadata and counts.
> - 0.7.0 (2026-05-09): add `city-open-data` catalog snapshot contract for Austin, Dallas, Houston, and San Antonio portal metadata refreshes. This is additive and supports source discovery / follow-on ingest planning.
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

### City open-data catalog snapshot (additive)
File: `src/lib/datasets/city-open-data.ts`
Script: `scripts/refresh-city-open-data.ts`
Snapshot: `public/cache/city-open-data-tx.json`
Curated script: `scripts/refresh-city-open-data-curated.ts`
Curated snapshot: `public/cache/city-open-data-curated-tx.json`
Ranked script: `scripts/refresh-city-open-data-ranked.ts`
Ranked snapshot: `public/cache/city-open-data-ranked-tx.json`

Purpose:
- freeze discoverable catalog metadata from the Austin, Dallas, Houston, and San Antonio city open-data portals into one committed Texas-city snapshot;
- support follow-on source selection and ingestion planning without live portal dependency in demo/research paths;
- produce a second curated snapshot limited to likely water / permits / infrastructure datasets for Atlas TX triage;
- produce a ranked snapshot that turns the 897 curated matches into an Atlas ingest shortlist with explicit priority lanes and score reasons.

Normalized row shape:
```ts
export type CityOpenDataCatalogRow = {
  sourceId: "austin" | "dallas" | "houston" | "san-antonio";
  sourceName: string;
  sourceType: "socrata" | "ckan";
  datasetId: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  organization: string | null;
  assetType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  tagCount: number;
  resourceCount: number;
  formats: string[];
  pageUrl: string;
  apiUrl: string | null;
};
```

Curated row shape additions:
```ts
export type CuratedCityOpenDataCatalogRow = CityOpenDataCatalogRow & {
  matchedThemes: Array<"water" | "permits" | "infrastructure">;
  matchReasons: string[]; // field:keyword pairs that triggered inclusion
};
```

Ranked row shape additions:
```ts
export type RankedCityOpenDataCatalogRow = CuratedCityOpenDataCatalogRow & {
  priorityLane:
    | "water-utility-ops"
    | "flood-drainage"
    | "building-development-permits"
    | "sewer-wastewater"
    | "infrastructure-projects"
    | "deprioritized";
  priorityScore: number;
  priorityReasons: string[];
};
```

Current ranked summary fields:
- `priorityLaneCounts`
- `priorityTop25`
- `totalRankedRowCount`
- `topPriorityCount`

Caveats:
- this is catalog metadata, not row-level dataset content;
- Socrata portal counts include non-tabular asset types (for example views, measures, files, and filters) unless downstream consumers explicitly filter them;
- curated inclusion is keyword/theme based and is a triage aid, not a guarantee that every matched dataset is in-scope or high-quality;
- ranked scores are heuristic prioritization for Atlas ingestion, not claims about data quality, policy importance, or public harm.

### SDWIS Water System Facilities (additive — storage tanks)
File: `src/lib/datasets/sdwis-facilities.ts`
Script: `scripts/refresh-sdwis-facilities.ts`
Snapshot: `public/cache/sdwis-storage-tx.json`

Purpose:
- inventory water-tower / ground-storage / reservoir facilities under each Texas Public Water System so the address-lookup composite can answer "what does my system store water in?";
- joinable by `pwsid` to existing SDWIS PWS rows and to the GEOGRAPHIC_AREA county join in `sdwis.ts`;
- foundation for future filtration / treatment / pump inventory by re-running with a wider `facilityTypeCodes` filter.

Normalized row shape:
```ts
export type SdwisFacility = {
  pwsid: string;
  facilityId: string;
  facilityName: string | null;
  stateFacilityId: string | null;
  facilityTypeCode: "ST" | "WL" | "IN" | "TP" | "DS" | "PC" | "OT";
  isActive: boolean;
};
```

Default snapshot filter: `FACILITY_TYPE_CODE=ST` (storage) + `FACILITY_ACTIVITY_CODE=A` (active). Current snapshot ≈ 28,500 active storage facilities across ~8,000 PWSs (~4.3 MB minified).

Caveats:
- WATER_SYSTEM_FACILITY rows have no latitude/longitude; geography is via `pwsid` joins only;
- `facility_name` strings often embed capacity hints (e.g. "0.2 MG GST" = 0.2 MG Ground Storage Tank, "15 MG RES" = 15 MG Reservoir) — treat as descriptive, not authoritative volume;
- a deactivated PWS may still own active facility rows in this table;
- widen with `loadSdwisFacilities({live: true, fetchParams: {facilityTypeCodes: ['ST','WL','TP','PC']}})` and write to `data/` (gitignored) for analysis runs that need the full facility footprint.

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

## Data center water pressure sources and scorer (added 0.10.0)

These entries are **planned** registrations supporting the additive plan in `docs/plans/2026-05-09-data-center-water-pressure.md`. Implementation lands under DC.M1. Until each fetcher ships, treat the rows here as the contract that the fetcher must satisfy.

### Planned sources

```ts
{
  id: "ercot-lfl",
  name: "ERCOT Large Flexible Load interconnection queue",
  category: "infrastructure",
  publisher: "Electric Reliability Council of Texas",
  keyFields: [
    "facilityName",
    "county",
    "queuedMw",
    "queueStatus",
    "queuePosition",
    "asOfDate",
    "facilityNameKnown",
  ],
  accessType: "external",
}

{
  id: "twdb-water-use-manufacturing",
  name: "TWDB Water Use Survey — manufacturing category",
  category: "infrastructure",
  publisher: "Texas Water Development Board",
  keyFields: [
    "countyFips",
    "countyName",
    "year",
    "manufacturingWaterUseGpd",
    "sourceUrl",
  ],
  accessType: "external",
}

{
  id: "austin-top-commercial-water",
  name: "Austin Top Commercial Water Customers",
  category: "infrastructure",
  publisher: "Austin Water (City of Austin)",
  keyFields: [
    "year",
    "customerName",
    "customerCategory",   // e.g. data-center, hotel, golf, hospital, school
    "annualGallons",
    "averageGpd",
    "sourceUrl",
  ],
  accessType: "external",
}

{
  id: "city-building-permits-tx",
  name: "City building / development permits (Austin / Dallas / Houston / San Antonio)",
  category: "infrastructure",
  publisher: "City of Austin / City of Dallas / City of Houston / City of San Antonio",
  keyFields: [
    "sourceCity",
    "permitId",
    "permitType",
    "issuedAt",
    "valuation",
    "address",
    "latitude",
    "longitude",
    "applicantName",
    "isLikelyDataCenter", // boolean derived from heuristics + applicant + valuation + use
  ],
  accessType: "external",
}
```

Notes:
- All four sources register as `accessType: "external"` and follow the standard `fetch* / normalize* / load*` contract.
- `city-building-permits-tx` is a composed loader — it reads the existing `public/cache/city-open-data-ranked-tx.json` shortlist for the `building-development-permits` lane and per-city Socrata datasets, normalizes them into one row shape, and exposes a single TX-wide loader.
- Snapshots live under `public/cache/<id>-tx.json` when small enough to commit; otherwise `data/<id>-tx.json` (gitignored) plus a refresh script.
- Per the field-name discipline at the bottom of this contract, every `county` / `countyName` field must be normalized through `normalizeCountyName()` before any join.

### Planned derived signal — Data Center Water Pressure (DCWP)

File: `src/lib/scoring/data_center_water_pressure.ts` (planned, DC.M1).

Inputs:
- `ercot-lfl` rows (current statewide queue snapshot)
- `twdb-water-use-manufacturing` rows (county baseline)
- `austin-top-commercial-water` rows where county is Travis
- `city-building-permits-tx` rows filtered to `isLikelyDataCenter: true`
- Existing TCEQ permit rows (`7fq8-wig2`)
- Existing US Drought Monitor and reservoir-storage context layers
- Existing DWRS rows (county-quartile rollup)

Per-county output (extends `<Slug>Row`):

```ts
export type DataCenterWaterPressureRow = {
  id: string;                        // county FIPS
  countyFips: string;
  countyName: string;
  score: number;                     // 0-100, statewide min-max
  components: {
    queuedWaterDemandGpdLow: number;
    queuedWaterDemandGpdHigh: number;
    countyBaselineWaterUseGpd: number;
    droughtMultiplier: number;
    dwrsQuartileMultiplier: number;
    reservoirTrendMultiplier: number;
  };
  facilities: Array<{
    facilityName: string | null;
    facilityNameKnown: boolean;
    queuedMw: number;
    waterIntensityFactorLow: number;
    waterIntensityFactorHigh: number;
    queueStatus: string;
    citationSourceIds: string[];     // ercot-lfl, city-building-permits-tx, etc.
  }>;
  caveats: string[];
};
```

Always-emitted caveats (the scorer is required to attach these or close equivalents):
- water intensity per MW is the largest unknown; defaults are documented and per-row low/high bounds are reported
- cooling type is rarely public; rows note which facilities used the default vs a known type
- ERCOT LFL queue includes paper projects; `queueStatus` must be visible per row
- city building-permit data is leading and noisy; permits do not equal commissioned load
- Austin Top Commercial Water Customers is annual and self-reported; cross-county comparisons are limited
- per-capita normalization is intentionally not used for DCWP — the journalist question is absolute siting pressure; per-resident exposure stays under EJ Burden Overlap
- queued data-center water demand is not a measurement of harm; DCWP is a journalist outlier signal

### Planned mismatch hooks

When `src/lib/scoring/official_signal_mismatch.ts` is implemented, it must accept the following DC-related inputs and emit them as distinct mismatch classes (each with its own caveats and citations):

1. **ESG vs permits** — hyperscaler regional ESG gpd vs sum of TCEQ permits + Austin top-customer rows in the same region.
2. **Queue vs baseline** — sum of `ercot-lfl` queued water demand vs the TWDB manufacturing baseline projection for the same county.
3. **Stress co-incidence** — high DCWP in counties with D2+ drought and top-quartile DWRS.
4. **EJ co-incidence** — DC siting density vs EJ Burden Overlap percentile in the same block groups.

Each mismatch is a journalist lead, not a causal claim. Standard Atlas TX framing rules apply: indicators / burden / contradiction, never harm or diagnosis.

## Citizen observation layer (added 0.7.0)

A separate, prototype community-observation lane. Strictly **isolated** from
the regulatory data above and from every scorer (`dwrs.ts`, `ej_overlap.ts`,
`apd.ts`, the planned mismatch detector). The colorimetry research memo
(`docs/research/smartphone-colorimetry.md`) sets the non-negotiables; this
contract enforces the data-side ones.

**Source id:** `citizen-strips`
**Access type:** local DB (Prisma + SQLite at `prisma/dev.db`)
**Owner workstream:** web (UI + route handlers); persistence shared in `src/lib/observations/`.

**Schema:** `WaterObservation` (`prisma/schema.prisma`). Discriminator column
`kind` so future modes (`tds`, `tap-photo`, `plumbing-form`) drop in without
migration churn. JSON-as-text columns parsed at the boundary in
`src/lib/observations/persistence.ts`.

**Pipeline (per submission):**
1. Browser samples median CIELab per pad against a bundled reference chart
   (`src/lib/observations/strips/reference-chart-9pad.ts`) and emits a
   `ClientReading`.
2. Server runs sharp-based QA (`src/lib/observations/qa.ts`) — blur,
   low-light, saturation-clip flags.
3. Server calls OpenAI `gpt-4o-mini` vision (`src/lib/observations/vision.ts`)
   for an independent per-analyte band reading. Returns `null` if
   `OPENAI_API_KEY` is unset → falls back to `review` status.
4. `decideStatus` in `src/lib/observations/status.ts` merges QA flags + client
   ↔ LLM agreement into one of: `accepted` / `accepted_warn` / `review` /
   `rejected`.

**Hard contract guarantees (do not violate):**
- `citizen-strips` MUST NOT appear in `MVP_DATASETS` and MUST NOT feed any
  scorer in `src/lib/scoring/`. Any future need to surface citizen data
  alongside regulatory data must be a *separate, clearly labeled* layer.
- All public projections strip server filesystem paths (image bytes never
  leave the server). See `toPublicView` in
  `src/app/api/citizen/observations/route.ts`.
- Outputs are bands, not numeric measurements. Never display a single number
  with units as if it were a lab reading.
- The reference chart `version: 0` is uncalibrated. Bumping it requires a
  cited source per the colorimetry memo §13.

**Routes:**
- `POST /api/citizen/observations` — multipart upload (image + clientReading)
- `GET  /api/citizen/observations` — list latest 100 (no image paths)
- `GET  /api/citizen/observations/[id]` — single

**Reference chart:** `generic-9pad-v0` — 9 analytes (pH, free chlorine, total
chlorine, total hardness, total alkalinity, nitrate, nitrite, iron, copper).
Lab values are PROTOTYPE approximations; replace before any public claim.

**MCP exposure:** none in v1. A future MCP tool would need its own contract
section here and a `mcp-tools.md` entry.

## Adding a new source or signal

1. Add an entry to `MVP_DATASETS` (data workstream).
2. Add fetcher + normalizer + load* + tests + cached snapshot (data workstream).
3. Update this contract with the new entry under "Current registered signals" or a new Sources section.
4. If a downstream MCP tool needs to expose it, mention in `mcp-tools.md` and `STATE.md`.

## Field-name discipline

Texas county fields vary (`county`, `county_name`, `facility_county`) — `src/lib/counties.ts` exists to normalize. Always run county strings through `normalizeCountyName()` before joining. PWS IDs are the federal SDWIS PWSID (state code + 7-digit number) — keep them as strings; never numericize.
