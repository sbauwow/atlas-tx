export type FloodplainFeature = {
  sourceId: "fema-nfhl";
  featureId: string;
  countyFips?: string;
  countyName?: string | null;
  zone?: string | null;
  floodway?: boolean | null;
  geometryType: "polygon";
  areaSqMeters?: number | null;
  raw: Record<string, unknown>;
};

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

export type LcraStageFlowReading = {
  sourceId: "lcra-hydromet-stageflow";
  siteNumber: string;
  stationName: string;
  observedAt: string;
  stageFeet?: number | null;
  flowCfs?: number | null;
  bankfullFeet?: number | null;
  floodStageFeet?: number | null;
  raw: Record<string, unknown>;
};

export type LcraLakeLevelReading = {
  sourceId: "lcra-hydromet-lakelevels";
  siteNumber: string;
  stationName: string;
  observedAt: string;
  elevationFeet?: number | null;
  raw: Record<string, unknown>;
};

export type LcraArrpOutfall = {
  sourceId: "lcra-arrp-outfalls";
  recordId: string;
  permitNumber: string;
  countyName?: string | null;
  permitteeName?: string | null;
  status?: string | null;
  segmentId?: string | null;
  basinId?: string | null;
  outfallNumber?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  raw: Record<string, unknown>;
};

export type LcraArrpLandPermit = {
  sourceId: "lcra-arrp-land-permits";
  recordId: string;
  permitNumber: string;
  countyName?: string | null;
  permitteeName?: string | null;
  status?: string | null;
  segmentId?: string | null;
  basinId?: string | null;
  permitType?: string | null;
  reviewType?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  raw: Record<string, unknown>;
};

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
