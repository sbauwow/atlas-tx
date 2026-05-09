export type AnalyticsPrimitive = string | number | boolean | null;

export type AnalyticsMetricMap = Record<string, AnalyticsPrimitive>;
export type AnalyticsMetricBuckets = Record<string, AnalyticsMetricMap>;

export type CountyAnalyticsSourceDescriptor = {
  sourceId: string;
  label?: string;
  category?: string;
};

export type CountyAnalyticsCountyRef = {
  name: string;
  slug: string;
};

export type CountyAnalyticsHighlight = {
  sourceId: string;
  label?: string;
  rank?: number;
  value?: number;
};

export type CountyAnalyticsOverviewInput = {
  county: CountyAnalyticsCountyRef;
  compositeScore?: number;
  ranks?: Record<string, number>;
  metrics?: Record<string, Record<string, unknown>>;
  sourceValues?: Record<string, number>;
};

export type CountyAnalyticsProfileSliceInput = {
  sourceId: string;
  name?: string;
  category?: string;
  metrics?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type CountyAnalyticsProfileInput = {
  county?: CountyAnalyticsCountyRef;
  collectedAt?: string;
  metrics?: Record<string, Record<string, unknown>>;
  annotations?: string[];
  errors?: Array<{ sourceId: string; message: string }>;
  slices?: CountyAnalyticsProfileSliceInput[];
};

export type CountyAnalyticsHydrologyInput = {
  layerHits?: Record<string, number>;
  matches?: unknown[];
  caveat?: string;
};

export type CountyDriverContribution = {
  sourceId: string;
  label: string;
  category?: string;
  rank: number | null;
  totalCount: number | null;
  percentile: number | null;
  rawValue: number | null;
  scoreContribution: number | null;
  shareOfComposite: number | null;
  highlight: boolean;
  metrics: AnalyticsMetricMap;
};

export type CountyTimePoint = {
  timestamp: string;
  value: number;
  label?: string;
  sourceId?: string;
  metadata?: AnalyticsMetricMap;
};

export type PressureRiskPoint = {
  id: string;
  label: string;
  score: number;
  rank?: number;
  category?: string;
  metadata?: AnalyticsMetricMap;
};

export type SourceFreshnessRecord = {
  sourceId: string;
  label?: string;
  collectedAt?: string | null;
  asOf?: string | null;
  stale?: boolean;
  caveat?: string;
  metadata?: AnalyticsMetricMap;
};

export type CountyAnalyticsSnapshot = {
  county: CountyAnalyticsCountyRef;
  generatedAt: string | null;
  compositeScore: number | null;
  compositeRank: number | null;
  sourceCount: number;
  sourceValues: Record<string, number>;
  overviewMetrics: AnalyticsMetricBuckets;
  profileMetrics: AnalyticsMetricBuckets;
  highlights: CountyAnalyticsHighlight[];
  drivers: CountyDriverContribution[];
  annotations: string[];
  errorCount: number;
  hydrology: {
    matchCount: number;
    layerHits: Record<string, number>;
    caveat?: string;
  };
  freshness: SourceFreshnessRecord[];
};

export type CountyDriverDecompositionInput = {
  compositeScore?: number;
  ranks?: Record<string, number>;
  sourceValues?: Record<string, number>;
  metrics?: Record<string, Record<string, unknown>>;
  highlights?: CountyAnalyticsHighlight[];
  sourceMetadata?: CountyAnalyticsSourceDescriptor[];
  rankDenominators?: Record<string, number>;
};

export type CountyAnalyticsSnapshotInput = {
  generatedAt?: string;
  overview?: CountyAnalyticsOverviewInput;
  profile?: CountyAnalyticsProfileInput;
  highlights?: CountyAnalyticsHighlight[];
  hydrologyContext?: CountyAnalyticsHydrologyInput;
  sourceMetadata?: CountyAnalyticsSourceDescriptor[];
  rankDenominators?: Record<string, number>;
  freshness?: SourceFreshnessRecord[];
};
