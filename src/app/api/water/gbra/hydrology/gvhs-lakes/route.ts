import { buildWaterFreshness } from "@/lib/water/freshness";
import { fetchGbraHydrologyLakes, filterGbraHydrologyLakesByName } from "@/lib/water/gbra-hydrology";

const SOURCE_ID = "gbra-hydrology-gvhs-lakes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  const lakes = await fetchGbraHydrologyLakes();
  const filtered = name ? filterGbraHydrologyLakesByName(lakes, name) : lakes;

  return Response.json({
    sourceId: SOURCE_ID,
    featureCount: filtered.length,
    lakes: filtered,
    freshness: buildWaterFreshness([SOURCE_ID]),
  });
}
