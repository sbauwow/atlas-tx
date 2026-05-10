import { countySlug, normalizeCountyName } from "@/lib/counties";
import { getCountyByFips, getCountyBySlugOrName } from "@/lib/water/county-lookup";
import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";
import {
  type GeocodedAddress,
  type GeocoderError,
  geocodeAddress,
} from "@/lib/geocoding/census";
import { getDefaultAtlasWaterSummaryService } from "@/lib/water/water-summary-service";
import { getDefaultAtlasCountyExplorerService } from "@/lib/atlas-county-explorer";
import { fetchTceqPendingPermits, type TceqWaterPermit } from "@/lib/tceq-permits";
import { loadSdwis, type SdwisRow } from "@/lib/datasets/sdwis";
import { loadAcsCountyPopulationFromSnapshot } from "@/lib/datasets/acs";
import type { CountyBreakdown } from "@/lib/atlas-county-explorer";
import type { WaterBreakdown } from "@/lib/water/water-summary-service";
import type {
  CountyWaterSummary,
  StreamGauge,
  WaterAlert,
  SewerOverflowEvent,
  SurfaceWaterQualitySegment,
} from "@/lib/water/types";

const PROXIMITY_PERMIT_LIMIT = 5;
const PROXIMITY_GAUGE_LIMIT = 3;
const PROXIMITY_PWS_LIMIT = 5;
const PROXIMITY_OVERFLOW_LIMIT = 5;

export type AddressLookupRequest = {
  address: string;
};

export type AddressLookupCounty = {
  slug: string;
  name: string;
  fips?: string;
};

export type AddressLookupDemographics = {
  countyPopulation: number | null;
};

export type AddressLookupNearbyPermit = TceqWaterPermit & {
  distanceMiles: number | null;
};

export type AddressLookupNearbyGauge = StreamGauge & {
  distanceMiles: number;
};

export type AddressLookupSegment = SurfaceWaterQualitySegment;

export type AddressLookupPws = {
  pwsid: string;
  pwsName: string | null;
  populationServed: number | null;
  healthBasedViolationCount: number;
  latestViolationEnd: string | null;
};

export type AddressLookupData = {
  query: string;
  matchedAddress: string;
  location: { latitude: number; longitude: number };
  county: AddressLookupCounty | null;
  blockGroupGeoid: string | null;
  tractGeoid: string | null;
  demographics: AddressLookupDemographics;
  water: {
    summary: CountyWaterSummary | null;
    activeAlerts: WaterAlert[];
    nearestGauges: AddressLookupNearbyGauge[];
    nearbySewerOverflows: SewerOverflowEvent[];
    surfaceWaterSegments: AddressLookupSegment[];
  };
  permits: {
    pendingInCounty: number;
    nearest: AddressLookupNearbyPermit[];
  };
  pws: AddressLookupPws[];
  countyProfile: CountyBreakdown | null;
};

export type AddressLookupEnvelope =
  | {
      ok: true;
      data: AddressLookupData;
      sources: string[];
      caveats: string[];
    }
  | {
      ok: false;
      error: GeocoderError | { kind: "internal"; message: string };
      caveats: string[];
    };

const STATIC_SOURCES = [
  "us-census-geocoder",
  "epa-sdwis-violations",
  "acs-county-population-tx",
  "tceq-water-quality-individual-permits",
  "atlas-county-explorer",
  "atlas-water-summary",
];

const STATIC_CAVEATS = [
  "EJ outputs are exposure / burden indicators, not harm.",
  "Census geocoder is live; matched address depends on Census Bureau benchmark vintage.",
  "SDWIS rows are filtered to TX health-based violations from the committed snapshot.",
  "Distance ranking uses the geocoded point and permit/gauge centroid; small offsets may flip neighboring entries.",
];

const EARTH_RADIUS_MI = 3958.7613;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineMiles(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(h));
}

