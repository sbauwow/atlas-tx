import { countySlug, normalizeCountyName } from "@/lib/counties";

export type CountyRef = {
  name: string;
  slug: string;
};

export type CountySliceMetrics = Record<string, unknown>;
export type CountySliceMetadata = Record<string, unknown>;

export type CountyDataCollection = {
  records: unknown[];
  metrics?: CountySliceMetrics;
  annotations?: string[];
  metadata?: CountySliceMetadata;
};

export type CountyDataSourceContext = {
  county: CountyRef;
  signal?: AbortSignal;
  options?: Record<string, unknown>;
};

export type CountyDataSource = {
  sourceId: string;
  name: string;
  category: string;
  datasetId?: string;
  description?: string;
  collect: (context: CountyDataSourceContext) => Promise<CountyDataCollection>;
};

export type CountySlice = {
  sourceId: string;
  name: string;
  category: string;
  datasetId?: string;
  description?: string;
  records: unknown[];
  metrics: CountySliceMetrics;
  annotations: string[];
  metadata: CountySliceMetadata;
};

export type CountySourceError = {
  sourceId: string;
  message: string;
};

export type CountyProfile = {
  county: CountyRef;
  collectedAt: string;
  sliceCount: number;
  slices: CountySlice[];
  metrics: Record<string, CountySliceMetrics>;
  annotations: string[];
  errors: CountySourceError[];
};

export type CollectCountyProfileOptions = {
  sourceIds?: string[];
  signal?: AbortSignal;
  sourceOptions?: Record<string, Record<string, unknown>>;
};

export type CountyDataService = {
  collectCountyProfile: (county: string, options?: CollectCountyProfileOptions) => Promise<CountyProfile>;
  listSources: () => CountyDataSource[];
};

export type CreateCountyDataServiceOptions = {
  sources: CountyDataSource[];
};

function toCountyRef(input: string): CountyRef {
  return {
    name: normalizeCountyName(input),
    slug: countySlug(input),
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function createCountyDataService({ sources }: CreateCountyDataServiceOptions): CountyDataService {
  return {
    listSources() {
      return [...sources];
    },

    async collectCountyProfile(county, options = {}) {
      const countyRef = toCountyRef(county);
      const selectedSources = options.sourceIds?.length
        ? sources.filter((source) => options.sourceIds?.includes(source.sourceId))
        : sources;

      const slices: CountySlice[] = [];
      const metrics: Record<string, CountySliceMetrics> = {};
      const annotations: string[] = [];
      const errors: CountySourceError[] = [];

      for (const source of selectedSources) {
        try {
          const result = await source.collect({
            county: countyRef,
            signal: options.signal,
            options: options.sourceOptions?.[source.sourceId],
          });

          const slice: CountySlice = {
            sourceId: source.sourceId,
            name: source.name,
            category: source.category,
            datasetId: source.datasetId,
            description: source.description,
            records: result.records,
            metrics: result.metrics ?? {},
            annotations: result.annotations ?? [],
            metadata: {
              recordCount: result.records.length,
              ...(result.metadata ?? {}),
            },
          };

          slices.push(slice);
          metrics[source.sourceId] = slice.metrics;
          annotations.push(...slice.annotations);
        } catch (error) {
          errors.push({
            sourceId: source.sourceId,
            message: toErrorMessage(error),
          });
        }
      }

      return {
        county: countyRef,
        collectedAt: new Date().toISOString(),
        sliceCount: slices.length,
        slices,
        metrics,
        annotations,
        errors,
      };
    },
  };
}
