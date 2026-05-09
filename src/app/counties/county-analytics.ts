import { readFile } from "fs/promises";
import * as path from "path";

import type { CountyBreakdown } from "@/lib/atlas-county-explorer";
import { decomposeCountyDrivers } from "@/lib/analytics/county";

const ANALYTICS_DIR = path.join(process.cwd(), "public", "cache", "analytics");

type CountyRef = {
  name: string;
  slug: string;
};

type CountyHistorySnapshot = {
  snapshotAt: string;
  metrics: {
    countyRiskScore: number;
    pressureScore: number;
    systemCount: number;
    violationCount: number;
    impairedSegmentCount: number;
    affectedPopulation: number | null;
    population: number | null;
    hydrologyLayerHitCount: number;
  };
  ranks: {
    risk: number;
    pressure: number;
  };
  highlights?: {
    topSystems?: Array<{
      pwsId: string;
      pwsName: string;
      score: number;
      violationCount: number;
    }>;
  };
};

type CountyHistoryRecord = {
  county: CountyRef;
  latestSnapshotAt: string;
  snapshots: CountyHistorySnapshot[];
};

type CountyHistoryArtifact = {
  generatedAt: string;
  provenance: {
    method: string;
    notes: string[];
  };
  counties: CountyHistoryRecord[];
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
  baselineSnapshotAt: string | null;
  comparisonSnapshotAt: string | null;
  notes: string[];
  movers: CountyMover[];
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
  quadrant:
    | "high-pressure-high-risk"
    | "high-pressure-lower-risk"
    | "lower-pressure-high-risk"
    | "lower-pressure-lower-risk";
};

type PressureRiskScatterArtifact = {
  generatedAt: string;
  notes: string[];
  points: ScatterPoint[];
};

type TrendPoint = {
  label: string;
  timestamp: string;
  riskScore: number;
  pressureScore: number;
};

type DriverSummary = {
  sourceId: string;
  label: string;
  rank: number | null;
  percentile: number | null;
  rawValue: number | null;
  scoreContribution: number | null;
  shareOfComposite: number | null;
};

type CalloutPanel = {
  title: string;
  body: string;
  detail: string;
};

export type CountyAnalyticsViewModel = {
  available: boolean;
  generatedAt: string | null;
  trendPoints: TrendPoint[];
  currentRiskScore: number | null;
  previousRiskScore: number | null;
  currentPressureScore: number | null;
  previousPressureScore: number | null;
  riskDelta: number | null;
  pressureDelta: number | null;
  riskRank: number | null;
  pressureRank: number | null;
  movement: CountyMover["movement"] | null;
  rankDelta: number | null;
  topDrivers: DriverSummary[];
  topSystems: Array<{
    pwsId: string;
    pwsName: string;
    score: number;
    violationCount: number;
  }>;
  quadrantLabel: string | null;
  quadrantDescription: string | null;
  callout: CalloutPanel;
  provenanceMethod: string | null;
  provenanceNotes: string[];
  moverNotes: string[];
  scatterNotes: string[];
};

function roundToTwo(value: number): number {
  return Number(value.toFixed(2));
}

function formatSnapshotLabel(timestamp: string, index: number): string {
  const [date, timeWithZone] = timestamp.split("T");
  const time = timeWithZone?.slice(0, 5) ?? `Run ${index + 1}`;
  const shortDate = date?.slice(5) ?? "Snapshot";
  return `${shortDate} ${time}Z`;
}

function movementLabel(movement: CountyMover["movement"] | null, rankDelta: number | null): string {
  if (movement === "up" && rankDelta !== null) {
    return `up ${rankDelta} spots in the risk ranking`;
  }

  if (movement === "down" && rankDelta !== null) {
    return `down ${Math.abs(rankDelta)} spots in the risk ranking`;
  }

  if (movement === "new") {
    return "new to the committed comparison window";
  }

  return "steady across the latest committed comparison window";
}

