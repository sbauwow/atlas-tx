import { buildWaterFreshness } from "@/lib/water/freshness";
import { fetchGbraWaterQualitySite } from "@/lib/water/gbra-hydrology";

const SOURCE_ID = "gbra-water-quality-sites";

type RouteContext = {
  params: Promise<{ stationId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { stationId } = await context.params;
  const site = await fetchGbraWaterQualitySite(stationId);

  if (!site) {
    return Response.json({ error: `GBRA water quality site not found: ${stationId}` }, { status: 404 });
  }

  return Response.json({
    sourceId: SOURCE_ID,
    site,
    freshness: buildWaterFreshness([SOURCE_ID]),
  });
}
