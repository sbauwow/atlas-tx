import { SEVERITY_HEX, type SeverityLevel } from "@/app/design/states";

export type MicroBarProps = {
  value: number;
  median: number;
  max: number;
  width?: number;
  height?: number;
  label?: string;
  severity?: SeverityLevel;
  showMedianTick?: boolean;
};

export default function MicroBar({
  value,
  median,
  max,
  width = 64,
  height = 10,
  label,
  severity = 2,
  showMedianTick = true,
}: MicroBarProps) {
  const safeMax = Math.max(max, 1);
  const w = Math.min(1, value / safeMax) * width;
  const medianX = Math.min(1, median / safeMax) * width;
  const fill = SEVERITY_HEX[severity];
  return (
    <svg
      role="img"
      aria-label={label ?? `value ${value} of max ${safeMax}, median ${median}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block align-middle"
    >
      <rect x={0} y={height / 2 - 1} width={width} height={2} fill="#1e293b" rx={1} />
      <rect
        x={0}
        y={1}
        width={Math.max(1, w)}
        height={height - 2}
        fill={fill}
        rx={1}
        fillOpacity={value > 0 ? 1 : 0.2}
        className="atlas-bar-grow"
      />
      {showMedianTick && median > 0 ? (
        <line x1={medianX} y1={0} x2={medianX} y2={height} stroke="#94a3b8" strokeWidth={0.75} strokeDasharray="1.5 1.5" />
      ) : null}
    </svg>
  );
}
