import { promises as fs } from "node:fs";
import path from "node:path";

import {
  buildSurfaceWaterQualityCountyIndex,
  fetchSurfaceWaterQualitySegments,
  normalizeSurfaceWaterQualityResponses,
  SURFACE_WATER_QUALITY_SERVICE_URL,
  SURFACE_WATER_SEGMENT_LAYER_IDS,
  type SurfaceWaterCountyJoinLayerId,
  type SurfaceWaterQualityFeature,
  type SurfaceWaterQualityRow,
  type SurfaceWaterSegmentLayerId,
} from "../src/lib/datasets/surface-water-quality";

export type SurfaceWaterQualityRefreshLayer = {
  layerId: SurfaceWaterSegmentLayerId;
  layerName: string;
  sourceUrl: string;
};

export const SURFACE_WATER_QUALITY_REFRESH_PLAN: SurfaceWaterQualityRefreshLayer[] = [
  {
    layerId: 7,
    layerName: "Reservoir Segments",
    sourceUrl: `${SURFACE_WATER_QUALITY_SERVICE_URL}/7`,
  },
  {
    layerId: 8,
    layerName: "Stream Segments",
    sourceUrl: `${SURFACE_WATER_QUALITY_SERVICE_URL}/8`,
  },
];

export type SurfaceWaterQualityCountyJoinLayer = {
  layerId: SurfaceWaterCountyJoinLayerId;
  layerName: string;
  sourceUrl: string;
};

export type SurfaceWaterQualityGeometryFeature = {
  attributes?: Record<string, unknown>;
  geometry?: {
    paths?: number[][][];
    rings?: number[][][];
    x?: number;
    y?: number;
  };
};

export const SURFACE_WATER_QUALITY_COUNTY_JOIN_PLAN: SurfaceWaterQualityCountyJoinLayer[] = [
  { layerId: 2, layerName: "AU Reservoirs", sourceUrl: `${SURFACE_WATER_QUALITY_SERVICE_URL}/2` },
  { layerId: 3, layerName: "AU Streams", sourceUrl: `${SURFACE_WATER_QUALITY_SERVICE_URL}/3` },
];

export function buildSurfaceWaterQualityGeometryQueryUrl(
  layerId: SurfaceWaterSegmentLayerId,
  segmentIds: string[],
): string {
  const url = new URL(`${SURFACE_WATER_QUALITY_SERVICE_URL}/${layerId}/query`);
  const where = segmentIds.map((segmentId) => `SEG_ID='${segmentId.replace(/'/g, "''")}'`).join(' OR ');
  url.searchParams.set('where', where || '1=0');
  url.searchParams.set('outFields', 'SEG_ID');
  url.searchParams.set('returnGeometry', 'true');
  url.searchParams.set('f', 'pjson');
  return url.toString();
}

export type SurfaceWaterQualitySnapshot = {
  generatedAt: string;
  source: string;
  rows: SurfaceWaterQualityRow[];
};

export function buildDefaultSurfaceWaterQualityRefreshPlan(): SurfaceWaterQualityRefreshLayer[] {
  return [...SURFACE_WATER_QUALITY_REFRESH_PLAN];
}

