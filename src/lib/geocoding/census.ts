/**
 * U.S. Census Bureau Geocoder — free, no key, US-only.
 *
 * Used by the address-lookup composite service to resolve a free-text address
 * into a lat/lon plus county FIPS + block-group GEOID, so we can hand it off to
 * existing county-keyed services (water summary, ACS, NWS alerts, etc.) and to
 * lat/lon-buffered services later (EJScreen).
 *
 * Docs: https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.pdf
 */

const ENDPOINT =
  "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";
const DEFAULT_TIMEOUT_MS = 6000;
const TEXAS_STATE_FIPS = "48";

export type GeocodedAddress = {
  matchedAddress: string;
  latitude: number;
  longitude: number;
  countyFips: string | null;
  countyName: string | null;
  stateFips: string | null;
  blockGroupGeoid: string | null;
  tractGeoid: string | null;
};

export type GeocoderError = {
  kind: "no-match" | "out-of-state" | "network" | "invalid-input" | "timeout";
  message: string;
};

export type GeocoderResult =
  | { ok: true; address: GeocodedAddress }
  | { ok: false; error: GeocoderError };

type CensusGeographyEntry = {
  GEOID?: string;
  NAME?: string;
  STATE?: string;
  COUNTY?: string;
  TRACT?: string;
  BLKGRP?: string;
};

type CensusGeographies = Record<string, CensusGeographyEntry[] | undefined>;

type CensusAddressMatch = {
  matchedAddress?: string;
  coordinates?: { x?: number; y?: number };
  geographies?: CensusGeographies;
};

type CensusResponse = {
  result?: {
    addressMatches?: CensusAddressMatch[];
  };
};

function pickFirst(geographies: CensusGeographies | undefined, ...keys: string[]) {
  if (!geographies) return undefined;
  for (const key of keys) {
    const entries = geographies[key];
    if (entries && entries.length > 0) return entries[0];
  }
  return undefined;
}

export async function geocodeAddress(
  query: string,
  options: { timeoutMs?: number; texasOnly?: boolean; fetchImpl?: typeof fetch } = {},
): Promise<GeocoderResult> {
  const trimmed = query.trim();
  if (trimmed.length < 4) {
    return {
      ok: false,
      error: { kind: "invalid-input", message: "Address is too short" },
    };
  }

  const url = new URL(ENDPOINT);
  url.searchParams.set("address", trimmed);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("vintage", "Current_Current");
  url.searchParams.set("format", "json");

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let response: Response;
  try {
    response = await fetchImpl(url.toString(), {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { accept: "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isTimeout = error instanceof DOMException && error.name === "TimeoutError";
    return {
      ok: false,
      error: { kind: isTimeout ? "timeout" : "network", message },
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: { kind: "network", message: `Census geocoder ${response.status}` },
    };
  }

  let body: CensusResponse;
  try {
    body = (await response.json()) as CensusResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: { kind: "network", message } };
  }

  const match = body.result?.addressMatches?.[0];
  if (!match || !match.coordinates) {
    return {
      ok: false,
      error: { kind: "no-match", message: "Census geocoder returned no matches" },
    };
  }

  const lat = Number(match.coordinates.y);
  const lon = Number(match.coordinates.x);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return {
      ok: false,
      error: { kind: "no-match", message: "Match returned non-numeric coordinates" },
    };
  }

  const county = pickFirst(match.geographies, "Counties", "2020 Census Counties");
  const blockGroup = pickFirst(
    match.geographies,
    "Census Block Groups",
    "2020 Census Block Groups",
    "Block Groups",
  );
  const tract = pickFirst(
    match.geographies,
    "Census Tracts",
    "2020 Census Tracts",
    "Tracts",
  );

  const stateFips = county?.STATE ?? null;
  if (options.texasOnly !== false && stateFips && stateFips !== TEXAS_STATE_FIPS) {
    return {
      ok: false,
      error: {
        kind: "out-of-state",
        message: `Address resolved to state FIPS ${stateFips}; Atlas TX covers Texas only`,
      },
    };
  }

  return {
    ok: true,
    address: {
      matchedAddress: match.matchedAddress ?? trimmed,
      latitude: lat,
      longitude: lon,
      countyFips: county?.GEOID ?? null,
      countyName: county?.NAME ?? null,
      stateFips,
      blockGroupGeoid: blockGroup?.GEOID ?? null,
      tractGeoid: tract?.GEOID ?? null,
    },
  };
}
