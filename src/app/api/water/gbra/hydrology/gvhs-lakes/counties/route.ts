import { buildWaterFreshness } from "@/lib/water/freshness";
import { fetchGbraHydrologyLakeCountyCoverage, filterGbraHydrologyLakeCountyCoverageByName } from "@/lib/water/gbra-hydrology";

const SOURCE_ID = "gbra-hydrology-gvhs-lakes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  const coverage = await fetchGbraHydrologyLakeCountyCoverage();
  const filtered = name ? filterGbraHydrologyLakeCountyCoverageByName(coverage, name) : coverage;

  return Response.json({
    sourceId: SOURCE_ID,
    featureCount: filtered.length,
    coverage: filtered,
    freshness: buildWaterFreshness([SOURCE_ID]),
  });
}
