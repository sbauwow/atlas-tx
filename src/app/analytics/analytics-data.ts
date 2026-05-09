import { readFile } from "fs/promises";
import * as path from "path";

const ANALYTICS_DIR = path.join(process.cwd(), "public", "cache", "analytics");

const QUADRANT_LABELS = {
  "high-pressure-high-risk": "High pressure + high risk",
  "high-pressure-lower-risk": "High pressure + lower risk",
  "lower-pressure-high-risk": "Lower pressure + high risk",
  "lower-pressure-lower-risk": "Lower pressure + lower risk",
} as const;

type CountyRef = {
  name: string;
  slug: string;
};

type CountyMover = {
  county: CountyRef;
  movement: "new" | "steady" | "up" | "down";
  currentRank: number;
  previousRank: number | null;
  rankDelta: number | null;
  currentRiskScore: number;
  previousRiskScore: number | null;
  scoreDelta: number | null;
  currentPressureScore: number;
  previousPressureScore: number | null;
};

type CountyMoversArtifact = {
  artifact?: string;
  artifactVersion?: number;
  generatedAt?: string;
  baselineSnapshotAt?: string | null;
  comparisonSnapshotAt?: string | null;
  notes?: string[];
  movers?: CountyMover[];
};

type ScatterPoint = {
  county: CountyRef;
  x: number;
  y: number;
  population: number | null;
  impairedSegmentCount: number;
  hydrologyLayerHitCount: number;
  systemCount: number;
  violationCount: number;
  quadrant: keyof typeof QUADRANT_LABELS;
};

type PressureRiskScatterArtifact = {
  artifact?: string;
  artifactVersion?: number;
  generatedAt?: string;
  axes?: {
    x?: string;
    y?: string;
  };
  notes?: string[];
  points?: ScatterPoint[];
};

type FreshnessSource = {
  sourceId: string;
  label: string;
  artifactPath: string;
  source: string;
  generatedAt: string;
  ageDays: number;
  status: "fresh" | "aging" | "stale" | string;
  rowCount: number | null;
  notes?: string[];
};

type SourceFreshnessArtifact = {
  artifact?: string;
  artifactVersion?: number;
  generatedAt?: string;
  sources?: FreshnessSource[];
};

type ScreeningLane = {
  title: string;
  badge: string;
  href: string;
  primary: string;
  secondary: string;
};

type WhatChangedChip = {
  label: string;
  value: string;
  tone: "accent" | "warning" | "neutral";
};

type QuadrantSummary = {
  id: string;
  label: string;
  count: number;
  share: number;
  note: string;
  tone: "accent" | "warning" | "neutral";
};

export type StatewideAnalyticsViewModel = {
  generatedAt: string | null;
  historyLength: number;
  moversCount: number;
  scatterCount: number;
  freshSourceCount: number;
  moversGeneratedAt: string | null;
  scatterGeneratedAt: string | null;
  moversComparisonSummary: string;
  whatChangedHeadline: string;
  whatChangedDetail: string;
  whatChangedWindowLabel: string;
  whatChangedChips: WhatChangedChip[];
  whatChangedLanes: ScreeningLane[];
  moversNotes: string[];
  scatterNotes: string[];
  moversRows: Array<{
    id: string;
    label: string;
    href: string;
    currentValue: number;
    previousValue: number | null;
    delta: number | null;
    rank: number;
    movementLabel: string;
    note: string;
  }>;
  screeningLanes: ScreeningLane[];
  pressureBars: Array<{
    id: string;
    label: string;
    value: number;
    secondaryValue: number;
    note: string;
    tone: "accent" | "warning" | "neutral";
  }>;
  quadrantBars: QuadrantSummary[];
  scatterPoints: Array<{
    id: string;
    label: string;
    x: number;
    y: number;
    size: number;
    category: "default" | "focus" | "stable" | "risk";
    detail: string;
    href: string;
  }>;
  sourceSummary: Array<{
    sourceId: string;
    label: string;
    artifactPath: string;
    source: string;
    generatedAt: string;
    freshness: string;
    rowCountLabel: string;
    notes: string[];
  }>;
};

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatCompactInteger(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Unknown";
  }

  const useCompact = Math.abs(value) >= 1000;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: useCompact ? 1 : 0,
    notation: useCompact ? "compact" : "standard",
  }).format(value);
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

