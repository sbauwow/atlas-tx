import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import {
  DecompositionBarsPanel,
  MetricTrendChart,
  MoversTable,
  ScatterplotPanel,
} from "@/app/components/charts";

describe("MetricTrendChart", () => {
  it("renders an empty state when no valid points are provided", () => {
    const html = renderToStaticMarkup(
      <MetricTrendChart
        title="County risk trend"
        points={[]}
        sourceLabel="Wave 1 snapshot"
        freshnessLabel="fresh"
      />,
    );

    expect(html).toContain("Trend unavailable");
    expect(html).toContain("No trend data available yet.");
    expect(html).toContain("Source: Wave 1 snapshot");
    expect(html).toContain("Freshness: fresh");
  });

  it("renders a line path and latest value for populated data", () => {
    const html = renderToStaticMarkup(
      <MetricTrendChart
        title="County risk trend"
        valueLabel="Risk score"
        points={[
          { label: "Run 1", value: 18.2 },
          { label: "Run 2", value: 21.4, annotation: "post-refresh" },
          { label: "Run 3", value: 19.9 },
        ]}
      />,
    );

    expect(html).toContain("trend chart");
    expect(html).toContain("Latest");
    expect(html).toContain("Metric: Risk score");
    expect(html).toContain("Run 2: 21.4 — post-refresh");
  });
});

describe("DecompositionBarsPanel", () => {
  it("renders an empty state when no valid bars are provided", () => {
    const html = renderToStaticMarkup(
      <DecompositionBarsPanel title="Driver mix" bars={[{ id: "a", label: "SDWIS", value: null }]} />,
    );

    expect(html).toContain("Breakdown unavailable");
    expect(html).toContain("No decomposition data available yet.");
  });

  it("renders bars with change chips for populated data", () => {
    const html = renderToStaticMarkup(
      <DecompositionBarsPanel
        title="Driver mix"
        bars={[
          { id: "sdwis", label: "SDWIS burden", value: 72, change: 5.2, tone: "warning" },
          { id: "swq", label: "Surface water pressure", value: 31, secondaryValue: 24, change: -2.1 },
        ]}
      />,
    );

    expect(html).toContain("SDWIS burden");
    expect(html).toContain("Baseline 24");
    expect(html).toContain("+5.2");
    expect(html).toContain("−2.1");
  });
});

describe("ScatterplotPanel", () => {
  it("renders an empty state when no valid points are provided", () => {
    const html = renderToStaticMarkup(
      <ScatterplotPanel title="Pressure vs risk" xLabel="Pressure" yLabel="Risk" points={[]} />,
    );

    expect(html).toContain("Scatter unavailable");
    expect(html).toContain("No comparison points available yet.");
  });

  it("renders plotted points with titles and links for populated data", () => {
    const html = renderToStaticMarkup(
      <ScatterplotPanel
        title="Pressure vs risk"
        xLabel="Pressure"
        yLabel="Risk"
        points={[
          { id: "harris", label: "Harris County", x: 100, y: 100, size: 250, category: "focus", href: "/counties/harris-county" },
          { id: "travis", label: "Travis County", x: 0.43, y: 9.72, detail: "high risk / lower pressure" },
        ]}
      />,
    );

    expect(html).toContain("scatter plot");
    expect(html).toContain('href="/counties/harris-county"');
    expect(html).toContain("Harris County: Pressure 100, Risk 100");
    expect(html).toContain("high risk / lower pressure");
  });
});

describe("MoversTable", () => {
  it("renders an empty state when no rows are provided", () => {
    const html = renderToStaticMarkup(<MoversTable title="County movers" rows={[]} />);

    expect(html).toContain("Movers unavailable");
    expect(html).toContain("No movers available yet.");
  });

  it("renders linked rows with derived deltas", () => {
    const html = renderToStaticMarkup(
      <MoversTable
        title="County movers"
        rows={[
          {
            id: "harris",
            label: "Harris County",
            href: "/counties/harris-county",
            currentValue: 100,
            previousValue: 96.4,
            rank: 1,
            movementLabel: "up",
            note: "SDWIS + pressure",
          },
        ]}
      />,
    );

    expect(html).toContain('href="/counties/harris-county"');
    expect(html).toContain("Harris County");
    expect(html).toContain("96.4");
    expect(html).toContain("+3.6");
    expect(html).toContain("SDWIS + pressure");
  });
});
