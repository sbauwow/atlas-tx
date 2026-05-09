import { countySlug } from "@/lib/counties";
import { loadSurfaceWaterQualityFromSnapshot } from "@/lib/datasets/surface-water-quality";
import { fetchTexasNfhlCountyCoverage, type NfhlCountyCoverageResponse } from "@/lib/water/fema-nfhl";
import { buildWaterFreshness } from "@/lib/water/freshness";
import { fetchTexasWaterAlerts, filterAlertsForCounty } from "@/lib/water/nws";
import { fetchGeneralWaterPermits } from "@/lib/water/tceq-general-permits";
import { fetchRecentSewerOverflows } from "@/lib/water/tceq-sewer-overflows";
import type { CountyWaterSummary, SewerOverflowEvent, StreamGauge, SurfaceWaterQualitySegment, WaterAlert, WaterGovernanceEntity, WaterPermitRecord } from "@/lib/water/types";
import { fetchTexasStreamGauges, filterGaugesForCounty } from "@/lib/water/usgs";
import { fetchWaterGovernance } from "@/lib/water/water-governance";
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
};

function getFloodplainCount(
  countyName: string,
  floodplainCoverage?: NfhlCountyCoverageResponse,
): number {
  return (
    floodplainCoverage?.counties.find((coverage) => countySlug(coverage.county.slug) === countySlug(countyName))
      ?.jurisdictionCount ?? 0
  );
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

function buildSummary(
  countyName: string,
  alerts: WaterAlert[],
  gauges: StreamGauge[],
  sewerOverflows: SewerOverflowEvent[],
  permits: WaterPermitRecord[],
  governance: WaterGovernanceEntity[],
  surfaceWaterQuality: SurfaceWaterQualitySegment[],
  floodplainCoverage?: NfhlCountyCoverageResponse,
): CountyWaterSummary {
  const floodplainFeatureCount = getFloodplainCount(countyName, floodplainCoverage);
  const impairedSurfaceWaterSegmentCount = surfaceWaterQuality.filter((row) => row.isImpaired).length;
  const mismatch = buildMismatch(alerts, sewerOverflows, surfaceWaterQuality);
  return {
    county: { name: countyName, slug: countySlug(countyName), fips: gauges[0]?.countyFips ?? undefined },
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
    },
    overlays: {
      hasFloodplainLayer: floodplainFeatureCount > 0,
      hasGaugeLayer: gauges.length > 0,
      hasAlertLayer: alerts.length > 0,
      hasSewerOverflowLayer: sewerOverflows.length > 0,
      hasSurfaceWaterImpairmentLayer: impairedSurfaceWaterSegmentCount > 0,
    },
    mismatch,
    annotations:
      impairedSurfaceWaterSegmentCount > 0
        ? [
            "Nearby surface-water impairment context is additive only; it is not a standalone verdict on county-wide harm.",
          ]
        : [],
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
}: CreateAtlasWaterSummaryServiceOptions = {}): AtlasWaterSummaryService {
  return {
    async getWaterOverview() {
      const [alerts, gauges, sewerOverflows, permits, governance, surfaceWaterQuality, floodplainCoverage] = await Promise.all([
        fetchAlerts(),
        fetchGauges(),
        fetchSewerOverflows(),
        fetchPermits(),
        fetchGovernance(),
        fetchSurfaceWaterQuality(),
        fetchFloodplainCountyCoverage(),
      ]);
      const sourceIds = listWaterSources().map((source) => source.sourceId);
      const countyNames = new Set<string>();
      alerts.forEach((alert) => (alert.countyNames ?? []).forEach((county) => countyNames.add(county)));
      gauges.forEach((gauge) => gauge.countyName && countyNames.add(gauge.countyName));
      sewerOverflows.forEach((event) => event.countyName && countyNames.add(event.countyName));
      permits.forEach((record) => record.countyName && countyNames.add(record.countyName));
      governance.forEach((record) => record.countyName && countyNames.add(record.countyName));
      surfaceWaterQuality.forEach((record) => record.countyName && countyNames.add(record.countyName));
      floodplainCoverage.counties.forEach((coverage) => countyNames.add(coverage.county.name));

      const counties = Array.from(countyNames)
        .sort((a, b) => a.localeCompare(b))
        .map((countyName) => {
          const countyPermits = permits.filter((record) => countySlug(record.countyName ?? "") === countySlug(countyName));
          const countyGovernance = governance.filter((record) => countySlug(record.countyName ?? "") === countySlug(countyName));
          const countySurfaceWaterQuality = surfaceWaterQuality.filter((record) => countySlug(record.countyName ?? "") === countySlug(countyName));
          return buildSummary(
            countyName,
            filterAlertsForCounty(alerts, countyName),
            filterGaugesForCounty(gauges, countyName),
            sewerOverflows.filter((event) => countySlug(event.countyName ?? "") === countySlug(countyName)),
            countyPermits,
            countyGovernance,
            countySurfaceWaterQuality,
            floodplainCoverage,
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
      const [alerts, gauges, sewerOverflows, permits, governance, surfaceWaterQuality, floodplainCoverage] = await Promise.all([
        fetchAlerts(),
        fetchGauges(),
        fetchSewerOverflows(),
        fetchPermits(),
        fetchGovernance(),
        fetchSurfaceWaterQuality(),
        fetchFloodplainCountyCoverage(),
      ]);
      const filteredAlerts = filterAlertsForCounty(alerts, county);
      const filteredGauges = filterGaugesForCounty(gauges, county);
      const filteredOverflows = sewerOverflows.filter((event) => countySlug(event.countyName ?? "") === countySlug(county));
      const filteredPermits = permits.filter((record) => countySlug(record.countyName ?? "") === countySlug(county));
      const filteredGovernance = governance.filter((record) => countySlug(record.countyName ?? "") === countySlug(county));
      const filteredSurfaceWaterQuality = surfaceWaterQuality.filter((record) => countySlug(record.countyName ?? "") === countySlug(county));
      const floodplainCounty = floodplainCoverage.counties.find((coverage) => countySlug(coverage.county.slug) === countySlug(county));
      const countyName =
        filteredAlerts[0]?.countyNames?.[0] ??
        filteredGauges[0]?.countyName ??
        filteredOverflows[0]?.countyName ??
        filteredPermits[0]?.countyName ??
        filteredGovernance[0]?.countyName ??
        filteredSurfaceWaterQuality[0]?.countyName ??
        floodplainCounty?.county.name;
      if (!countyName) {
        throw new Error(`County not found: ${county}`);
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
        ),
        layers: {
          alerts: filteredAlerts,
          gauges: filteredGauges,
          sewerOverflows: filteredOverflows,
          permits: filteredPermits,
          governance: filteredGovernance,
          surfaceWaterQuality: filteredSurfaceWaterQuality,
        },
        notes: floodplainCounty ? [`NFHL political jurisdictions mapped: ${floodplainCounty.jurisdictionCount}`] : [],
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
