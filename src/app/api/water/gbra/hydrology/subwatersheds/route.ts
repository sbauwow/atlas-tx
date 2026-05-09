import { buildWaterFreshness } from "@/lib/water/freshness";
import { fetchGbraHydrologySubwatersheds, filterGbraHydrologySubwatershedsByName } from "@/lib/water/gbra-hydrology";

const SOURCE_ID = "gbra-hydrology-subwatersheds";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  const subwatersheds = await fetchGbraHydrologySubwatersheds();
  const filtered = name ? filterGbraHydrologySubwatershedsByName(subwatersheds, name) : subwatersheds;

  return Response.json({
    sourceId: SOURCE_ID,
    featureCount: filtered.length,
    subwatersheds: filtered,
    freshness: buildWaterFreshness([SOURCE_ID]),
  });
}
