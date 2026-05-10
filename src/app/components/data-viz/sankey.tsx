import { SEVERITY_HEX } from "@/app/design/states";

export type SankeyNode = {
  id: string;
  label: string;
  /** 0-based column. */
  column: number;
  /** Optional accent. */
  accent?: string;
  /** Optional href for the label. */
  href?: string;
};

export type SankeyEdge = {
  fromId: string;
  toId: string;
  weight: number;
  title?: string;
};

export type SankeyProps = {
  nodes: SankeyNode[];
  edges: SankeyEdge[];
  width?: number;
  height?: number;
  ariaLabel?: string;
};

type LayoutNode = SankeyNode & {
  x: number;
  y: number;
  w: number;
  h: number;
  inflow: number;
  outflow: number;
};

const NODE_WIDTH = 10;
const NODE_GAP = 6;
const FLOW_OPACITY = 0.45;

/**
 * Minimal SVG Sankey. Routes flows column → column with cubic bezier ribbons,
 * sized by edge.weight. Skips d3-sankey to avoid a deep dependency chain.
 *
 * Caveats: each edge stacks into the destination column in input order, so the
 * caller should sort edges by source column for the cleanest layout.
 */
export default function Sankey({
  nodes,
  edges,
  width = 880,
  height = 380,
  ariaLabel,
}: SankeyProps) {
  if (!nodes.length) {
    return <div className="rounded-xl bg-white/[0.02] px-4 py-8 text-sm text-slate-500 ring-1 ring-white/5">No flows to render.</div>;
  }
  const columns = Array.from(new Set(nodes.map((n) => n.column))).sort((a, b) => a - b);
  const colCount = columns.length;
  const colWidth = colCount > 1 ? (width - NODE_WIDTH) / (colCount - 1) : 0;

  const totals = new Map<string, { inflow: number; outflow: number }>();
  for (const e of edges) {
    const f = totals.get(e.fromId) ?? { inflow: 0, outflow: 0 };
    f.outflow += e.weight;
    totals.set(e.fromId, f);
    const t = totals.get(e.toId) ?? { inflow: 0, outflow: 0 };
    t.inflow += e.weight;
    totals.set(e.toId, t);
  }

  const heightByColumn = new Map<number, number>();
  for (const n of nodes) {
    const t = totals.get(n.id) ?? { inflow: 0, outflow: 0 };
    const cap = Math.max(t.inflow, t.outflow, 1);
    heightByColumn.set(n.column, (heightByColumn.get(n.column) ?? 0) + cap);
  }
  const maxColTotal = Math.max(...heightByColumn.values(), 1);
  const usableHeight = height - NODE_GAP * (Math.max(...nodes.map((n) => 1)) + 1);
  const scale = usableHeight / maxColTotal;

  // Lay nodes
  const layout: Map<string, LayoutNode> = new Map();
  for (const col of columns) {
    const colNodes = nodes.filter((n) => n.column === col);
    let y = NODE_GAP;
    for (const n of colNodes) {
      const t = totals.get(n.id) ?? { inflow: 0, outflow: 0 };
      const cap = Math.max(t.inflow, t.outflow, 1);
      const h = Math.max(8, cap * scale);
      const x = colWidth * col;
      layout.set(n.id, {
        ...n,
        x,
        y,
        w: NODE_WIDTH,
        h,
        inflow: t.inflow,
        outflow: t.outflow,
      });
      y += h + NODE_GAP;
    }
  }

  const sortedEdges = [...edges].sort((a, b) => {
    const af = layout.get(a.fromId)?.y ?? 0;
    const bf = layout.get(b.fromId)?.y ?? 0;
    if (af !== bf) return af - bf;
    return (layout.get(a.toId)?.y ?? 0) - (layout.get(b.toId)?.y ?? 0);
  });

  const sourceCursor = new Map<string, number>();
  const targetCursor = new Map<string, number>();

  const ribbons = sortedEdges
    .map((e, idx) => {
      const from = layout.get(e.fromId);
      const to = layout.get(e.toId);
      if (!from || !to) return null;
      const ribbon = e.weight * scale;
      const sCursor = sourceCursor.get(e.fromId) ?? 0;
      const tCursor = targetCursor.get(e.toId) ?? 0;
      const x0 = from.x + from.w;
      const x1 = to.x;
      const y0 = from.y + sCursor + ribbon / 2;
      const y1 = to.y + tCursor + ribbon / 2;
      sourceCursor.set(e.fromId, sCursor + ribbon);
      targetCursor.set(e.toId, tCursor + ribbon);
      const cx = (x0 + x1) / 2;
      const path = `M${x0},${y0} C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
      return (
        <path
          key={`${e.fromId}->${e.toId}-${idx}`}
          d={path}
          fill="none"
          stroke={from.accent ?? SEVERITY_HEX[2]}
          strokeOpacity={FLOW_OPACITY}
          strokeWidth={Math.max(1, ribbon)}
          className="atlas-shimmer-stroke"
          style={{ animationDelay: `${(idx % 8) * 200}ms` }}
        >
          <title>{e.title ?? `${from.label} → ${to.label}: ${e.weight}`}</title>
        </path>
      );
    })
    .filter(Boolean);

  return (
    <svg
      role="img"
      aria-label={ariaLabel ?? "Sankey flow diagram"}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      {ribbons}
      {Array.from(layout.values()).map((n) => (
        <g key={n.id}>
          <rect
            x={n.x}
            y={n.y}
            width={n.w}
            height={n.h}
            fill={n.accent ?? SEVERITY_HEX[2]}
            rx={1}
          >
            <title>{`${n.label}: in ${n.inflow}, out ${n.outflow}`}</title>
          </rect>
          <text
            x={n.column === Math.max(...columns) ? n.x - 4 : n.x + n.w + 4}
            y={n.y + n.h / 2}
            dominantBaseline="middle"
            textAnchor={n.column === Math.max(...columns) ? "end" : "start"}
            fontSize={10}
            fill="#cbd5f5"
            fontFamily="var(--font-geist-mono, monospace)"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
