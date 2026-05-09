import { countySlug, normalizeCountyName } from "@/lib/counties";
import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";

export type CountyRef = { name: string; slug: string; fips?: string };

const COUNTY_REFS: CountyRef[] = Object.entries(TEXAS_COUNTY_CENTROIDS).map(([slug, centroid]) => ({
  slug,
  fips: centroid.fips,
  name: normalizeCountyName(slug),
}));

const COUNTY_BY_SLUG = new Map(COUNTY_REFS.map((county) => [county.slug, county]));
const COUNTY_BY_FIPS = new Map(COUNTY_REFS.flatMap((county) => county.fips ? [[county.fips, county] as const] : []));

export function getCountyBySlugOrName(input: string): CountyRef | undefined {
  const slug = countySlug(input);
  return COUNTY_BY_SLUG.get(slug);
}

export function getCountyByFips(fips: string): CountyRef | undefined {
  return COUNTY_BY_FIPS.get(fips);
}
