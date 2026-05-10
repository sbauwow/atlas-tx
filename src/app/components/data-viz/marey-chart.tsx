import { SEVERITY_HEX } from "@/app/design/states";

export type MareySegment = {
  /** Stable id for React key + selection. */
  id: string;
  /** Lane label (county / system / applicant). Lanes are derived from this. */
  lane: string;
  /** Optional sub-label rendered into the segment title. */
  detail?: string;
  /** Inclusive start. ISO string preferred. */
  startAt: string;
  /** Inclusive end. ISO string. Open-ended ⇒ pass `null`/omit and an open marker is drawn at `now`. */
  endAt?: string | null;
  /** Optional explicit color. */
  color?: string;
};

export type MareyChartProps = {
  segments: MareySegment[];
  /** Earliest tick on the time axis. Defaults to min(startAt) - 1y. */
  start?: Date;
  /** Latest tick on the time axis. Defaults to today. */
  end?: Date;
  width?: number;
  laneHeight?: number;
  laneLabelWidth?: number;
  ariaLabel?: string;
  /** Optional caption shown bottom-right. */
  caption?: string;
};

const PADDING_TOP = 36;
const PADDING_BOTTOM = 28;
const PADDING_RIGHT = 24;

const DEFAULT_COLOR = SEVERITY_HEX[2];

/**
 * Marey-style chart: each row is a lane (county/system/applicant); each
 * `MareySegment` is a diagonal from (startAt, lane-top) to (endAt, lane-bottom),
 * so density and tenure read together. Open-ended rows trail to "now."
 *
 * Pure SVG. Lane order = first-appearance order of the input.
 */
export default function MareyChart({
  segments,
  start,
  end,
  width = 880,
  laneHeight = 14,
  laneLabelWidth = 120,
  ariaLabel,
  caption,
}: MareyChartProps) {
  if (!segments.length) {
    return <div className="rounded-xl bg-white/[0.02] px-4 py-8 text-sm text-slate-500 ring-1 ring-white/5">No tenure rows to plot.</div>;
  }

  const lanes: string[] = [];
  for (const seg of segments) {
    if (!lanes.includes(seg.lane)) lanes.push(seg.lane);
  }
  const lanesByName = new Map(lanes.map((lane, idx) => [lane, idx]));

  const startTs = (start ?? new Date(Math.min(...segments.map((s) => Date.parse(s.startAt))))).getTime();
  const endTs = (end ?? new Date()).getTime();
  const span = Math.max(1, endTs - startTs);

  const innerHeight = lanes.length * laneHeight;
  const height = PADDING_TOP + innerHeight + PADDING_BOTTOM;
  const innerWidth = width - laneLabelWidth - PADDING_RIGHT;
  const xFor = (ts: number) => laneLabelWidth + ((ts - startTs) / span) * innerWidth;

  // Year ticks on x-axis
  const startYear = new Date(startTs).getUTCFullYear();
  const endYear = new Date(endTs).getUTCFullYear();
  const yearTicks: number[] = [];
  const stride = Math.max(1, Math.ceil((endYear - startYear) / 12));
  for (let year = Math.ceil(startYear / stride) * stride; year <= endYear; year += stride) {
    yearTicks.push(year);
  }

  return (
    <svg
      role="img"
      aria-label={ariaLabel ?? `Marey chart with ${lanes.length} lanes and ${segments.length} segments`}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Year gridlines */}
      {yearTicks.map((year) => {
        const x = xFor(Date.UTC(year, 0, 1));
        return (
          <g key={`tick-${year}`}>
            <line x1={x} y1={PADDING_TOP - 8} x2={x} y2={PADDING_TOP + innerHeight} stroke="#1e293b" strokeWidth={0.6} />
            <text x={x} y={PADDING_TOP - 12} fontSize={10} textAnchor="middle" fill="#64748b" fontFamily="var(--font-geist-mono, monospace)">
              {year}
            </text>
          </g>
        );
      })}

      {/* Lane labels + zebra */}
      {lanes.map((lane, idx) => {
        const y = PADDING_TOP + idx * laneHeight;
        return (
          <g key={`lane-${lane}`}>
            {idx % 2 === 1 ? (
              <rect x={laneLabelWidth} y={y} width={innerWidth} height={laneHeight} fill="#0f172a" fillOpacity={0.5} />
            ) : null}
            <text x={laneLabelWidth - 6} y={y + laneHeight / 2} dominantBaseline="middle" textAnchor="end" fontSize={10} fill="#94a3b8" fontFamily="var(--font-geist-mono, monospace)">
              {lane}
            </text>
          </g>
        );
      })}

      {/* Segments: diagonal from top-left (startAt) to bottom-right (endAt) within the lane */}
      {segments.map((seg) => {
        const laneIdx = lanesByName.get(seg.lane);
        if (laneIdx === undefined) return null;
        const startTsSeg = Date.parse(seg.startAt);
        const endTsSeg = seg.endAt ? Date.parse(seg.endAt) : endTs;
        if (Number.isNaN(startTsSeg)) return null;
        const yTop = PADDING_TOP + laneIdx * laneHeight + 1.5;
        const yBottom = PADDING_TOP + laneIdx * laneHeight + laneHeight - 1.5;
        const x0 = xFor(Math.max(startTs, startTsSeg));
        const x1 = xFor(Math.min(endTs, Number.isNaN(endTsSeg) ? endTs : endTsSeg));
        const color = seg.color ?? DEFAULT_COLOR;
        const isOpen = !seg.endAt;
        // Stagger fade-in across segments so the chart "draws" left-to-right.
        const delayMs = Math.min(800, ((startTsSeg - startTs) / span) * 1200);
        return (
          <g
            key={seg.id}
            className="atlas-fade-rise"
            style={{ animationDelay: `${delayMs}ms` }}
          >
            <line
              x1={x0}
              y1={yTop}
              x2={x1}
              y2={yBottom}
              stroke={color}
              strokeWidth={1.4}
              strokeLinecap="round"
              opacity={0.85}
            />
            {isOpen ? (
              <circle cx={x1} cy={yBottom} r={1.6} fill={color} />
            ) : null}
            <title>
              {`${seg.lane} · ${seg.detail ?? seg.id} · ${seg.startAt.slice(0, 10)} → ${seg.endAt ? seg.endAt.slice(0, 10) : "open"}`}
            </title>
          </g>
        );
      })}

      {/* Axis baseline */}
      <line x1={laneLabelWidth} y1={PADDING_TOP + innerHeight} x2={width - PADDING_RIGHT} y2={PADDING_TOP + innerHeight} stroke="#334155" strokeWidth={0.8} />

      {caption ? (
        <text x={width - PADDING_RIGHT} y={height - 8} fontSize={9} textAnchor="end" fill="#64748b" fontFamily="var(--font-geist-mono, monospace)">
          {caption}
        </text>
      ) : null}
    </svg>
  );
}
