import { promises as fs } from "node:fs";
import path from "node:path";

import { countySlug, normalizeCountyName } from "@/lib/counties";
import { loadSdwisSnapshot, type SdwisSnapshot } from "@/lib/datasets/sdwis";
import type { SurfaceWaterQualitySnapshot } from "@/lib/datasets/surface-water-quality";
import type { TwdbHydrologySnapshot } from "@/lib/datasets/twdb-hydrology";
import { scoreDrinkingWaterRisk, type DrinkingWaterRiskRow } from "@/lib/scoring/dwrs";
import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";

const ANALYTICS_DIR = path.join(process.cwd(), "public", "cache", "analytics");
const COUNTY_HISTORY_FILENAME = "county-history.json";
const COUNTY_MOVERS_FILENAME = "county-movers.json";
const PRESSURE_RISK_SCATTER_FILENAME = "pressure-risk-scatter.json";
const SOURCE_FRESHNESS_FILENAME = "source-freshness.json";
const ARTIFACT_VERSION = 1;
const HISTORY_LIMIT = 24;
const TOP_MOVER_LIMIT = 25;

type AcsCountyPopulationSnapshot = {
  generatedAt: string;
  source: string;
  rows: Array<{
    NAME: string;
    B01003_001E: string | number;
  }>;
};

type SourceDescriptor = {
  sourceId: "sdwis" | "acs-county" | "surface-water-quality" | "twdb-hydrology";
  label: string;
  artifactPath: string;
  source: string;
  generatedAt: string;
  rowCount: number;
  notes: string[];
};

export type CountyAnalyticsSnapshot = {
  snapshotAt: string;
  metrics: {
    countyRiskScore: number;
    countyRawRisk: number;
    pressureScore: number;
    systemCount: number;
    violationCount: number;
    affectedPopulation: number;
    population: number | null;
    impairedSegmentCount: number;
    impairedPublicWaterSupplySegmentCount: number;
    impairedSegmentShare: number | null;
    hydrologyLayerHitCount: number;
  };
  ranks: {
    risk: number;
    pressure: number;
  };
  highlights: {
    topSystems: Array<{
      pwsId: string;
      pwsName: string | null;
      score: number;
      violationCount: number;
    }>;
  };
};

export type CountyHistoryRecord = {
  county: {
    name: string;
    slug: string;
  };
  latestSnapshotAt: string;
  snapshots: CountyAnalyticsSnapshot[];
};

export type CountyHistoryArtifact = {
  artifact: "county-history";
  artifactVersion: number;
  generatedAt: string;
  historyLength: number;
  provenance: {
    method: string;
    sources: SourceDescriptor[];
    notes: string[];
  };
  counties: CountyHistoryRecord[];
};

export type CountyMoversArtifact = {
  artifact: "county-movers";
  artifactVersion: number;
  generatedAt: string;
  baselineSnapshotAt: string | null;
  comparisonSnapshotAt: string | null;
  movers: Array<{
    county: {
      name: string;
      slug: string;
    };
    movement: "new" | "up" | "down" | "steady";
    currentRank: number;
    previousRank: number | null;
    rankDelta: number | null;
    currentRiskScore: number;
    previousRiskScore: number | null;
    scoreDelta: number | null;
    currentPressureScore: number;
    previousPressureScore: number | null;
  }>;
  notes: string[];
};

export type PressureRiskScatterArtifact = {
  artifact: "pressure-risk-scatter";
  artifactVersion: number;
  generatedAt: string;
  axes: {
    x: "pressureScore";
    y: "countyRiskScore";
  };
  points: Array<{
    county: {
      name: string;
      slug: string;
    };
    x: number;
    y: number;
    population: number | null;
    impairedSegmentCount: number;
    hydrologyLayerHitCount: number;
    systemCount: number;
    violationCount: number;
    quadrant: "high-pressure-high-risk" | "high-pressure-lower-risk" | "lower-pressure-high-risk" | "lower-pressure-lower-risk";
  }>;
  notes: string[];
};

export type SourceFreshnessArtifact = {
  artifact: "source-freshness";
  artifactVersion: number;
  generatedAt: string;
  sources: Array<{
    sourceId: SourceDescriptor["sourceId"];
    label: string;
    artifactPath: string;
    source: string;
    generatedAt: string;
    ageDays: number;
    status: "fresh" | "aging" | "stale";
    rowCount: number;
    notes: string[];
  }>;
};

