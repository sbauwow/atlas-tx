import { SEVERITY_HEX, type SeverityLevel } from "@/app/design/states";

export type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  showEnd?: boolean;
  ariaLabel?: string;
};

export default function Sparkline({
  values,
  width = 60,
  height = 16,
  stroke,
  fill,
  showEnd = true,
  ariaLabel,
}: SparklineProps) {
  if (!values.length) {
    return <span className="inline-block align-middle text-[10px] text-slate-600" style={{ width, height }} aria-label={ariaLabel ?? "no series"}>—</span>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / span) * (height - 2) - 1;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const last = values[values.length - 1];
  const lastY = height - ((last - min) / span) * (height - 2) - 1;
  const lastX = (values.length - 1) * stepX;
  const lineColor = stroke ?? SEVERITY_HEX[2 as SeverityLevel];
  const areaColor = fill ?? `${lineColor}22`;

  return (
    <svg
      role="img"
      aria-label={ariaLabel ?? `sparkline ${values.length} pts`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block align-middle"
    >
      <polyline
        points={`0,${height} ${points} ${width},${height}`}
        fill={areaColor}
        stroke="none"
      />
      <polyline points={points} fill="none" stroke={lineColor} strokeWidth={1} strokeLinejoin="round" strokeLinecap="round" />
      {showEnd ? <circle cx={lastX} cy={lastY} r={1.6} fill={lineColor} /> : null}
    </svg>
  );
}
