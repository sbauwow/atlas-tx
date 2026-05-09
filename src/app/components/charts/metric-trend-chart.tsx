import type { ReactNode } from "react";

import { ChartEmptyState, ChartShell } from "./chart-shell";
import { clamp, formatCompactNumber, getNumericExtent, type FooterMeta } from "./chart-helpers";

export type MetricTrendPoint = {
  label: string;
  value: number | null;
  annotation?: string;
};

export type MetricTrendChartProps = FooterMeta & {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  points: MetricTrendPoint[];
  summary?: ReactNode;
  valueLabel?: string;
  formatValue?: (value: number) => string;
  emptyMessage?: string;
  height?: number;
};

const CHART_WIDTH = 680;
const DEFAULT_HEIGHT = 240;
const PADDING = { top: 20, right: 18, bottom: 28, left: 18 };

export function MetricTrendChart({
  title,
  subtitle,
  eyebrow,
  points,
  summary,
  valueLabel,
  formatValue = formatCompactNumber,
  emptyMessage = "No trend data available yet.",
  height = DEFAULT_HEIGHT,
  sourceLabel,
  freshnessLabel,
  caveat,
  footer,
}: MetricTrendChartProps) {
  const validPoints = points.filter((point): point is MetricTrendPoint & { value: number } => typeof point.value === "number" && Number.isFinite(point.value));

  if (!validPoints.length) {
    return (
      <ChartShell
        title={title}
        subtitle={subtitle}
        eyebrow={eyebrow}
        aside={summary}
        sourceLabel={sourceLabel}
        freshnessLabel={freshnessLabel}
        caveat={caveat}
        footer={footer}
      >
        <ChartEmptyState title="Trend unavailable" message={emptyMessage} />
      </ChartShell>
    );
  }

  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = height - PADDING.top - PADDING.bottom;
  const [minValue, maxValue] = getNumericExtent(validPoints.map((point) => point.value));

  const toX = (index: number) => PADDING.left + (validPoints.length === 1 ? innerWidth / 2 : (innerWidth / (validPoints.length - 1)) * index);
  const toY = (value: number) => PADDING.top + innerHeight - clamp(((value - minValue) / (maxValue - minValue)) * innerHeight, 0, innerHeight);
  const path = validPoints.map((point, index) => `${index === 0 ? "M" : "L"}${toX(index)} ${toY(point.value)}`).join(" ");
  const latestPoint = validPoints.at(-1);
  const previousPoint = validPoints.length > 1 ? validPoints.at(-2) : null;
  const delta = latestPoint && previousPoint ? latestPoint.value - previousPoint.value : null;
  const midline = PADDING.top + innerHeight / 2;

  return (
    <ChartShell
      title={title}
      subtitle={subtitle}
      eyebrow={eyebrow}
      aside={summary ?? (latestPoint ? (
        <div className="space-y-1 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-right">
          <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/80">Latest</div>
          <div className="text-xl font-semibold text-white">{formatValue(latestPoint.value)}</div>
          {delta !== null ? <div className="text-xs text-cyan-100/80">{delta > 0 ? "Up" : delta < 0 ? "Down" : "Flat"} {formatValue(Math.abs(delta))}</div> : null}
        </div>
      ) : null)}
      sourceLabel={sourceLabel}
      freshnessLabel={freshnessLabel}
      caveat={caveat}
      footer={footer}
    >
      <div className="space-y-3">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${height}`} className="h-60 w-full" role="img" aria-label={`${title} trend chart`}>
          <defs>
            <linearGradient id="trendStroke" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <line x1={PADDING.left} y1={midline} x2={CHART_WIDTH - PADDING.right} y2={midline} stroke="rgba(148,163,184,0.18)" strokeDasharray="4 6" />
          <line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={height - PADDING.bottom} stroke="rgba(148,163,184,0.16)" />
          <line x1={PADDING.left} y1={height - PADDING.bottom} x2={CHART_WIDTH - PADDING.right} y2={height - PADDING.bottom} stroke="rgba(148,163,184,0.16)" />
          <path d={path} fill="none" stroke="url(#trendStroke)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {validPoints.map((point, index) => {
            const x = toX(index);
            const y = toY(point.value);
            return (
              <g key={`${point.label}-${index}`}>
                <circle cx={x} cy={y} r="5" fill="#020617" stroke="#38bdf8" strokeWidth="2" />
                <title>{`${point.label}: ${formatValue(point.value)}${point.annotation ? ` — ${point.annotation}` : ""}`}</title>
                <text x={x} y={height - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
        {valueLabel ? <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Metric: {valueLabel}</div> : null}
      </div>
    </ChartShell>
  );
}
