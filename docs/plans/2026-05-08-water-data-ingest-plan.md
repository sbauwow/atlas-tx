# Atlas TX Water + Flood Data Ingest Plan

> For Hermes: use subagent-driven-development if executing this. Favor structured public endpoints over HTML scraping. ArcGIS REST, Socrata, USGS, and NWS first; browser/manual fallback only for discovery or blocked edge cases.

Goal: add a water intelligence lane to Atlas TX with county-joinable flood, hydrology, utility, and water-infrastructure signals that can power county rankings, map overlays, and future farmer almanac / weather-network features.

Architecture:
- create a source registry separate from the current county explorer so each water source has an explicit fetch mode, normalization contract, and county-join strategy
- keep raw-source adapters narrow and typed, then transform into normalized records under `src/lib/water/`
- expose two product surfaces first: statewide county overlay summaries and county detail endpoints, using the same pattern as the existing county explorer

Tech stack:
- Next.js 16 app router
- TypeScript
- existing `src/lib/texas-open-data.ts` patterns for Socrata
- new ArcGIS/USGS/NWS adapters
- Vitest

Verified public endpoints (checked live):
- FEMA NFHL ArcGIS REST: `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer?f=pjson`
- USGS NWIS Texas stream sites: `https://waterservices.usgs.gov/nwis/site/?format=rdb&stateCd=tx&siteType=ST&siteStatus=active`
- NWS active alerts for Texas: `https://api.weather.gov/alerts/active?area=TX`
- TCEQ sanitary sewer overflows: `https://data.texas.gov/resource/8kc5-95uk.json?$limit=1`
- TCEQ general water permits: `https://data.texas.gov/resource/6pm5-am5m.json?$limit=1`
- Texas water districts: `https://data.texas.gov/resource/hr84-s96f.json?$limit=1`
- Texas water districts map metadata: `https://data.texas.gov/api/views/ruhk-kxgs`
- PUCT water/sewer IOU metadata: `https://data.texas.gov/api/views/auk8-env9`
- PUCT water/sewer submeter metadata: `https://data.texas.gov/api/views/iuez-sv34`
- TWDB flood planning page: `https://www.twdb.texas.gov/flood/planning/data.asp`
- TWDB GIS data page: `https://www.twdb.texas.gov/mapping/gisdata.asp`
- TCEQ GIS data hub: `https://gis-tceq.opendata.arcgis.com/`
- National Levee Database home: `https://levees.sec.usace.army.mil/#/`

## Regional authority ingest matrix (Texas)

Use this to prioritize LCRA-like authorities after the current LCRA slice. Preference order: machine-readable first, county-joinable second, operational value third.

