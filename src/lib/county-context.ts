import { countySlug, normalizeCountyName } from "@/lib/counties";
import { loadAcsCountyPopulationFromSnapshot } from "@/lib/datasets/acs";
import { loadSdwisSnapshot, type SdwisRow } from "@/lib/datasets/sdwis";
import { loadSurfaceWaterQualityFromSnapshot, type SurfaceWaterQualityRow } from "@/lib/datasets/surface-water-quality";
import { loadTwdbHydrologyFromSnapshot, type TwdbHydrologyRow } from "@/lib/datasets/twdb-hydrology";
import { TEXAS_COUNTY_CENTROIDS, type CountyCentroid } from "@/lib/texas-county-centroids";

export type CountyContextSurfaceWaterSummary = {
  totalSegments: number;
  impairedSegments: number;
  basins: string[];
  topImpairedSegments: Array<{ segmentId: string | null; segmentName: string | null; basin: string | null; flags: string[] }>;
};

export type CountyContextHydrologyEntry = {
  layerName: string;
  primaryCode: string | null;
  name: string | null;
  basin: string | null;
  region: string | null;
};

export type CountyContextHydrologySummary = {
  features: CountyContextHydrologyEntry[];
  layerCounts: Record<string, number>;
};

export type CountyContextDrinkingWaterSummary = {
  violationCount: number;
  pwsCount: number;
  populationExposed: number;
  topViolatingPws: { pwsName: string; populationServed: number; violationCount: number } | null;
  topContaminantCode: string | null;
  acsCountyPopulation: number | null;
  populationExposureRate: number | null;
};

export type CountyContextPublicNoticeSummary = {
  microbialViolations: number;
  tier1ViolationCount: number;
  microbialPwsImpacted: number;
  latestMicrobialViolation: string | null;
  topMicrobialPws: { pwsName: string; violationCount: number } | null;
};

export type CountyContextSnapshot = {
  countySlug: string;
  surfaceWater: CountyContextSurfaceWaterSummary;
  hydrology: CountyContextHydrologySummary;
  drinkingWater: CountyContextDrinkingWaterSummary;
  publicNotices: CountyContextPublicNoticeSummary;
};

const IMPAIRMENT_LABELS: Record<keyof SurfaceWaterQualityRow["impairmentFlags"], string> = {
  aquaticLife: "aquatic life",
  contactRecreation: "contact recreation",
  generalUse: "general use",
  fishConsumption: "fish consumption",
  publicWaterSupply: "public water supply",
  oysterWaters: "oyster waters",
};

function impairmentFlagList(flags: SurfaceWaterQualityRow["impairmentFlags"]): string[] {
  const result: string[] = [];
  for (const key of Object.keys(IMPAIRMENT_LABELS) as Array<keyof typeof IMPAIRMENT_LABELS>) {
    if (flags[key]) result.push(IMPAIRMENT_LABELS[key]);
  }
  return result;
}