function resolveCountySlug(address: GeocodedAddress): AddressLookupCounty | null {
  if (address.countyFips) {
    const ref = getCountyByFips(address.countyFips);
    if (ref) return { slug: ref.slug, name: ref.name, fips: ref.fips };
  }
  if (address.countyName) {
    const ref = getCountyBySlugOrName(address.countyName);
    if (ref) return { slug: ref.slug, name: ref.name, fips: ref.fips };
  }
  // Fallback: nearest centroid (used when Census omits county geographies)
  let bestSlug: string | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const [slug, centroid] of Object.entries(TEXAS_COUNTY_CENTROIDS)) {
    const distance =
      (centroid.lat - address.latitude) ** 2 +
      (centroid.lon - address.longitude) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestSlug = slug;
    }
  }
  if (!bestSlug) return null;
  const centroid = TEXAS_COUNTY_CENTROIDS[bestSlug];
  return {
    slug: bestSlug,
    name: normalizeCountyName(bestSlug),
    fips: centroid.fips,
  };
}

function rankNearbyPermits(
  permits: TceqWaterPermit[],
  countyName: string,
  point: { latitude: number; longitude: number },
): { pendingInCounty: number; nearest: AddressLookupNearbyPermit[] } {
  const inCounty = permits.filter((permit) =>
    permit.county ? countySlug(permit.county) === countySlug(countyName) : false,
  );
  const ranked = inCounty
    .map((permit) => {
      const distance =
        permit.latitude !== null && permit.longitude !== null
          ? haversineMiles(point, { latitude: permit.latitude, longitude: permit.longitude })
          : null;
      return { ...permit, distanceMiles: distance };
    })
    .sort((a, b) => {
      if (a.distanceMiles === null && b.distanceMiles === null) return 0;
      if (a.distanceMiles === null) return 1;
      if (b.distanceMiles === null) return -1;
      return a.distanceMiles - b.distanceMiles;
    })
    .slice(0, PROXIMITY_PERMIT_LIMIT);
  return { pendingInCounty: inCounty.length, nearest: ranked };
}

function rankNearbyGauges(
  gauges: StreamGauge[],
  point: { latitude: number; longitude: number },
): AddressLookupNearbyGauge[] {
  return gauges
    .filter((gauge) => Number.isFinite(gauge.latitude) && Number.isFinite(gauge.longitude))
    .map((gauge) => ({
      ...gauge,
      distanceMiles: haversineMiles(point, {
        latitude: gauge.latitude,
        longitude: gauge.longitude,
      }),
    }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, PROXIMITY_GAUGE_LIMIT);
}

function rankPwsForCounty(rows: SdwisRow[], countyName: string): AddressLookupPws[] {
  const wantedSlug = countySlug(countyName);
  const filtered = rows.filter((row) =>
    row.county ? countySlug(row.county) === wantedSlug : false,
  );
  const grouped = new Map<string, AddressLookupPws>();
  for (const row of filtered) {
    if (!row.pwsid) continue;
    const existing = grouped.get(row.pwsid);
    const incrementHealth = row.isHealthBased ? 1 : 0;
    if (!existing) {
      grouped.set(row.pwsid, {
        pwsid: row.pwsid,
        pwsName: row.pwsName,
        populationServed: row.populationServed,
        healthBasedViolationCount: incrementHealth,
        latestViolationEnd: row.complPerEndDate,
      });
      continue;
    }
    existing.healthBasedViolationCount += incrementHealth;
    if (row.populationServed !== null) {
      existing.populationServed = Math.max(
        existing.populationServed ?? 0,
        row.populationServed,
      );
    }
    if (
      row.complPerEndDate &&
      (!existing.latestViolationEnd || row.complPerEndDate > existing.latestViolationEnd)
    ) {
      existing.latestViolationEnd = row.complPerEndDate;
    }
  }
  return [...grouped.values()]
    .sort((a, b) => {
      if (a.healthBasedViolationCount !== b.healthBasedViolationCount) {
        return b.healthBasedViolationCount - a.healthBasedViolationCount;
      }
      return (b.populationServed ?? 0) - (a.populationServed ?? 0);
    })
    .slice(0, PROXIMITY_PWS_LIMIT);
}

function recentSewerOverflows(
  overflows: SewerOverflowEvent[],
  countyName: string,
): SewerOverflowEvent[] {
  const wantedSlug = countySlug(countyName);
  return overflows
    .filter((event) =>
      event.countyName ? countySlug(event.countyName) === wantedSlug : false,
    )
    .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))
    .slice(0, PROXIMITY_OVERFLOW_LIMIT);
}

