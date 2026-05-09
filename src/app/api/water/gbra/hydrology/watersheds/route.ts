import { buildWaterFreshness } from "@/lib/water/freshness";
import { fetchGbraHydrologyWatersheds, filterGbraHydrologyWatershedsByName } from "@/lib/water/gbra-hydrology";

const SOURCE_ID = "gbra-hydrology-watersheds";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  const watersheds = await fetchGbraHydrologyWatersheds();
  const filtered = name ? filterGbraHydrologyWatershedsByName(watersheds, name) : watersheds;

  return Response.json({
    sourceId: SOURCE_ID,
    featureCount: filtered.length,
    watersheds: filtered,
    freshness: buildWaterFreshness([SOURCE_ID]),
  });
}
