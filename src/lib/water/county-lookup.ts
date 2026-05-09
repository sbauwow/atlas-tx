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

export function listCountyRefs(): CountyRef[] {
  return COUNTY_REFS;
}

export function getAdjacentCountyRefs(input: string): { previous: CountyRef | null; next: CountyRef | null } {
  const slug = countySlug(input);
  const index = COUNTY_REFS.findIndex((county) => county.slug === slug);
  if (index === -1) {
    return { previous: null, next: null };
  }
  return {
    previous: COUNTY_REFS[index - 1] ?? null,
    next: COUNTY_REFS[index + 1] ?? null,
  };
}

export function getCountyBySlugOrName(input: string): CountyRef | undefined {
  const slug = countySlug(input);
  return COUNTY_BY_SLUG.get(slug);
}

export function getCountyByFips(fips: string): CountyRef | undefined {
  return COUNTY_BY_FIPS.get(fips);
}

export function getNearestCountyForPoint(latitude: number, longitude: number): CountyRef | undefined {
  let bestCounty: CountyRef | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const county of COUNTY_REFS) {
    const centroid = TEXAS_COUNTY_CENTROIDS[county.slug];
    const distance = ((centroid.lat - latitude) ** 2) + ((centroid.lon - longitude) ** 2);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCounty = county;
    }
  }

  return bestCounty;
}