export type AnalyticsArtifacts = {
  countyHistory: CountyHistoryArtifact;
  countyMovers: CountyMoversArtifact;
  pressureRiskScatter: PressureRiskScatterArtifact;
  sourceFreshness: SourceFreshnessArtifact;
};

type AnalyticsInputs = {
  generatedAt: string;
  sdwisSnapshot: SdwisSnapshot;
  acsSnapshot: AcsCountyPopulationSnapshot;
  surfaceWaterSnapshot: SurfaceWaterQualitySnapshot;
  twdbHydrologySnapshot: TwdbHydrologySnapshot;
  previousHistory: CountyHistoryArtifact | null;
};

type CountyAggregate = {
  county: {
    name: string;
    slug: string;
  };
  rawRisk: number;
  pressureRaw: number;
  systemCount: number;
  violationCount: number;
  affectedPopulation: number;
  population: number | null;
  impairedSegmentCount: number;
  impairedPublicWaterSupplySegmentCount: number;
  impairedSegmentShare: number | null;
  hydrologyLayerHitCount: number;
  topSystems: DrinkingWaterRiskRow[];
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function normalizeScore(value: number, min: number, max: number): number {
  if (max === min) return 100;
  return round2(((value - min) / (max - min)) * 100);
}

function bboxContains(row: { bbox: [number, number, number, number] }, point: { lat: number; lon: number }) {
  return point.lon >= row.bbox[0] && point.lat >= row.bbox[1] && point.lon <= row.bbox[2] && point.lat <= row.bbox[3];
}

function normalizePopulationSnapshot(snapshot: AcsCountyPopulationSnapshot): Record<string, number> {
  const populations: Record<string, number> = {};
  for (const row of snapshot.rows) {
    if (!row.NAME.endsWith(", Texas")) continue;
    const countyPart = row.NAME.replace(/,\s*Texas$/, "");
    const population = Number(row.B01003_001E);
    if (!Number.isFinite(population)) continue;
    populations[normalizeCountyName(countyPart)] = population;
  }
  return populations;
}

function buildHydrologyLayerHits(snapshot: TwdbHydrologySnapshot): Record<string, number> {
  const hits: Record<string, number> = {};
  for (const [slug, centroid] of Object.entries(TEXAS_COUNTY_CENTROIDS) as Array<[string, { lat: number; lon: number }]>) {
    const uniqueLayers = new Set<string>();
    for (const row of snapshot.rows) {
      if (bboxContains(row, centroid)) {
        uniqueLayers.add(row.layerId);
      }
    }
    hits[normalizeCountyName(slug)] = uniqueLayers.size;
  }
  return hits;
}

function sortByCounty<T extends { county: { name: string; slug: string } }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => left.county.name.localeCompare(right.county.name) || left.county.slug.localeCompare(right.county.slug));
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return round2((sorted[middle - 1] + sorted[middle]) / 2);
  }
  return sorted[middle];
}

function latestSnapshot(record: CountyHistoryRecord): CountyAnalyticsSnapshot {
  const snapshot = record.snapshots.at(-1);
  if (!snapshot) {
    throw new Error(`County history record is missing snapshots for ${record.county.slug}`);
  }
  return snapshot;
}

function buildSourceDescriptors(input: AnalyticsInputs): SourceDescriptor[] {
  return [
    {
      sourceId: "sdwis",
      label: "EPA SDWIS Texas snapshot",
      artifactPath: "public/cache/sdwis-tx.json",
      source: input.sdwisSnapshot.source,
      generatedAt: input.sdwisSnapshot.generatedAt,
      rowCount: input.sdwisSnapshot.rowCount,
      notes: input.sdwisSnapshot.caveats,
    },
    {
      sourceId: "acs-county",
      label: "ACS county population snapshot",
      artifactPath: "public/cache/acs-county-tx.json",
      source: input.acsSnapshot.source,
      generatedAt: input.acsSnapshot.generatedAt,
      rowCount: input.acsSnapshot.rows.length,
      notes: ["Population coverage is limited to the committed ACS county snapshot currently in public/cache/acs-county-tx.json."],
    },
    {
      sourceId: "surface-water-quality",
      label: "TCEQ surface-water-quality snapshot",
      artifactPath: "public/cache/surface-water-quality-tx.json",
      source: input.surfaceWaterSnapshot.source,
      generatedAt: input.surfaceWaterSnapshot.generatedAt,
      rowCount: input.surfaceWaterSnapshot.rows.length,
      notes: ["County-level pressure uses impaired segment counts from the cached surface-water snapshot."],
    },
    {
      sourceId: "twdb-hydrology",
      label: "TWDB hydrology snapshot",
      artifactPath: "public/cache/twdb-hydrology-tx.json",
      source: input.twdbHydrologySnapshot.source,
      generatedAt: input.twdbHydrologySnapshot.generatedAt,
      rowCount: input.twdbHydrologySnapshot.rows.length,
      notes: ["Hydrology is used here only for centroid/bounding-box context so Wave 2 consumers can add map overlays later."],
    },
  ];
}