export function summarizeSurfaceWaterQualityRefresh(
  snapshot: SurfaceWaterQualitySnapshot,
  countyBySegment: Record<string, string> = {},
  geometryCountyBySegment: Record<string, string> = {},
) {
  const rowsByLayer = snapshot.rows.reduce<Record<string, number>>((accumulator, row) => {
    accumulator[String(row.layerId)] = (accumulator[String(row.layerId)] ?? 0) + 1;
    return accumulator;
  }, {});
  const rowsWithCounty = snapshot.rows.filter((row) => row.countyName).length;
  const rowsWithoutCounty = snapshot.rows.length - rowsWithCounty;
  const impairedRowsWithCounty = snapshot.rows.filter((row) => row.isImpaired && row.countyName).length;
  const direct = snapshot.rows.filter((row) => row.countyName && !(row.segmentId && countyBySegment[row.segmentId]) && !(row.segmentId && geometryCountyBySegment[row.segmentId])).length;
  const auFallback = snapshot.rows.filter((row) => row.countyName && Boolean(row.segmentId && countyBySegment[row.segmentId])).length;
  const geometryFallback = snapshot.rows.filter((row) => row.countyName && Boolean(row.segmentId && geometryCountyBySegment[row.segmentId])).length;

  return {
    layerCount: SURFACE_WATER_SEGMENT_LAYER_IDS.length,
    rowCount: snapshot.rows.length,
    rowsByLayer,
    impairedRowCount: snapshot.rows.filter((row) => row.isImpaired).length,
    countyCoverage: {
      rowsWithCounty,
      rowsWithoutCounty,
      percentWithCounty: snapshot.rows.length ? Math.round((rowsWithCounty / snapshot.rows.length) * 10000) / 100 : 0,
      impairedRowsWithCounty,
      joinSources: {
        direct,
        auFallback,
        geometryFallback,
        unresolved: rowsWithoutCounty,
      },
    },
  };
}

function representativePoint(feature: SurfaceWaterQualityGeometryFeature): { lat: number; lon: number } | null {
  const geometry = feature.geometry;
  if (!geometry) return null;
  if (typeof geometry.x === 'number' && typeof geometry.y === 'number') {
    return { lon: geometry.x, lat: geometry.y };
  }
  const firstPathPoint = geometry.paths?.[0]?.[0];
  if (firstPathPoint && firstPathPoint.length >= 2) {
    return { lon: firstPathPoint[0]!, lat: firstPathPoint[1]! };
  }
  const firstRingPoint = geometry.rings?.[0]?.[0];
  if (firstRingPoint && firstRingPoint.length >= 2) {
    return { lon: firstRingPoint[0]!, lat: firstRingPoint[1]! };
  }
  return null;
}

async function fetchGeometryFeaturesFromArcgis(
  layer: SurfaceWaterQualityRefreshLayer,
  segmentIds: string[],
): Promise<SurfaceWaterQualityGeometryFeature[]> {
  const response = await fetch(`${SURFACE_WATER_QUALITY_SERVICE_URL}/${layer.layerId}/query`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: new URLSearchParams({
      where: segmentIds.map((segmentId) => `SEG_ID='${segmentId.replace(/'/g, "''")}'`).join(' OR ') || '1=0',
      outFields: 'SEG_ID',
      returnGeometry: 'true',
      f: 'pjson',
    }),
  });
  if (!response.ok) {
    throw new Error(`Surface water geometry fetch failed (${response.status}) for layer ${layer.layerId}`);
  }
  const data = await response.json() as { features?: SurfaceWaterQualityGeometryFeature[] };
  return data.features ?? [];
}

async function resolveCountyFromFcc(lat: number, lon: number): Promise<string | null> {
  const url = new URL('https://geo.fcc.gov/api/census/block/find');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('format', 'json');
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) return null;
  const data = await response.json() as { County?: { name?: string } };
  return data.County?.name ?? null;
}

