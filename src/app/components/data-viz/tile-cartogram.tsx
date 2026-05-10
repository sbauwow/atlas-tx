import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";
import { SEVERITY_HEX, type SeverityLevel } from "@/app/design/states";

export type TileCartogramCounty = {
  slug: string;
  name: string;
  severity: SeverityLevel;
  /** Optional secondary signal — colors a small dot in the upper right of the tile. */
  flag?: boolean;
  /** Tooltip body. */
  title: string;
  /** Optional href; tile becomes an anchor. */
  href?: string;
};

export type TileCartogramProps = {
  counties: TileCartogramCounty[];
  /** Number of columns. Higher → smaller tiles. ~24 reads well at full width. */
  cols?: number;
  /** Tile edge length in px. */
  tile?: number;
  selectedSlug?: string | null;
  ariaLabel?: string;
};

/**
 * Lays Texas counties into a regular tile grid using lat/lon binning,
 * preserving rough geographic shape without true polygons. Each tile = one
 * county, color = severity. Reads as a small-multiples version of the
 * choropleth: you see the whole state at once and outliers pop because tile
 * area is uniform (no Loving County getting visually drowned by Harris).
 */
export default function TileCartogram({
  counties,
  cols = 26,
  tile = 14,
  selectedSlug,
  ariaLabel,
}: TileCartogramProps) {
  const rows = Math.ceil(254 / cols);
  const lons: number[] = [];
  const lats: number[] = [];
  for (const slug of Object.keys(TEXAS_COUNTY_CENTROIDS)) {
    const c = TEXAS_COUNTY_CENTROIDS[slug];
    if (!c) continue;
    lons.push(c.lon);
    lats.push(c.lat);
  }
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const lonSpan = maxLon - minLon || 1;
  const latSpan = maxLat - minLat || 1;

  const occupancy = new Map<string, TileCartogramCounty & { col: number; row: number }>();
  const bySlug = new Map(counties.map((c) => [c.slug, c]));

  // First pass: ideal grid cell from lat/lon
  type Placement = TileCartogramCounty & { col: number; row: number };
  const placements: Placement[] = [];
  for (const slug of Object.keys(TEXAS_COUNTY_CENTROIDS).sort()) {
    const meta = bySlug.get(slug);
    if (!meta) continue;
    const c = TEXAS_COUNTY_CENTROIDS[slug];
    const idealCol = Math.round(((c.lon - minLon) / lonSpan) * (cols - 1));
    const idealRow = Math.round(((maxLat - c.lat) / latSpan) * (rows - 1));
    placements.push({ ...meta, col: idealCol, row: idealRow });
  }

  // Resolve collisions by spiraling out from the ideal cell to the nearest free one.
  const taken = new Set<string>();
  const directions: Array<[number, number]> = [
    [0, 0],
    [1, 0], [0, 1], [-1, 0], [0, -1],
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [2, 0], [0, 2], [-2, 0], [0, -2],
    [2, 1], [2, -1], [-2, 1], [-2, -1],
    [1, 2], [-1, 2], [1, -2], [-1, -2],
    [2, 2], [-2, 2], [2, -2], [-2, -2],
    [3, 0], [0, 3], [-3, 0], [0, -3],
  ];
  for (const placement of placements) {
    let placed = false;
    for (const [dCol, dRow] of directions) {
      const col = placement.col + dCol;
      const row = placement.row + dRow;
      if (col < 0 || row < 0 || col >= cols) continue;
      const key = `${col}:${row}`;
      if (taken.has(key)) continue;
      taken.add(key);
      occupancy.set(key, { ...placement, col, row });
      placed = true;
      break;
    }
    if (!placed) {
      // Fallback: append to end
      let col = 0;
      let row = rows;
      while (taken.has(`${col}:${row}`)) {
        col += 1;
        if (col >= cols) {
          col = 0;
          row += 1;
        }
      }
      taken.add(`${col}:${row}`);
      occupancy.set(`${col}:${row}`, { ...placement, col, row });
    }
  }

  const maxRow = Math.max(...Array.from(occupancy.values()).map((p) => p.row));
  const width = cols * tile;
  const height = (maxRow + 1) * tile;

  return (
    <svg
      role="img"
      aria-label={ariaLabel ?? "Texas county tile cartogram"}
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ maxHeight: 360 }}
    >
      {Array.from(occupancy.values()).map((p) => {
        const x = p.col * tile;
        const y = p.row * tile;
        const fill = SEVERITY_HEX[p.severity];
        const isSelected = p.slug === selectedSlug;
        const tileEl = (
          <g key={p.slug} data-county-slug={p.slug}>
            <rect
              x={x + 0.5}
              y={y + 0.5}
              width={tile - 1}
              height={tile - 1}
              fill={fill}
              fillOpacity={p.severity === 0 ? 0.35 : 1}
              stroke={isSelected ? "#f8fafc" : "#020617"}
              strokeWidth={isSelected ? 1.25 : 0.5}
              rx={1}
            >
              {isSelected ? (
                <>
                  <animate attributeName="stroke-opacity" values="1;0.4;1" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="stroke-width" values="1.25;2.25;1.25" dur="2.4s" repeatCount="indefinite" />
                </>
              ) : null}
            </rect>
            {p.flag ? (
              <circle cx={x + tile - 3} cy={y + 3} r={1.5} fill="#f8fafc">
                <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
              </circle>
            ) : null}
            <title>{p.title}</title>
          </g>
        );
        return p.href ? (
          <a key={p.slug} href={p.href}>
            {tileEl}
          </a>
        ) : (
          tileEl
        );
      })}
    </svg>
  );
}
