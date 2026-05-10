type ContourLayer = {
  className: string;
  stroke: string;
  opacity: number;
  paths: string[];
  strokeWidth: number;
};

/**
 * Drifting watershed-like topographic background. Two stacked SVG layers
 * with offset speeds so they parallax. Pure SVG paths, no deps.
 *
 * Mounted by routes that want immersive depth (/, /water, /water/mechanism).
 * Renders absolutely behind content; pointer-events disabled. Honors
 * prefers-reduced-motion via globals.css `.atlas-topo-layer-*`.
 */
export default function TopographicBackground({ tone = "cyan" }: { tone?: "cyan" | "amber" }) {
  const accent = tone === "amber" ? "#fbbf24" : "#22d3ee";
  // Hand-tuned watershed-like contours. Coordinates kept stable to avoid hydration mismatch.
  const layers: ContourLayer[] = [
    {
      className: "atlas-topo-layer atlas-topo-layer-a",
      stroke: accent,
      opacity: 0.06,
      strokeWidth: 0.9,
      paths: [
        "M-200,520 C100,460 300,540 600,500 C900,460 1100,520 1400,480",
        "M-200,560 C150,510 360,570 660,520 C960,470 1140,560 1500,520",
        "M-200,610 C200,540 380,620 720,560 C1020,510 1180,600 1520,560",
        "M-200,660 C220,580 420,660 760,600 C1080,540 1240,640 1560,600",
        "M-200,710 C240,620 460,710 800,640 C1120,580 1280,680 1600,640",
      ],
    },
    {
      className: "atlas-topo-layer atlas-topo-layer-b",
      stroke: "#94a3b8",
      opacity: 0.05,
      strokeWidth: 0.6,
      paths: [
        "M-200,460 C150,400 350,480 700,440 C1050,400 1200,460 1500,420",
        "M-200,500 C200,430 420,510 780,460 C1100,420 1260,500 1600,460",
        "M-200,540 C250,460 480,540 840,490 C1180,440 1320,520 1700,490",
        "M-200,580 C300,490 540,580 900,520 C1240,470 1380,550 1800,520",
      ],
    },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[820px] overflow-hidden"
    >
      {/* Subtle radial wash to anchor the topo against the body bg. */}
      <div
        className="absolute inset-x-0 top-0 h-[820px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(34, 211, 238, 0.10), transparent 70%)",
        }}
      />
      {layers.map((layer, idx) => (
        <svg
          key={`topo-${idx}`}
          className={`absolute inset-x-[-10%] top-0 h-[820px] w-[120%] ${layer.className}`}
          viewBox="-200 0 1600 820"
          preserveAspectRatio="xMidYMid slice"
        >
          <g fill="none" stroke={layer.stroke} strokeWidth={layer.strokeWidth} strokeLinecap="round" strokeOpacity={layer.opacity}>
            {layer.paths.map((d, pIdx) => (
              <path key={pIdx} d={d} />
            ))}
          </g>
        </svg>
      ))}
      {/* River-glow streaks: thin diagonal accents. */}
      <svg
        aria-hidden="true"
        className="absolute inset-x-[-5%] top-0 h-[820px] w-[110%]"
        viewBox="0 0 1400 820"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="atlas-topo-river" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0" />
            <stop offset="50%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M-100,360 C300,280 700,420 1500,300" fill="none" stroke="url(#atlas-topo-river)" strokeWidth={1.4} />
        <path d="M-100,420 C400,330 900,460 1500,360" fill="none" stroke="url(#atlas-topo-river)" strokeWidth={1.1} />
      </svg>
    </div>
  );
}