function buildCurrentCountyRecords(input: AnalyticsInputs): CountyHistoryRecord[] {
  const populations = normalizePopulationSnapshot(input.acsSnapshot);
  const hydrologyHits = buildHydrologyLayerHits(input.twdbHydrologySnapshot);
  const scoredSystems = scoreDrinkingWaterRisk({
    violations: input.sdwisSnapshot.rows,
    asOf: input.generatedAt.slice(0, 10),
  }).filter((row) => row.county);

  const riskByCounty = new Map<string, {
    rawRisk: number;
    violationCount: number;
    affectedPopulation: number;
    systems: DrinkingWaterRiskRow[];
  }>();
  for (const row of scoredSystems) {
    const countyName = normalizeCountyName(row.county ?? "");
    const existing = riskByCounty.get(countyName) ?? {
      rawRisk: 0,
      violationCount: 0,
      affectedPopulation: 0,
      systems: [],
    };
    existing.rawRisk += row.rawScore;
    existing.violationCount += row.violationCount;
    existing.affectedPopulation += row.populationServed;
    existing.systems.push(row);
    riskByCounty.set(countyName, existing);
  }

  const surfaceByCounty = new Map<string, {
    totalSegmentCount: number;
    impairedSegmentCount: number;
    impairedPublicWaterSupplySegmentCount: number;
  }>();
  for (const row of input.surfaceWaterSnapshot.rows) {
    if (!row.countyName) continue;
    const countyName = normalizeCountyName(row.countyName);
    const existing = surfaceByCounty.get(countyName) ?? {
      totalSegmentCount: 0,
      impairedSegmentCount: 0,
      impairedPublicWaterSupplySegmentCount: 0,
    };
    existing.totalSegmentCount += 1;
    if (row.isImpaired) {
      existing.impairedSegmentCount += 1;
    }
    if (row.impairmentFlags.publicWaterSupply) {
      existing.impairedPublicWaterSupplySegmentCount += 1;
    }
    surfaceByCounty.set(countyName, existing);
  }

  const countyNames = new Set<string>([
    ...Object.keys(populations),
    ...Array.from(riskByCounty.keys()),
    ...Array.from(surfaceByCounty.keys()),
  ]);

  const aggregates: CountyAggregate[] = Array.from(countyNames).map((countyName) => {
    const risk = riskByCounty.get(countyName);
    const surface = surfaceByCounty.get(countyName) ?? {
      totalSegmentCount: 0,
      impairedSegmentCount: 0,
      impairedPublicWaterSupplySegmentCount: 0,
    };
    const population = populations[countyName] ?? null;
    const pressureRaw = population && population > 0
      ? (surface.impairedSegmentCount / population) * 100_000
      : surface.impairedSegmentCount;

    return {
      county: {
        name: countyName,
        slug: countySlug(countyName),
      },
      rawRisk: round4(risk?.rawRisk ?? 0),
      pressureRaw: round4(pressureRaw),
      systemCount: risk?.systems.length ?? 0,
      violationCount: risk?.violationCount ?? 0,
      affectedPopulation: risk?.affectedPopulation ?? 0,
      population,
      impairedSegmentCount: surface.impairedSegmentCount,
      impairedPublicWaterSupplySegmentCount: surface.impairedPublicWaterSupplySegmentCount,
      impairedSegmentShare:
        surface.totalSegmentCount > 0 ? round4(surface.impairedSegmentCount / surface.totalSegmentCount) : null,
      hydrologyLayerHitCount: hydrologyHits[countyName] ?? 0,
      topSystems: [...(risk?.systems ?? [])]
        .sort((left, right) => right.score - left.score || right.rawScore - left.rawScore)
        .slice(0, 3),
    };
  });

  const riskMin = aggregates.length ? Math.min(...aggregates.map((entry) => entry.rawRisk)) : 0;
  const riskMax = aggregates.length ? Math.max(...aggregates.map((entry) => entry.rawRisk)) : 0;
  const pressureMin = aggregates.length ? Math.min(...aggregates.map((entry) => entry.pressureRaw)) : 0;
  const pressureMax = aggregates.length ? Math.max(...aggregates.map((entry) => entry.pressureRaw)) : 0;

  const records = aggregates.map<CountyHistoryRecord>((entry) => ({
    county: entry.county,
    latestSnapshotAt: input.generatedAt,
    snapshots: [
      {
        snapshotAt: input.generatedAt,
        metrics: {
          countyRiskScore: normalizeScore(entry.rawRisk, riskMin, riskMax),
          countyRawRisk: entry.rawRisk,
          pressureScore: normalizeScore(entry.pressureRaw, pressureMin, pressureMax),
          systemCount: entry.systemCount,
          violationCount: entry.violationCount,
          affectedPopulation: entry.affectedPopulation,
          population: entry.population,
          impairedSegmentCount: entry.impairedSegmentCount,
          impairedPublicWaterSupplySegmentCount: entry.impairedPublicWaterSupplySegmentCount,
          impairedSegmentShare: entry.impairedSegmentShare,
          hydrologyLayerHitCount: entry.hydrologyLayerHitCount,
        },
        ranks: {
          risk: 0,
          pressure: 0,
        },
        highlights: {
          topSystems: entry.topSystems.map((system) => ({
            pwsId: system.pwsId,
            pwsName: system.pwsName,
            score: system.score,
            violationCount: system.violationCount,
          })),
        },
      },
    ],
  }));

  [...records]
    .sort((left, right) => latestSnapshot(right).metrics.countyRiskScore - latestSnapshot(left).metrics.countyRiskScore || left.county.name.localeCompare(right.county.name))
    .forEach((record, index) => {
      latestSnapshot(record).ranks.risk = index + 1;
    });

  [...records]
    .sort((left, right) => latestSnapshot(right).metrics.pressureScore - latestSnapshot(left).metrics.pressureScore || left.county.name.localeCompare(right.county.name))
    .forEach((record, index) => {
      latestSnapshot(record).ranks.pressure = index + 1;
    });

  return records;
}

