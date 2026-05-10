import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CustomProjection } from "@visx/geo";
import { geoAlbers } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";

import { ACCENT_HEX, SEVERITY_HEX, SEVERITY_LABEL, type Freshness, type SeverityLevel } from "@/app/design/states";
import { SEVERITY_GLYPH } from "@/app/design/glyphs";
import {
  ChoroplethTooltipLayer,
  type ChoroplethTooltipContent,
} from "@/app/components/choropleth-tooltip-layer";

export type ChoroplethCounty = {
  slug: string;
  name: string;
  fips?: string;
  severity: SeverityLevel;
  riskScore: number;
  mismatchScore: number;
  metrics: {
    floodplainFeatureCount?: number;
    activeWaterAlertCount?: number;
    streamGaugeCount?: number;
    oilAndGasExtractionPermitCount?: number;
    petroleumBulkStationPermitCount?: number;
    otherGeneralPermitCount?: number;
  };
  /** Per-county freshness (reduces opacity + dashes border when stale/missing). */
  freshness?: Freshness;
};

export type ChoroplethGauge = {
  siteNumber: string;
  stationName: string;
  latitude: number;
  longitude: number;
};

const MAP_WIDTH = 900;
const MAP_HEIGHT = 520;

type CountyProps = { name?: string; fips: string };
type CountyTopology = Topology<{ counties: GeometryCollection<{ name?: string }> }>;

let cachedFeatures: FeatureCollection<Geometry, CountyProps> | null = null;

function loadTexasCountyFeatures(): FeatureCollection<Geometry, CountyProps> {
  if (cachedFeatures) return cachedFeatures;
  const path = join(process.cwd(), "public", "cache", "tx-counties-topo.json");
  const topo = JSON.parse(readFileSync(path, "utf8")) as CountyTopology;
  const fc = feature(topo, topo.objects.counties) as unknown as FeatureCollection<Geometry, { name?: string }>;
  const geometries = topo.objects.counties.geometries;
  const enriched: FeatureCollection<Geometry, CountyProps> = {
    type: "FeatureCollection",
    features: fc.features.map((f, i) => {
      const id = String(geometries[i]?.id ?? f.id ?? "");
      return {
        ...f,
        properties: {
          fips: id,
          name: f.properties?.name ?? "",
        },
      };
    }),
  };
  cachedFeatures = enriched;
  return enriched;
}

function projectionFor(width: number, height: number) {
  return geoAlbers()
    .rotate([99, 0])
    .center([0, 31.3])
    .parallels([28, 36])
    .scale(Math.min(width, height) * 5.2)
    .translate([width / 2, height / 2]);
}

