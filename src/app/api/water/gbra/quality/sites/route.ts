import { buildWaterFreshness } from "@/lib/water/freshness";
import { fetchGbraWaterQualitySites, filterGbraWaterQualitySitesByCounty, filterGbraWaterQualitySitesByName } from "@/lib/water/gbra-hydrology";

const SOURCE_ID = "gbra-water-quality-sites";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const county = searchParams.get("county");

  let sites = await fetchGbraWaterQualitySites();
  if (county) sites = filterGbraWaterQualitySitesByCounty(sites, county);
  if (name) sites = filterGbraWaterQualitySitesByName(sites, name);

  return Response.json({
    sourceId: SOURCE_ID,
    siteCount: sites.length,
    sites,
    freshness: buildWaterFreshness([SOURCE_ID]),
  });
}
