import { countySlug } from "@/lib/counties";
import { loadSurfaceWaterQualityFromSnapshot } from "@/lib/datasets/surface-water-quality";
import { fetchTexasNfhlCountyCoverage, type NfhlCountyCoverageResponse } from "@/lib/water/fema-nfhl";
import { getCountyBySlugOrName, getNearestCountyForPoint, type CountyRef } from "@/lib/water/county-lookup";
import { buildWaterFreshness } from "@/lib/water/freshness";
import {
  fetchLcraArrpLandPermits as fetchLcraArrpLandPermitsDefault,
  fetchLcraArrpOutfalls as fetchLcraArrpOutfallsDefault,
} from "@/lib/water/lcra-arrp";
import {
  fetchLcraWaterQualitySiteObservations as fetchLcraWaterQualitySiteObservationsDefault,
  fetchLcraWaterQualitySiteParameters as fetchLcraWaterQualitySiteParametersDefault,
  fetchLcraWaterQualitySites as fetchLcraWaterQualitySitesDefault,
} from "@/lib/water/lcra-water-quality";
import { fetchTexasWaterAlerts, filterAlertsForCounty } from "@/lib/water/nws";
import { fetchGeneralWaterPermits } from "@/lib/water/tceq-general-permits";
import { fetchRecentSewerOverflows } from "@/lib/water/tceq-sewer-overflows";
import { fetchTexasStreamGauges, filterGaugesForCounty } from "@/lib/water/usgs";
import { fetchWaterGovernance } from "@/lib/water/water-governance";
import type {
  CountyWaterSummary,
  LcraArrpLandPermit,
  LcraArrpOutfall,
  LcraWaterQualityObservation,
  LcraWaterQualityParameter,
  LcraWaterQualitySite,
  SewerOverflowEvent,
  StreamGauge,
  SurfaceWaterQualitySegment,
  WaterAlert,
  WaterGovernanceEntity,
  WaterPermitRecord,
} from "@/lib/water/types";
import { listWaterSources } from "@/lib/water/water-source-registry";

export type WaterBreakdown = {
  county: CountyWaterSummary;
  layers: {
    alerts: WaterAlert[];
    gauges: StreamGauge[];
    sewerOverflows: SewerOverflowEvent[];
    permits: WaterPermitRecord[];
    governance: WaterGovernanceEntity[];
    surfaceWaterQuality: SurfaceWaterQualitySegment[];
    lcraArrpOutfalls: LcraArrpOutfall[];
    lcraArrpLandPermits: LcraArrpLandPermit[];
    lcraWaterQualitySites: LcraWaterQualitySite[];
  };
  notes: string[];
};

export type WaterOverview = {
  generatedAt: string;
  sourceIds: string[];
  freshness: { generatedAt: string; sources: Record<string, { cached: boolean; cachedAt: string | null; expiresAt: string | null; ttlMs: number | null }> };
  counties: CountyWaterSummary[];
};

export type AtlasWaterSummaryService = {
  getWaterOverview(): Promise<WaterOverview>;
  getCountyWaterBreakdown(county: string): Promise<WaterBreakdown>;
};

export type CreateAtlasWaterSummaryServiceOptions = {
  fetchAlerts?: () => Promise<WaterAlert[]>;
  fetchGauges?: () => Promise<StreamGauge[]>;
  fetchSewerOverflows?: () => Promise<SewerOverflowEvent[]>;
  fetchPermits?: () => Promise<WaterPermitRecord[]>;
  fetchGovernance?: () => Promise<WaterGovernanceEntity[]>;
  fetchSurfaceWaterQuality?: () => Promise<SurfaceWaterQualitySegment[]>;
  fetchFloodplainCountyCoverage?: () => Promise<NfhlCountyCoverageResponse>;
  fetchLcraArrpOutfalls?: () => Promise<LcraArrpOutfall[]>;
  fetchLcraArrpLandPermits?: () => Promise<LcraArrpLandPermit[]>;
  fetchLcraWaterQualitySites?: () => Promise<LcraWaterQualitySite[]>;
  fetchLcraWaterQualitySiteParameters?: (siteId: string) => Promise<LcraWaterQualityParameter[]>;
  fetchLcraWaterQualitySiteObservations?: (siteId: string) => Promise<LcraWaterQualityObservation[]>;
};

