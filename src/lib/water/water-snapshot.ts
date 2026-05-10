import { promises as fs } from "node:fs";
import path from "node:path";

import type { NfhlCountyCoverageResponse } from "@/lib/water/fema-nfhl";
import type {
  LcraArrpLandPermit,
  LcraArrpOutfall,
  LcraWaterQualityObservation,
  LcraWaterQualityParameter,
  LcraWaterQualitySite,
  SewerOverflowEvent,
  StreamGauge,
  WaterAlert,
  WaterGovernanceEntity,
  WaterPermitRecord,
} from "@/lib/water/types";

export type WaterOverviewSnapshot = {
  generatedAt: string;
  alerts?: WaterAlert[];
  gauges?: StreamGauge[];
  sewerOverflows?: SewerOverflowEvent[];
  permits?: WaterPermitRecord[];
  governance?: WaterGovernanceEntity[];
  floodplainCoverage?: NfhlCountyCoverageResponse;
  lcraArrpOutfalls?: LcraArrpOutfall[];
  lcraArrpLandPermits?: LcraArrpLandPermit[];
  lcraWaterQualitySites?: LcraWaterQualitySite[];
  lcraSiteParameters?: Record<string, LcraWaterQualityParameter[]>;
  lcraSiteObservations?: Record<string, LcraWaterQualityObservation[]>;
};

export const WATER_OVERVIEW_SNAPSHOT_REL_PATH = "public/cache/water-overview-tx.json";

function snapshotPath(): string {
  return path.resolve(process.cwd(), WATER_OVERVIEW_SNAPSHOT_REL_PATH);
}

export async function tryLoadWaterOverviewSnapshot(): Promise<WaterOverviewSnapshot | null> {
  try {
    const raw = await fs.readFile(snapshotPath(), "utf8");
    return JSON.parse(raw) as WaterOverviewSnapshot;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function writeWaterOverviewSnapshot(snapshot: WaterOverviewSnapshot): Promise<void> {
  await fs.mkdir(path.dirname(snapshotPath()), { recursive: true });
  await fs.writeFile(snapshotPath(), JSON.stringify(snapshot));
}

let memoizedSnapshotPromise: Promise<WaterOverviewSnapshot | null> | undefined;

export function getWaterOverviewSnapshotPromise(): Promise<WaterOverviewSnapshot | null> {
  if (!memoizedSnapshotPromise) memoizedSnapshotPromise = tryLoadWaterOverviewSnapshot();
  return memoizedSnapshotPromise;
}

export function resetWaterOverviewSnapshotMemo(): void {
  memoizedSnapshotPromise = undefined;
}