function movementLabel(mover: CountyMover) {
  if (mover.movement === "up") {
    return mover.rankDelta ? `Up ${Math.abs(mover.rankDelta)} rank slots` : "Moved up";
  }

  if (mover.movement === "down") {
    return mover.rankDelta ? `Down ${Math.abs(mover.rankDelta)} rank slots` : "Moved down";
  }

  if (mover.movement === "new") {
    return "New to the comparison window";
  }

  return "Steady in the comparison window";
}

function classifyScatterPoint(point: ScatterPoint): "default" | "focus" | "stable" | "risk" {
  if (point.quadrant === "high-pressure-high-risk") {
    return "risk";
  }

  if (point.y >= 10 || point.x >= 10) {
    return "focus";
  }

  if (point.quadrant === "lower-pressure-lower-risk") {
    return "stable";
  }

  return "default";
}

function buildScatterDetail(point: ScatterPoint) {
  return `${QUADRANT_LABELS[point.quadrant]} · ${formatCompactInteger(point.violationCount)} violations · ${formatCompactInteger(point.impairedSegmentCount)} impaired segments · ${formatCompactInteger(point.systemCount)} systems`;
}

async function readJsonIfPresent<T>(filename: string): Promise<T | null> {
  try {
    const contents = await readFile(path.join(ANALYTICS_DIR, filename), "utf8");
    return JSON.parse(contents) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ENOENT")) {
      return null;
    }

    throw error;
  }
}

function buildComparisonSummary(moversArtifact: CountyMoversArtifact | null) {
  if (!moversArtifact?.baselineSnapshotAt || !moversArtifact.comparisonSnapshotAt) {
    return "Wave 1 comparison snapshots are not available yet.";
  }

  return `Comparing ${formatTimestamp(moversArtifact.baselineSnapshotAt)} against ${formatTimestamp(moversArtifact.comparisonSnapshotAt)}.`;
}

function formatSignedNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }

  const formatted = formatNumber(Math.abs(value), digits);
  if (value === 0) {
    return `±${formatted}`;
  }

  return `${value > 0 ? "+" : "−"}${formatted}`;
}

function movementBadge(movement: CountyMover["movement"]): string {
  switch (movement) {
    case "up":
      return "Riser";
    case "down":
      return "Faller";
    case "new":
      return "New";
    default:
      return "Steady";
  }
}

function buildWhatChangedLane(
  movers: CountyMover[],
  historyLength: number,
  moversArtifact: CountyMoversArtifact | null,
): Pick<
  StatewideAnalyticsViewModel,
  "whatChangedHeadline" | "whatChangedDetail" | "whatChangedWindowLabel" | "whatChangedChips" | "whatChangedLanes"