type CountyLcraQualityAggregate = {
  county: CountyRef;
  sites: LcraWaterQualitySite[];
  activeSiteCount: number;
  impairedSiteCount: number;
  availableParameterCount?: number;
  latestObservationAt: string | undefined;
  topStoretSummary?: string;
};

function getFloodplainCount(countyName: string, floodplainCoverage?: NfhlCountyCoverageResponse): number {
  return floodplainCoverage?.counties.find((coverage) => countySlug(coverage.county.slug) === countySlug(countyName))?.jurisdictionCount ?? 0;
}

function matchesCounty(countyName: string | null | undefined, county: string) {
  return countySlug(countyName ?? "") === countySlug(county);
}

function buildMismatch(
  alerts: WaterAlert[],
  sewerOverflows: SewerOverflowEvent[],
  surfaceWaterQuality: SurfaceWaterQualitySegment[],
): { score: number; flags: string[] } | undefined {
  const flags: string[] = [];
  const impairedCount = surfaceWaterQuality.filter((row) => row.isImpaired).length;
  if (impairedCount > 0 && sewerOverflows.length > 0) {
    flags.push("surface-water impairment overlaps recent sewer overflow activity");
  }
  if (impairedCount > 0 && alerts.length <= 1) {
    flags.push("surface-water impairment is present with only light active alert coverage");
  }
  if (flags.length === 0) return undefined;
  return {
    score: Math.min(100, flags.length * 25 + (sewerOverflows.length > 0 ? 25 : 0)),
    flags,
  };
}

function maxIsoDate(values: Array<string | null | undefined>): string | undefined {
  const valid = values.filter((value): value is string => Boolean(value)).sort();
  return valid.at(-1);
}

async function safeLoad<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch {
    return fallback;
  }
}

function isLcraManagedSite(site: LcraWaterQualitySite): boolean {
  return (site.agency ?? "").trim().toUpperCase() === "LCRA";
}

function getCountyForLcraSite(site: LcraWaterQualitySite): CountyRef | undefined {
  if (!Number.isFinite(site.latitude) || !Number.isFinite(site.longitude)) return undefined;
  return getNearestCountyForPoint(site.latitude as number, site.longitude as number);
}

function buildTopStoretSummary(observations: LcraWaterQualityObservation[]): string | undefined {
  if (!observations.length) return undefined;

  const counts = new Map<string, { count: number; firstSeen: number }>();
  observations.forEach((observation, index) => {
    const label = observation.storetName?.trim() || observation.storetCode;
    const existing = counts.get(label);
    if (existing) {
      existing.count += 1;
      return;
    }
    counts.set(label, { count: 1, firstSeen: index });
  });

  return Array.from(counts.entries())
    .sort((a, b) => {
      if (b[1].count !== a[1].count) return b[1].count - a[1].count;
      return a[1].firstSeen - b[1].firstSeen;
    })
    .slice(0, 3)
    .map(([label, meta]) => `${label} (${meta.count})`)
    .join(", ");
}

async function buildLcraCountyAggregates(
  sites: LcraWaterQualitySite[],
  fetchSiteParameters?: (siteId: string) => Promise<LcraWaterQualityParameter[]>,
  fetchSiteObservations?: (siteId: string) => Promise<LcraWaterQualityObservation[]>,
): Promise<Map<string, CountyLcraQualityAggregate>> {
  const countySites = new Map<string, { county: CountyRef; sites: LcraWaterQualitySite[] }>();

  for (const site of sites.filter(isLcraManagedSite)) {
    const county = getCountyForLcraSite(site);
    if (!county) continue;
    const existing = countySites.get(county.slug);
    if (existing) {
      existing.sites.push(site);
    } else {
      countySites.set(county.slug, { county, sites: [site] });
    }
  }

  const aggregates = await Promise.all(Array.from(countySites.values()).map(async ({ county, sites: countyLevelSites }) => {
    const parameterRows = fetchSiteParameters
      ? (await Promise.all(countyLevelSites.map((site) => safeLoad(() => fetchSiteParameters(site.siteId), [])))).flat()
      : [];
    const observationRows = fetchSiteObservations
      ? (await Promise.all(countyLevelSites.map((site) => safeLoad(() => fetchSiteObservations(site.siteId), [])))).flat()
      : [];

    const availableParameterCount = parameterRows.length ? new Set(parameterRows.map((row) => row.storetCode)).size : undefined;
    const latestObservationAt = maxIsoDate([
      ...countyLevelSites.map((site) => site.lastObservedAt),
      ...observationRows.map((row) => row.observedAt),
    ]);

    return {
      county,
      aggregate: {
        county,
        sites: countyLevelSites,
        activeSiteCount: countyLevelSites.filter((site) => site.isActive).length,
        impairedSiteCount: countyLevelSites.filter((site) => site.impairedSegment).length,
        availableParameterCount,
        latestObservationAt,
        topStoretSummary: buildTopStoretSummary(observationRows),
      } satisfies CountyLcraQualityAggregate,
    };
  }));

  return new Map(aggregates.map(({ county, aggregate }) => [county.slug, aggregate]));
}

