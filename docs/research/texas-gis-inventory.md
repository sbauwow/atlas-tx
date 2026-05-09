# Texas GIS inventory for Atlas TX

> Status: research note and ingestion-planning inventory. Not a contract.
>
> Written: 2026-05-08 after checking the Atlas TX repo plus live Texas agency portals.
> This is not a claim to list every GIS layer in Texas. It is a first-pass,
> atlas-tx-oriented inventory of the official statewide portals, the highest-value
> dataset families, and the next ingestion candidates.

## 1. Bottom line

Atlas TX already has the right core tabular stack for the water-risk story:
- TCEQ Water Quality Individual Permits (`7fq8-wig2`)
- Texas Water Districts (`hr84-s96f`)
- EPA SDWIS
- EPA EJScreen
- Census ACS
- optional/follow-on: EPA ECHO, EPA TRI, TCEQ CID

What is missing is a cleaner statewide GIS inventory around those tables.
The best official GIS sources for that next layer are:

1. Texas Open Data Portal (`data.texas.gov`) for tabular/state-agency datasets
2. TCEQ GIS Data Hub and geographic data viewers for environmental/water layers
3. TWDB GIS downloads for water, hydro, aquifer, well, and planning-region geometry
4. TxGIO / StratMap for statewide base layers like parcels, address points, hydrography, imagery, and lidar
5. TxDOT Open Data for roadway/infrastructure overlays
6. Railroad Commission GIS for oil, gas, and pipeline context

For ingestion planning, the most valuable additions after the current MVP are:
- TWDB aquifers, river basins, HUCs, reservoirs, wells, and planning regions
- TCEQ GIS hub layers that complement permits/water districts
- StratMap hydrography, parcels, address points, imagery, and elevation
- RRC oil/gas/pipeline overlays
- TxDOT roadway / congestion / project layers for infrastructure context

## 2. What Atlas TX already registers

From `README.md` and `docs/contracts/dataset-registry.md`, Atlas TX currently centers on:

### Current core
- `7fq8-wig2` — TCEQ Water Quality Individual Permits (Active/Pending)
- `hr84-s96f` — Texas Water Districts
- `epa-sdwis-violations` — SDWIS drinking-water violations
- `epa-ejscreen-2024` — EJScreen indicators
- `census-acs5-2023-county` — ACS population and demographics

### Current secondary / follow-on
- `epa-echo-violations`
- EPA TRI (mentioned in README as secondary)
- `tceq-cid-search-one`
- `tceq-cid-search-two`

This means the repo already has the right score inputs. The next step is broadening the map geometry and exposure-context layers around them.

## 3. Official GIS / data sources checked live

### A. Texas Open Data Portal
URL: <https://data.texas.gov/>

What it is:
- statewide portal for Texas agency datasets, mostly tabular/API-first
- good for Socrata ingestion and county/entity joins

Observed live categories included:
- Permits & Licensing
- Business & Economy
- Government & Taxes
- Social Services
- Transportation
- Agriculture
- Public Safety
- Energy and Environment
- Public Reports and Maps

Atlas TX use:
- continue using this for stable tabular source ingestion
- search for more TCEQ/TWDB/TxDOT agency datasets before scraping bespoke viewers

### B. TCEQ GIS
URLs:
- <https://www.tceq.texas.gov/gis>
- <https://gis-tceq.opendata.arcgis.com/>

Observed live links from the TCEQ GIS page:
- TCEQ GIS Data Hub
- TCEQ Geographic Data Viewers
- Maps Created by TCEQ Staff
- GIS Standards
- TCEQ Spatial Data Dictionary (Point)
- Water Districts Map Viewer
- Water Well Report Viewer
- Edwards Aquifer Map Viewer

Observed live program buckets in the TCEQ GIS Data Hub:
- Air
- Land Management
- Water
- Emergency Response
- Administrative
- All Available Datasets

Atlas TX use:
- complement the Socrata permit tables with TCEQ-maintained geometry/view layers
- identify spatial layers for wells, districts, aquifer/admin boundaries, and water-related facilities
- use the data dictionary and standards pages before normalizing any TCEQ geometry feed

### C. TWDB GIS downloads
URL: <https://www.twdb.texas.gov/mapping/gisdata.asp>

