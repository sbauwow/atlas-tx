import { buildWaterFreshness } from "@/lib/water/freshness";
import { fetchGbraHydrologyMajorRivers, filterGbraHydrologyMajorRiversByName } from "@/lib/water/gbra-hydrology";

const SOURCE_ID = "gbra-hydrology-major-rivers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  const rivers = await fetchGbraHydrologyMajorRivers();
  const filtered = name ? filterGbraHydrologyMajorRiversByName(rivers, name) : rivers;

  return Response.json({
    sourceId: SOURCE_ID,
    featureCount: filtered.length,
    rivers: filtered,
    freshness: buildWaterFreshness([SOURCE_ID]),
  });
}