| Authority | Coverage / type | Verified data surface | Likely source mode | County-joinable | First ingest target | ROI |
|---|---|---|---|---|---|---|
| GBRA | Guadalupe-Blanco basin river authority | `https://www.gbra.org/operations/hydrolakes/`, `https://www.gbra.org/environmental/water-quality/`, ArcGIS hub `https://opengbra-gbra.hub.arcgis.com`, ArcGIS experience `https://experience.arcgis.com/experience/d69ff8b1857940a9a3567fb5b08418cc` | ArcGIS Hub / Experience + site endpoints | yes for many GIS layers; maybe for ops tables after normalization | hydrolakes + water-quality inventory + open-data layer catalog | very high |
| SARA | San Antonio River Authority | Open data hub `https://sariverauthority-sara-tx.opendata.arcgis.com/`, floodplain viewer `https://experience.arcgis.com/experience/929de86ce9274a858eb53319a8d16d87`, watershed viewer `https://experience.arcgis.com/experience/d9e510a7bfbb456fa3243c9f7ba20766`, basin report card `https://www.sariverauthority.org/maps-reports/river-basin-report-card/` | ArcGIS Hub / ArcGIS Experience / downloadable GIS | yes | floodplain + water-quality viewer layers + watershed planning layers | very high |
| SJRA | San Jacinto River Authority | OneRain dashboards under `https://sanjacinto.onerain.com/`, flood management `https://www.sjra.net/floodmanagement/`, Lake Conroe `https://www.sjra.net/lakeconroe/` | OneRain + site metadata | partial; point gauges yes, some ops pages maybe not | rainfall / gauge / reservoir conditions | high |
| TRA | Trinity River Authority | Clean Rivers `https://www.trinityra.org/basin_planning/clean_rivers_program/index.php`, lake/river data `https://www.trinityra.org/lake_information/lake_river_data/index.php`, flood planning `https://www.trinityra.org/basin_planning/flood_planning/index.php`, ArcGIS experience `https://experience.arcgis.com/experience/b5cc6be47b324f47bbcf4cc866694052` | site tables + ArcGIS | yes for basin/lake layers; maybe for quality program outputs after normalization | lake storage / river data + Clean Rivers data inventory | high |
| SRA | Sabine River Authority of Texas | rain `https://sratx.org/basin-conditions/se-texas-rain/`, lake levels `https://sratx.org/basin-conditions/lake-levels/`, stream levels `https://sratx.org/basin-conditions/stream-levels/`, water quality `https://sratx.org/water-quality/water-quality-monitoring/` | site endpoints + linked gauges | partial to yes | rain / stream / lake condition feeds | high |
| LNVA | Lower Neches Valley Authority | OneRain `https://lnva.onerain.com/dashboard/?dashboard=54023492-7d9f-47c4-a0ed-3ef734c35c0b`, canal quality `https://lnva.dst.tx.us/canal-water-quality`, Clean Rivers `https://lnva.dst.tx.us/clean-rivers-program` | OneRain + site tables | partial to yes | canal quality + rainfall / gauge feeds | medium-high |
| EAA | Edwards Aquifer Authority (adjacent groundwater authority, not river authority) | Environmental Data Portal `https://data.edwardsaquifer.org/`, homepage aquifer conditions `https://www.edwardsaquifer.org/` | dedicated data portal | yes for many monitoring locations / regional overlays | aquifer conditions + environmental data catalog | very high |
| TRWD | Tarrant Regional Water District (adjacent regional water authority) | OneRain dashboards `https://trwd.onerain.com/`, ArcGIS app `https://trwdmaps.maps.arcgis.com/apps/instant/nearby/index.html?appid=9b2f631d838946c5a410df998cf984ee` | OneRain + ArcGIS | partial to yes | rainfall / flood ops / lake levels | medium-high |
| BRA | Brazos River Authority | basin / reservoir pages `https://brazos.org/about-us/about-the-bra/maps`, lake maps like `https://brazos.org/about-us/reservoirs/lake-granbury/online-lake-map` | site pages; deeper endpoint hunt still needed | unclear | reservoir / lake metadata, then inspect hidden GIS/API surfaces | medium |
| UCRA | Upper Colorado River Authority | `https://www.ucra.org/` (needs deeper endpoint discovery) | unknown yet | unclear | second-pass discovery only | low for now |

Recommended execution order:
1. GBRA
2. SARA
3. EAA
4. TRA
5. SJRA
6. SRA
7. LNVA
8. TRWD
9. BRA
10. UCRA

## Best next move after the current LCRA quality routes

Build a county aggregation layer from:
- LCRA quality site coordinates
- observation counts / latest observation dates
- top STORET categories / codes by county

Then surface these county summary fields:
- `activeLcraQualitySiteCount`
- `latestLcraObservationAt`
- `availableLcraParameterCount`
- `impairedLcraMonitoringSiteCount`

Implementation note:
- county-join sites by point-in-county from latitude/longitude
- compute observation recency from normalized site / segment observations already exposed under `/api/water/lcra/quality/...`
- treat LCRA as monitoring-context enrichment; do not present it as the statewide regulatory source of truth

---

## Product scope for this lane

Initial public outcomes:
1. county flood exposure lens
2. county hydrology / gauge coverage lens
3. county sewer-spill / water-infrastructure stress lens
4. county water-governance structure lens

Immediate map layers:
- county floodplain share
- active flood-related alerts
- stream gauges
- sewer overflow events
- water districts / utilities

