# Atlas TX execution registry

This contract defines the machine-readable registry that drives Atlas TX's agentic ingest botnet.

Primary artifact:
- `config/execution-registry.county.json`

## Purpose

Atlas now has two separate but related layers:
- source catalogs that describe datasets and verified endpoints
- an execution registry that tells autonomous agents what to pull, in what wave, and why it matters

The execution registry is the coordination spine for:
- weather/history refreshes
- future open-data roadmap work
- county-level data-lane promotion
- botnet-style orchestration across structured APIs, snapshots, and fragile sources

## Design goals

The registry should make these questions answerable without reading prose docs:
- what should run now?
- what is only planned?
- what is authoritative vs explanatory vs community?
- what geography and time grain does a lane use?
- what downstream surfaces depend on it?
- what gates must be met before promotion into the main product?

## Top-level schema

```json
{
  "registryVersion": "0.1.0",
  "scope": "atlas-tx-county-ingest",
  "generatedFrom": ["docs/..."],
  "defaultGeography": "county",
  "executionUnits": []
}
```

## Execution unit schema

Each `executionUnits[]` row should include:

- `id`
- `name`
- `thesisLane`
  - `public-record-water-risk`
  - `operational-stress`
  - `hydrologic-weather-explanation`
  - `burden-governance-context`
  - `contradiction-detection`
  - `community-verification`
- `evidenceClass`
  - `authoritative`
  - `explanatory`
  - `derived`
  - `community`
- `status`
  - `active`
  - `partial`
  - `planned`
  - `research`
  - `legacy`
  - `blocked`
- `maturity`
  - `production`
  - `productizing`
  - `research-panel`
  - `discovery-only`
  - `research`
- `roadmapWave`
  - `wave-0`
  - `wave-1`
  - `wave-2`
  - `wave-3`
  - `wave-4`
- `roadmapPhaseLabel`
  - `now`
  - `next`
  - `later`
  - `future-community`
- `priorityRank`
- `strategicPriority`
- `sourceRefs`
- `upstreamType`
- `grain`
- `geographicJoinStrategy`
- `temporalResolution`
- `outputs`
- `downstreamConsumers`
- `activationCriteria`
- `caveats`

## Wave model

### Wave 0
Current county backbone.

Examples:
- permits
- water districts
- sewer overflows
- NWS active alerts
- USGS current streamflow context
- FEMA NFHL
- surface-water quality
- TWDB hydrology context

### Wave 1
County-month weather/hydrology productization.

Examples:
- county-month precipitation
- county-month streamflow
- county-month drought
- county-month temperature
- county-month NWS flood alerts

### Wave 2
Burden, compliance, and governance deepening.

Examples:
- SDWIS
- EJScreen
- ACS
- ECHO
- CID procedural signals

### Wave 3
Harder contradiction signals and future public-data lanes.

Examples:
- boil-water notices
- E2 disinfectant reporting
- IBI / biology

### Wave 4
Community verification layers.

Examples:
- citizen water observations
- future mission-derived evidence layers

## Execution rules

1. One upstream source can create multiple execution units.
   - Example: current NWS alerts vs county-month flood-alert history.

2. Evidence classes must stay explicit.
   - Community data should never be silently merged into authoritative scoring.

3. Activation gates matter.
   - A lane can be strategically important but still blocked from product promotion until joins, coverage, and QA are proven.

4. Null vs zero semantics must remain honest.
   - Especially for county-month weather panels.

## Related code

- `src/lib/execution/execution-registry.ts`
- `src/lib/atlas-ingest-orchestrator.ts`
- `scripts/refresh-all.ts`
- `scripts/refresh-weather.ts`
- `scripts/refresh-roadmap-open-data.ts`