function buildSummary(
  countyName: string,
  alerts: WaterAlert[],
  gauges: StreamGauge[],
  sewerOverflows: SewerOverflowEvent[],
  permits: WaterPermitRecord[],
  governance: WaterGovernanceEntity[],
  surfaceWaterQuality: SurfaceWaterQualitySegment[],
  floodplainCoverage: NfhlCountyCoverageResponse | undefined,
  lcraArrpOutfalls: LcraArrpOutfall[],
  lcraArrpLandPermits: LcraArrpLandPermit[],
  lcraQuality?: CountyLcraQualityAggregate,
): CountyWaterSummary {
  const floodplainFeatureCount = getFloodplainCount(countyName, floodplainCoverage);
  const impairedSurfaceWaterSegmentCount = surfaceWaterQuality.filter((row) => row.isImpaired).length;
  const mismatch = buildMismatch(alerts, sewerOverflows, surfaceWaterQuality);

  return {
    county: {
      name: countyName,
      slug: countySlug(countyName),
      fips: gauges[0]?.countyFips ?? lcraQuality?.county.fips ?? undefined,
    },
    metrics: {
      floodplainFeatureCount,
      streamGaugeCount: gauges.length,
      activeWaterAlertCount: alerts.length,
      sewerOverflowCount30d: sewerOverflows.length,
      sewerOverflowGallons30d: sewerOverflows.reduce((sum, event) => sum + (event.amountGallons ?? 0), 0),
      generalPermitCount: permits.length,
      waterDistrictCount: governance.filter((entity) => entity.sourceId === "tceq-water-districts").length,
      waterUtilityCount: governance.filter((entity) => entity.sourceId !== "tceq-water-districts").length,
      surfaceWaterSegmentCount: surfaceWaterQuality.length,
      impairedSurfaceWaterSegmentCount,
      lcraArrpOutfallCount: lcraArrpOutfalls.length,
      lcraArrpLandPermitCount: lcraArrpLandPermits.length,
      activeLcraQualitySiteCount: lcraQuality?.activeSiteCount,
      latestLcraObservationAt: lcraQuality?.latestObservationAt,
      availableLcraParameterCount: lcraQuality?.availableParameterCount,
      impairedLcraMonitoringSiteCount: lcraQuality?.impairedSiteCount,
    },
    overlays: {
      hasFloodplainLayer: floodplainFeatureCount > 0,
      hasGaugeLayer: gauges.length > 0,
      hasAlertLayer: alerts.length > 0,
      hasSewerOverflowLayer: sewerOverflows.length > 0,
      hasSurfaceWaterImpairmentLayer: impairedSurfaceWaterSegmentCount > 0,
    },
    mismatch,
    annotations: [
      ...(impairedSurfaceWaterSegmentCount > 0
        ? ["Nearby surface-water impairment context is additive only; it is not a standalone verdict on county-wide harm."]
        : []),
      ...(lcraQuality
        ? ["LCRA monitoring metrics are basin-context enrichment and not the statewide regulatory source of truth."]
        : []),
    ],
  };
}

