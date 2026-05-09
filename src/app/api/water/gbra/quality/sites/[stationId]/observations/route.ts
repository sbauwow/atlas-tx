import { buildWaterFreshness } from "@/lib/water/freshness";
import { fetchGbraWaterQualityObservations, fetchGbraWaterQualitySite } from "@/lib/water/gbra-hydrology";

const SITE_SOURCE_ID = "gbra-water-quality-sites";
const OBS_SOURCE_ID = "gbra-water-quality-observations";

type RouteContext = {
  params: Promise<{ stationId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { stationId } = await context.params;
  const site = await fetchGbraWaterQualitySite(stationId);

  if (!site?.currentCsvUrl) {
    return Response.json({ error: `No current GBRA CSV observations found for station ${stationId}` }, { status: 404 });
  }

  const observations = await fetchGbraWaterQualityObservations(stationId, site.currentCsvUrl);

  return Response.json({
    sourceId: OBS_SOURCE_ID,
    site,
    observationCount: observations.length,
    observations,
    freshness: buildWaterFreshness([SITE_SOURCE_ID, OBS_SOURCE_ID]),
  });
}
