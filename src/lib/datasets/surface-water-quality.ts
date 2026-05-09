import { promises as fs } from "node:fs";
import path from "node:path";

import { normalizeCountyName } from "@/lib/counties";

export const SURFACE_WATER_QUALITY_SERVICE_URL = "https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer";
export const SURFACE_WATER_SEGMENT_LAYER_IDS = [7, 8] as const;
export const SURFACE_WATER_COUNTY_JOIN_LAYER_IDS = [2, 3] as const;
export type SurfaceWaterSegmentLayerId = (typeof SURFACE_WATER_SEGMENT_LAYER_IDS)[number];
export type SurfaceWaterCountyJoinLayerId = (typeof SURFACE_WATER_COUNTY_JOIN_LAYER_IDS)[number];

const SNAPSHOT_REL_PATH = "public/cache/surface-water-quality-tx.json";
const DEFAULT_OUT_FIELDS = [
  "SEG_ID",
  "SEG_NAME",
  "BASIN_NAME",
  "SEG_CLASS",
  "SEG_TYPE",
  "SEG_DESCRIPTION",
  "SIZE_",
  "SIZE_UNIT",
  "IR_YEAR",
  "IMP_AQUATIC_LIFE",
  "IMP_CONTACT_REC",
  "IMP_GENERAL",
  "IMP_FISH_CONSUMPTION",
  "IMP_PWS",
  "IMP_OYSTER_WATERS",
] as const;

export type SurfaceWaterQualityFeature = {
  attributes?: Record<string, unknown>;
};

export type SurfaceWaterQualityLayerResponse = {
  layerId: SurfaceWaterSegmentLayerId;
  layerName: string;
  features: SurfaceWaterQualityFeature[];
  exceededTransferLimit?: boolean;
};

export type SurfaceWaterQualityRawSnapshot = {
  generatedAt: string;
  source: string;
  layers: Partial<Record<SurfaceWaterSegmentLayerId, SurfaceWaterQualityLayerResponse>>;
};

export type SurfaceWaterQualityRow = {
  layerId: SurfaceWaterSegmentLayerId;
  layerName: string;
  segmentId: string | null;
  segmentName: string | null;
  basinName: string | null;
  segmentClass: string | null;
  segmentType: string | null;
  countyName?: string | null;
  size: number | null;
  sizeUnit: string | null;
  assessmentYear: number | null;
  isImpaired: boolean;
  impairmentFlags: {
    aquaticLife: boolean;
    contactRecreation: boolean;
    generalUse: boolean;
    fishConsumption: boolean;
    publicWaterSupply: boolean;
    oysterWaters: boolean;
  };
  sourceUrl: string;
};

export type SurfaceWaterQualitySnapshot = {
  generatedAt: string;
  source: string;
  rows: SurfaceWaterQualityRow[];
};

export type SurfaceWaterQualityQueryOptions = {
  where?: string;
  resultRecordCount?: number;
};

export type SurfaceWaterCountyJoinFeatures = Partial<Record<SurfaceWaterCountyJoinLayerId, SurfaceWaterQualityFeature[]>>;

function snapshotPath(): string {
  return path.resolve(process.cwd(), SNAPSHOT_REL_PATH);
}

function asString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function round4(value: number | null): number | null {
  if (value == null) return null;
  return Math.round(value * 10_000) / 10_000;
}

function yesFlag(value: unknown): boolean {
  return String(value ?? "").trim().toUpperCase() === "Y";
}

function extractCountyName(attrs: Record<string, unknown>): string | null {
  const text = [attrs.SEG_DESCRIPTION, attrs.AU_LOCATION_DESCRIPTION]
    .map((value) => asString(value))
    .filter((value): value is string => Boolean(value))
    .join(" ");
  if (!text) return null;

  const match = text.match(/\b([A-Z][A-Za-z'\-]*(?: [A-Z][A-Za-z'\-]*)*) County\b/);
  if (!match?.[1]) return null;
  return normalizeCountyName(`${match[1]} County`);
}

export function buildSurfaceWaterQualityCountyIndex(
  layers: SurfaceWaterCountyJoinFeatures,
): Record<string, string> {
  const countyBySegment: Record<string, string> = {};
  for (const layerId of SURFACE_WATER_COUNTY_JOIN_LAYER_IDS) {
    for (const feature of layers[layerId] ?? []) {
      const attrs = feature.attributes ?? {};
      const segmentId = asString(attrs.SEG_ID);
      const countyName = extractCountyName(attrs);
      if (segmentId && countyName && !countyBySegment[segmentId]) {
        countyBySegment[segmentId] = countyName;
      }
    }
  }
  return countyBySegment;
}

