const NFHL_SERVICE_URL = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer";
const TEXAS_STATE_FIPS = "48";
const POLITICAL_JURISDICTIONS_LAYER_ID = 22;
const POLITICAL_JURISDICTIONS_LAYER_NAME = "Political Jurisdictions";
const POLITICAL_JURISDICTIONS_OUT_FIELDS = [
  "OBJECTID",
  "DFIRM_ID",
  "POL_NAME1",
  "POL_NAME2",
  "POL_NAME3",
  "CO_FIPS",
  "ST_FIPS",
  "COMM_NO",
  "CID",
] as const;

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

type NfhlFeatureAttributes = {
  OBJECTID?: number;
  DFIRM_ID?: string | null;
  POL_NAME1?: string | null;
  POL_NAME2?: string | null;
  POL_NAME3?: string | null;
  CO_FIPS?: string | null;
  ST_FIPS?: string | null;
  COMM_NO?: string | null;
  CID?: string | null;
  [key: string]: unknown;
};

type NfhlFeature = {
  attributes?: NfhlFeatureAttributes;
};

type NfhlLayerQueryResponse = {
  features?: NfhlFeature[];
  exceededTransferLimit?: boolean;
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
  resultRecordCount?: number;
};

export type NfhlPoliticalJurisdictionFeature = {
  objectId: number | null;
  dfirmId: string | null;
  jurisdictionName: string | null;
  countyFips: string | null;
  stateFips: string | null;
  communityNumber: string | null;
  communityId: string | null;
  raw: Record<string, unknown>;
};

export type NfhlPoliticalJurisdictionsResponse = {
  sourceId: "fema-nfhl";
  layerId: 22;
  layerName: "Political Jurisdictions";
  where: `ST_FIPS='${typeof TEXAS_STATE_FIPS}'`;
  featureCount: number;
  exceededTransferLimit: boolean;
  features: NfhlPoliticalJurisdictionFeature[];
};

function normalizeLayer(layer: NfhlLayer): NormalizedNfhlLayer {
  return {
    id: Number(layer.id ?? -1),
    name: String(layer.name ?? "Unknown layer"),
    geometryType: layer.geometryType ?? null,
  };
}

function joinJurisdictionName(attributes: NfhlFeatureAttributes): string | null {
  const parts = [attributes.POL_NAME1, attributes.POL_NAME2, attributes.POL_NAME3]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
  return parts.length > 0 ? parts.join(" / ") : null;
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

export function extractCountyRelevantNfhlLayers(metadata: NfhlServiceMetadata | NormalizedNfhlServiceMetadata): NormalizedNfhlLayer[] {
  const relevantNames = new Set(["Political Jurisdictions", "Levees", "Water Lines"]);
  const layers = "sourceId" in metadata ? metadata.layers : normalizeNfhlServiceMetadata(metadata).layers;
  return layers.filter((layer) => relevantNames.has(layer.name));
}

export function buildNfhlLayerQueryUrl(layerId: number, options: NfhlLayerQueryOptions = {}): string {
  const url = new URL(`${NFHL_SERVICE_URL}/${layerId}/query`);
  url.searchParams.set("where", options.where ?? "1=1");
  url.searchParams.set("outFields", options.outFields?.join(",") ?? "*");
  url.searchParams.set("returnGeometry", String(options.returnGeometry ?? false));
  url.searchParams.set("f", "pjson");
  if (typeof options.resultRecordCount === "number") {
    url.searchParams.set("resultRecordCount", String(options.resultRecordCount));
  }
  return url.toString();
}

export function buildTexasPoliticalJurisdictionsQueryUrl(limit?: number): string {
  return buildNfhlLayerQueryUrl(POLITICAL_JURISDICTIONS_LAYER_ID, {
    where: `ST_FIPS='${TEXAS_STATE_FIPS}'`,
    outFields: [...POLITICAL_JURISDICTIONS_OUT_FIELDS],
    returnGeometry: false,
    resultRecordCount: limit,
  });
}

export function normalizeNfhlPoliticalJurisdictionsResponse(
  response: NfhlLayerQueryResponse,
): NfhlPoliticalJurisdictionsResponse {
  const features = (response.features ?? []).map((feature) => {
    const attributes = feature.attributes ?? {};
    return {
      objectId: typeof attributes.OBJECTID === "number" ? attributes.OBJECTID : null,
      dfirmId: typeof attributes.DFIRM_ID === "string" ? attributes.DFIRM_ID : null,
      jurisdictionName: joinJurisdictionName(attributes),
      countyFips: typeof attributes.CO_FIPS === "string" ? attributes.CO_FIPS : null,
      stateFips: typeof attributes.ST_FIPS === "string" ? attributes.ST_FIPS : null,
      communityNumber: typeof attributes.COMM_NO === "string" ? attributes.COMM_NO : null,
      communityId: typeof attributes.CID === "string" ? attributes.CID : null,
      raw: attributes,
    };
  });

  return {
    sourceId: "fema-nfhl",
    layerId: POLITICAL_JURISDICTIONS_LAYER_ID,
    layerName: POLITICAL_JURISDICTIONS_LAYER_NAME,
    where: `ST_FIPS='${TEXAS_STATE_FIPS}'`,
    featureCount: features.length,
    exceededTransferLimit: response.exceededTransferLimit === true,
    features,
  };
}

export async function fetchNfhlServiceMetadata(signal?: AbortSignal): Promise<NormalizedNfhlServiceMetadata> {
  const response = await fetch(`${NFHL_SERVICE_URL}?f=pjson`, { signal });
  if (!response.ok) {
    throw new Error(`NFHL metadata request failed: ${response.status}`);
  }
  return normalizeNfhlServiceMetadata((await response.json()) as NfhlServiceMetadata);
}

export async function fetchNfhlDiscoveryBundle(signal?: AbortSignal): Promise<{
  metadata: NormalizedNfhlServiceMetadata;
  relevantLayers: NormalizedNfhlLayer[];
}> {
  const metadata = await fetchNfhlServiceMetadata(signal);
  return {
    metadata,
    relevantLayers: extractCountyRelevantNfhlLayers(metadata),
  };
}

export async function fetchTexasNfhlPoliticalJurisdictions(
  limit?: number,
  signal?: AbortSignal,
): Promise<NfhlPoliticalJurisdictionsResponse> {
  const response = await fetch(buildTexasPoliticalJurisdictionsQueryUrl(limit), { signal });
  if (!response.ok) {
    throw new Error(`NFHL political jurisdictions request failed: ${response.status}`);
  }
  return normalizeNfhlPoliticalJurisdictionsResponse((await response.json()) as NfhlLayerQueryResponse);
}
