import { countySlug, normalizeCountyName } from "@/lib/counties";
import { listRecent } from "@/lib/observations/persistence";
import { fetchGeneralWaterPermits } from "@/lib/water/tceq-general-permits";
import { fetchRecentSewerOverflows } from "@/lib/water/tceq-sewer-overflows";
import { fetchTexasWaterAlerts } from "@/lib/water/nws";
import { fetchWaterGovernance } from "@/lib/water/water-governance";
import type { ObservationRow } from "@/lib/observations/types";
import type { SewerOverflowEvent, WaterAlert, WaterGovernanceEntity, WaterPermitRecord } from "@/lib/water/types";

export type WaterSourceDescriptor = {
  sourceType: "district" | "utility" | "permittee";
  name: string;
  countyName: string;
  metadata?: Record<string, string | number | null>;
};

export type WaterSourceTimelinePoint = {
  month: string;
  alertCount: number;
  sewerOverflowCount: number;
  permitCount: number;
  communitySampleCount: number;
};

export type CountyWaterSourceProfile = {
  county: { slug: string; name: string };
  generatedAt: string;
  sourceDescriptors: WaterSourceDescriptor[];
  openDataSummary: {
    activeWaterUtilities: number;
    activeWaterDistricts: number;
    trackedPermitSites: number;
  };
  timeline: WaterSourceTimelinePoint[];
  communitySamples: Array<{
    id: string;
    createdAt: string;
    status: string;
    stripBrand: string | null;
  }>;
};

export type CreateCountyWaterSourceProfileServiceOptions = {
  fetchGovernance?: () => Promise<WaterGovernanceEntity[]>;
  fetchPermits?: () => Promise<WaterPermitRecord[]>;
  fetchAlerts?: () => Promise<WaterAlert[]>;
  fetchSewerOverflows?: () => Promise<SewerOverflowEvent[]>;
  fetchCommunityObservations?: (limit?: number) => Promise<readonly ObservationRow[]>;
};

function monthKey(dateIso: string): string {
  return dateIso.slice(0, 7);
}

function upsertMonth(map: Map<string, WaterSourceTimelinePoint>, month: string): WaterSourceTimelinePoint {
  const existing = map.get(month);
  if (existing) return existing;
  const created: WaterSourceTimelinePoint = {
    month,
    alertCount: 0,
    sewerOverflowCount: 0,
    permitCount: 0,
    communitySampleCount: 0,
  };
  map.set(month, created);
  return created;
}

function matchesCounty(nameOrSlug: string | null | undefined, targetSlug: string): boolean {
  if (!nameOrSlug) return false;
  return countySlug(nameOrSlug) === targetSlug;
}

function descriptorFromGovernance(entity: WaterGovernanceEntity): WaterSourceDescriptor {
  return {
    sourceType: entity.sourceId === "tceq-water-districts" ? "district" : "utility",
    name: entity.entityName,
    countyName: normalizeCountyName(entity.countyName ?? "Unknown County"),
    metadata: {
      entityType: entity.entityType ?? null,
      city: entity.city ?? null,
      sourceId: entity.sourceId,
    },
  };
}

function descriptorFromPermit(record: WaterPermitRecord): WaterSourceDescriptor {
  return {
    sourceType: "permittee",
    name: record.siteName ?? record.permitNumber,
    countyName: normalizeCountyName(record.countyName ?? "Unknown County"),
    metadata: {
      permitNumber: record.permitNumber,
      permitType: record.permitType ?? null,
      permitStatus: record.permitStatus ?? null,
    },
  };
}

export function createCountyWaterSourceProfileService({
  fetchGovernance = fetchWaterGovernance,
  fetchPermits = fetchGeneralWaterPermits,
  fetchAlerts = fetchTexasWaterAlerts,
  fetchSewerOverflows = () => fetchRecentSewerOverflows(180),
  fetchCommunityObservations = (limit = 300) => listRecent(limit),
}: CreateCountyWaterSourceProfileServiceOptions = {}) {
  return {
    async getCountyProfile(county: string): Promise<CountyWaterSourceProfile> {
      const targetCountyName = normalizeCountyName(county.replace(/-/g, " "));
      const targetSlug = countySlug(targetCountyName);
      const [governance, permits, alerts, overflows, observations] = await Promise.all([
        fetchGovernance(),
        fetchPermits(),
        fetchAlerts(),
        fetchSewerOverflows(),
        fetchCommunityObservations(300),
      ]);

      const countyGovernance = governance.filter((entity) => matchesCounty(entity.countyName, targetSlug));
      const countyPermits = permits.filter((record) => matchesCounty(record.countyName, targetSlug));
      const countyObservations = observations.filter((row) => matchesCounty(row.countySlug, targetSlug));
      const countyAlerts = alerts.filter((alert) => (alert.countyNames ?? []).some((name) => matchesCounty(name, targetSlug)));
      const countyOverflows = overflows.filter((event) => matchesCounty(event.countyName, targetSlug));

      const sourceDescriptors = [
        ...countyGovernance.map(descriptorFromGovernance),
        ...countyPermits.slice(0, 50).map(descriptorFromPermit),
      ];

      const monthMap = new Map<string, WaterSourceTimelinePoint>();

      countyObservations.forEach((row) => {
        const point = upsertMonth(monthMap, monthKey(row.createdAt.toISOString()));
        point.communitySampleCount += 1;
      });

      countyOverflows.forEach((row) => {
        if (!row.startDate) return;
        const point = upsertMonth(monthMap, monthKey(row.startDate));
        point.sewerOverflowCount += 1;
      });

      countyPermits.forEach((row) => {
        const dateCandidate =
          typeof row.raw?.effective_date === "string"
            ? row.raw.effective_date
            : typeof row.raw?.iss_dt === "string"
              ? row.raw.iss_dt
              : null;
        if (!dateCandidate) return;
        const point = upsertMonth(monthMap, monthKey(dateCandidate));
        point.permitCount += 1;
      });

      countyAlerts.forEach((row) => {
        if (!row.sentAt) return;
        const point = upsertMonth(monthMap, monthKey(row.sentAt));
        point.alertCount += 1;
      });

      const timeline = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

      const countyName =
        countyGovernance[0]?.countyName ??
        countyPermits[0]?.countyName ??
        countyOverflows[0]?.countyName ??
        normalizeCountyName(county);

      return {
        county: { slug: targetSlug, name: countyName },
        generatedAt: new Date().toISOString(),
        sourceDescriptors,
        openDataSummary: {
          activeWaterUtilities: countyGovernance.filter((entity) => entity.sourceId !== "tceq-water-districts").length,
          activeWaterDistricts: countyGovernance.filter((entity) => entity.sourceId === "tceq-water-districts").length,
          trackedPermitSites: countyPermits.length,
        },
        timeline,
        communitySamples: countyObservations.slice(0, 50).map((row) => ({
          id: row.id,
          createdAt: row.createdAt.toISOString(),
          status: row.status,
          stripBrand: row.stripBrand,
        })),
      };
    },
  };
}

let defaultWaterSourceProfileService: ReturnType<typeof createCountyWaterSourceProfileService> | undefined;

export function getDefaultCountyWaterSourceProfileService() {
  if (!defaultWaterSourceProfileService) {
    defaultWaterSourceProfileService = createCountyWaterSourceProfileService();
  }
  return defaultWaterSourceProfileService;
}
