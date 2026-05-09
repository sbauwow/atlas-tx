import countiesAtlas from "us-atlas/counties-albers-10m.json";
import { geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";

import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";
import type { PendingPermitCountyMapRow } from "@/lib/tceq-permits";

type CountyFeature = Feature<Geometry, { name?: string }> & { id?: string | number };

const countyAtlas = countiesAtlas as unknown as Topology<{ counties: GeometryCollection }>;
const countyCollection = feature(countyAtlas, countyAtlas.objects.counties) as FeatureCollection<Geometry, { name?: string }>;
const texasCountyFeatures = countyCollection.features.filter((item) => String(item.id ?? "").startsWith("48")) as CountyFeature[];
const texasCountyBorders = mesh(
  countyAtlas,
  countyAtlas.objects.counties,
  (left, right) => String(left?.id ?? "").startsWith("48") && String(right?.id ?? "").startsWith("48") && left !== right,
);
const texasCountyOutline = mesh(
  countyAtlas,
  countyAtlas.objects.counties,
  (left, right) => String(left?.id ?? "").startsWith("48") && (!right || !String(right.id ?? "").startsWith("48")),
);
const pathGenerator = geoPath();
const texasBounds = pathGenerator.bounds({ type: "FeatureCollection", features: texasCountyFeatures });
const VIEWBOX_PADDING = 12;
const viewBox = [
  texasBounds[0][0] - VIEWBOX_PADDING,
  texasBounds[0][1] - VIEWBOX_PADDING,
  texasBounds[1][0] - texasBounds[0][0] + VIEWBOX_PADDING * 2,
  texasBounds[1][1] - texasBounds[0][1] + VIEWBOX_PADDING * 2,
].join(" ");
const texasCountyByFips = new Map(texasCountyFeatures.map((item) => [String(item.id ?? ""), item]));
const texasCountyFipsBySlug = Object.fromEntries(
  Object.entries(TEXAS_COUNTY_CENTROIDS).flatMap(([slug, centroid]) => (centroid.fips ? [[slug, centroid.fips]] : [])),
);

function permitMapFill(permitCount: number) {
  if (permitCount >= 3) return "#d946ef";
  if (permitCount === 2) return "#22d3ee";
  return "#34d399";
}

export function TexasCountyChoropleth({ rows }: { rows: PendingPermitCountyMapRow[] }) {
  const highlightedCounties = rows
    .map((row) => {
      const fips = texasCountyFipsBySlug[row.slug];
      const countyFeature = fips ? texasCountyByFips.get(fips) : null;
      const path = countyFeature ? pathGenerator(countyFeature) : null;
      if (!countyFeature || !path) return null;
      return { row, countyFeature, path };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <svg viewBox={viewBox} className="h-[420px] w-full" role="img" aria-label="Texas county permit pressure map">
      <defs>
        <radialGradient id="permitMapBackdrop" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
        <pattern id="cidHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(248,250,252,0.85)" strokeWidth="2" />
        </pattern>
      </defs>
      <rect x={texasBounds[0][0] - VIEWBOX_PADDING} y={texasBounds[0][1] - VIEWBOX_PADDING} width={texasBounds[1][0] - texasBounds[0][0] + VIEWBOX_PADDING * 2} height={texasBounds[1][1] - texasBounds[0][1] + VIEWBOX_PADDING * 2} fill="url(#permitMapBackdrop)" />
      <g aria-hidden="true">
        {texasCountyFeatures.map((county) => {
          const path = pathGenerator(county);
          if (!path) return null;
          return <path key={`base-${String(county.id ?? county.properties?.name ?? "county")}`} d={path} fill="rgba(51,65,85,0.72)" stroke="rgba(148,163,184,0.15)" strokeWidth={0.35} />;
        })}
      </g>
      {highlightedCounties.map(({ row, path }) => (
        <g key={row.slug} data-county-map-path={row.slug}>
          <path d={path} fill={permitMapFill(row.permitCount)} stroke={row.hasProceduralPressure ? "#f8fafc" : "rgba(15,23,42,0.95)"} strokeWidth={row.hasProceduralPressure ? 1.4 : 0.75} />
          {row.cidCaseCount > 0 ? <path d={path} fill="url(#cidHatch)" opacity={0.8} /> : null}
          <title>{`${row.county}: ${row.permitCount} pending permit${row.permitCount === 1 ? "" : "s"}, ${row.cidCaseCount} CID case${row.cidCaseCount === 1 ? "" : "s"}`}</title>
        </g>
      ))}
      {pathGenerator(texasCountyBorders) ? <path d={pathGenerator(texasCountyBorders) ?? undefined} fill="none" stroke="rgba(226,232,240,0.2)" strokeWidth={0.28} /> : null}
      {pathGenerator(texasCountyOutline) ? <path d={pathGenerator(texasCountyOutline) ?? undefined} fill="none" stroke="rgba(248,250,252,0.55)" strokeWidth={0.9} /> : null}
    </svg>
  );
}