Do not build first:
- parcel-level flood-risk UI
- raster-heavy flood-depth analytics
- full TWDB/TCEQ hub ingestion
- private weather station ingest

---

## Source registry to add

Create: `src/lib/water/water-source-registry.ts`

```ts
export type WaterSourceKind =
  | "arcgis-rest"
  | "socrata"
  | "usgs-rdb"
  | "nws-geojson"
  | "html-discovery";

export type WaterJoinStrategy =
  | "county-name"
  | "county-fips"
  | "point-in-county"
  | "polygon-overlay"
  | "statewide-only";

export type WaterSourceDefinition = {
  sourceId: string;
  name: string;
  kind: WaterSourceKind;
  verifiedUrl: string;
  joinStrategy: WaterJoinStrategy;
  refreshCadence: "hourly" | "daily" | "weekly" | "manual";
  notes?: string;
};
```

Seed the registry with these source IDs:
- `fema-nfhl`
- `usgs-stream-sites`
- `nws-alerts`
- `tceq-sewer-overflows`
- `tceq-general-water-permits`
- `tceq-water-districts`
- `puct-water-iou`
- `puct-water-submeter`
- `twdb-flood-discovery`
- `twdb-gis-discovery`
- `tceq-gis-discovery`
- `national-levee-discovery`

---

## Canonical schemas to add now

Create: `src/lib/water/types.ts`

### 1) Floodplain feature
```ts
export type FloodplainFeature = {
  sourceId: "fema-nfhl";
  featureId: string;
  countyFips?: string;
  countyName?: string;
  zone?: string | null;
  floodway?: boolean | null;
  geometryType: "polygon";
  areaSqMeters?: number | null;
  raw: Record<string, unknown>;
};
```

### 2) Stream gauge
```ts
export type StreamGauge = {
  sourceId: "usgs-stream-sites";
  siteNumber: string;
  stationName: string;
  countyName?: string | null;
  countyFips?: string | null;
  latitude: number;
  longitude: number;
  siteType?: string | null;
  status?: string | null;
  raw: Record<string, unknown>;
};
```

### 3) Flood / weather alert
```ts
export type WaterAlert = {
  sourceId: "nws-alerts";
  alertId: string;
  event: string;
  severity?: string | null;
  certainty?: string | null;
  urgency?: string | null;
  headline?: string | null;
  sentAt?: string | null;
  expiresAt?: string | null;
  countyNames?: string[];
  geometryType: "polygon" | "none";
  raw: Record<string, unknown>;
};
```

### 4) Sewer overflow event
```ts
export type SewerOverflowEvent = {
  sourceId: "tceq-sewer-overflows";
  incidentNumber: string;
  countyName?: string | null;
  entityName?: string | null;
  materialType?: string | null;
  amountGallons?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  cause?: string | null;
  status?: string | null;
  raw: Record<string, unknown>;
};
```

### 5) Water permit record
```ts
export type WaterPermitRecord = {
  sourceId: "tceq-general-water-permits" | "tceq-water-quality-individual-permits";
  permitNumber: string;
  countyName?: string | null;
  permitStatus?: string | null;
  permitType?: string | null;
  siteName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  raw: Record<string, unknown>;
};
```

### 6) Water governance entity
```ts
export type WaterGovernanceEntity = {
  sourceId: "tceq-water-districts" | "puct-water-iou" | "puct-water-submeter";
  entityId: string;
  countyName?: string | null;
  entityName: string;
  entityType?: string | null;
  activityStatus?: string | null;
  city?: string | null;
  raw: Record<string, unknown>;
};
```

### 7) County water summary
```ts
export type CountyWaterSummary = {
  county: { name: string; slug: string; fips?: string };
  metrics: {
    floodplainFeatureCount?: number;
    streamGaugeCount?: number;
    activeWaterAlertCount?: number;
    sewerOverflowCount30d?: number;
    sewerOverflowGallons30d?: number;
    generalPermitCount?: number;
    waterDistrictCount?: number;
    waterUtilityCount?: number;
  };
  overlays: {
    hasFloodplainLayer: boolean;
    hasGaugeLayer: boolean;
    hasAlertLayer: boolean;
    hasSewerOverflowLayer: boolean;
  };
  annotations: string[];
};
```

