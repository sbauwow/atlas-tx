import { createAtlasCountyDataService, ATLAS_COUNTY_SOURCES } from "@/lib/atlas-county-sources";
import type { CountyDataService, CountyProfile } from "@/lib/county-data-service";
import { countySlug, normalizeCountyName } from "@/lib/counties";
import {
  loadTwdbHydrologyFromSnapshot,
  type TwdbHydrologyLayerId,
  type TwdbHydrologyRow,
} from "@/lib/datasets/twdb-hydrology";
import { fetchDatasetRows } from "@/lib/texas-open-data";
import { TEXAS_COUNTY_CENTROIDS, type CountyCentroid } from "@/lib/texas-county-centroids";

export type CountyOverviewSourceRow = {
  county: string;
  value: number;
  metrics: Record<string, number | string | null>;
};

export type CountyOverviewSource = {
  sourceId: string;
  category: string;
  label: string;
  collect: () => Promise<CountyOverviewSourceRow[]>;
};

export type CountyOverviewRecord = {
  county: {
    name: string;
    slug: string;
  };
  centroid?: CountyCentroid;
  compositeScore: number;
  ranks: Record<string, number>;
  metrics: Record<string, Record<string, number | string | null>>;
  sourceValues: Record<string, number>;
};

export type CountyOverview = {
  generatedAt: string;
  countyCount: number;
  sourceIds: string[];
  counties: CountyOverviewRecord[];
};

export type CountyHighlight = {
  sourceId: string;
  label: string;
  rank: number;
  value: number;
};

export type CountyHydrologyContext = {
  countyCentroid?: CountyCentroid;
  layerHits: Record<TwdbHydrologyLayerId, number>;
  matches: Array<{
    layerId: TwdbHydrologyLayerId;
    layerName: string;
    primaryCode: string | null;
    name: string | null;
    basin: string | null;
    region: string | null;
    subregion: string | null;
  }>;
  caveat: string;
};

export type CountyBreakdown = {
  overview: CountyOverviewRecord;
  profile: CountyProfile;
  highlights: CountyHighlight[];
  hydrologyContext: CountyHydrologyContext;
};

export type AtlasCountyExplorerService = {
  getCountyOverview: () => Promise<CountyOverview>;
  getCountyBreakdown: (county: string) => Promise<CountyBreakdown>;
};

export type CreateAtlasCountyExplorerServiceOptions = {
  overviewSources?: CountyOverviewSource[];
  detailService?: CountyDataService;
  centroids?: Record<string, CountyCentroid>;
  hydrologyRowsLoader?: () => Promise<TwdbHydrologyRow[]>;
};

type CountyAccumulator = {
  county: {
    name: string;
    slug: string;
  };
  centroid?: CountyCentroid;
  metrics: Record<string, Record<string, number | string | null>>;
  sourceValues: Record<string, number>;
  ranks: Record<string, number>;
  compositeScore: number;
};

