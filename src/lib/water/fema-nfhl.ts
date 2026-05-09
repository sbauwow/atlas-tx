import { getCountyByFips, type CountyRef } from "@/lib/water/county-lookup";
import { getGlobalWaterDataCache } from "@/lib/water/cache";

const NFHL_SERVICE_URL = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer";
const TEXAS_STATE_FIPS = "48";
const POLITICAL_JURISDICTIONS_LAYER_ID = 22;
const LEVEES_LAYER_ID = 23;
const POLITICAL_JURISDICTIONS_LAYER_NAME = "Political Jurisdictions";
const LEVEES_LAYER_NAME = "Levees";
const NFHL_METADATA_TTL_MS = 24 * 60 * 60 * 1000;
const NFHL_POLITICAL_JURISDICTIONS_TTL_MS = 24 * 60 * 60 * 1000;
const NFHL_LEVEES_TTL_MS = 24 * 60 * 60 * 1000;
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
const LEVEES_OUT_FIELDS = [
  "OBJECTID",
  "DFIRM_ID",
  "LEVEE_ID",
  "LEVEE_NM",
  "LEVEE_TYP",
  "WTR_NM",
  "LEVEE_STAT",
  "OWNER",
  "DISTRICT",
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
  LEVEE_ID?: string | null;
  LEVEE_NM?: string | null;
  LEVEE_TYP?: string | null;
  WTR_NM?: string | null;
  LEVEE_STAT?: string | null;
  OWNER?: string | null;
  DISTRICT?: string | null;
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

export type NfhlLeveeFeature = {
  objectId: number | null;
  dfirmId: string | null;
  leveeId: string | null;
  leveeName: string | null;
  leveeType: string | null;
  waterName: string | null;
  leveeStatus: string | null;
  owner: string | null;
  district: string | null;
  raw: Record<string, unknown>;
};

export type NfhlLeveesResponse = {
  sourceId: "fema-nfhl";
  layerId: 23;
  layerName: "Levees";
  where: "DFIRM_ID LIKE '48%'";
  featureCount: number;
  exceededTransferLimit: boolean;
  features: NfhlLeveeFeature[];
};

export type NfhlCountyCoverage = {
  county: CountyRef;
  jurisdictionCount: number;
  jurisdictionNames: string[];
  dfirmIds: string[];
  communityIds: string[];
};

export type NfhlCountyCoverageResponse = {
  sourceId: "fema-nfhl";
  layerId: 22;
  layerName: "Political Jurisdictions";
  countyCount: number;
  counties: NfhlCountyCoverage[];
};

function normalizeLayer(layer: NfhlLayer): NormalizedNfhlLayer {
  return {
    id: Number(layer.id ?? -1),
    name: String(layer.name ?? "Unknown layer"),
    geometryType: layer.geometryType ?? null,
  };
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function joinJurisdictionName(attributes: NfhlFeatureAttributes): string | null {
  const parts = [attributes.POL_NAME1, attributes.POL_NAME2, attributes.POL_NAME3]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
  return parts.length > 0 ? parts.join(" / ") : null;
}

function toTexasCountyFips(countyFips: string | null, stateFips: string | null): string | null {
  if (!countyFips) {
    return null;
  }
  const normalizedCounty = countyFips.padStart(3, "0");
  const normalizedState = (stateFips ?? TEXAS_STATE_FIPS).padStart(2, "0");
  return `${normalizedState}${normalizedCounty}`;
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
  const relevantNames = new Set([POLITICAL_JURISDICTIONS_LAYER_NAME, LEVEES_LAYER_NAME, "Water Lines"]);
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

export function buildTexasLeveesQueryUrl(limit?: number): string {
  return buildNfhlLayerQueryUrl(LEVEES_LAYER_ID, {
    where: "DFIRM_ID LIKE '48%'",
    outFields: [...LEVEES_OUT_FIELDS],
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
      dfirmId: normalizeNullableString(attributes.DFIRM_ID),
      jurisdictionName: joinJurisdictionName(attributes),
      countyFips: normalizeNullableString(attributes.CO_FIPS),
      stateFips: normalizeNullableString(attributes.ST_FIPS),
      communityNumber: normalizeNullableString(attributes.COMM_NO),
      communityId: normalizeNullableString(attributes.CID),
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

export function normalizeNfhlLeveesResponse(response: NfhlLayerQueryResponse): NfhlLeveesResponse {
  const features = (response.features ?? []).map((feature) => {
    const attributes = feature.attributes ?? {};
    return {
      objectId: typeof attributes.OBJECTID === "number" ? attributes.OBJECTID : null,
      dfirmId: normalizeNullableString(attributes.DFIRM_ID),
      leveeId: normalizeNullableString(attributes.LEVEE_ID),
      leveeName: normalizeNullableString(attributes.LEVEE_NM),
      leveeType: normalizeNullableString(attributes.LEVEE_TYP),
      waterName: normalizeNullableString(attributes.WTR_NM),
      leveeStatus: normalizeNullableString(attributes.LEVEE_STAT),
      owner: normalizeNullableString(attributes.OWNER),
      district: normalizeNullableString(attributes.DISTRICT),
      raw: attributes,
    };
  });

  return {
    sourceId: "fema-nfhl",
    layerId: LEVEES_LAYER_ID,
    layerName: LEVEES_LAYER_NAME,
    where: "DFIRM_ID LIKE '48%'",
    featureCount: features.length,
    exceededTransferLimit: response.exceededTransferLimit === true,
    features,
  };
}

export function mapNfhlPoliticalJurisdictionsToAtlasCounties(
  response: NfhlPoliticalJurisdictionsResponse,
): NfhlCountyCoverageResponse {
  const grouped = new Map<string, NfhlCountyCoverage>();

  response.features.forEach((feature) => {
    const joinedFips = toTexasCountyFips(feature.countyFips, feature.stateFips);
    if (!joinedFips) {
      return;
    }
    const county = getCountyByFips(joinedFips);
    if (!county) {
      return;
    }
    const existing = grouped.get(county.slug) ?? {
      county,
      jurisdictionCount: 0,
      jurisdictionNames: [],
      dfirmIds: [],
      communityIds: [],
    };
    existing.jurisdictionCount += 1;
    if (feature.jurisdictionName && !existing.jurisdictionNames.includes(feature.jurisdictionName)) {
      existing.jurisdictionNames.push(feature.jurisdictionName);
    }
    if (feature.dfirmId && !existing.dfirmIds.includes(feature.dfirmId)) {
      existing.dfirmIds.push(feature.dfirmId);
    }
    if (feature.communityId && !existing.communityIds.includes(feature.communityId)) {
      existing.communityIds.push(feature.communityId);
    }
    grouped.set(county.slug, existing);
  });

  const counties = Array.from(grouped.values()).sort((left, right) => left.county.name.localeCompare(right.county.name));
  return {
    sourceId: "fema-nfhl",
    layerId: POLITICAL_JURISDICTIONS_LAYER_ID,
    layerName: POLITICAL_JURISDICTIONS_LAYER_NAME,
    countyCount: counties.length,
    counties,
  };
}

export function filterNfhlLeveesForCounty(
  county: string,
  levees: NfhlLeveesResponse,
  countyCoverage: NfhlCountyCoverageResponse,
): NfhlLeveesResponse {
  const match = countyCoverage.counties.find((coverage) => coverage.county.slug === county || coverage.county.name === county);
  if (!match) {
    return { ...levees, featureCount: 0, features: [] };
  }
  const dfirmIds = new Set(match.dfirmIds);
  const features = levees.features.filter((feature) => feature.dfirmId && dfirmIds.has(feature.dfirmId));
  return {
    ...levees,
    featureCount: features.length,
    features,
  };
}

async function fetchNfhlServiceMetadataUncached(signal?: AbortSignal): Promise<NormalizedNfhlServiceMetadata> {
  const response = await fetch(`${NFHL_SERVICE_URL}?f=pjson`, { signal });
  if (!response.ok) {
    throw new Error(`NFHL metadata request failed: ${response.status}`);
  }
  return normalizeNfhlServiceMetadata((await response.json()) as NfhlServiceMetadata);
}

export async function fetchNfhlServiceMetadata(signal?: AbortSignal): Promise<NormalizedNfhlServiceMetadata> {
  if (signal) {
    return fetchNfhlServiceMetadataUncached(signal);
  }
  return getGlobalWaterDataCache().getOrLoad("fema-nfhl:metadata", NFHL_METADATA_TTL_MS, () => fetchNfhlServiceMetadataUncached());
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

async function fetchTexasNfhlPoliticalJurisdictionsUncached(
  limit?: number,
  signal?: AbortSignal,
): Promise<NfhlPoliticalJurisdictionsResponse> {
  const response = await fetch(buildTexasPoliticalJurisdictionsQueryUrl(limit), { signal });
  if (!response.ok) {
    throw new Error(`NFHL political jurisdictions request failed: ${response.status}`);
  }
  return normalizeNfhlPoliticalJurisdictionsResponse((await response.json()) as NfhlLayerQueryResponse);
}

export async function fetchTexasNfhlPoliticalJurisdictions(
  limit?: number,
  signal?: AbortSignal,
): Promise<NfhlPoliticalJurisdictionsResponse> {
  if (signal || typeof limit === "number") {
    return fetchTexasNfhlPoliticalJurisdictionsUncached(limit, signal);
  }
  return getGlobalWaterDataCache().getOrLoad(
    "fema-nfhl:political-jurisdictions",
    NFHL_POLITICAL_JURISDICTIONS_TTL_MS,
    () => fetchTexasNfhlPoliticalJurisdictionsUncached(),
  );
}

export async function fetchTexasNfhlCountyCoverage(signal?: AbortSignal): Promise<NfhlCountyCoverageResponse> {
  return mapNfhlPoliticalJurisdictionsToAtlasCounties(await fetchTexasNfhlPoliticalJurisdictions(undefined, signal));
}

export async function fetchTexasNfhlCountyLevees(
  county: string,
  limit?: number,
  signal?: AbortSignal,
): Promise<NfhlLeveesResponse> {
  const [levees, countyCoverage] = await Promise.all([
    fetchTexasNfhlLevees(limit, signal),
    fetchTexasNfhlCountyCoverage(signal),
  ]);
  return filterNfhlLeveesForCounty(county, levees, countyCoverage);
}

async function fetchTexasNfhlLeveesUncached(limit?: number, signal?: AbortSignal): Promise<NfhlLeveesResponse> {
  const response = await fetch(buildTexasLeveesQueryUrl(limit), { signal });
  if (!response.ok) {
    throw new Error(`NFHL levees request failed: ${response.status}`);
  }
  return normalizeNfhlLeveesResponse((await response.json()) as NfhlLayerQueryResponse);
}

export async function fetchTexasNfhlLevees(limit?: number, signal?: AbortSignal): Promise<NfhlLeveesResponse> {
  if (signal || typeof limit === "number") {
    return fetchTexasNfhlLeveesUncached(limit, signal);
  }
  return getGlobalWaterDataCache().getOrLoad("fema-nfhl:levees", NFHL_LEVEES_TTL_MS, () => fetchTexasNfhlLeveesUncached());
}