---

## Files to create

Core source/adapters:
- `src/lib/water/types.ts`
- `src/lib/water/water-source-registry.ts`
- `src/lib/water/arcgis-rest.ts`
- `src/lib/water/usgs.ts`
- `src/lib/water/nws.ts`
- `src/lib/water/water-summary-service.ts`
- `src/lib/water/fema-nfhl.ts`
- `src/lib/water/tceq-sewer-overflows.ts`
- `src/lib/water/tceq-general-permits.ts`
- `src/lib/water/water-governance.ts`

Discovery/metadata files:
- `src/lib/water/discovery/twdb.ts`
- `src/lib/water/discovery/tceq-hub.ts`
- `src/lib/water/discovery/levees.ts`

API routes:
- `src/app/api/water/overview/route.ts`
- `src/app/api/water/counties/[slug]/route.ts`
- `src/app/api/water/alerts/route.ts`
- `src/app/api/water/gauges/route.ts`

Tests:
- `tests/fema-nfhl.test.ts`
- `tests/usgs-water.test.ts`
- `tests/nws-water-alerts.test.ts`
- `tests/tceq-sewer-overflows.test.ts`
- `tests/water-summary-service.test.ts`
- `tests/water-api-routes.test.ts`

Docs:
- `docs/sources/water-sources.md`

---

## Exact route plan

### `/api/water/overview`
Purpose: statewide county-level summaries for map coloring and ranking.

Response shape:
```ts
{
  generatedAt: string;
  counties: CountyWaterSummary[];
  sourceIds: string[];
}
```

### `/api/water/counties/[slug]`
Purpose: selected county detail view.

Response shape:
```ts
{
  county: CountyWaterSummary;
  layers: {
    sewerOverflows: SewerOverflowEvent[];
    gauges: StreamGauge[];
    alerts: WaterAlert[];
    governance: WaterGovernanceEntity[];
  };
  notes: string[];
}
```

### `/api/water/alerts`
Purpose: statewide active alerts, optionally filter by county.

Query params:
- `county=travis-county` optional

### `/api/water/gauges`
Purpose: statewide or county-filtered stream gauges.

Query params:
- `county=travis-county` optional

---

## First five adapters to implement

### Adapter 1: NWS active alerts
File: `src/lib/water/nws.ts`

Why first:
- clean API
- operationally useful
- easy product payoff

Behavior:
- fetch Texas active alerts from `api.weather.gov`
- keep only water-relevant events initially:
  - Flood Warning
  - Flash Flood Warning
  - Flood Advisory
  - Hydrologic Outlook
  - Coastal Flood Warning
- normalize county names from `areaDesc` when possible

Minimal exported functions:
```ts
export async function fetchTexasWaterAlerts(): Promise<WaterAlert[]>;
export function filterAlertsForCounty(alerts: WaterAlert[], county: string): WaterAlert[];
```

### Adapter 2: USGS Texas stream sites
File: `src/lib/water/usgs.ts`

Why second:
- live hydrology lane
- stable public source

Behavior:
- fetch Texas stream sites from NWIS RDB endpoint
- parse tab-delimited response
- normalize points and county names/FIPS if present
- if county missing, leave nullable for now; later assign by point-in-county

Minimal exported functions:
```ts
export async function fetchTexasStreamGauges(): Promise<StreamGauge[]>;
export function filterGaugesForCounty(gauges: StreamGauge[], county: string): StreamGauge[];
```

### Adapter 3: TCEQ sewer overflows
File: `src/lib/water/tceq-sewer-overflows.ts`

Why third:
- high-signal county infrastructure pain metric
- easy county aggregation

Behavior:
- use Socrata endpoint `8kc5-95uk`
- start with bounded window, e.g. last 30 or 90 days
- normalize `amount` to gallons where possible
- derive county from row if present; if absent, later geocode/point join, but initial version can keep unknowns excluded from county rollups