function normalizeRow(
  layer: SurfaceWaterQualityLayerResponse,
  feature: SurfaceWaterQualityFeature,
  countyBySegment: Record<string, string> = {},
): SurfaceWaterQualityRow {
  const attrs = feature.attributes ?? {};
  const impairmentFlags = {
    aquaticLife: yesFlag(attrs.IMP_AQUATIC_LIFE),
    contactRecreation: yesFlag(attrs.IMP_CONTACT_REC),
    generalUse: yesFlag(attrs.IMP_GENERAL),
    fishConsumption: yesFlag(attrs.IMP_FISH_CONSUMPTION),
    publicWaterSupply: yesFlag(attrs.IMP_PWS),
    oysterWaters: yesFlag(attrs.IMP_OYSTER_WATERS),
  };

  const segmentId = asString(attrs.SEG_ID);
  return {
    layerId: layer.layerId,
    layerName: layer.layerName.trim(),
    segmentId,
    segmentName: asString(attrs.SEG_NAME),
    basinName: asString(attrs.BASIN_NAME),
    segmentClass: asString(attrs.SEG_CLASS),
    segmentType: asString(attrs.SEG_TYPE),
    countyName: extractCountyName(attrs) ?? (segmentId ? countyBySegment[segmentId] ?? null : null),
    size: round4(asNumber(attrs.SIZE_)),
    sizeUnit: asString(attrs.SIZE_UNIT),
    assessmentYear: asNumber(attrs.IR_YEAR),
    isImpaired: Object.values(impairmentFlags).some(Boolean),
    impairmentFlags,
    sourceUrl: `${SURFACE_WATER_QUALITY_SERVICE_URL}/${layer.layerId}`,
  };
}

export function buildSurfaceWaterQualityQueryUrl(
  layerId: SurfaceWaterSegmentLayerId,
  options: SurfaceWaterQualityQueryOptions = {},
): string {
  const url = new URL(`${SURFACE_WATER_QUALITY_SERVICE_URL}/${layerId}/query`);
  url.searchParams.set("where", options.where ?? "1=1");
  url.searchParams.set("outFields", DEFAULT_OUT_FIELDS.join(","));
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("f", "pjson");
  if (typeof options.resultRecordCount === "number") {
    url.searchParams.set("resultRecordCount", String(options.resultRecordCount));
  }
  return url.toString();
}

export function normalizeSurfaceWaterQualityResponses(
  snapshot: SurfaceWaterQualityRawSnapshot,
  countyBySegment: Record<string, string> = {},
): SurfaceWaterQualityRow[] {
  return SURFACE_WATER_SEGMENT_LAYER_IDS.flatMap((layerId) => {
    const layer = snapshot.layers[layerId];
    if (!layer) return [];
    return layer.features.map((feature) => normalizeRow(layer, feature, countyBySegment));
  });
}

export async function fetchSurfaceWaterQualitySegments(
  options: SurfaceWaterQualityQueryOptions = {},
): Promise<SurfaceWaterQualityRawSnapshot> {
  const layers = await Promise.all(
    SURFACE_WATER_SEGMENT_LAYER_IDS.map(async (layerId) => {
      const response = await fetch(buildSurfaceWaterQualityQueryUrl(layerId, options), {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Surface water quality fetch failed (${response.status}) for layer ${layerId}`);
      }
      const data = await response.json() as {
        features?: SurfaceWaterQualityFeature[];
        exceededTransferLimit?: boolean;
      };
      return [layerId, {
        layerId,
        layerName: layerId === 7 ? "Reservoir Segments" : "Stream Segments",
        features: data.features ?? [],
        exceededTransferLimit: data.exceededTransferLimit ?? false,
      }] as const;
    }),
  );

  return {
    generatedAt: new Date().toISOString(),
    source: SURFACE_WATER_QUALITY_SERVICE_URL,
    layers: Object.fromEntries(layers),
  };
}

export async function loadSurfaceWaterQualityFromSnapshot(): Promise<SurfaceWaterQualityRow[]> {
  const raw = await fs.readFile(snapshotPath(), "utf8");
  const snapshot = JSON.parse(raw) as SurfaceWaterQualitySnapshot;
  return snapshot.rows;
}
