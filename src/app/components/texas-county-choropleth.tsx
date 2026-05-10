import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";
import type { PendingPermitCountyMapRow } from "@/lib/tceq-permits";

import {
  ChoroplethTooltipLayer,
  type ChoroplethTooltipContent,
} from "./choropleth-tooltip-layer";
import { CountyChoroplethSvg, type CountyMetricMode } from "./county-map-primitives";

const texasCountyFipsBySlug = Object.fromEntries(
  Object.entries(TEXAS_COUNTY_CENTROIDS).flatMap(([slug, centroid]) => (centroid.fips ? [[slug, centroid.fips]] : [])),
);

const permitMetricMode: CountyMetricMode = {
  id: "permitCount",
  label: "Permit pressure",
  valueLabel: "Pending permits",
  legendTitle: "Pending permit counts",
  description: "Counties brighten as unresolved permit volume stacks up.",
  format: "integer",
  noDataLabel: "No active permit signal",
  buckets: [
    { label: "1 active permit", fill: "#34d399", min: 1, max: 2 },
    { label: "2 active permits", fill: "#22d3ee", min: 2, max: 3 },
    { label: "3+ active permits", fill: "#d946ef", min: 3 },
  ],
};

export function TexasCountyChoropleth({ rows }: { rows: PendingPermitCountyMapRow[] }) {
  const counties = rows
    .map((row) => {
      const fips = texasCountyFipsBySlug[row.slug];
      if (!fips) return null;

      return {
        slug: row.slug,
        name: row.county,
        fips,
        href: `/permits?county=${row.slug}`,
        metrics: {
          permitCount: row.permitCount,
        },
        context: `${row.cidCaseCount} CID case${row.cidCaseCount === 1 ? "" : "s"}`,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const proceduralSlugs = new Set(rows.filter((row) => row.hasProceduralPressure).map((row) => row.slug));
  const tooltips: Array<[string, ChoroplethTooltipContent]> = rows.map((row) => [
    row.slug,
    {
      title: row.county,
      subtitle: "TCEQ permit pressure",
      rows: [
        {
          label: "Pending permits",
          value: row.permitCount.toLocaleString(),
          tone: row.permitCount >= 3 ? "warn" : "default",
        },
        {
          label: "CID cases",
          value: row.cidCaseCount.toLocaleString(),
          tone: row.cidCaseCount > 0 ? "warn" : "muted",
        },
        ...(proceduralSlugs.has(row.slug)
          ? [{ value: "Procedural pressure flagged", tone: "accent" as const }]
          : []),
      ],
      footer: "Click to open county-filtered permits.",
    },
  ]);

  return (
    <ChoroplethTooltipLayer tooltips={tooltips}>
      <CountyChoroplethSvg
        counties={counties}
        metricMode={permitMetricMode}
        overlays={[
          {
            id: "procedural-pressure",
            label: "Procedural pressure",
            countySlugs: rows.filter((row) => row.hasProceduralPressure).map((row) => row.slug),
            tone: "outline",
            color: "#f8fafc",
          },
          {
            id: "cid-cases",
            label: "CID cases present",
            countySlugs: rows.filter((row) => row.cidCaseCount > 0).map((row) => row.slug),
            tone: "hatch",
            color: "rgba(248,250,252,0.85)",
          },
        ]}
        ariaLabel="Texas county permit pressure map"
        idPrefix="permit-map"
      />
    </ChoroplethTooltipLayer>
  );
}
