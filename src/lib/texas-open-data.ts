import type { MvpDataset } from "@/lib/mvp-datasets";
import { MVP_DATASETS } from "@/lib/mvp-datasets";
import type { CountyDataCollection, CountyDataSource } from "@/lib/county-data-service";
import { normalizeCountyName } from "@/lib/counties";

const SOCRATA_BASE_URL = "https://data.texas.gov/resource";
const COUNTY_QUERY_FIELDS: Record<string, string> = {
  "7fq8-wig2": "facility_county",
  "hr84-s96f": "county",
  "waxz-c9q5": "county",
  "ctj5-pypw": "county_name",
  "tmhs-ahbh": "county_name",
};

export type SocrataQueryOptions = {
  limit?: number;
  offset?: number;
  select?: string;
  where?: string;
  order?: string;
  group?: string;
  having?: string;
};

export type FetchRows = <TRecord>(
  datasetId: string,
  county: string,
  options?: SocrataQueryOptions,
  signal?: AbortSignal,
) => Promise<TRecord[]>;

export type SocrataCountySourceConfig<TRecord> = {
  sourceId: string;
  datasetId: string;
  category: string;
  name: string;
  description?: string;
  fetchRows?: FetchRows;
  query?: SocrataQueryOptions;
  summarize?: (records: TRecord[]) => Omit<CountyDataCollection, "records"> | void;
};

function uppercaseCountyBaseName(input: string): string {
  return normalizeCountyName(input).replace(/ County$/, "").toUpperCase();
}

export function getDatasetById(id: string): MvpDataset | undefined {
  return MVP_DATASETS.find((dataset) => dataset.id === id);
}

export function getTabularDatasetIds(): string[] {
  return MVP_DATASETS.filter((dataset) => dataset.accessType === "dataset").map((dataset) => dataset.id);
}

export function datasetResourceUrl(id: string): string | undefined {
  const dataset = getDatasetById(id);
  if (!dataset || dataset.accessType !== "dataset") {
    return undefined;
  }

  return `${SOCRATA_BASE_URL}/${dataset.id}.json`;
}

export function buildDatasetUrl(id: string, options: SocrataQueryOptions = {}): string | undefined {
  const base = datasetResourceUrl(id);
  if (!base) {
    return undefined;
  }

  const params: Array<[string, string]> = [];
  if (options.select) {
    params.push(["$select", options.select]);
  }
  if (options.group) {
    params.push(["$group", options.group]);
  }
  if (options.order) {
    params.push(["$order", options.order]);
  }
  if (options.where) {
    params.push(["$where", options.where]);
  }
  if (options.having) {
    params.push(["$having", options.having]);
  }
  if (options.limit !== undefined) {
    params.push(["$limit", String(options.limit)]);
  }
  if (options.offset !== undefined) {
    params.push(["$offset", String(options.offset)]);
  }

  if (!params.length) {
    return base;
  }

  const query = params
    .map(([key, value]) => {
      const encodedValue = encodeURIComponent(value)
        .replace(/%20/g, "+")
        .replace(/\*/g, "%2A")
        .replace(/\(/g, "%28")
        .replace(/\)/g, "%29");
      return `${encodeURIComponent(key)}=${encodedValue}`;
    })
    .join("&");

  return `${base}?${query}`;
}

export function buildCountyDatasetUrl(id: string, county: string, options: SocrataQueryOptions = {}): string | undefined {
  const countyField = COUNTY_QUERY_FIELDS[id];
  if (!countyField) {
    return undefined;
  }

  const url = buildDatasetUrl(id, options);
  if (!url) {
    return undefined;
  }

  const nextUrl = new URL(url);
  nextUrl.searchParams.set(countyField, uppercaseCountyBaseName(county));
  return nextUrl.toString();
}

export async function fetchDatasetRows<TRecord>(
  datasetId: string,
  options?: SocrataQueryOptions,
  signal?: AbortSignal,
): Promise<TRecord[]> {
  const url = buildDatasetUrl(datasetId, options);
  if (!url) {
    throw new Error(`Dataset ${datasetId} does not support resource API access`);
  }

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Texas Open Data request failed for ${datasetId}: ${response.status}`);
  }

  return (await response.json()) as TRecord[];
}

export async function fetchCountyDatasetRows<TRecord>(
  datasetId: string,
  county: string,
  options?: SocrataQueryOptions,
  signal?: AbortSignal,
): Promise<TRecord[]> {
  const url = buildCountyDatasetUrl(datasetId, county, options);
  if (!url) {
    throw new Error(`Dataset ${datasetId} does not support county queries`);
  }

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Texas Open Data request failed for ${datasetId}: ${response.status}`);
  }

  return (await response.json()) as TRecord[];
}

export function createSocrataCountySource<TRecord>(config: SocrataCountySourceConfig<TRecord>): CountyDataSource {
  const fetchRows = config.fetchRows ?? fetchCountyDatasetRows;

  return {
    sourceId: config.sourceId,
    datasetId: config.datasetId,
    category: config.category,
    name: config.name,
    description: config.description,
    async collect({ county, signal }) {
      const records = signal
        ? await fetchRows<TRecord>(config.datasetId, county.name, config.query, signal)
        : await fetchRows<TRecord>(config.datasetId, county.name, config.query);
      const summary = config.summarize?.(records) as Omit<CountyDataCollection, "records"> | undefined;

      return {
        records,
        metrics: summary?.metrics ?? {},
        annotations: summary?.annotations ?? [],
        metadata: summary?.metadata ?? {},
      };
    },
  };
}