export default function TexasChoropleth({
  counties,
  gauges,
  selectedSlug,
  variant = "risk",
}: {
  counties: ChoroplethCounty[];
  gauges: ChoroplethGauge[];
  selectedSlug?: string | null;
  variant?: "risk" | "oil-gas";
}) {
  const features = loadTexasCountyFeatures();
  const bySlug = new Map(counties.map((c) => [c.slug, c]));
  const byFips = new Map<string, ChoroplethCounty>();
  for (const c of counties) {
    if (c.fips) byFips.set(c.fips, c);
  }

  const projection = projectionFor(MAP_WIDTH, MAP_HEIGHT);
  const selected = selectedSlug ? bySlug.get(selectedSlug) ?? null : null;
  const selectedFips = selected?.fips;

  const tooltips: Array<[string, ChoroplethTooltipContent]> = counties.map((county) => {
    const level: SeverityLevel = county.severity;
    if (variant === "oil-gas") {
      return [
        county.slug,
        {
          title: `${county.name}`,
          subtitle: "Oil and gas extraction permits",
          rows: [
            {
              label: "TXG31 (oil and gas)",
              value: (county.metrics.oilAndGasExtractionPermitCount ?? 0).toLocaleString(),
              tone: (county.metrics.oilAndGasExtractionPermitCount ?? 0) > 0 ? "warn" : "muted",
            },
            {
              label: "TXG34 (petroleum bulk)",
              value: (county.metrics.petroleumBulkStationPermitCount ?? 0).toLocaleString(),
            },
            {
              label: "Other general permits",
              value: (county.metrics.otherGeneralPermitCount ?? 0).toLocaleString(),
            },
            {
              value: `${SEVERITY_LABEL[level]} ${SEVERITY_GLYPH[level]}`,
              tone: level >= 3 ? "warn" : level >= 1 ? "accent" : "muted",
            },
          ],
        },
      ];
    }
    return [
      county.slug,
      {
        title: county.name,
        subtitle: "Water risk overview",
        rows: [
          {
            label: "Mismatch score",
            value: county.mismatchScore.toLocaleString(),
            tone: county.mismatchScore >= 4 ? "warn" : county.mismatchScore > 0 ? "accent" : "muted",
          },
          {
            label: "NFHL features",
            value: (county.metrics.floodplainFeatureCount ?? 0).toLocaleString(),
          },
          {
            label: "Active alerts",
            value: (county.metrics.activeWaterAlertCount ?? 0).toLocaleString(),
            tone: (county.metrics.activeWaterAlertCount ?? 0) > 0 ? "warn" : "default",
          },
          {
            label: "Stream gauges",
            value: (county.metrics.streamGaugeCount ?? 0).toLocaleString(),
          },
          {
            value: `${SEVERITY_LABEL[level]} ${SEVERITY_GLYPH[level]}`,
            tone: level >= 3 ? "warn" : level >= 1 ? "accent" : "muted",
          },
        ],
      },
    ];
  });

  return (
    <ChoroplethTooltipLayer tooltips={tooltips} className="overflow-hidden rounded-xl bg-slate-950 ring-1 ring-white/5">
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="h-[560px] w-full sm:h-[720px] lg:h-[880px]"
        role="img"
        aria-label={variant === "oil-gas" ? "Texas county oil and gas extraction permit map" : "Texas county water risk map"}
      >
        <defs>
          <radialGradient id="mapVignette" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#mapVignette)" />

        <CustomProjection<Feature<Geometry, CountyProps>>
          projection={() => projection}
          data={features.features}
        >
          {(map) => (
            <g>
              {map.features.map(({ feature: feat, path }) => {
                const fips = feat.properties.fips;
                const county = byFips.get(fips);
                if (!path) return null;
                const isSelected = !!county && county.slug === selectedSlug;
                const level: SeverityLevel = (county?.severity ?? 0) as SeverityLevel;
                const fill = isSelected ? ACCENT_HEX : SEVERITY_HEX[level];
                const freshness = county?.freshness ?? (county ? "fresh" : "missing");
                const isStale = freshness === "stale";
                const isMissing = freshness === "missing";
                const baseOpacity = !county || (level === 0 && !isSelected) ? 0.55 : 1;
                const freshnessOpacity = isMissing ? 0.4 : isStale ? 0.7 : 1;
                const stroke = isMissing
                  ? "#475569"
                  : county?.metrics.floodplainFeatureCount
                    ? "#f8fafc"
                    : "#0f172a";
                const strokeDasharray = isStale || isMissing ? "2 2" : undefined;
                return (
                  <path
                    key={fips}
                    d={path}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={county?.metrics.floodplainFeatureCount ? 1.25 : 0.6}
                    strokeDasharray={strokeDasharray}
                    fillOpacity={baseOpacity * freshnessOpacity}
                    data-county-slug={county?.slug ?? `fips-${fips}`}
                    data-severity={level}
                    data-freshness={freshness}
                    className="transition-[fill-opacity,stroke-width] duration-150"
                  >
                    <title>
                      {county
                        ? variant === "oil-gas"
                          ? `${county.name}: TXG31 ${county.metrics.oilAndGasExtractionPermitCount ?? 0}, TXG34 ${county.metrics.petroleumBulkStationPermitCount ?? 0}, other permits ${county.metrics.otherGeneralPermitCount ?? 0} — ${SEVERITY_LABEL[level]} ${SEVERITY_GLYPH[level]}${isStale ? " · stale cache" : isMissing ? " · cache missing" : ""}`
                          : `${county.name}: mismatch ${county.mismatchScore}, NFHL ${county.metrics.floodplainFeatureCount ?? 0}, alerts ${county.metrics.activeWaterAlertCount ?? 0}, gauges ${county.metrics.streamGaugeCount ?? 0} — ${SEVERITY_LABEL[level]} ${SEVERITY_GLYPH[level]}${isStale ? " · stale cache" : isMissing ? " · cache missing" : ""}`
                        : `${feat.properties.name} County (no data)`}
                    </title>
                  </path>
                );
              })}

              {/* Selection halo on top of polygons, behind gauge markers. */}
              {selected && selectedFips
                ? (() => {
                    const found = map.features.find((f) => f.feature.properties.fips === selectedFips);
                    if (!found || !found.path) return null;
                    return (
                      <path
                        d={found.path}
                        fill="none"
                        stroke={ACCENT_HEX}
                        strokeOpacity={0.7}
                        strokeWidth={2}
                        pointerEvents="none"
                        className="atlas-pulse-halo"
                      />
                    );
                  })()
                : null}
            </g>
          )}
        </CustomProjection>

        {gauges.map((gauge) => {
          const point = projection([gauge.longitude, gauge.latitude]);
          if (!point) return null;
          return (
            <g key={gauge.siteNumber} data-gauge-site={gauge.siteNumber}>
              <circle cx={point[0]} cy={point[1]} r={4} fill="#f8fafc" stroke="#0f172a" strokeWidth={1.5} />
              <circle cx={point[0]} cy={point[1]} r={11} fill="none" stroke={ACCENT_HEX} strokeWidth={1.25}>
                <animate attributeName="r" values="9;14;9" dur="3.2s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.65;0.15;0.65" dur="3.2s" repeatCount="indefinite" />
              </circle>
              <title>{`${gauge.stationName} — stream gauge`}</title>
            </g>
          );
        })}
      </svg>
    </ChoroplethTooltipLayer>
  );
}