export async function loadCountyContext(rawSlug: string): Promise<CountyContextSnapshot> {
  const slug = countySlug(rawSlug);
  const [swqRows, hydrologyRows, sdwis, acsByCounty] = await Promise.all([
    loadSurfaceWaterQualityFromSnapshot(),
    loadTwdbHydrologyFromSnapshot(),
    loadSdwisSnapshot(),
    loadAcsCountyPopulationFromSnapshot().catch(() => ({}) as Record<string, number>),
  ]);

  const swqMatches = swqRows.filter((row) => row.countyName && countySlug(row.countyName) === slug);
  const basins = new Set<string>();
  let impairedSegments = 0;
  const impairedDetails: CountyContextSurfaceWaterSummary["topImpairedSegments"] = [];
  for (const row of swqMatches) {
    if (row.basinName) basins.add(row.basinName);
    if (row.isImpaired) {
      impairedSegments += 1;
      if (impairedDetails.length < 6) {
        impairedDetails.push({
          segmentId: row.segmentId,
          segmentName: row.segmentName,
          basin: row.basinName,
          flags: impairmentFlagList(row.impairmentFlags),
        });
      }
    }
  }

  const centroid: CountyCentroid | undefined = TEXAS_COUNTY_CENTROIDS[slug];
  const hydrologyMatches: TwdbHydrologyRow[] = centroid
    ? hydrologyRows.filter((row) =>
        centroid.lon >= row.bbox[0] &&
        centroid.lat >= row.bbox[1] &&
        centroid.lon <= row.bbox[2] &&
        centroid.lat <= row.bbox[3],
      )
    : [];

  const layerCounts: Record<string, number> = {};
  const featuresByCode = new Map<string, CountyContextHydrologyEntry>();
  for (const row of hydrologyMatches) {
    layerCounts[row.layerName] = (layerCounts[row.layerName] ?? 0) + 1;
    const code = row.primaryCode ?? `${row.layerName}::${row.name ?? "feature"}`;
    if (!featuresByCode.has(code)) {
      featuresByCode.set(code, {
        layerName: row.layerName,
        primaryCode: row.primaryCode ?? null,
        name: row.name ?? null,
        basin: row.basin ?? null,
        region: row.region ?? null,
      });
    }
  }

  const sdwisMatches: SdwisRow[] = sdwis.rows.filter((row) => row.county && countySlug(row.county) === slug);
  const pwsTotals = new Map<string, { pwsName: string; populationServed: number; violationCount: number }>();
  const contaminantCounts = new Map<string, number>();
  let tier1ViolationCount = 0;
  let microbialViolations = 0;
  let latestMicrobialViolation: string | null = null;
  const microbialPwsCounts = new Map<string, { pwsName: string; violationCount: number }>();
  for (const row of sdwisMatches) {
    const key = row.pwsid;
    const tracker = pwsTotals.get(key);
    if (tracker) {
      tracker.violationCount += 1;
    } else {
      pwsTotals.set(key, {
        pwsName: row.pwsName ?? row.pwsid,
        populationServed: row.populationServed ?? 0,
        violationCount: 1,
      });
    }
    if (row.contaminantCode) {
      contaminantCounts.set(row.contaminantCode, (contaminantCounts.get(row.contaminantCode) ?? 0) + 1);
    }
    if (row.publicNotificationTier === 1) tier1ViolationCount += 1;
    if (row.ruleGroupCode === "100") {
      microbialViolations += 1;
      const microbialKey = row.pwsid;
      const m = microbialPwsCounts.get(microbialKey);
      if (m) {
        m.violationCount += 1;
      } else {
        microbialPwsCounts.set(microbialKey, { pwsName: row.pwsName ?? row.pwsid, violationCount: 1 });
      }
      const dt = row.complPerBeginDate ?? null;
      if (dt && (!latestMicrobialViolation || dt > latestMicrobialViolation)) {
        latestMicrobialViolation = dt;
      }
    }
  }
  let topMicrobialPws: CountyContextPublicNoticeSummary["topMicrobialPws"] = null;
  for (const tracker of microbialPwsCounts.values()) {
    if (!topMicrobialPws || tracker.violationCount > topMicrobialPws.violationCount) {
      topMicrobialPws = { ...tracker };
    }
  }
  let topViolatingPws: CountyContextDrinkingWaterSummary["topViolatingPws"] = null;
  for (const tracker of pwsTotals.values()) {
    if (!topViolatingPws || tracker.violationCount > topViolatingPws.violationCount) {
      topViolatingPws = { ...tracker };
    }
  }
  const populationExposed = [...pwsTotals.values()].reduce((sum, tracker) => sum + tracker.populationServed, 0);
  let topContaminantCode: string | null = null;
  let topContaminantHits = 0;
  for (const [code, hits] of contaminantCounts.entries()) {
    if (hits > topContaminantHits) {
      topContaminantHits = hits;
      topContaminantCode = code;
    }
  }

  const countyNameForAcs = normalizeCountyName(slug.replace(/-/g, " ") + " county");
  const acsCountyPopulation = acsByCounty[countyNameForAcs] ?? null;
  const populationExposureRate = acsCountyPopulation && acsCountyPopulation > 0
    ? Math.min(1, populationExposed / acsCountyPopulation)
    : null;

  return {
    countySlug: slug,
    surfaceWater: {
      totalSegments: swqMatches.length,
      impairedSegments,
      basins: [...basins].sort(),
      topImpairedSegments: impairedDetails,
    },
    hydrology: {
      features: [...featuresByCode.values()].slice(0, 8),
      layerCounts,
    },
    drinkingWater: {
      violationCount: sdwisMatches.length,
      pwsCount: pwsTotals.size,
      populationExposed,
      topViolatingPws,
      topContaminantCode,
      acsCountyPopulation,
      populationExposureRate,
    },
    publicNotices: {
      microbialViolations,
      tier1ViolationCount,
      microbialPwsImpacted: microbialPwsCounts.size,
      latestMicrobialViolation,
      topMicrobialPws,
    },
  };
}