export function createAtlasWaterSummaryService({
  fetchAlerts = fetchTexasWaterAlerts,
  fetchGauges = fetchTexasStreamGauges,
  fetchSewerOverflows = () => fetchRecentSewerOverflows(30),
  fetchPermits = fetchGeneralWaterPermits,
  fetchGovernance = fetchWaterGovernance,
  fetchSurfaceWaterQuality = loadSurfaceWaterQualityFromSnapshot,
  fetchFloodplainCountyCoverage = fetchTexasNfhlCountyCoverage,
  fetchLcraArrpOutfalls = fetchLcraArrpOutfallsDefault,
  fetchLcraArrpLandPermits = fetchLcraArrpLandPermitsDefault,
  fetchLcraWaterQualitySites = fetchLcraWaterQualitySitesDefault,
  fetchLcraWaterQualitySiteParameters = fetchLcraWaterQualitySiteParametersDefault,
  fetchLcraWaterQualitySiteObservations = (siteId: string) => fetchLcraWaterQualitySiteObservationsDefault(siteId),
}: CreateAtlasWaterSummaryServiceOptions = {}): AtlasWaterSummaryService {
  return {
    async getWaterOverview() {
      const [alerts, gauges, sewerOverflows, permits, governance, surfaceWaterQuality, floodplainCoverage, lcraArrpOutfalls, lcraArrpLandPermits, lcraWaterQualitySites] = await Promise.all([
        fetchAlerts(),
        fetchGauges(),
        fetchSewerOverflows(),
        fetchPermits(),
        fetchGovernance(),
        fetchSurfaceWaterQuality(),
        fetchFloodplainCountyCoverage(),
        fetchLcraArrpOutfalls(),
        fetchLcraArrpLandPermits(),
        safeLoad(() => fetchLcraWaterQualitySites(), []),
      ]);

      const lcraCountyAggregates = await buildLcraCountyAggregates(
        lcraWaterQualitySites,
      );

      const sourceIds = listWaterSources().map((source) => source.sourceId);
      const countyNames = new Set<string>();
      alerts.forEach((alert) => (alert.countyNames ?? []).forEach((county) => countyNames.add(county)));
      gauges.forEach((gauge) => gauge.countyName && countyNames.add(gauge.countyName));
      sewerOverflows.forEach((event) => event.countyName && countyNames.add(event.countyName));
      permits.forEach((record) => record.countyName && countyNames.add(record.countyName));
      governance.forEach((record) => record.countyName && countyNames.add(record.countyName));
      surfaceWaterQuality.forEach((record) => record.countyName && countyNames.add(record.countyName));
      floodplainCoverage.counties.forEach((coverage) => countyNames.add(coverage.county.name));
      lcraArrpOutfalls.forEach((record) => record.countyName && countyNames.add(record.countyName));
      lcraArrpLandPermits.forEach((record) => record.countyName && countyNames.add(record.countyName));
      lcraCountyAggregates.forEach((aggregate) => countyNames.add(aggregate.county.name));

      const counties = Array.from(countyNames)
        .sort((a, b) => a.localeCompare(b))
        .map((countyName) => {
          const aggregate = lcraCountyAggregates.get(countySlug(countyName));
          return buildSummary(
            aggregate?.county.name ?? countyName,
            filterAlertsForCounty(alerts, countyName),
            filterGaugesForCounty(gauges, countyName),
            sewerOverflows.filter((event) => matchesCounty(event.countyName, countyName)),
            permits.filter((record) => matchesCounty(record.countyName, countyName)),
            governance.filter((record) => matchesCounty(record.countyName, countyName)),
            surfaceWaterQuality.filter((record) => matchesCounty(record.countyName, countyName)),
            floodplainCoverage,
            lcraArrpOutfalls.filter((record) => matchesCounty(record.countyName, countyName)),
            lcraArrpLandPermits.filter((record) => matchesCounty(record.countyName, countyName)),
            aggregate,
          );
        });

      return {
        generatedAt: new Date().toISOString(),
        sourceIds,
        freshness: buildWaterFreshness(sourceIds),
        counties,
      };
    },

    async getCountyWaterBreakdown(county) {
      const [alerts, gauges, sewerOverflows, permits, governance, surfaceWaterQuality, floodplainCoverage, lcraArrpOutfalls, lcraArrpLandPermits, lcraWaterQualitySites] = await Promise.all([
        fetchAlerts(),
        fetchGauges(),
        fetchSewerOverflows(),
        fetchPermits(),
        fetchGovernance(),
        fetchSurfaceWaterQuality(),
        fetchFloodplainCountyCoverage(),
        fetchLcraArrpOutfalls(),
        fetchLcraArrpLandPermits(),
        safeLoad(() => fetchLcraWaterQualitySites(), []),
      ]);

      const lcraCountyAggregates = await buildLcraCountyAggregates(
        lcraWaterQualitySites,
        fetchLcraWaterQualitySiteParameters,
        fetchLcraWaterQualitySiteObservations,
      );

      const filteredAlerts = filterAlertsForCounty(alerts, county);
      const filteredGauges = filterGaugesForCounty(gauges, county);
      const filteredOverflows = sewerOverflows.filter((event) => matchesCounty(event.countyName, county));
      const filteredPermits = permits.filter((record) => matchesCounty(record.countyName, county));
      const filteredGovernance = governance.filter((record) => matchesCounty(record.countyName, county));
      const filteredSurfaceWaterQuality = surfaceWaterQuality.filter((record) => matchesCounty(record.countyName, county));
      const filteredLcraOutfalls = lcraArrpOutfalls.filter((record) => matchesCounty(record.countyName, county));
      const filteredLcraLandPermits = lcraArrpLandPermits.filter((record) => matchesCounty(record.countyName, county));
      const floodplainCounty = floodplainCoverage.counties.find((coverage) => countySlug(coverage.county.slug) === countySlug(county));
      const lcraQuality = lcraCountyAggregates.get(countySlug(county));
      const filteredLcraQualitySites = lcraQuality?.sites ?? [];
      const countyName =
        lcraQuality?.county.name ??
        filteredAlerts[0]?.countyNames?.[0] ??
        filteredGauges[0]?.countyName ??
        filteredOverflows[0]?.countyName ??
        filteredPermits[0]?.countyName ??
        filteredGovernance[0]?.countyName ??
        filteredSurfaceWaterQuality[0]?.countyName ??
        filteredLcraOutfalls[0]?.countyName ??
        filteredLcraLandPermits[0]?.countyName ??
        floodplainCounty?.county.name ??
        getCountyBySlugOrName(county)?.name;

      if (!countyName) {
        throw new Error(`County not found: ${county}`);
      }

      const notes: string[] = [];
      if (floodplainCounty) notes.push(`NFHL political jurisdictions mapped: ${floodplainCounty.jurisdictionCount}`);
      if (filteredSurfaceWaterQuality.length > 0) {
        notes.push(`Surface-water segments: ${filteredSurfaceWaterQuality.length} (${filteredSurfaceWaterQuality.filter((row) => row.isImpaired).length} impaired)`);
      }
      if (filteredLcraOutfalls.length) notes.push(`LCRA ARRP outfalls: ${filteredLcraOutfalls.length}`);
      if (filteredLcraLandPermits.length) notes.push(`LCRA ARRP land permits: ${filteredLcraLandPermits.length}`);
      if (lcraQuality) {
        notes.push(`LCRA quality sites: ${lcraQuality.sites.length} total / ${lcraQuality.activeSiteCount} active / ${lcraQuality.impairedSiteCount} impaired`);
        if (lcraQuality.latestObservationAt) notes.push(`Latest LCRA observation: ${lcraQuality.latestObservationAt}`);
        notes.push(`Available LCRA parameters: ${lcraQuality.availableParameterCount}`);
        if (lcraQuality.topStoretSummary) notes.push(`Top STORET: ${lcraQuality.topStoretSummary}`);
      }

      return {
        county: buildSummary(
          countyName,
          filteredAlerts,
          filteredGauges,
          filteredOverflows,
          filteredPermits,
          filteredGovernance,
          filteredSurfaceWaterQuality,
          floodplainCoverage,
          filteredLcraOutfalls,
          filteredLcraLandPermits,
          lcraQuality,
        ),
        layers: {
          alerts: filteredAlerts,
          gauges: filteredGauges,
          sewerOverflows: filteredOverflows,
          permits: filteredPermits,
          governance: filteredGovernance,
          surfaceWaterQuality: filteredSurfaceWaterQuality,
          lcraArrpOutfalls: filteredLcraOutfalls,
          lcraArrpLandPermits: filteredLcraLandPermits,
          lcraWaterQualitySites: filteredLcraQualitySites,
        },
        notes,
      };
    },
  };
}

let defaultWaterSummaryService: AtlasWaterSummaryService | undefined;

export function getDefaultAtlasWaterSummaryService(): AtlasWaterSummaryService {
  if (!defaultWaterSummaryService) {
    defaultWaterSummaryService = createAtlasWaterSummaryService();
  }
  return defaultWaterSummaryService;
}
