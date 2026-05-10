import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { CountyHeadlinerMap } from "@/app/components/county-headliner-map";
import {
  CountyChoroplethSvg,
  bucketForCountyMetric,
  formatCountyMetricValue,
  type CountyMapRecord,
  type CountyMetricMode,
} from "@/app/components/county-map-primitives";

const counties: CountyMapRecord[] = [
  {
    slug: "harris-county",
    name: "Harris County",
    fips: "48201",
    href: "/counties/harris-county",
    metrics: { risk: 92, permits: 5 },
    context: "High burden, persistent pressure.",
  },
  {
    slug: "travis-county",
    name: "Travis County",
    fips: "48453",
    metrics: { risk: 61, permits: 1 },
    context: "Elevated risk, lighter permit queue.",
  },
  {
    slug: "bexar-county",
    name: "Bexar County",
    fips: "48029",
    metrics: { risk: null, permits: 3 },
  },
];

const metricModes: CountyMetricMode[] = [
  {
    id: "risk",
    label: "Risk score",
    valueLabel: "Risk score",
    legendTitle: "Composite burden",
    description: "Counties intensify as the burden stack rises.",
    format: "integer",
    buckets: [
      { label: "Low", fill: "#164e63", min: 0, max: 40 },
      { label: "Elevated", fill: "#0891b2", min: 40, max: 70 },
      { label: "Critical", fill: "#d946ef", min: 70 },
    ],
  },
  {
    id: "permits",
    label: "Permit queue",
    valueLabel: "Pending permits",
    legendTitle: "Open permits",
    description: "Track unresolved permit queues by county.",
    format: "integer",
    buckets: [
      { label: "1-2", fill: "#22d3ee", min: 1, max: 3 },
      { label: "3+", fill: "#d946ef", min: 3 },
    ],
  },
];

describe("County map primitives", () => {
  it("formats metric values and resolves buckets", () => {
    expect(formatCountyMetricValue(metricModes[0], 92)).toBe("92");
    expect(formatCountyMetricValue(metricModes[0], null)).toBe("No data");
    expect(bucketForCountyMetric(metricModes[0], 61)?.label).toBe("Elevated");
    expect(bucketForCountyMetric(metricModes[0], null)).toBeNull();
  });

  it("renders linked counties with overlay annotations", () => {
    const html = renderToStaticMarkup(
      <CountyChoroplethSvg
        counties={counties}
        metricMode={metricModes[1]}
        overlays={[
          { id: "watch", label: "Watch county", tone: "outline", countySlugs: ["harris-county"] },
          { id: "cid", label: "CID cases", tone: "hatch", countySlugs: ["bexar-county"] },
        ]}
        ariaLabel="Reusable county map"
        idPrefix="shared-map-test"
      />,
    );

    expect(html).toContain("Reusable county map");
    expect(html).toContain('href="/counties/harris-county"');
    expect(html).toContain("data-county-map-path=\"harris-county\"");
    expect(html).toContain("Pending permits 5");
    expect(html).toContain("CID cases");
    expect(html).toContain("shared-map-test-pattern-cid");
  });
});

describe("CountyHeadlinerMap", () => {
  it("renders multi-metric legend, prompts, and top counties for the active mode", () => {
    const html = renderToStaticMarkup(
      <CountyHeadlinerMap
        title="County correlation workspace"
        subtitle="Map-first county scan"
        eyebrow="Wave M1"
        counties={counties}
        metricModes={metricModes}
        activeMetricId="permits"
        overlays={[
          {
            id: "procedural",
            label: "Procedural pressure",
            tone: "outline",
            countySlugs: ["harris-county"],
            description: "White outlines flag counties where process friction may explain the stack.",
          },
        ]}
        correlationPrompts={[
          "Start with the bright counties, then ask whether the same names survive when you flip the mode chip.",
        ]}
        sourceLabel="Atlas TX Wave M1"
        freshnessLabel="Cached snapshot"
      />,
    );

    expect(html).toContain("County correlation workspace");
    expect(html).toContain("Permit queue");
    expect(html).toContain("Open permits");
    expect(html).toContain("Procedural pressure");
    expect(html).toContain("Correlation prompts");
    expect(html).toContain("Top counties");
    expect(html).toContain('href="/counties/harris-county"');
    expect(html).toContain(">Harris County<");
    expect(html).toContain("5");
    expect(html).toContain("Source: Atlas TX Wave M1");
    expect(html).toContain("Freshness: Cached snapshot");
  });

  it("renders an empty state when no metric modes are provided", () => {
    const html = renderToStaticMarkup(
      <CountyHeadlinerMap title="County correlation workspace" counties={counties} metricModes={[]} emptyMessage="No layer configured yet." />,
    );

    expect(html).toContain("Map unavailable");
    expect(html).toContain("No layer configured yet.");
  });
});