function describeQuadrant(quadrant: ScatterPoint["quadrant"] | null): { label: string; description: string } | null {
  if (!quadrant) {
    return null;
  }

  switch (quadrant) {
    case "high-pressure-high-risk":
      return {
        label: "High pressure + high risk",
        description: "This county sits above the current statewide median on both the pressure and risk axes in the committed scatter snapshot.",
      };
    case "high-pressure-lower-risk":
      return {
        label: "High pressure + lower risk",
        description: "Surface-water pressure is elevated relative to peers, but the county risk score is below the current statewide median.",
      };
    case "lower-pressure-high-risk":
      return {
        label: "Lower pressure + high risk",
        description: "Drinking-water risk is elevated relative to peers even though the county sits below the current statewide median on the pressure axis.",
      };
    case "lower-pressure-lower-risk":
      return {
        label: "Lower pressure + lower risk",
        description: "Both axes sit below the current statewide medians in the committed scatter snapshot.",
      };
    default:
      return null;
  }
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

function buildFallbackCallout(breakdown: CountyBreakdown): CalloutPanel {
  const topHighlight = breakdown.highlights[0];
  return {
    title: "What this means",
    body: topHighlight
      ? `${breakdown.overview.county.name} currently stands out most on ${topHighlight.label.toLowerCase()} within the explorer scoring stack.`
      : `${breakdown.overview.county.name} has a county explorer score, but no committed analytics history is available for trend interpretation yet.`,
    detail:
      "This page is showing the live county explorer breakdown only. Trend language appears once the committed analytics cache includes this county in county-history, county-movers, and pressure-risk artifacts.",
  };
}

export async function buildCountyAnalyticsViewModel(breakdown: CountyBreakdown): Promise<CountyAnalyticsViewModel> {
  const [historyArtifact, moversArtifact, scatterArtifact] = await Promise.all([
    readJsonIfPresent<CountyHistoryArtifact>("county-history.json"),
    readJsonIfPresent<CountyMoversArtifact>("county-movers.json"),
    readJsonIfPresent<PressureRiskScatterArtifact>("pressure-risk-scatter.json"),
  ]);

  const historyRecord = historyArtifact?.counties.find((entry) => entry.county.slug === breakdown.overview.county.slug) ?? null;
  const mover = moversArtifact?.movers.find((entry) => entry.county.slug === breakdown.overview.county.slug) ?? null;
  const scatterPoint = scatterArtifact?.points.find((entry) => entry.county.slug === breakdown.overview.county.slug) ?? null;

  if (!historyRecord) {
    return {
      available: false,
      generatedAt: historyArtifact?.generatedAt ?? null,
      trendPoints: [],
      currentRiskScore: null,
      previousRiskScore: null,
      currentPressureScore: null,
      previousPressureScore: null,
      riskDelta: null,
      pressureDelta: null,
      riskRank: null,
      pressureRank: null,
      movement: null,
      rankDelta: null,
      topDrivers: [],
      topSystems: [],
      quadrantLabel: null,
      quadrantDescription: null,
      callout: buildFallbackCallout(breakdown),
      provenanceMethod: historyArtifact?.provenance.method ?? null,
      provenanceNotes: historyArtifact?.provenance.notes ?? [],
      moverNotes: moversArtifact?.notes ?? [],
      scatterNotes: scatterArtifact?.notes ?? [],
    };
  }

  const snapshots = historyRecord.snapshots;
  const latestSnapshot = snapshots.at(-1) ?? null;
  const previousSnapshot = snapshots.at(-2) ?? null;
  const quadrants = describeQuadrant(scatterPoint?.quadrant ?? null);
  const countyCount = historyArtifact?.counties.length ?? 0;
  const rankDenominators = Object.fromEntries(
    Object.keys(breakdown.overview.ranks).map((sourceId) => [sourceId, countyCount]),
  );
  const topDrivers = decomposeCountyDrivers({
    compositeScore: breakdown.overview.compositeScore,
    ranks: breakdown.overview.ranks,
    sourceValues: breakdown.overview.sourceValues,
    metrics: breakdown.overview.metrics,
    highlights: breakdown.highlights,
    rankDenominators,
  })
    .slice(0, 4)
    .map((driver) => ({
      sourceId: driver.sourceId,
      label: driver.label,
      rank: driver.rank,
      percentile: driver.percentile,
      rawValue: driver.rawValue,
      scoreContribution: driver.scoreContribution,
      shareOfComposite: driver.shareOfComposite,
    }));

  const topDriver = topDrivers[0] ?? null;
  const currentRiskScore = latestSnapshot?.metrics.countyRiskScore ?? null;
  const previousRiskScore = previousSnapshot?.metrics.countyRiskScore ?? null;
  const currentPressureScore = latestSnapshot?.metrics.pressureScore ?? null;
  const previousPressureScore = previousSnapshot?.metrics.pressureScore ?? null;
  const riskDelta = currentRiskScore !== null && previousRiskScore !== null ? roundToTwo(currentRiskScore - previousRiskScore) : null;
  const pressureDelta =
    currentPressureScore !== null && previousPressureScore !== null ? roundToTwo(currentPressureScore - previousPressureScore) : null;
  const topSystems = latestSnapshot?.highlights?.topSystems?.slice(0, 3) ?? [];
  const trendPoints = snapshots.map((snapshot, index) => ({
    label: formatSnapshotLabel(snapshot.snapshotAt, index),
    timestamp: snapshot.snapshotAt,
    riskScore: snapshot.metrics.countyRiskScore,
    pressureScore: snapshot.metrics.pressureScore,
  }));

  const callout: CalloutPanel = {
    title: "What changed and why",
    body: topDriver
      ? `${breakdown.overview.county.name} is currently driven most by ${topDriver.label.toLowerCase()} in the county explorer stack, while the committed analytics lane classifies it as ${quadrants?.label.toLowerCase() ?? "an uncategorized county"}.`
      : `${breakdown.overview.county.name} has committed analytics history, but no ranked driver decomposition was available from the current explorer breakdown.`,
    detail: previousSnapshot
      ? riskDelta === 0 && pressureDelta === 0
        ? `Across the latest two committed snapshots, both the county risk score and pressure score are unchanged, so the analytical read is about persistent position rather than a new spike. The county is ${movementLabel(mover?.movement ?? null, mover?.rankDelta ?? null)}.`
        : `Across the latest two committed snapshots, the county risk score moved ${(riskDelta ?? 0) > 0 ? "up" : "down"} ${Math.abs(riskDelta ?? 0)} points and the pressure score moved ${(pressureDelta ?? 0) > 0 ? "up" : "down"} ${Math.abs(pressureDelta ?? 0)} points. The county is ${movementLabel(mover?.movement ?? null, mover?.rankDelta ?? null)}.`
      : "Only one committed county-history snapshot is available for this county, so the page can describe current position but not a real period-over-period delta yet.",
  };

  return {
    available: true,
    generatedAt: historyArtifact?.generatedAt ?? scatterArtifact?.generatedAt ?? null,
    trendPoints,
    currentRiskScore,
    previousRiskScore,
    currentPressureScore,
    previousPressureScore,
    riskDelta,
    pressureDelta,
    riskRank: latestSnapshot?.ranks.risk ?? null,
    pressureRank: latestSnapshot?.ranks.pressure ?? null,
    movement: mover?.movement ?? null,
    rankDelta: mover?.rankDelta ?? null,
    topDrivers,
    topSystems,
    quadrantLabel: quadrants?.label ?? null,
    quadrantDescription: quadrants?.description ?? null,
    callout,
    provenanceMethod: historyArtifact?.provenance.method ?? null,
    provenanceNotes: historyArtifact?.provenance.notes ?? [],
    moverNotes: moversArtifact?.notes ?? [],
    scatterNotes: scatterArtifact?.notes ?? [],
  };
}
