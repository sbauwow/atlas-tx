import type { ReferenceChart } from "../types";
import { JED_POOL_TOOLS_5WAY_CHART } from "./reference-chart-jed-5way";
import { GENERIC_9PAD_CHART } from "./reference-chart-9pad";

const CHARTS: readonly ReferenceChart[] = [
  JED_POOL_TOOLS_5WAY_CHART,
  GENERIC_9PAD_CHART,
];

const CHARTS_BY_ID = new Map(CHARTS.map((chart) => [chart.id, chart]));

export function listReferenceCharts(): readonly ReferenceChart[] {
  return CHARTS;
}

export function getReferenceChart(chartId: string | null | undefined): ReferenceChart {
  if (!chartId) {
    return JED_POOL_TOOLS_5WAY_CHART;
  }
  return CHARTS_BY_ID.get(chartId) ?? JED_POOL_TOOLS_5WAY_CHART;
}

export const DEFAULT_REFERENCE_CHART = JED_POOL_TOOLS_5WAY_CHART;
