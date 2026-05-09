import { countySlug } from "@/lib/counties";
import { fetchTexasWaterAlerts, filterAlertsForCounty } from "@/lib/water/nws";
import { fetchGeneralWaterPermits } from "@/lib/water/tceq-general-permits";
import { fetchRecentSewerOverflows } from "@/lib/water/tceq-sewer-overflows";
import { fetchTexasStreamGauges, filterGaugesForCounty } from "@/lib/water/usgs";
import { fetchWaterGovernance } from "@/lib/water/water-governance";
import type { CountyWaterSummary, SewerOverflowEvent, StreamGauge, WaterAlert, WaterGovernanceEntity, WaterPermitRecord } from "@/lib/water/types";
import { listWaterSources } from "@/lib/water/water-source-registry";

export type WaterBreakdown = {
  county: CountyWaterSummary;
  layers: {
    alerts: WaterAlert[];
    gauges: StreamGauge[];
    sewerOverflows: SewerOverflowEvent[];
    permits: WaterPermitRecord[];
    governance: WaterGovernanceEntity[];
  };
  notes: string[];
};

export type AtlasWaterSummaryService = {
  getWaterOverview(): Promise<{ generatedAt: string; sourceIds: string[]; counties: CountyWaterSummary[] }>;
  getCountyWaterBreakdown(county: string): Promise<WaterBreakdown>;
};

export type CreateAtlasWaterSummaryServiceOptions = {
  fetchAlerts?: () => Promise<WaterAlert[]>;
  fetchGauges?: () => Promise<StreamGauge[]>;
  fetchSewerOverflows?: () => Promise<SewerOverflowEvent[]>;
  fetchPermits?: () => Promise<WaterPermitRecord[]>;
  fetchGovernance?: () => Promise<WaterGovernanceEntity[]>;
};

function buildSummary(
  countyName: string,
  alerts: WaterAlert[],
  gauges: StreamGauge[],
  sewerOverflows: SewerOverflowEvent[],
  permits: WaterPermitRecord[],
  governance: WaterGovernanceEntity[],
): CountyWaterSummary {
  return {
    county: { name: countyName, slug: countySlug(countyName), fips: gauges[0]?.countyFips ?? undefined },
    metrics: {
      streamGaugeCount: gauges.length,
      activeWaterAlertCount: alerts.length,
      sewerOverflowCount30d: sewerOverflows.length,
      sewerOverflowGallons30d: sewerOverflows.reduce((sum, event) => sum + (event.amountGallons ?? 0), 0),
      generalPermitCount: permits.length,
      waterDistrictCount: governance.filter((entity) => entity.sourceId === "tceq-water-districts").length,
      waterUtilityCount: governance.filter((entity) => entity.sourceId !== "tceq-water-districts").length,
    },
    overlays: {
      hasFloodplainLayer: false,
      hasGaugeLayer: gauges.length > 0,
      hasAlertLayer: alerts.length > 0,
      hasSewerOverflowLayer: sewerOverflows.length > 0,
    },
    annotations: [],
  };
}

export function createAtlasWaterSummaryService({
  fetchAlerts = fetchTexasWaterAlerts,
  fetchGauges = fetchTexasStreamGauges,
  fetchSewerOverflows = () => fetchRecentSewerOverflows(30),
  fetchPermits = fetchGeneralWaterPermits,
  fetchGovernance = fetchWaterGovernance,
}: CreateAtlasWaterSummaryServiceOptions = {}): AtlasWaterSummaryService {
  return {
    async getWaterOverview() {
      const [alerts, gauges, sewerOverflows, permits, governance] = await Promise.all([
        fetchAlerts(),
        fetchGauges(),
        fetchSewerOverflows(),
        fetchPermits(),
        fetchGovernance(),
      ]);
      const countyNames = new Set<string>();
      alerts.forEach((alert) => (alert.countyNames ?? []).forEach((county) => countyNames.add(county)));
      gauges.forEach((gauge) => gauge.countyName && countyNames.add(gauge.countyName));
      sewerOverflows.forEach((event) => event.countyName && countyNames.add(event.countyName));
      permits.forEach((record) => record.countyName && countyNames.add(record.countyName));
      governance.forEach((record) => record.countyName && countyNames.add(record.countyName));

      const counties = Array.from(countyNames)
        .sort((a, b) => a.localeCompare(b))
        .map((countyName) => {
          const countyPermits = permits.filter((record) => countySlug(record.countyName ?? "") === countySlug(countyName));
          const countyGovernance = governance.filter((record) => countySlug(record.countyName ?? "") === countySlug(countyName));
          return buildSummary(
            countyName,
            filterAlertsForCounty(alerts, countyName),
            filterGaugesForCounty(gauges, countyName),
            sewerOverflows.filter((event) => countySlug(event.countyName ?? "") === countySlug(countyName)),
            countyPermits,
            countyGovernance,
          );
        });

      return {
        generatedAt: new Date().toISOString(),
        sourceIds: listWaterSources().map((source) => source.sourceId),
        counties,
      };
    },

    async getCountyWaterBreakdown(county) {
      const [alerts, gauges, sewerOverflows, permits, governance] = await Promise.all([
        fetchAlerts(),
        fetchGauges(),
        fetchSewerOverflows(),
        fetchPermits(),
        fetchGovernance(),
      ]);
      const filteredAlerts = filterAlertsForCounty(alerts, county);
      const filteredGauges = filterGaugesForCounty(gauges, county);
      const filteredOverflows = sewerOverflows.filter((event) => countySlug(event.countyName ?? "") === countySlug(county));
      const filteredPermits = permits.filter((record) => countySlug(record.countyName ?? "") === countySlug(county));
      const filteredGovernance = governance.filter((record) => countySlug(record.countyName ?? "") === countySlug(county));
      const countyName = filteredAlerts[0]?.countyNames?.[0] ?? filteredGauges[0]?.countyName ?? filteredOverflows[0]?.countyName ?? filteredPermits[0]?.countyName ?? filteredGovernance[0]?.countyName;
      if (!countyName) {
        throw new Error(`County not found: ${county}`);
      }
      return {
        county: buildSummary(countyName, filteredAlerts, filteredGauges, filteredOverflows, filteredPermits, filteredGovernance),
        layers: {
          alerts: filteredAlerts,
          gauges: filteredGauges,
          sewerOverflows: filteredOverflows,
          permits: filteredPermits,
          governance: filteredGovernance,
        },
        notes: [],
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