function numberValue(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function sortByValueDesc(rows: CountyOverviewSourceRow[]): CountyOverviewSourceRow[] {
  return [...rows].sort((left, right) => {
    if (right.value !== left.value) {
      return right.value - left.value;
    }

    return normalizeCountyName(left.county).localeCompare(normalizeCountyName(right.county));
  });
}

function percentileForRank(rank: number, count: number): number {
  if (count <= 1) {
    return 100;
  }

  return ((count - rank) / (count - 1)) * 100;
}

function buildOverviewRecordMap(
  sourceIds: string[],
  sourceRows: Array<{ source: CountyOverviewSource; rows: CountyOverviewSourceRow[] }>,
  centroids: Record<string, CountyCentroid>,
): CountyAccumulator[] {
  const byCounty = new Map<string, CountyAccumulator>();

  for (const { source, rows } of sourceRows) {
    const rankedRows = sortByValueDesc(rows);
    rankedRows.forEach((row, index) => {
      const countyName = normalizeCountyName(row.county);
      const slug = countySlug(row.county);
      const rank = index + 1;
      const existing = byCounty.get(slug) ?? {
        county: { name: countyName, slug },
        centroid: centroids[slug],
        metrics: {},
        sourceValues: {},
        ranks: {},
        compositeScore: 0,
      };

      existing.metrics[source.sourceId] = row.metrics;
      existing.sourceValues[source.sourceId] = row.value;
      existing.ranks[source.sourceId] = rank;
      byCounty.set(slug, existing);
    });
  }

  for (const county of byCounty.values()) {
    const percentiles = sourceIds
      .filter((sourceId) => county.ranks[sourceId] !== undefined)
      .map((sourceId) => percentileForRank(county.ranks[sourceId], sourceRows.find((row) => row.source.sourceId === sourceId)?.rows.length ?? 0));

    county.compositeScore = percentiles.length
      ? Number((percentiles.reduce((sum, value) => sum + value, 0) / percentiles.length).toFixed(2))
      : 0;
  }

  const sorted = [...byCounty.values()].sort((left, right) => {
    if (right.compositeScore !== left.compositeScore) {
      return right.compositeScore - left.compositeScore;
    }

    return left.county.name.localeCompare(right.county.name);
  });

  sorted.forEach((county, index) => {
    county.ranks.composite = index + 1;
  });

  return sorted;
}

function sourceMetricLabel(sourceId: string): string {
  return ATLAS_COUNTY_SOURCES.find((source) => source.sourceId === sourceId)?.name ?? sourceId;
}

function bboxContainsCentroid(row: TwdbHydrologyRow, centroid: CountyCentroid): boolean {
  return (
    centroid.lon >= row.bbox[0] &&
    centroid.lat >= row.bbox[1] &&
    centroid.lon <= row.bbox[2] &&
    centroid.lat <= row.bbox[3]
  );
}

function buildCountyHydrologyContext(
  countyCentroid: CountyCentroid | undefined,
  rows: TwdbHydrologyRow[],
): CountyHydrologyContext {
  const layerHits: Record<TwdbHydrologyLayerId, number> = {
    "twdb-major-aquifers": 0,
    "twdb-river-basins": 0,
    "twdb-huc8": 0,
  };

  if (!countyCentroid) {
    return {
      countyCentroid,
      layerHits,
      matches: [],
      caveat:
        "Hydrology context is based on county centroid overlap with cached TWDB feature bounding boxes, not full polygon intersection.",
    };
  }

  const matches = rows.filter((row) => bboxContainsCentroid(row, countyCentroid));
  for (const row of matches) {
    layerHits[row.layerId] += 1;
  }

  return {
    countyCentroid,
    layerHits,
    matches: matches.map((row) => ({
      layerId: row.layerId,
      layerName: row.layerName,
      primaryCode: row.primaryCode,
      name: row.name,
      basin: row.basin,
      region: row.region,
      subregion: row.subregion,
    })),
    caveat:
      "Hydrology context is based on county centroid overlap with cached TWDB feature bounding boxes, not full polygon intersection.",
  };
}

async function collectPermitOverviewRows(): Promise<CountyOverviewSourceRow[]> {
  const rows = await fetchDatasetRows<Array<{ facility_county?: string; permit_count?: string }>[number]>("7fq8-wig2", {
    select: "facility_county, count(*) as permit_count",
    group: "facility_county",
    order: "permit_count DESC",
    limit: 300,
  });

  return rows
    .filter((row) => row.facility_county)
    .map((row) => ({
      county: row.facility_county ?? "",
      value: numberValue(row.permit_count),
      metrics: { permitCount: numberValue(row.permit_count) },
    }));
}

async function collectWaterDistrictOverviewRows(): Promise<CountyOverviewSourceRow[]> {
  const rows = await fetchDatasetRows<Array<{ county?: string; district_count?: string }>[number]>("hr84-s96f", {
    select: "county, count(*) as district_count",
    group: "county",
    order: "district_count DESC",
    limit: 300,
  });

  return rows
    .filter((row) => row.county)
    .map((row) => ({
      county: row.county ?? "",
      value: numberValue(row.district_count),
      metrics: { districtCount: numberValue(row.district_count) },
    }));
}

async function collectCpiOverviewRows(): Promise<CountyOverviewSourceRow[]> {
  const rows = await fetchDatasetRows<
    Array<{ county?: string; total_completed_investigations?: string; latest_fiscal_year?: string }>[number]
  >("waxz-c9q5", {
    select: "county, sum(completed_investigations) as total_completed_investigations, max(fiscal_year) as latest_fiscal_year",
    group: "county",
    order: "total_completed_investigations DESC",
    limit: 300,
  });

  return rows
    .filter((row) => row.county)
    .map((row) => ({
      county: row.county ?? "",
      value: numberValue(row.total_completed_investigations),
      metrics: {
        totalCompletedInvestigations: numberValue(row.total_completed_investigations),
        latestFiscalYear: row.latest_fiscal_year ?? null,
      },
    }));
}

async function collectCountyReturnsOverviewRows(): Promise<CountyOverviewSourceRow[]> {
  const rows = await fetchDatasetRows<Array<{ county_name?: string; total_due?: string; total_taxpayers?: string }>[number]>(
    "ctj5-pypw",
    {
      select: "county_name, sum(total_due) as total_due, sum(taxpayers) as total_taxpayers",
      group: "county_name",
      order: "total_due DESC",
      limit: 300,
    },
  );

  return rows
    .filter((row) => row.county_name)
    .map((row) => ({
      county: row.county_name ?? "",
      value: numberValue(row.total_due),
      metrics: {
        totalDue: numberValue(row.total_due),
        totalTaxpayers: numberValue(row.total_taxpayers),
      },
    }));
}

async function collectSalesTaxOverviewRows(): Promise<CountyOverviewSourceRow[]> {
  const rows = await fetchDatasetRows<Array<{ county_name?: string; row_count?: string; max_rate?: string }>[number]>("tmhs-ahbh", {
    select: "county_name, count(*) as row_count, max(new_rate) as max_rate",
    group: "county_name",
    order: "row_count DESC",
    limit: 300,
  });

  return rows
    .filter((row) => row.county_name)
    .map((row) => ({
      county: row.county_name ?? "",
      value: numberValue(row.row_count),
      metrics: {
        rowCount: numberValue(row.row_count),
        maxRate: numberValue(row.max_rate),
      },
    }));
}

export const DEFAULT_ATLAS_COUNTY_OVERVIEW_SOURCES: CountyOverviewSource[] = [
  { sourceId: "permits", category: "environment", label: "Permits", collect: collectPermitOverviewRows },
  { sourceId: "water-districts", category: "infrastructure", label: "Water districts", collect: collectWaterDistrictOverviewRows },
  { sourceId: "cpi-investigations", category: "social", label: "CPI investigations", collect: collectCpiOverviewRows },
  { sourceId: "county-returns", category: "fiscal", label: "County returns", collect: collectCountyReturnsOverviewRows },
  { sourceId: "sales-tax-rates", category: "fiscal", label: "Sales tax rates", collect: collectSalesTaxOverviewRows },
];

export function createAtlasCountyExplorerService({
  overviewSources = DEFAULT_ATLAS_COUNTY_OVERVIEW_SOURCES,
  detailService = createAtlasCountyDataService(),
  centroids = TEXAS_COUNTY_CENTROIDS,
  hydrologyRowsLoader = () => loadTwdbHydrologyFromSnapshot(),
}: CreateAtlasCountyExplorerServiceOptions = {}): AtlasCountyExplorerService {
  return {
    async getCountyOverview() {
      const sourceRows = await Promise.all(
        overviewSources.map(async (source) => ({
          source,
          rows: await source.collect(),
        })),
      );
      const sourceIds = overviewSources.map((source) => source.sourceId);
      const counties = buildOverviewRecordMap(sourceIds, sourceRows, centroids).map<CountyOverviewRecord>((county) => ({
        county: county.county,
        centroid: county.centroid,
        compositeScore: county.compositeScore,
        ranks: county.ranks,
        metrics: county.metrics,
        sourceValues: county.sourceValues,
      }));

      return {
        generatedAt: new Date().toISOString(),
        countyCount: counties.length,
        sourceIds,
        counties,
      };
    },

    async getCountyBreakdown(county) {
      const overview = await this.getCountyOverview();
      const targetSlug = countySlug(county);
      const selected = overview.counties.find((entry) => entry.county.slug === targetSlug);
      if (!selected) {
        throw new Error(`County not found: ${county}`);
      }

      const [profile, hydrologyRows] = await Promise.all([
        detailService.collectCountyProfile(selected.county.name),
        hydrologyRowsLoader(),
      ]);
      const highlights = Object.entries(selected.sourceValues)
        .map(([sourceId, value]) => ({
          sourceId,
          label: overviewSources.find((source) => source.sourceId === sourceId)?.label ?? sourceMetricLabel(sourceId),
          rank: selected.ranks[sourceId],
          value,
        }))
        .sort((left, right) => {
          if (left.rank !== right.rank) {
            return left.rank - right.rank;
          }
          return right.value - left.value;
        });

      return {
        overview: selected,
        profile,
        highlights,
        hydrologyContext: buildCountyHydrologyContext(selected.centroid, hydrologyRows),
      };
    },
  };
}

let defaultExplorerService: AtlasCountyExplorerService | undefined;

export function getDefaultAtlasCountyExplorerService(): AtlasCountyExplorerService {
  if (!defaultExplorerService) {
    defaultExplorerService = createAtlasCountyExplorerService();
  }

  return defaultExplorerService;
}
