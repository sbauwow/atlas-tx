import { promises as fs } from "node:fs";
import path from "node:path";

export type TwdbHydrologyLayerId =
  | "twdb-major-aquifers"
  | "twdb-river-basins"
  | "twdb-huc8";

export type TwdbHydrologyBBox = [number, number, number, number];

export type TwdbHydrologyGeometryType = "polygon" | "other";

export type TwdbHydrologyRawRow = {
  attributes: Record<string, unknown>;
  bbox: TwdbHydrologyBBox;
  geometryType: TwdbHydrologyGeometryType;
};

export type TwdbHydrologyRawLayer = {
  layerName: string;
  sourceUrl: string;
  rows: TwdbHydrologyRawRow[];
};

export type TwdbHydrologyRawSnapshot = {
  generatedAt: string;
  source: string;
  layers: Partial<Record<TwdbHydrologyLayerId, TwdbHydrologyRawLayer>>;
};

export type TwdbHydrologyRow = {
  layerId: TwdbHydrologyLayerId;
  layerName: string;
  primaryCode: string | null;
  name: string | null;
  basin: string | null;
  region: string | null;
  subregion: string | null;
  bbox: TwdbHydrologyBBox;
  geometryType: TwdbHydrologyGeometryType;
  sourceUrl: string;
};

export type TwdbHydrologySnapshot = {
  generatedAt: string;
  source: string;
  rows: TwdbHydrologyRow[];
};

const SNAPSHOT_REL_PATH = "public/cache/twdb-hydrology-tx.json";

function snapshotPath(): string {
  return path.resolve(process.cwd(), SNAPSHOT_REL_PATH);
}

function asString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeLayerRow(
  layerId: TwdbHydrologyLayerId,
  layer: TwdbHydrologyRawLayer,
  row: TwdbHydrologyRawRow,
): TwdbHydrologyRow {
  const attrs = row.attributes;

  if (layerId === "twdb-major-aquifers") {
    return {
      layerId,
      layerName: layer.layerName,
      primaryCode: asString(attrs.AQUIFER),
      name: asString(attrs.AQ_NAME),
      basin: null,
      region: null,
      subregion: null,
      bbox: row.bbox,
      geometryType: row.geometryType,
      sourceUrl: layer.sourceUrl,
    };
  }

  if (layerId === "twdb-river-basins") {
    const basinName = asString(attrs.basin_name);
    return {
      layerId,
      layerName: layer.layerName,
      primaryCode: asString(attrs.basin_num),
      name: basinName,
      basin: basinName,
      region: null,
      subregion: null,
      bbox: row.bbox,
      geometryType: row.geometryType,
      sourceUrl: layer.sourceUrl,
    };
  }

  return {
    layerId,
    layerName: layer.layerName,
    primaryCode: asString(attrs.HUC_8),
    name: asString(attrs.SUBBASIN),
    basin: asString(attrs.BASIN),
    region: asString(attrs.REGION),
    subregion: asString(attrs.SUBREGION),
    bbox: row.bbox,
    geometryType: row.geometryType,
    sourceUrl: layer.sourceUrl,
  };
}

export function normalizeTwdbHydrologyRawSnapshot(
  snapshot: TwdbHydrologyRawSnapshot,
): TwdbHydrologyRow[] {
  const order: TwdbHydrologyLayerId[] = [
    "twdb-major-aquifers",
    "twdb-river-basins",
    "twdb-huc8",
  ];

  return order.flatMap((layerId) => {
    const layer = snapshot.layers[layerId];
    if (!layer) return [];
    return layer.rows.map((row) => normalizeLayerRow(layerId, layer, row));
  });
}

export async function loadTwdbHydrologyFromSnapshot(
  layerId?: TwdbHydrologyLayerId,
): Promise<TwdbHydrologyRow[]> {
  const raw = await fs.readFile(snapshotPath(), "utf8");
  const snapshot = JSON.parse(raw) as TwdbHydrologySnapshot;
  if (!layerId) {
    return snapshot.rows;
  }
  return snapshot.rows.filter((row) => row.layerId === layerId);
}
