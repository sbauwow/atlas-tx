const NFHL_SERVICE_URL = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer";

type NfhlLayer = {
  id?: number;
  name?: string;
  geometryType?: string;
};

type NfhlServiceMetadata = {
  currentVersion?: number;
  mapName?: string;
  layers?: NfhlLayer[];
};

export type NormalizedNfhlLayer = {
  id: number;
  name: string;
  geometryType: string | null;
};

export type NormalizedNfhlServiceMetadata = {
  sourceId: "fema-nfhl";
  mapName: string | null;
  currentVersion: number | null;
  layerCount: number;
  layers: NormalizedNfhlLayer[];
};

export type NfhlLayerQueryOptions = {
  where?: string;
  outFields?: string[];
  returnGeometry?: boolean;
};

function normalizeLayer(layer: NfhlLayer): NormalizedNfhlLayer {
  return {
    id: Number(layer.id ?? -1),
    name: String(layer.name ?? "Unknown layer"),
    geometryType: layer.geometryType ?? null,
  };
}

export function normalizeNfhlServiceMetadata(metadata: NfhlServiceMetadata): NormalizedNfhlServiceMetadata {
  const layers = (metadata.layers ?? []).map(normalizeLayer);
  return {
    sourceId: "fema-nfhl",
    mapName: metadata.mapName ?? null,
    currentVersion: typeof metadata.currentVersion === "number" ? metadata.currentVersion : null,
    layerCount: layers.length,
    layers,
  };
}

export function extractCountyRelevantNfhlLayers(metadata: NfhlServiceMetadata): NormalizedNfhlLayer[] {
  const relevantNames = new Set(["Political Jurisdictions", "Levees", "Water Lines"]);
  return normalizeNfhlServiceMetadata(metadata).layers.filter((layer) => relevantNames.has(layer.name));
}

export function buildNfhlLayerQueryUrl(layerId: number, options: NfhlLayerQueryOptions = {}): string {
  const url = new URL(`${NFHL_SERVICE_URL}/${layerId}/query`);
  url.searchParams.set("where", options.where ?? "1=1");
  url.searchParams.set("outFields", options.outFields?.join(",") ?? "*");
  url.searchParams.set("returnGeometry", String(options.returnGeometry ?? false));
  url.searchParams.set("f", "pjson");
  return url.toString();
}

export async function fetchNfhlServiceMetadata(signal?: AbortSignal): Promise<NormalizedNfhlServiceMetadata> {
  const response = await fetch(`${NFHL_SERVICE_URL}?f=pjson`, { signal });
  if (!response.ok) {
    throw new Error(`NFHL metadata request failed: ${response.status}`);
  }
  return normalizeNfhlServiceMetadata((await response.json()) as NfhlServiceMetadata);
}
