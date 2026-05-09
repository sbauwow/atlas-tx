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

export const WATER_SOURCE_REGISTRY: WaterSourceDefinition[] = [
  { sourceId: "fema-nfhl", name: "FEMA National Flood Hazard Layer", kind: "arcgis-rest", verifiedUrl: "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer?f=pjson", joinStrategy: "polygon-overlay", refreshCadence: "weekly" },
  { sourceId: "usgs-stream-sites", name: "USGS Texas stream sites", kind: "usgs-rdb", verifiedUrl: "https://waterservices.usgs.gov/nwis/site/?format=rdb&stateCd=tx&siteType=ST&siteStatus=active", joinStrategy: "county-fips", refreshCadence: "daily" },
  { sourceId: "nws-alerts", name: "NWS active alerts for Texas", kind: "nws-geojson", verifiedUrl: "https://api.weather.gov/alerts/active?area=TX", joinStrategy: "county-name", refreshCadence: "hourly" },
  { sourceId: "tceq-sewer-overflows", name: "TCEQ sanitary sewer overflows", kind: "socrata", verifiedUrl: "https://data.texas.gov/resource/8kc5-95uk.json?$limit=1", joinStrategy: "county-name", refreshCadence: "daily" },
  { sourceId: "tceq-general-water-permits", name: "TCEQ general water permits", kind: "socrata", verifiedUrl: "https://data.texas.gov/resource/6pm5-am5m.json?$limit=1", joinStrategy: "county-name", refreshCadence: "daily" },
  { sourceId: "tceq-water-districts", name: "Texas water districts", kind: "socrata", verifiedUrl: "https://data.texas.gov/resource/hr84-s96f.json?$limit=1", joinStrategy: "county-name", refreshCadence: "weekly" },
  { sourceId: "puct-water-iou", name: "PUCT water and sewer IOUs", kind: "socrata", verifiedUrl: "https://data.texas.gov/api/views/auk8-env9", joinStrategy: "county-name", refreshCadence: "weekly" },
  { sourceId: "puct-water-submeter", name: "PUCT water and sewer submetering", kind: "socrata", verifiedUrl: "https://data.texas.gov/api/views/iuez-sv34", joinStrategy: "county-name", refreshCadence: "weekly" },
  { sourceId: "twdb-flood-discovery", name: "TWDB flood planning discovery", kind: "html-discovery", verifiedUrl: "https://www.twdb.texas.gov/flood/planning/data.asp", joinStrategy: "statewide-only", refreshCadence: "manual" },
  { sourceId: "twdb-gis-discovery", name: "TWDB GIS discovery", kind: "html-discovery", verifiedUrl: "https://www.twdb.texas.gov/mapping/gisdata.asp", joinStrategy: "statewide-only", refreshCadence: "manual" },
  { sourceId: "tceq-gis-discovery", name: "TCEQ GIS data hub discovery", kind: "html-discovery", verifiedUrl: "https://gis-tceq.opendata.arcgis.com/", joinStrategy: "statewide-only", refreshCadence: "manual" },
  { sourceId: "national-levee-discovery", name: "National Levee Database discovery", kind: "html-discovery", verifiedUrl: "https://levees.sec.usace.army.mil/#/", joinStrategy: "statewide-only", refreshCadence: "manual" },
];

export function listWaterSources(): WaterSourceDefinition[] {
  return [...WATER_SOURCE_REGISTRY];
}

export function getWaterSource(sourceId: string): WaterSourceDefinition | undefined {
  return WATER_SOURCE_REGISTRY.find((source) => source.sourceId === sourceId);
}
