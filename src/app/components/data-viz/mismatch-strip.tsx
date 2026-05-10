import { SEVERITY_HEX } from "@/app/design/states";

export type MismatchStripProps = {
  /** "What official compliance signals say" — violations, sewer overflows, NFHL footprint. */
  complianceValue: number;
  /** "What the world says" — alerts, gauge anomaly, drought, observed quality issues. */
  worldValue: number;
  /** Shared scale ceiling so multiple counties read together. */
  scaleMax: number;
  width?: number;
  height?: number;
  ariaLabel?: string;
};

const COMPLIANCE_COLOR = SEVERITY_HEX[2];
const WORLD_COLOR = SEVERITY_HEX[3];

export default function MismatchStrip({
  complianceValue,
  worldValue,
  scaleMax,
  width = 180,
  height = 14,
  ariaLabel,
}: MismatchStripProps) {
  const safeMax = Math.max(scaleMax, 1);
  const half = width / 2;
  const leftW = Math.min(1, complianceValue / safeMax) * (half - 2);
  const rightW = Math.min(1, worldValue / safeMax) * (half - 2);
  return (
    <svg
      role="img"
      aria-label={ariaLabel ?? `compliance ${complianceValue} vs world ${worldValue}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block align-middle"
    >
      <rect x={0} y={height / 2 - 1} width={width} height={2} fill="#1e293b" rx={1} />
      {/* compliance side: grows leftward from center */}
      <rect
        x={half - leftW - 1}
        y={1}
        width={Math.max(1, leftW)}
        height={height - 2}
        fill={COMPLIANCE_COLOR}
        fillOpacity={complianceValue > 0 ? 0.85 : 0.2}
      />
      {/* world side: grows rightward from center */}
      <rect
        x={half + 1}
        y={1}
        width={Math.max(1, rightW)}
        height={height - 2}
        fill={WORLD_COLOR}
        fillOpacity={worldValue > 0 ? 0.85 : 0.2}
      />
      <line x1={half} y1={0} x2={half} y2={height} stroke="#94a3b8" strokeWidth={0.6} />
    </svg>
  );
}
