import countiesAtlas from "us-atlas/counties-albers-10m.json";
import { geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";

export type CountyMapMetricValue = number | null | undefined;

export type CountyMapRecord = {
  slug: string;
  name: string;
  fips?: string;
  href?: string;
  metrics: Record<string, CountyMapMetricValue>;
  context?: string;
};

export type CountyMetricBucket = {
  label: string;
  fill: string;
  min?: number;
  max?: number;
};

export type CountyMetricMode = {
  id: string;
  label: string;
  description?: string;
  legendTitle?: string;
  valueLabel?: string;
  format?: "integer" | "decimal" | "percent";
  decimals?: number;
  prefix?: string;
  suffix?: string;
  buckets: CountyMetricBucket[];
  noDataLabel?: string;
};

export type CountyMapOverlay = {
  id: string;
  label: string;
  countySlugs: string[];
  description?: string;
  tone?: "outline" | "hatch";
  color?: string;
};

type CountyFeature = Feature<Geometry, { name?: string }> & { id?: string | number };

type CountyChoroplethSvgProps = {
  counties: CountyMapRecord[];
  metricMode: CountyMetricMode;
  overlays?: CountyMapOverlay[];
  selectedCountySlug?: string | null;
  ariaLabel: string;
  className?: string;
  idPrefix?: string;
};

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
const backgroundRect = {
  x: texasBounds[0][0] - VIEWBOX_PADDING,
  y: texasBounds[0][1] - VIEWBOX_PADDING,
  width: texasBounds[1][0] - texasBounds[0][0] + VIEWBOX_PADDING * 2,
  height: texasBounds[1][1] - texasBounds[0][1] + VIEWBOX_PADDING * 2,
};
const texasCountyByFips = new Map(texasCountyFeatures.map((item) => [String(item.id ?? ""), item]));

export function formatCountyMetricValue(mode: CountyMetricMode, value: CountyMapMetricValue) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return mode.noDataLabel ?? "No data";
  }

  const decimals = mode.decimals ?? (mode.format === "integer" ? 0 : mode.format === "percent" ? 1 : 1);
  const numeric =
    mode.format === "percent"
      ? `${value.toFixed(decimals)}%`
      : value.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });

  return `${mode.prefix ?? ""}${numeric}${mode.suffix ?? ""}`;
}

export function bucketForCountyMetric(mode: CountyMetricMode, value: CountyMapMetricValue) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return (
    mode.buckets.find((bucket) => {
      const aboveMin = bucket.min === undefined || value >= bucket.min;
      const belowMax = bucket.max === undefined || value < bucket.max;
      return aboveMin && belowMax;
    }) ?? null
  );
}

export function rankCountiesForMetric(counties: CountyMapRecord[], metricMode: CountyMetricMode) {
  return [...counties]
    .filter((county) => {
      const value = county.metrics[metricMode.id];
      return value !== null && value !== undefined && !Number.isNaN(value);
    })
    .sort((left, right) => (right.metrics[metricMode.id] ?? Number.NEGATIVE_INFINITY) - (left.metrics[metricMode.id] ?? Number.NEGATIVE_INFINITY));
}

export function CountyChoroplethSvg({
  counties,
  metricMode,
  overlays = [],
  selectedCountySlug,
  ariaLabel,
  className,
  idPrefix = "county-map",
}: CountyChoroplethSvgProps) {
  const countiesByFips = new Map<string, CountyMapRecord>();
  for (const county of counties) {
    if (county.fips) {
      countiesByFips.set(county.fips, county);
    }
  }

  const overlayLookups = overlays.map((overlay) => ({
    ...overlay,
    slugSet: new Set(overlay.countySlugs),
  }));

  return (
    <svg viewBox={viewBox} className={className ?? "h-[560px] w-full sm:h-[720px] lg:h-[880px]"} role="img" aria-label={ariaLabel}>
      <defs>
        <radialGradient id={`${idPrefix}-backdrop`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
        {overlayLookups
          .filter((overlay) => overlay.tone === "hatch")
          .map((overlay) => (
            <pattern
              key={`${overlay.id}-pattern`}
              id={`${idPrefix}-pattern-${overlay.id}`}
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(135)"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke={overlay.color ?? "rgba(248,250,252,0.85)"} strokeWidth="2" />
            </pattern>
          ))}
      </defs>
      <rect x={backgroundRect.x} y={backgroundRect.y} width={backgroundRect.width} height={backgroundRect.height} fill={`url(#${idPrefix}-backdrop)`} />
      <g aria-hidden="true">
        {texasCountyFeatures.map((county) => {
          const path = pathGenerator(county);
          if (!path) return null;
          return <path key={`base-${String(county.id ?? county.properties?.name ?? "county")}`} d={path} fill="rgba(51,65,85,0.72)" stroke="rgba(148,163,184,0.15)" strokeWidth={0.35} />;
        })}
      </g>
      {texasCountyFeatures.map((countyFeature) => {
        const fips = String(countyFeature.id ?? "");
        const county = countiesByFips.get(fips);
        const path = pathGenerator(countyFeature);
        if (!county || !path) return null;

        const value = county.metrics[metricMode.id];
        const bucket = bucketForCountyMetric(metricMode, value);
        const overlaysForCounty = overlayLookups.filter((overlay) => overlay.slugSet.has(county.slug));
        const outlineOverlay = overlaysForCounty.find((overlay) => overlay.tone === "outline");
        const strokeColor = county.slug === selectedCountySlug ? "#f8fafc" : outlineOverlay?.color ?? "rgba(15,23,42,0.95)";
        const strokeWidth = county.slug === selectedCountySlug ? 1.45 : outlineOverlay ? 1.15 : 0.72;
        const label = metricMode.valueLabel ?? metricMode.label;
        const titleBits = [`${county.name}: ${label} ${formatCountyMetricValue(metricMode, value)}`];
        if (county.context) titleBits.push(county.context);
        for (const overlay of overlaysForCounty) {
          titleBits.push(overlay.label);
        }

        const countyShape = (
          <g data-county-map-path={county.slug} data-metric-mode={metricMode.id}>
            <path d={path} fill={bucket?.fill ?? "rgba(71,85,105,0.78)"} stroke={strokeColor} strokeWidth={strokeWidth} />
            {overlaysForCounty
              .filter((overlay) => overlay.tone === "hatch")
              .map((overlay) => (
                <path key={`${county.slug}-${overlay.id}`} d={path} fill={`url(#${idPrefix}-pattern-${overlay.id})`} opacity={0.82} />
              ))}
            <title>{titleBits.join(" — ")}</title>
          </g>
        );

        return county.href ? (
          <a key={county.slug} href={county.href} aria-label={`Open ${county.name}`}>
            {countyShape}
          </a>
        ) : (
          <g key={county.slug}>{countyShape}</g>
        );
      })}
      {pathGenerator(texasCountyBorders) ? <path d={pathGenerator(texasCountyBorders) ?? undefined} fill="none" stroke="rgba(226,232,240,0.2)" strokeWidth={0.28} /> : null}
      {pathGenerator(texasCountyOutline) ? <path d={pathGenerator(texasCountyOutline) ?? undefined} fill="none" stroke="rgba(248,250,252,0.55)" strokeWidth={0.9} /> : null}
    </svg>
  );
}

export function lookupTexasCountyFeature(fips: string) {
  return texasCountyByFips.get(fips) ?? null;
}