Observed live downloadable layers:
- Major Aquifers
- Minor Aquifers
- River Basins
- HUC (8-digit hydrologic units)
- Existing Reservoirs
- Precipitation
- Major Rivers
- Texas Hillshade
- Texas Terrain
- GWDB Well Locations
- SDRDB Well Locations
- SDRDB Plugging Report Locations
- GCD boundaries
- RASL boundaries
- GMA boundaries
- PGMA boundaries
- PFCA regions
- RWPA boundaries
- FPR flood-planning-group boundaries
- Well Location Grid

The page also links to:
- Texas Water Data Hub
- BRACS GIS data

Atlas TX use:
- strongest near-term GIS expansion source after current MVP datasets
- directly useful for aquifer, basin, watershed, well, reservoir, and planning-region overlays

### D. TxGIO / StratMap
URLs:
- <https://tnris.org/>
- <https://www.tnris.org/stratmap/>

Observed live StratMap themes:
- Orthoimagery
- Elevation – Lidar
- Hydrography
- Land Parcels
- Address Points

Observed live positioning:
- StratMap exists to develop consistent statewide digital data layers
- final accepted deliverables are placed in the public domain

Atlas TX use:
- statewide base geometry
- parcel/address geocoding context
- map presentation and physical context layers
- possible future service-area or facility-neighborhood analysis support

Operational note:
- the TxGIO DataHub endpoint (`https://data.geographic.texas.gov/`) returned HTTP 403 when checked directly, so plan around possible browser/CDN restrictions if automation is needed

### E. TxDOT Open Data Portal
URL: <https://gis-txdot.opendata.arcgis.com/>

Observed live categories:
- Assets
- Boundaries
- Highway Performance & Reports
- Infrastructure
- Planning
- Projects
- Roadways
- Safety
- Traffic

Observed live featured items / tools:
- TxDOT Roadways
- TxDOT Projects
- Congestion
- Statewide Planning Map
- Project Tracker
- Data Dictionary
- Maps

Atlas TX use:
- roadway access / transport burden context
- infrastructure adjacency for facilities, PWSs, or communities
- future emergency-response or logistics storytelling

### F. Railroad Commission of Texas GIS
URL: <https://www.rrc.texas.gov/resource-center/research/gis-viewer/>

Observed live positioning:
- Public GIS Viewer for oil, gas, and pipeline data
- updated nightly
- supports pipeline, survey, lease-ID, and API/address search workflows

Atlas TX use:
- oil/gas/pipeline exposure overlays
- likely strongest non-water burden layer if Atlas TX expands beyond permits + EJScreen

## 4. Prioritized ingestion plan

### Tier 1 — add next
These have the clearest direct payoff for the water-risk and burden story.

1. TWDB Major/Minor Aquifers
2. TWDB River Basins and HUCs
3. TWDB Existing Reservoirs
4. TWDB GWDB / SDRDB well layers
5. TWDB GCD / GMA / RWPA / FPR region boundaries
6. TCEQ GIS Hub water-related layers not already covered by Socrata
7. StratMap Hydrography

### Tier 2 — add after Tier 1
Strong contextual layers, but not required to make the core demo credible.

1. StratMap parcels
2. StratMap address points
3. StratMap imagery / lidar references
4. TxDOT roadways / congestion / projects
5. RRC oil, gas, and pipeline overlays

### Tier 3 — research / operational follow-up
1. Texas Water Data Hub APIs once the hub is fully available again
2. BRACS GIS relevance to groundwater/well context
3. TCEQ viewer-backed layers that may need ArcGIS/feature-service extraction rather than simple file download
4. service-area geometry for PWS / district analysis, if available from TCEQ/TWDB rather than inferred

## 5. Suggested repo follow-ons

### Near-term docs/data work
1. Keep `docs/research/texas-gis-inventory.csv` as the machine-readable seed inventory
2. Add a `priority` + `status` field once work starts on each source
3. Decide whether Atlas TX wants a `geometry-first` registry alongside the current dataset registry

### Best first implementation candidates
If the next milestone is geospatial enrichment rather than new scoring math, start with:
1. TWDB River Basins / HUC / Aquifers
2. TWDB GWDB well locations
3. TCEQ GIS Hub water program layers
4. StratMap hydrography

That sequence stays tightly aligned with the current water-risk story and avoids scope creep into generic statewide GIS collecting.

## 6. Inventory file

Machine-readable inventory lives at:
- [`texas-gis-inventory.csv`](texas-gis-inventory.csv)

The CSV is intended for ingestion planning, not public-facing claims. Some rows represent dataset families or portal groupings rather than one exact downloadable layer; that is intentional for first-pass planning.