> {
  const upwardMovers = movers
    .filter((mover) => mover.movement === "up")
    .sort((left, right) => Math.abs(right.rankDelta ?? 0) - Math.abs(left.rankDelta ?? 0) || left.currentRank - right.currentRank);
  const downwardMovers = movers
    .filter((mover) => mover.movement === "down")
    .sort((left, right) => Math.abs(right.rankDelta ?? 0) - Math.abs(left.rankDelta ?? 0) || left.currentRank - right.currentRank);
  const newMovers = movers.filter((mover) => mover.movement === "new").sort((left, right) => left.currentRank - right.currentRank);
  const steadyMovers = movers.filter((mover) => mover.movement === "steady").sort((left, right) => left.currentRank - right.currentRank);
  const scoreShifts = movers
    .filter((mover) => typeof mover.scoreDelta === "number" && mover.scoreDelta !== 0)
    .sort((left, right) => Math.abs(right.scoreDelta ?? 0) - Math.abs(left.scoreDelta ?? 0) || left.currentRank - right.currentRank);

  const whatChangedWindowLabel =
    moversArtifact?.baselineSnapshotAt && moversArtifact?.comparisonSnapshotAt
      ? `${formatTimestamp(moversArtifact.baselineSnapshotAt)} → ${formatTimestamp(moversArtifact.comparisonSnapshotAt)}`
      : historyLength > 1
        ? "Committed comparison window unavailable"
        : "Single committed snapshot";

  const changedCount = upwardMovers.length + downwardMovers.length + newMovers.length;
  const whatChangedChips: WhatChangedChip[] = [
    { label: "Risks up", value: String(upwardMovers.length), tone: upwardMovers.length ? "warning" : "neutral" },
    { label: "Risks down", value: String(downwardMovers.length), tone: downwardMovers.length ? "accent" : "neutral" },
    { label: "New in lane", value: String(newMovers.length), tone: newMovers.length ? "accent" : "neutral" },
    { label: "Steady", value: String(steadyMovers.length), tone: steadyMovers.length ? "neutral" : "accent" },
  ];

  if (historyLength < 2 || !moversArtifact?.baselineSnapshotAt || !moversArtifact.comparisonSnapshotAt) {
    return {
      whatChangedHeadline: "What changed will activate once Atlas has at least two committed statewide snapshots.",
      whatChangedDetail:
        movers.length > 0
          ? "Current county ranks still render below, but this lane avoids period-over-period claims until a real comparison window is committed."
          : "No committed mover rows are available yet, so Atlas can only show empty-state messaging for now.",
      whatChangedWindowLabel,
      whatChangedChips,
      whatChangedLanes: [],
    };
  }

  const seen = new Set<string>();
  const whatChangedLanes: ScreeningLane[] = [];

  const pushLane = (mover: CountyMover, primary: string, secondary: string) => {
    if (seen.has(mover.county.slug) || whatChangedLanes.length >= 4) {
      return;
    }

    seen.add(mover.county.slug);
    whatChangedLanes.push({
      title: mover.county.name,
      badge: movementBadge(mover.movement),
      href: `/counties/${mover.county.slug}`,
      primary,
      secondary,
    });
  };

  upwardMovers.forEach((mover) => {
    pushLane(
      mover,
      `Rank #${mover.currentRank} · ${movementLabel(mover)}`,
      `Risk ${formatSignedNumber(mover.scoreDelta ?? 0)} · pressure ${formatNumber(mover.currentPressureScore)} · prior rank ${mover.previousRank ?? "—"}`,
    );
  });

  downwardMovers.forEach((mover) => {
    pushLane(
      mover,
      `Rank #${mover.currentRank} · ${movementLabel(mover)}`,
      `Risk ${formatSignedNumber(mover.scoreDelta ?? 0)} · pressure ${formatNumber(mover.currentPressureScore)} · prior rank ${mover.previousRank ?? "—"}`,
    );
  });

  newMovers.forEach((mover) => {
    pushLane(
      mover,
      `Entered at rank #${mover.currentRank} · risk ${formatNumber(mover.currentRiskScore)}`,
      `Pressure ${formatNumber(mover.currentPressureScore)} · no prior committed rank in this comparison window.`,
    );
  });

  scoreShifts.forEach((mover) => {
    pushLane(
      mover,
      `Rank #${mover.currentRank} · risk ${formatNumber(mover.currentRiskScore)}`,
      `Risk ${formatSignedNumber(mover.scoreDelta ?? 0)} versus prior snapshot · ${movementLabel(mover)}.`,
    );
  });

  if (!whatChangedLanes.length) {
    steadyMovers.slice(0, 4).forEach((mover) => {
      pushLane(
        mover,
        `Held rank #${mover.currentRank} · risk ${formatNumber(mover.currentRiskScore)}`,
        `No movement between committed snapshots · pressure ${formatNumber(mover.currentPressureScore)} · prior risk ${formatNumber(mover.previousRiskScore ?? mover.currentRiskScore)}.`,
      );
    });
  }

  const whatChangedHeadline =
    changedCount > 0
      ? `Recent movement across committed snapshots: ${upwardMovers.length} up, ${downwardMovers.length} down, ${newMovers.length} new.`
      : `No county movement was recorded across the latest committed comparison window.`;
  const whatChangedDetail =
    changedCount > 0
      ? `${steadyMovers.length} counties stayed steady while the lane below surfaces the clearest movement labels and score changes already committed to county-movers.json.`
      : steadyMovers.length > 0
        ? `${steadyMovers.length} counties are marked steady, so Atlas falls back to the highest-ranked persistent counties instead of inventing a trend.`
        : "The mover artifact is present but does not contain enough rows to build a recent-movement lane yet.";

  return {
    whatChangedHeadline,
    whatChangedDetail,
    whatChangedWindowLabel,
    whatChangedChips,
    whatChangedLanes,
  };
}

