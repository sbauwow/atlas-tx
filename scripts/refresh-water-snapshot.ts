import { fetchTexasNfhlCountyCoverage } from "../src/lib/water/fema-nfhl";
import { fetchLcraArrpLandPermits, fetchLcraArrpOutfalls } from "../src/lib/water/lcra-arrp";
import {
  fetchLcraWaterQualitySiteObservations,
  fetchLcraWaterQualitySiteParameters,
  fetchLcraWaterQualitySites,
} from "../src/lib/water/lcra-water-quality";
import { fetchTexasWaterAlerts } from "../src/lib/water/nws";
import { fetchGeneralWaterPermits } from "../src/lib/water/tceq-general-permits";
import { fetchRecentSewerOverflows } from "../src/lib/water/tceq-sewer-overflows";
import { fetchTexasStreamGauges } from "../src/lib/water/usgs";
import { fetchWaterGovernance } from "../src/lib/water/water-governance";
import {
  WATER_OVERVIEW_SNAPSHOT_REL_PATH,
  writeWaterOverviewSnapshot,
  type WaterOverviewSnapshot,
} from "../src/lib/water/water-snapshot";

function isLcraManagedAgency(agency: string | null | undefined): boolean {
  return (agency ?? "").trim().toUpperCase() === "LCRA";
}

async function tryFetch<T>(label: string, loader: () => Promise<T>): Promise<T | undefined> {
  try {
    const value = await loader();
    return value;
  } catch (error) {
    console.warn(`[refresh-water-snapshot] ${label} failed — omitting from snapshot. ${(error as Error).message}`);
    return undefined;
  }
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  console.log("[refresh-water-snapshot] Fetching base sources...");

  const [
    alerts,
    gauges,
    sewerOverflows,
    permits,
    governance,
    floodplainCoverage,
    lcraArrpOutfalls,
    lcraArrpLandPermits,
    lcraWaterQualitySites,
  ] = await Promise.all([
    tryFetch("alerts", () => fetchTexasWaterAlerts()),
    tryFetch("gauges", () => fetchTexasStreamGauges()),
    tryFetch("sewerOverflows", () => fetchRecentSewerOverflows(30)),
    tryFetch("permits", () => fetchGeneralWaterPermits()),
    tryFetch("governance", () => fetchWaterGovernance()),
    tryFetch("floodplainCoverage", () => fetchTexasNfhlCountyCoverage()),
    tryFetch("lcraArrpOutfalls", () => fetchLcraArrpOutfalls()),
    tryFetch("lcraArrpLandPermits", () => fetchLcraArrpLandPermits()),
    tryFetch("lcraWaterQualitySites", () => fetchLcraWaterQualitySites()),
  ]);

  console.log(
    `[refresh-water-snapshot] Base sources · alerts=${alerts?.length ?? "—"} gauges=${gauges?.length ?? "—"} overflows=${sewerOverflows?.length ?? "—"} permits=${permits?.length ?? "—"} governance=${governance?.length ?? "—"} nfhl-counties=${floodplainCoverage?.counties.length ?? "—"} lcra-outfalls=${lcraArrpOutfalls?.length ?? "—"} lcra-land-permits=${lcraArrpLandPermits?.length ?? "—"} lcra-quality-sites=${lcraWaterQualitySites?.length ?? "—"}`,
  );

  let lcraSiteParameters: WaterOverviewSnapshot["lcraSiteParameters"];
  let lcraSiteObservations: WaterOverviewSnapshot["lcraSiteObservations"];

  if (lcraWaterQualitySites?.length) {
    const lcraManagedSites = lcraWaterQualitySites.filter((site) => isLcraManagedAgency(site.agency));
    console.log(
      `[refresh-water-snapshot] Fetching params + observations for ${lcraManagedSites.length} LCRA-managed sites...`,
    );

    const params: NonNullable<WaterOverviewSnapshot["lcraSiteParameters"]> = {};
    const observations: NonNullable<WaterOverviewSnapshot["lcraSiteObservations"]> = {};

    for (const site of lcraManagedSites) {
      const [siteParams, siteObs] = await Promise.all([
        fetchLcraWaterQualitySiteParameters(site.siteId).catch((error: unknown) => {
          console.warn(`[refresh-water-snapshot] params ${site.siteId} failed:`, (error as Error).message);
          return [];
        }),
        fetchLcraWaterQualitySiteObservations(site.siteId).catch((error: unknown) => {
          console.warn(`[refresh-water-snapshot] obs ${site.siteId} failed:`, (error as Error).message);
          return [];
        }),
      ]);
      params[site.siteId] = siteParams;
      observations[site.siteId] = siteObs;
    }

    lcraSiteParameters = params;
    lcraSiteObservations = observations;
  } else {
    console.log("[refresh-water-snapshot] Skipping per-site LCRA fan-out — no sites available.");
  }

  const snapshot: WaterOverviewSnapshot = {
    generatedAt: new Date().toISOString(),
    alerts,
    gauges,
    sewerOverflows,
    permits,
    governance,
    floodplainCoverage,
    lcraArrpOutfalls,
    lcraArrpLandPermits,
    lcraWaterQualitySites,
    lcraSiteParameters,
    lcraSiteObservations,
  };

  await writeWaterOverviewSnapshot(snapshot);
  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[refresh-water-snapshot] Wrote ${WATER_OVERVIEW_SNAPSHOT_REL_PATH} in ${elapsedSec}s`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