export function mergeCountyHistory(previous: CountyHistoryArtifact | null, currentRecords: CountyHistoryRecord[]): CountyHistoryRecord[] {
  const merged = new Map<string, CountyHistoryRecord>();

  for (const record of previous?.counties ?? []) {
    merged.set(record.county.slug, {
      county: record.county,
      latestSnapshotAt: record.latestSnapshotAt,
      snapshots: [...record.snapshots],
    });
  }

  for (const current of currentRecords) {
    const existing = merged.get(current.county.slug);
    const currentSnapshot = latestSnapshot(current);
    if (!existing) {
      merged.set(current.county.slug, current);
      continue;
    }

    const snapshots = [...existing.snapshots.filter((snapshot) => snapshot.snapshotAt !== currentSnapshot.snapshotAt), currentSnapshot]
      .sort((left, right) => left.snapshotAt.localeCompare(right.snapshotAt))
      .slice(-HISTORY_LIMIT);

    merged.set(current.county.slug, {
      county: current.county,
      latestSnapshotAt: currentSnapshot.snapshotAt,
      snapshots,
    });
  }

  return sortByCounty(Array.from(merged.values()));
}

export function buildCountyHistoryArtifact(input: AnalyticsInputs): CountyHistoryArtifact {
  const counties = mergeCountyHistory(input.previousHistory, buildCurrentCountyRecords(input));
  const historyLength = counties.length ? Math.max(...counties.map((county) => county.snapshots.length)) : 0;

  return {
    artifact: "county-history",
    artifactVersion: ARTIFACT_VERSION,
    generatedAt: input.generatedAt,
    historyLength,
    provenance: {
      method:
        "County analytics are derived from committed SDWIS, ACS county population, surface-water-quality, and TWDB hydrology snapshots. History appends one real snapshot per run and never fabricates prior periods.",
      sources: buildSourceDescriptors(input),
      notes: [
        "countyRiskScore is the statewide 0-100 normalization of summed SDWIS DWRS raw scores per county.",
        "pressureScore is the statewide 0-100 normalization of impaired segment counts per 100k residents when population is available; otherwise it falls back to raw impaired segment count.",
        "hydrologyLayerHitCount uses county centroids against cached TWDB bounding boxes as a lightweight context hook for Wave 2 maps.",
      ],
    },
    counties,
  };
}

