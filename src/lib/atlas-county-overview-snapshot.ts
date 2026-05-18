import { promises as fs } from "node:fs";
import path from "node:path";

import type { CountyOverview } from "@/lib/atlas-county-explorer";

// Committed offline fallback for the statewide county overview. The homepage
// (`/`) is statically generated and assembles this from live Socrata datasets;
// without a cached snapshot a single failed/blocked fetch fails the whole
// `next build` prerender (AGENTS.md §5). Mirrors water-snapshot.ts.
export const COUNTY_OVERVIEW_SNAPSHOT_REL_PATH = "public/cache/county-overview-tx.json";

function snapshotPath(): string {
  return path.resolve(process.cwd(), COUNTY_OVERVIEW_SNAPSHOT_REL_PATH);
}

export async function tryLoadCountyOverviewSnapshot(): Promise<CountyOverview | null> {
  try {
    const raw = await fs.readFile(snapshotPath(), "utf8");
    return JSON.parse(raw) as CountyOverview;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function writeCountyOverviewSnapshot(snapshot: CountyOverview): Promise<void> {
  await fs.mkdir(path.dirname(snapshotPath()), { recursive: true });
  await fs.writeFile(snapshotPath(), JSON.stringify(snapshot));
}

let memoizedSnapshotPromise: Promise<CountyOverview | null> | undefined;

export function getCountyOverviewSnapshotPromise(): Promise<CountyOverview | null> {
  if (!memoizedSnapshotPromise) memoizedSnapshotPromise = tryLoadCountyOverviewSnapshot();
  return memoizedSnapshotPromise;
}

export function resetCountyOverviewSnapshotMemo(): void {
  memoizedSnapshotPromise = undefined;
}