Minimal exported functions:
```ts
export async function fetchRecentSewerOverflows(days: number): Promise<SewerOverflowEvent[]>;
export function summarizeSewerOverflowsByCounty(events: SewerOverflowEvent[]): Map<string, { count: number; gallons: number }>;
```

### Adapter 4: TCEQ general water permits
File: `src/lib/water/tceq-general-permits.ts`

Why fourth:
- extends existing permit story cleanly
- easy statewide aggregation

Behavior:
- use dataset `6pm5-am5m`
- aggregate by county and permit status
- later merge with existing individual permits source if desired

Minimal exported functions:
```ts
export async function fetchGeneralWaterPermits(): Promise<WaterPermitRecord[]>;
export function summarizeGeneralPermitsByCounty(records: WaterPermitRecord[]): Map<string, number>;
```

### Adapter 5: Water governance bundle
File: `src/lib/water/water-governance.ts`

Why fifth:
- turns static utility data into county structure metrics
- supports long-term infrastructure and policy lenses

Behavior:
- begin with `hr84-s96f`
- then `auk8-env9` and `iuez-sv34`
- normalize all to `WaterGovernanceEntity`

Minimal exported functions:
```ts
export async function fetchWaterDistricts(): Promise<WaterGovernanceEntity[]>;
export async function fetchWaterUtilities(): Promise<WaterGovernanceEntity[]>;
export function summarizeGovernanceByCounty(records: WaterGovernanceEntity[]): Map<string, { districtCount: number; utilityCount: number }>;
```

---

## FEMA floodplain strategy

Do not make FEMA the first execution slice, but define it now correctly.

File: `src/lib/water/fema-nfhl.ts`

Phase 1 scope:
- fetch service metadata from NFHL MapServer
- identify county-relevant layers and field names
- add a thin query builder for layer queries
- do not attempt full statewide polygon ingestion in the first commit

Need before county rollups:
- a county polygon or county FIPS join path
- either:
  - direct county fields in queried layers, or
  - spatial overlay against Texas county polygons

Phase 1 exported functions:
```ts
export async function fetchNfhlServiceMetadata(): Promise<Record<string, unknown>>;
export function buildNfhlLayerQueryUrl(layerId: number, where?: string): string;
```

Phase 2:
- query flood zone layers for Texas only
- compute county summary metrics like floodplain feature count or area share

---

## County join strategy

Short-term join rules:
1. county name direct match when source provides county
2. county name normalize through existing `normalizeCountyName()` and `countySlug()`
3. keep unmatched records in a statewide bucket instead of dropping them silently

Later join rules:
4. county FIPS direct join when available
5. point-in-county join for gauges / alerts / spill points
6. polygon overlay for FEMA floodplain features

Create later helper:
- `src/lib/water/county-join.ts`

Planned API:
```ts
export function joinByCountyName(input: string): { name: string; slug: string } | null;
export function groupUnknownCountyRecords<T>(records: T[]): T[];
```

---

## Summary service design

File: `src/lib/water/water-summary-service.ts`

Purpose:
- orchestrate the first five adapters
- produce `CountyWaterSummary[]`
- mirror the current county explorer service shape so UI work is easy later

Minimal service API:
```ts
export type AtlasWaterSummaryService = {
  getWaterOverview(): Promise<{
    generatedAt: string;
    counties: CountyWaterSummary[];
    sourceIds: string[];
  }>;
  getCountyWaterBreakdown(county: string): Promise<{
    county: CountyWaterSummary;
    layers: {
      sewerOverflows: SewerOverflowEvent[];
      gauges: StreamGauge[];
      alerts: WaterAlert[];
      governance: WaterGovernanceEntity[];
    };
    notes: string[];
  }>;
};
```

Use ranking fields later, but do not force a composite water score in the first commit.

---

## Discovery-only sources for later scraping

These should be added as discovery metadata collectors, not full ingestors yet:
- TWDB flood planning page
- TWDB GIS page
- TCEQ GIS hub
- National Levee Database