export async function executeSurfaceWaterQualityRefresh(options?: {
  generatedAt?: string;
  collectLayerFeatures?: (layer: SurfaceWaterQualityRefreshLayer) => Promise<SurfaceWaterQualityFeature[]>;
  collectCountyJoinFeatures?: (layer: SurfaceWaterQualityCountyJoinLayer) => Promise<SurfaceWaterQualityFeature[]>;
  collectGeometryFeatures?: (layer: SurfaceWaterQualityRefreshLayer, segmentIds: string[]) => Promise<SurfaceWaterQualityGeometryFeature[]>;
  resolveCountyForPoint?: (lat: number, lon: number) => Promise<string | null>;
}) {
  const plan = buildDefaultSurfaceWaterQualityRefreshPlan();
  const generatedAt = options?.generatedAt ?? new Date().toISOString();

  const rawSnapshot = options?.collectLayerFeatures
    ? {
        generatedAt,
        source: SURFACE_WATER_QUALITY_SERVICE_URL,
        layers: Object.fromEntries(
          await Promise.all(
            plan.map(async (layer) => [
              layer.layerId,
              {
                layerId: layer.layerId,
                layerName: layer.layerName,
                features: await options.collectLayerFeatures!(layer),
                exceededTransferLimit: false,
              },
            ]),
          ),
        ),
      }
    : await fetchSurfaceWaterQualitySegments();

  const countyJoinFeatures = options?.collectCountyJoinFeatures
    ? Object.fromEntries(
        await Promise.all(
          SURFACE_WATER_QUALITY_COUNTY_JOIN_PLAN.map(async (layer) => [
            layer.layerId,
            await options.collectCountyJoinFeatures!(layer),
          ]),
        ),
      )
    : {};
  const countyBySegment = buildSurfaceWaterQualityCountyIndex(countyJoinFeatures);

  const snapshot: SurfaceWaterQualitySnapshot = {
    generatedAt,
    source: SURFACE_WATER_QUALITY_SERVICE_URL,
    rows: normalizeSurfaceWaterQualityResponses({
      generatedAt,
      source: SURFACE_WATER_QUALITY_SERVICE_URL,
      layers: rawSnapshot.layers,
    }, countyBySegment),
  };

  const unresolvedByLayer = plan.map((layer) => ({
    layer,
    segmentIds: snapshot.rows
      .filter((row) => row.layerId === layer.layerId && !row.countyName && row.segmentId)
      .map((row) => row.segmentId as string),
  })).filter((entry) => entry.segmentIds.length > 0);

  const geometryCountyBySegment: Record<string, string> = {};
  const collectGeometryFeatures = options?.collectGeometryFeatures ?? fetchGeometryFeaturesFromArcgis;
  const resolveCountyForPoint = options?.resolveCountyForPoint ?? resolveCountyFromFcc;
  for (const { layer, segmentIds } of unresolvedByLayer) {
    const features = await collectGeometryFeatures(layer, segmentIds);
    for (const feature of features) {
      const segmentId = String(feature.attributes?.SEG_ID ?? '').trim();
      if (!segmentId || geometryCountyBySegment[segmentId]) continue;
      const point = representativePoint(feature);
      if (!point) continue;
      const county = await resolveCountyForPoint(point.lat, point.lon);
      if (county) {
        geometryCountyBySegment[segmentId] = county;
      }
    }
  }

  snapshot.rows = snapshot.rows.map((row) => row.countyName || !row.segmentId || !geometryCountyBySegment[row.segmentId]
    ? row
    : { ...row, countyName: geometryCountyBySegment[row.segmentId] });

  return {
    plan,
    rawSnapshot: {
      generatedAt,
      source: SURFACE_WATER_QUALITY_SERVICE_URL,
      layers: rawSnapshot.layers,
    },
    snapshot,
    summary: summarizeSurfaceWaterQualityRefresh(snapshot, countyBySegment, geometryCountyBySegment),
  };
}

export async function writeSurfaceWaterQualitySnapshot(
  snapshot: SurfaceWaterQualitySnapshot,
  options?: {
    path?: string;
    writeFile?: (path: string, content: string) => Promise<void>;
  },
) {
  const outputPath = options?.path ?? "public/cache/surface-water-quality-tx.json";
  const writeFile =
    options?.writeFile ??
    (async (targetPath: string, content: string) => {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, content);
    });

  await writeFile(outputPath, JSON.stringify(snapshot));
}

export async function main() {
  const result = await executeSurfaceWaterQualityRefresh();
  await writeSurfaceWaterQualitySnapshot(result.snapshot);
  console.log(
    JSON.stringify(
      {
        plan: result.plan,
        summary: result.summary,
        snapshotPath: "public/cache/surface-water-quality-tx.json",
      },
      null,
      2,
    ),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
