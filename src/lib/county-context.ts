import { countySlug } from "@/lib/counties";
import { loadSurfaceWaterQualityFromSnapshot, type SurfaceWaterQualityRow } from "@/lib/datasets/surface-water-quality";
import { loadTwdbHydrologyFromSnapshot, type TwdbHydrologyRow } from "@/lib/datasets/twdb-hydrology";
import { TEXAS_COUNTY_CENTROIDS, type CountyCentroid } from "@/lib/texas-county-centroids";

export type CountyContextSurfaceWaterSummary = {
  totalSegments: number;
  impairedSegments: number;
  basins: string[];
  topImpairedSegments: Array<{ segmentId: string | null; segmentName: string | null; basin: string | null; flags: string[] }>;
};

export type CountyContextHydrologyEntry = {
  layerName: string;
  primaryCode: string | null;
  name: string | null;
  basin: string | null;
  region: string | null;
};

export type CountyContextHydrologySummary = {
  features: CountyContextHydrologyEntry[];
  layerCounts: Record<string, number>;
};

export type CountyContextSnapshot = {
  countySlug: string;
  surfaceWater: CountyContextSurfaceWaterSummary;
  hydrology: CountyContextHydrologySummary;
};

const IMPAIRMENT_LABELS: Record<keyof SurfaceWaterQualityRow["impairmentFlags"], string> = {
  aquaticLife: "aquatic life",
  contactRecreation: "contact recreation",
  generalUse: "general use",
  fishConsumption: "fish consumption",
  publicWaterSupply: "public water supply",
  oysterWaters: "oyster waters",
};

function impairmentFlagList(flags: SurfaceWaterQualityRow["impairmentFlags"]): string[] {
  const result: string[] = [];
  for (const key of Object.keys(IMPAIRMENT_LABELS) as Array<keyof typeof IMPAIRMENT_LABELS>) {
    if (flags[key]) result.push(IMPAIRMENT_LABELS[key]);
  }
  return result;
}

export async function loadCountyContext(rawSlug: string): Promise<CountyContextSnapshot> {
  const slug = countySlug(rawSlug);
  const [swqRows, hydrologyRows] = await Promise.all([
    loadSurfaceWaterQualityFromSnapshot(),
    loadTwdbHydrologyFromSnapshot(),
  ]);

  const swqMatches = swqRows.filter((row) => row.countyName && countySlug(row.countyName) === slug);
  const basins = new Set<string>();
  let impairedSegments = 0;
  const impairedDetails: CountyContextSurfaceWaterSummary["topImpairedSegments"] = [];
  for (const row of swqMatches) {
    if (row.basinName) basins.add(row.basinName);
    if (row.isImpaired) {
      impairedSegments += 1;
      if (impairedDetails.length < 6) {
        impairedDetails.push({
          segmentId: row.segmentId,
          segmentName: row.segmentName,
          basin: row.basinName,
          flags: impairmentFlagList(row.impairmentFlags),
        });
      }
    }
  }

  const centroid: CountyCentroid | undefined = TEXAS_COUNTY_CENTROIDS[slug];
  const hydrologyMatches: TwdbHydrologyRow[] = centroid
    ? hydrologyRows.filter((row) =>
        centroid.lon >= row.bbox[0] &&
        centroid.lat >= row.bbox[1] &&
        centroid.lon <= row.bbox[2] &&
        centroid.lat <= row.bbox[3],
      )
    : [];

  const layerCounts: Record<string, number> = {};
  const featuresByCode = new Map<string, CountyContextHydrologyEntry>();
  for (const row of hydrologyMatches) {
    layerCounts[row.layerName] = (layerCounts[row.layerName] ?? 0) + 1;
    const code = row.primaryCode ?? `${row.layerName}::${row.name ?? "feature"}`;
    if (!featuresByCode.has(code)) {
      featuresByCode.set(code, {
        layerName: row.layerName,
        primaryCode: row.primaryCode ?? null,
        name: row.name ?? null,
        basin: row.basin ?? null,
        region: row.region ?? null,
      });
    }
  }

  return {
    countySlug: slug,
    surfaceWater: {
      totalSegments: swqMatches.length,
      impairedSegments,
      basins: [...basins].sort(),
      topImpairedSegments: impairedDetails,
    },
    hydrology: {
      features: [...featuresByCode.values()].slice(0, 8),
      layerCounts,
    },
  };
}