Create a discovery format:
```ts
export type DiscoveryAsset = {
  sourceId: string;
  label: string;
  url: string;
  assetType: "html-page" | "arcgis-layer" | "download";
  notes?: string;
};
```

Goal:
- turn these pages into a tracked backlog of actual machine-usable sublayers/downloads
- avoid committing to brittle HTML scraping before the real endpoints are enumerated

---

## Execution order

### Task 1: create water types + source registry
Files:
- create `src/lib/water/types.ts`
- create `src/lib/water/water-source-registry.ts`
- test `tests/water-source-registry.test.ts`

### Task 2: add NWS alerts adapter
Files:
- create `src/lib/water/nws.ts`
- create `tests/nws-water-alerts.test.ts`

### Task 3: add USGS stream gauge adapter
Files:
- create `src/lib/water/usgs.ts`
- create `tests/usgs-water.test.ts`

### Task 4: add TCEQ sewer overflow adapter
Files:
- create `src/lib/water/tceq-sewer-overflows.ts`
- create `tests/tceq-sewer-overflows.test.ts`

### Task 5: add general permits adapter
Files:
- create `src/lib/water/tceq-general-permits.ts`
- create `tests/tceq-general-permits.test.ts`

### Task 6: add governance adapter
Files:
- create `src/lib/water/water-governance.ts`
- create `tests/water-governance.test.ts`

### Task 7: add summary service
Files:
- create `src/lib/water/water-summary-service.ts`
- create `tests/water-summary-service.test.ts`

### Task 8: add water APIs
Files:
- create `src/app/api/water/overview/route.ts`
- create `src/app/api/water/counties/[slug]/route.ts`
- create `src/app/api/water/alerts/route.ts`
- create `src/app/api/water/gauges/route.ts`
- create `tests/water-api-routes.test.ts`

### Task 9: add FEMA discovery stub
Files:
- create `src/lib/water/fema-nfhl.ts`
- create `tests/fema-nfhl.test.ts`

### Task 10: add docs
Files:
- create `docs/sources/water-sources.md`
- document verified endpoints, field caveats, county joins, and unknowns

---

## Testing plan

Use strict TDD for each adapter.

Example red/green targets:
- `tests/nws-water-alerts.test.ts`
  - parses active Texas alerts
  - filters to flood/water-relevant events
  - derives county names from `areaDesc`
- `tests/usgs-water.test.ts`
  - parses NWIS RDB header/data rows
  - returns normalized gauges with lat/lon
- `tests/tceq-sewer-overflows.test.ts`
  - parses amount into gallons
  - groups by county over bounded lookback window
- `tests/water-summary-service.test.ts`
  - merges heterogeneous source summaries into county summaries
- `tests/water-api-routes.test.ts`
  - route returns overview JSON
  - route returns county detail JSON

Verification commands:
- `npm test`
- `npm run lint`
- `npm run build`

---

## First UI after APIs

After the API slice is green, add:
- `/water` page
- statewide county water table
- live alert badge count
- map toggles for:
  - alerts
  - gauges
  - sewer overflows
  - governance layers

Do not block adapter work on UI.

---

## Important cautions

- Do not scrape HTML if a machine endpoint exists.
- Do not start with FEMA polygon-heavy analytics until county join strategy is explicit.
- Do not silently discard records with missing counties; track unknowns.
- Keep live alert/gauge sources operational and bounded; avoid unbounded historical pulls in first pass.
- Treat TWDB/TCEQ hub pages as discovery sources first, not ingestion sources.

---

## Recommended immediate implementation slice

Implement exactly this first:
1. `src/lib/water/types.ts`
2. `src/lib/water/water-source-registry.ts`
3. `src/lib/water/nws.ts`
4. `src/lib/water/usgs.ts`
5. `src/lib/water/tceq-sewer-overflows.ts`
6. `src/lib/water/water-summary-service.ts`
7. `/api/water/overview`
8. `/api/water/counties/[slug]`

That gives Atlas TX a real water lane fast without getting buried in FEMA polygon complexity.
