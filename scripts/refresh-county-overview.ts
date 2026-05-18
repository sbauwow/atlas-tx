import { getDefaultAtlasCountyExplorerService } from "../src/lib/atlas-county-explorer";
import {
  COUNTY_OVERVIEW_SNAPSHOT_REL_PATH,
  writeCountyOverviewSnapshot,
} from "../src/lib/atlas-county-overview-snapshot";

// Regenerates the committed offline fallback the homepage prerender depends on.
// Run where the live Socrata datasets are reachable; commit the result.
async function main() {
  const overview = await getDefaultAtlasCountyExplorerService().getCountyOverview();

  if (overview.counties.length === 0) {
    throw new Error(
      "Refusing to write an empty county-overview snapshot — live sources returned no rows. " +
        "Run this where data.texas.gov is reachable.",
    );
  }

  await writeCountyOverviewSnapshot(overview);
  console.log(
    JSON.stringify(
      {
        snapshotPath: COUNTY_OVERVIEW_SNAPSHOT_REL_PATH,
        countyCount: overview.countyCount,
        sourceIds: overview.sourceIds,
        generatedAt: overview.generatedAt,
      },
      null,
      2,
    ),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