async function safeRun<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[address-lookup] sub-fetch failed, using fallback", error);
    }
    return fallback;
  }
}

export type AddressLookupOptions = {
  geocoder?: typeof geocodeAddress;
  loaders?: Partial<{
    waterBreakdown: (countySlug: string) => Promise<WaterBreakdown | null>;
    countyBreakdown: (countySlug: string) => Promise<CountyBreakdown | null>;
    sdwis: () => Promise<SdwisRow[]>;
    permits: () => Promise<TceqWaterPermit[]>;
    acsPopulation: () => Promise<Record<string, number>>;
  }>;
};

export async function lookupAddress(
  request: AddressLookupRequest,
  options: AddressLookupOptions = {},
): Promise<AddressLookupEnvelope> {
  const geocoder = options.geocoder ?? geocodeAddress;
  const result = await geocoder(request.address);
  if (!result.ok) {
    return { ok: false, error: result.error, caveats: STATIC_CAVEATS };
  }
  const address = result.address;
  const point = { latitude: address.latitude, longitude: address.longitude };
  const county = resolveCountySlug(address);

  const waterService = getDefaultAtlasWaterSummaryService();
  const countyService = getDefaultAtlasCountyExplorerService();
  const loaders = options.loaders ?? {};

  const waterBreakdownLoader =
    loaders.waterBreakdown ??
    (async (slug: string) => waterService.getCountyWaterBreakdown(slug));
  const countyBreakdownLoader =
    loaders.countyBreakdown ??
    (async (slug: string) => countyService.getCountyBreakdown(slug));
  const sdwisLoader = loaders.sdwis ?? (() => loadSdwis());
  const permitsLoader = loaders.permits ?? (() => fetchTceqPendingPermits());
  const acsLoader = loaders.acsPopulation ?? (() => loadAcsCountyPopulationFromSnapshot());

  const [waterBreakdown, countyBreakdown, sdwisRows, permits, acsPopulation] =
    await Promise.all([
      county ? safeRun(() => waterBreakdownLoader(county.slug), null) : Promise.resolve(null),
      county ? safeRun(() => countyBreakdownLoader(county.slug), null) : Promise.resolve(null),
      safeRun(sdwisLoader, [] as SdwisRow[]),
      safeRun(permitsLoader, [] as TceqWaterPermit[]),
      safeRun(acsLoader, {} as Record<string, number>),
    ]);

  const summary = waterBreakdown?.county ?? null;
  const activeAlerts = waterBreakdown?.layers.alerts ?? [];
  const allGauges = waterBreakdown?.layers.gauges ?? [];
  const allOverflows = waterBreakdown?.layers.sewerOverflows ?? [];
  const segments = waterBreakdown?.layers.surfaceWaterQuality ?? [];

  const permitsRanked = county
    ? rankNearbyPermits(permits, county.name, point)
    : { pendingInCounty: 0, nearest: [] };

  const data: AddressLookupData = {
    query: request.address,
    matchedAddress: address.matchedAddress,
    location: point,
    county,
    blockGroupGeoid: address.blockGroupGeoid,
    tractGeoid: address.tractGeoid,
    demographics: {
      countyPopulation: county
        ? acsPopulation[normalizeCountyName(county.name)] ?? null
        : null,
    },
    water: {
      summary,
      activeAlerts,
      nearestGauges: rankNearbyGauges(allGauges, point),
      nearbySewerOverflows: county
        ? recentSewerOverflows(allOverflows, county.name)
        : [],
      surfaceWaterSegments: segments,
    },
    permits: permitsRanked,
    pws: county ? rankPwsForCounty(sdwisRows, county.name) : [],
    countyProfile: countyBreakdown,
  };

  return {
    ok: true,
    data,
    sources: STATIC_SOURCES,
    caveats: STATIC_CAVEATS,
  };
}