export async function loadStatewideAnalyticsViewModel(): Promise<StatewideAnalyticsViewModel> {
  const [historyArtifact, moversArtifact, scatterArtifact, freshnessArtifact] = await Promise.all([
    readJsonIfPresent<{ historyLength?: number }>("county-history.json"),
    readJsonIfPresent<CountyMoversArtifact>("county-movers.json"),
    readJsonIfPresent<PressureRiskScatterArtifact>("pressure-risk-scatter.json"),
    readJsonIfPresent<SourceFreshnessArtifact>("source-freshness.json"),
  ]);

  const historyLength = historyArtifact?.historyLength ?? 0;
  const movers = [...(moversArtifact?.movers ?? [])].sort((left, right) => left.currentRank - right.currentRank);
  const points = [...(scatterArtifact?.points ?? [])];
  const sources = [...(freshnessArtifact?.sources ?? [])];
  const whatChangedLane = buildWhatChangedLane(movers, historyLength, moversArtifact);

  const moversRows = movers.slice(0, 20).map((mover) => ({
    id: mover.county.slug,
    label: mover.county.name,
    href: `/counties/${mover.county.slug}`,
    currentValue: mover.currentRiskScore,
    previousValue: mover.previousRiskScore,
    delta: mover.scoreDelta,
    rank: mover.currentRank,
    movementLabel: movementLabel(mover),
    note: `Pressure ${formatNumber(mover.currentPressureScore)} · previous rank ${mover.previousRank ?? "—"}`,
  }));

  const upwardMovers = movers.filter((mover) => mover.movement === "up").slice(0, 3);
  const newestMovers = movers.filter((mover) => mover.movement === "new").slice(0, 2);
  const highRisk = [...movers].slice(0, 3);

  const screeningLanes: ScreeningLane[] = [
    ...upwardMovers.map((mover) => ({
      title: mover.county.name,
      badge: "Riser",
      href: `/counties/${mover.county.slug}`,
      primary: `Rank #${mover.currentRank} · risk ${formatNumber(mover.currentRiskScore)}`,
      secondary: mover.rankDelta ? `Up ${Math.abs(mover.rankDelta)} slots with pressure ${formatNumber(mover.currentPressureScore)}.` : `Movement flagged with pressure ${formatNumber(mover.currentPressureScore)}.`,
    })),
    ...newestMovers.map((mover) => ({
      title: mover.county.name,
      badge: "New",
      href: `/counties/${mover.county.slug}`,
      primary: `Entered at rank #${mover.currentRank}`,
      secondary: `Current risk ${formatNumber(mover.currentRiskScore)} · pressure ${formatNumber(mover.currentPressureScore)}.`,
    })),
  ];

  if (!screeningLanes.length) {
    screeningLanes.push(
      ...highRisk.map((mover) => ({
        title: mover.county.name,
        badge: mover.movement === "steady" ? "Steady" : mover.movement,
        href: `/counties/${mover.county.slug}`,
        primary: `Rank #${mover.currentRank} · risk ${formatNumber(mover.currentRiskScore)}`,
        secondary: `Pressure ${formatNumber(mover.currentPressureScore)} · ${movementLabel(mover)}.`,
      })),
    );
  }

  const topPressurePoints: StatewideAnalyticsViewModel["pressureBars"] = [...points]
    .sort((left, right) => right.x - left.x || right.y - left.y)
    .slice(0, 6)
    .map((point) => ({
      id: point.county.slug,
      label: point.county.name,
      value: point.x,
      secondaryValue: point.y,
      note: `${QUADRANT_LABELS[point.quadrant]} · ${formatCompactInteger(point.violationCount)} violations`,
      tone: point.quadrant === "high-pressure-high-risk" ? "warning" : point.quadrant === "lower-pressure-lower-risk" ? "neutral" : "accent",
    }));

  const quadrantCounts = points.reduce<Record<string, number>>((accumulator, point) => {
    accumulator[point.quadrant] = (accumulator[point.quadrant] ?? 0) + 1;
    return accumulator;
  }, {});

  const quadrantBars: QuadrantSummary[] = (Object.keys(QUADRANT_LABELS) as Array<keyof typeof QUADRANT_LABELS>).map((quadrant) => {
    const count = quadrantCounts[quadrant] ?? 0;
    const share = points.length ? Number(((count / points.length) * 100).toFixed(1)) : 0;
    return {
      id: quadrant,
      label: QUADRANT_LABELS[quadrant],
      count,
      share,
      note: `${count} ${count === 1 ? "county" : "counties"} · ${share}% of current scatter points`,
      tone: quadrant === "high-pressure-high-risk" ? "warning" : quadrant === "lower-pressure-lower-risk" ? "neutral" : "accent",
    };
  });

  const scatterPoints = points
    .sort((left, right) => right.y - left.y || right.x - left.x)
    .map((point) => ({
      id: point.county.slug,
      label: point.county.name,
      x: point.x,
      y: point.y,
      size: Math.max(point.violationCount, point.systemCount, 8),
      category: classifyScatterPoint(point),
      detail: buildScatterDetail(point),
      href: `/counties/${point.county.slug}`,
    }));

  const sourceSummary = sources.map((source) => ({
    sourceId: source.sourceId,
    label: source.label,
    artifactPath: source.artifactPath,
    source: source.source,
    generatedAt: source.generatedAt,
    freshness: `${source.status} · ${formatNumber(source.ageDays, 1)} days old`,
    rowCountLabel: typeof source.rowCount === "number" ? `${formatCompactInteger(source.rowCount)} rows cached` : "Row count unavailable",
    notes: source.notes?.slice(0, 2) ?? [],
  }));

  const generatedAtCandidates = [moversArtifact?.generatedAt, scatterArtifact?.generatedAt, freshnessArtifact?.generatedAt].filter(
    (value): value is string => Boolean(value),
  );
  const generatedAt = generatedAtCandidates.sort().at(-1) ?? null;

  return {
    generatedAt,
    historyLength,
    moversCount: movers.length,
    scatterCount: points.length,
    freshSourceCount: sources.filter((source) => source.status === "fresh").length,
    moversGeneratedAt: moversArtifact?.generatedAt ?? null,
    scatterGeneratedAt: scatterArtifact?.generatedAt ?? null,
    moversComparisonSummary: buildComparisonSummary(moversArtifact),
    whatChangedHeadline: whatChangedLane.whatChangedHeadline,
    whatChangedDetail: whatChangedLane.whatChangedDetail,
    whatChangedWindowLabel: whatChangedLane.whatChangedWindowLabel,
    whatChangedChips: whatChangedLane.whatChangedChips,
    whatChangedLanes: whatChangedLane.whatChangedLanes,
    moversNotes: moversArtifact?.notes ?? [],
    scatterNotes: scatterArtifact?.notes ?? [],
    moversRows,
    screeningLanes,
    pressureBars: topPressurePoints,
    quadrantBars,
    scatterPoints,
    sourceSummary,
  };
}

export { formatTimestamp, formatNumber };
