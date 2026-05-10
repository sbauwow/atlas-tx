/**
 * U.S. Census Bureau Geocoder — free, no key, US-only.
 *
 * Used by the address-lookup composite service to resolve a free-text address
 * into a lat/lon plus county FIPS + block-group GEOID, so we can hand it off to
 * existing county-keyed services (water summary, ACS, NWS alerts, etc.) and to
 * lat/lon-buffered services later (EJScreen).
 *
 * Census is free but flaky — its frontend wraps an internal gateway that
 * intermittently returns HTTP 502 *and* sometimes returns HTTP 200 with a body
 * shaped like `{"errors": [...], "status": "502"}` instead of an
 * `addressMatches` payload. Both cases are transient. The fetch loop retries
 * on either; without retries the user sees one in three lookups fail.
 *
 * Docs: https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.pdf
 */

const ENDPOINT =
  "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";
const DEFAULT_TIMEOUT_MS = 6000;
const TEXAS_STATE_FIPS = "48";
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_BACKOFF_MS = [250, 750];

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
  errors?: unknown;
  status?: unknown;
};

function pickFirst(geographies: CensusGeographies | undefined, ...keys: string[]) {
  if (!geographies) return undefined;
  for (const key of keys) {
    const entries = geographies[key];
    if (entries && entries.length > 0) return entries[0];
  }
  return undefined;
}

type AttemptOutcome =
  | { kind: "ok"; body: CensusResponse }
  | { kind: "retryable"; error: GeocoderError }
  | { kind: "fatal"; error: GeocoderError };

async function attemptCensusFetch(
  url: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<AttemptOutcome> {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { accept: "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isTimeout = error instanceof DOMException && error.name === "TimeoutError";
    return {
      kind: "retryable",
      error: { kind: isTimeout ? "timeout" : "network", message },
    };
  }

  if (response.status >= 500) {
    return {
      kind: "retryable",
      error: { kind: "network", message: `Census geocoder ${response.status}` },
    };
  }
  if (!response.ok) {
    return {
      kind: "fatal",
      error: { kind: "network", message: `Census geocoder ${response.status}` },
    };
  }

  let body: CensusResponse;
  try {
    body = (await response.json()) as CensusResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { kind: "retryable", error: { kind: "network", message } };
  }

  // Census's frontend sometimes wraps an upstream gateway error inside an
  // HTTP 200 response, e.g. `{"errors": ["..."], "status": "502"}`. Treat any
  // non-2xx status string as a retryable network error.
  const inBodyStatus = typeof body.status === "string" || typeof body.status === "number"
    ? Number(body.status)
    : null;
  if (
    Array.isArray(body.errors) &&
    body.errors.length > 0 &&
    (!body.result?.addressMatches || body.result.addressMatches.length === 0)
  ) {
    const message = `Census geocoder reported errors${inBodyStatus ? ` (status ${inBodyStatus})` : ""}`;
    if (!inBodyStatus || inBodyStatus >= 500) {
      return { kind: "retryable", error: { kind: "network", message } };
    }
    return { kind: "fatal", error: { kind: "network", message } };
  }

  return { kind: "ok", body };
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function geocodeAddress(
  query: string,
  options: {
    timeoutMs?: number;
    texasOnly?: boolean;
    fetchImpl?: typeof fetch;
    retryAttempts?: number;
    retryBackoffMs?: readonly number[];
  } = {},
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
  const maxAttempts = Math.max(1, options.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS);
  const backoff = options.retryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;

  let lastError: GeocoderError = { kind: "network", message: "no attempts made" };
  let body: CensusResponse | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const outcome = await attemptCensusFetch(url.toString(), fetchImpl, timeoutMs);
    if (outcome.kind === "ok") {
      body = outcome.body;
      break;
    }
    lastError = outcome.error;
    if (outcome.kind === "fatal") {
      return { ok: false, error: lastError };
    }
    if (attempt < maxAttempts) {
      await delay(backoff[attempt - 1] ?? backoff[backoff.length - 1] ?? 0);
    }
  }

  if (!body) {
    return { ok: false, error: lastError };
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
