import { getGlobalWaterDataCache } from "@/lib/water/cache";

const CACHE_KEYS: Record<string, string> = {
  "nws-alerts": "nws-alerts",
  "usgs-stream-sites": "usgs-stream-sites",
  "lcra-hydromet-stageflow": "lcra-hydromet-stageflow",
  "lcra-hydromet-lakelevels": "lcra-hydromet-lakelevels",
  "lcra-arrp-outfalls": "lcra-arrp-outfalls",
  "lcra-arrp-land-permits": "lcra-arrp-land-permits",
  "lcra-water-quality-sites": "lcra-water-quality-sites",
  "gbra-hydrology-major-rivers": "gbra-hydrology-major-rivers",
  "gbra-hydrology-gvhs-lakes": "gbra-hydrology-gvhs-lakes",
  "tceq-sewer-overflows": "tceq-sewer-overflows:30",
  "tceq-general-water-permits": "tceq-general-water-permits",
  "tceq-water-districts": "tceq-water-districts",
  "puct-water-iou": "puct-water-utilities",
  "puct-water-submeter": "puct-water-utilities",
  "fema-nfhl": "fema-nfhl:political-jurisdictions",
  "fema-nfhl-metadata": "fema-nfhl:metadata",
  "fema-nfhl-levees": "fema-nfhl:levees",
};

export function getWaterSourceFreshness(sourceId: string) {
  const key = CACHE_KEYS[sourceId];
  return key ? getGlobalWaterDataCache().getFreshness(key) : { cached: false, cachedAt: null, expiresAt: null, ttlMs: null };
}

export function buildWaterFreshness(sourceIds: string[]) {
  return {
    generatedAt: new Date().toISOString(),
    sources: Object.fromEntries(sourceIds.map((sourceId) => [sourceId, getWaterSourceFreshness(sourceId)])),
  };
}