export function buildCountyMoversArtifact(history: CountyHistoryArtifact): CountyMoversArtifact {
  const movers = history.counties.map((county) => {
    const current = latestSnapshot(county);
    const previous = county.snapshots.at(-2);
    const rankDelta = previous ? previous.ranks.risk - current.ranks.risk : null;
    const movement: CountyMoversArtifact["movers"][number]["movement"] = !previous
      ? "new"
      : rankDelta === 0
        ? "steady"
        : (rankDelta ?? 0) > 0
          ? "up"
          : "down";

    return {
      county: county.county,
      movement,
      currentRank: current.ranks.risk,
      previousRank: previous?.ranks.risk ?? null,
      rankDelta,
      currentRiskScore: current.metrics.countyRiskScore,
      previousRiskScore: previous?.metrics.countyRiskScore ?? null,
      scoreDelta: previous ? round2(current.metrics.countyRiskScore - previous.metrics.countyRiskScore) : null,
      currentPressureScore: current.metrics.pressureScore,
      previousPressureScore: previous?.metrics.pressureScore ?? null,
    };
  });

  const baselineSnapshotAt = history.counties.find((county) => county.snapshots.length > 1)?.snapshots.at(-2)?.snapshotAt ?? null;
  const comparisonSnapshotAt = history.counties[0] ? latestSnapshot(history.counties[0]).snapshotAt : null;

  return {
    artifact: "county-movers",
    artifactVersion: ARTIFACT_VERSION,
    generatedAt: history.generatedAt,
    baselineSnapshotAt,
    comparisonSnapshotAt,
    movers: movers
      .sort((left, right) => Math.abs(right.rankDelta ?? 0) - Math.abs(left.rankDelta ?? 0) || left.currentRank - right.currentRank || left.county.name.localeCompare(right.county.name))
      .slice(0, TOP_MOVER_LIMIT),
    notes: baselineSnapshotAt
      ? ["Rank deltas compare the newest county-history snapshot against the immediately preceding real snapshot."]
      : ["This is the first county-history snapshot, so every county is marked as new and rank deltas are null."],
  };
}

export function buildPressureRiskScatterArtifact(history: CountyHistoryArtifact): PressureRiskScatterArtifact {
  const currentPoints = history.counties.map((county) => ({ county: county.county, snapshot: latestSnapshot(county) }));
  const riskMedian = median(currentPoints.map((entry) => entry.snapshot.metrics.countyRiskScore));
  const pressureMedian = median(currentPoints.map((entry) => entry.snapshot.metrics.pressureScore));

  return {
    artifact: "pressure-risk-scatter",
    artifactVersion: ARTIFACT_VERSION,
    generatedAt: history.generatedAt,
    axes: {
      x: "pressureScore",
      y: "countyRiskScore",
    },
    points: currentPoints
      .map(({ county, snapshot }) => {
        const quadrant: PressureRiskScatterArtifact["points"][number]["quadrant"] =
          snapshot.metrics.pressureScore >= pressureMedian
            ? snapshot.metrics.countyRiskScore >= riskMedian
              ? "high-pressure-high-risk"
              : "high-pressure-lower-risk"
            : snapshot.metrics.countyRiskScore >= riskMedian
              ? "lower-pressure-high-risk"
              : "lower-pressure-lower-risk";

        return {
          county,
          x: snapshot.metrics.pressureScore,
          y: snapshot.metrics.countyRiskScore,
          population: snapshot.metrics.population,
          impairedSegmentCount: snapshot.metrics.impairedSegmentCount,
          hydrologyLayerHitCount: snapshot.metrics.hydrologyLayerHitCount,
          systemCount: snapshot.metrics.systemCount,
          violationCount: snapshot.metrics.violationCount,
          quadrant,
        };
      })
      .sort((left, right) => right.y - left.y || right.x - left.x || left.county.name.localeCompare(right.county.name)),
    notes: [
      "Both axes are normalized to a 0-100 statewide range for stable chart consumption.",
      "Quadrants use median splits from the newest real county-history snapshot.",
    ],
  };
}

