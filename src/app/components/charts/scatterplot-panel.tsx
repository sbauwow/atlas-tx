import { ChartEmptyState, ChartShell } from "./chart-shell";
import { clamp, formatCompactNumber, getNumericExtent, type FooterMeta } from "./chart-helpers";

export type ScatterPoint = {
  id: string;
  label: string;
  x: number | null;
  y: number | null;
  size?: number | null;
  category?: string;
  detail?: string;
  href?: string;
};

export type ScatterplotPanelProps = FooterMeta & {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  points: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  emptyMessage?: string;
};

const WIDTH = 680;
const HEIGHT = 280;
const PADDING = { top: 20, right: 20, bottom: 36, left: 42 };
const CATEGORY_COLORS: Record<string, string> = {
  default: "#38bdf8",
  focus: "#f472b6",
  stable: "#22c55e",
  risk: "#f59e0b",
};

export function ScatterplotPanel({
  title,
  subtitle,
  eyebrow,
  points,
  xLabel,
  yLabel,
  formatX = formatCompactNumber,
  formatY = formatCompactNumber,
  emptyMessage = "No comparison points available yet.",
  sourceLabel,
  freshnessLabel,
  caveat,
  footer,
}: ScatterplotPanelProps) {
  const validPoints = points.filter((point): point is ScatterPoint & { x: number; y: number } => typeof point.x === "number" && Number.isFinite(point.x) && typeof point.y === "number" && Number.isFinite(point.y));

  if (!validPoints.length) {
    return (
      <ChartShell title={title} subtitle={subtitle} eyebrow={eyebrow} sourceLabel={sourceLabel} freshnessLabel={freshnessLabel} caveat={caveat} footer={footer}>
        <ChartEmptyState title="Scatter unavailable" message={emptyMessage} />
      </ChartShell>
    );
  }

  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const [minX, maxX] = getNumericExtent(validPoints.map((point) => point.x));
  const [minY, maxY] = getNumericExtent(validPoints.map((point) => point.y));
  const midX = PADDING.left + innerWidth / 2;
  const midY = PADDING.top + innerHeight / 2;

  const toX = (value: number) => PADDING.left + clamp(((value - minX) / (maxX - minX)) * innerWidth, 0, innerWidth);
  const toY = (value: number) => PADDING.top + innerHeight - clamp(((value - minY) / (maxY - minY)) * innerHeight, 0, innerHeight);

  return (
    <ChartShell title={title} subtitle={subtitle} eyebrow={eyebrow} sourceLabel={sourceLabel} freshnessLabel={freshnessLabel} caveat={caveat} footer={footer}>
      <div className="space-y-3">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-72 w-full" role="img" aria-label={`${title} scatter plot`}>
          <rect x={PADDING.left} y={PADDING.top} width={innerWidth} height={innerHeight} rx="18" fill="rgba(15,23,42,0.8)" stroke="rgba(148,163,184,0.16)" />
          <line x1={midX} y1={PADDING.top} x2={midX} y2={HEIGHT - PADDING.bottom} stroke="rgba(148,163,184,0.16)" strokeDasharray="4 6" />
          <line x1={PADDING.left} y1={midY} x2={WIDTH - PADDING.right} y2={midY} stroke="rgba(148,163,184,0.16)" strokeDasharray="4 6" />
          <line x1={PADDING.left} y1={HEIGHT - PADDING.bottom} x2={WIDTH - PADDING.right} y2={HEIGHT - PADDING.bottom} stroke="rgba(148,163,184,0.16)" />
          <line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={HEIGHT - PADDING.bottom} stroke="rgba(148,163,184,0.16)" />
          {validPoints.map((point) => {
            const cx = toX(point.x);
            const cy = toY(point.y);
            const radius = point.size ? 4 + clamp(point.size / 25, 0, 10) : 5;
            const fill = CATEGORY_COLORS[point.category ?? ""] ?? CATEGORY_COLORS.default;
            const node = (
              <g>
                <circle cx={cx} cy={cy} r={radius} fill={fill} fillOpacity="0.9" stroke="rgba(2,6,23,0.85)" strokeWidth="1.5" />
                <title>{`${point.label}: ${xLabel} ${formatX(point.x)}, ${yLabel} ${formatY(point.y)}${point.detail ? ` — ${point.detail}` : ""}`}</title>
              </g>
            );

            return point.href ? <a key={point.id} href={point.href} aria-label={`Open ${point.label}`}>{node}</a> : <g key={point.id}>{node}</g>;
          })}
          <text x={WIDTH / 2} y={HEIGHT - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">{xLabel}</text>
          <text x={18} y={HEIGHT / 2} textAnchor="middle" transform={`rotate(-90 18 ${HEIGHT / 2})`} className="fill-slate-500 text-[11px]">{yLabel}</text>
        </svg>
        <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
          <div>{xLabel}: {formatX(minX)} to {formatX(maxX)}</div>
          <div>{yLabel}: {formatY(minY)} to {formatY(maxY)}</div>
        </div>
      </div>
    </ChartShell>
  );
}