export function buildSourceFreshnessArtifact(history: CountyHistoryArtifact): SourceFreshnessArtifact {
  return {
    artifact: "source-freshness",
    artifactVersion: ARTIFACT_VERSION,
    generatedAt: history.generatedAt,
    sources: history.provenance.sources.map((source) => {
      const ageDays = round2((Date.parse(history.generatedAt) - Date.parse(source.generatedAt)) / 86_400_000);
      return {
        sourceId: source.sourceId,
        label: source.label,
        artifactPath: source.artifactPath,
        source: source.source,
        generatedAt: source.generatedAt,
        ageDays,
        status: ageDays <= 2 ? "fresh" : ageDays <= 14 ? "aging" : "stale",
        rowCount: source.rowCount,
        notes: source.notes,
      };
    }),
  };
}

async function readJsonFile<T>(target: string): Promise<T> {
  return JSON.parse(await fs.readFile(target, "utf8")) as T;
}

async function readExistingCountyHistory(): Promise<CountyHistoryArtifact | null> {
  try {
    return await readJsonFile<CountyHistoryArtifact>(path.join(ANALYTICS_DIR, COUNTY_HISTORY_FILENAME));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ENOENT")) {
      return null;
    }
    throw error;
  }
}

export async function loadAnalyticsInputs(options: { generatedAt?: string } = {}): Promise<AnalyticsInputs> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const [sdwisSnapshot, acsSnapshot, surfaceWaterSnapshot, twdbHydrologySnapshot, previousHistory] = await Promise.all([
    loadSdwisSnapshot(),
    readJsonFile<AcsCountyPopulationSnapshot>(path.join(process.cwd(), "public", "cache", "acs-county-tx.json")),
    readJsonFile<SurfaceWaterQualitySnapshot>(path.join(process.cwd(), "public", "cache", "surface-water-quality-tx.json")),
    readJsonFile<TwdbHydrologySnapshot>(path.join(process.cwd(), "public", "cache", "twdb-hydrology-tx.json")),
    readExistingCountyHistory(),
  ]);

  return {
    generatedAt,
    sdwisSnapshot,
    acsSnapshot,
    surfaceWaterSnapshot,
    twdbHydrologySnapshot,
    previousHistory,
  };
}

export async function generateAnalyticsArtifacts(options: { generatedAt?: string } = {}): Promise<AnalyticsArtifacts> {
  const inputs = await loadAnalyticsInputs(options);
  const countyHistory = buildCountyHistoryArtifact(inputs);
  return {
    countyHistory,
    countyMovers: buildCountyMoversArtifact(countyHistory),
    pressureRiskScatter: buildPressureRiskScatterArtifact(countyHistory),
    sourceFreshness: buildSourceFreshnessArtifact(countyHistory),
  };
}

export async function writeAnalyticsArtifacts(
  artifacts: AnalyticsArtifacts,
  options: {
    baseDir?: string;
    writeFile?: (target: string, content: string) => Promise<void>;
  } = {},
) {
  const baseDir = options.baseDir ?? ANALYTICS_DIR;
  const writeFile = options.writeFile ?? (async (target, content) => fs.writeFile(target, content, "utf8"));
  await fs.mkdir(baseDir, { recursive: true });

  const writes = [
    { path: path.join(baseDir, COUNTY_HISTORY_FILENAME), content: JSON.stringify(artifacts.countyHistory, null, 2) },
    { path: path.join(baseDir, COUNTY_MOVERS_FILENAME), content: JSON.stringify(artifacts.countyMovers, null, 2) },
    { path: path.join(baseDir, PRESSURE_RISK_SCATTER_FILENAME), content: JSON.stringify(artifacts.pressureRiskScatter, null, 2) },
    { path: path.join(baseDir, SOURCE_FRESHNESS_FILENAME), content: JSON.stringify(artifacts.sourceFreshness, null, 2) },
  ];

  for (const entry of writes) {
    await writeFile(entry.path, entry.content);
  }

  return writes.map((entry) => entry.path);
}

export async function main() {
  const artifacts = await generateAnalyticsArtifacts();
  const outputPaths = await writeAnalyticsArtifacts(artifacts);
  console.log(
    JSON.stringify(
      {
        outputPaths,
        countyCount: artifacts.countyHistory.counties.length,
        historyLength: artifacts.countyHistory.historyLength,
        moverCount: artifacts.countyMovers.movers.length,
      },
      null,
      2,
    ),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
