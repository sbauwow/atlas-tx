import "server-only";

import { readFile } from "node:fs/promises";
import * as path from "node:path";

import { countySlug } from "@/lib/counties";

import { getWatchlistDetail, listWatchlists } from "./persistence";
import { type WatchlistDetailRow, type WatchlistItemRow, WatchlistNotFoundError } from "./types";

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
  quadrant: string;
};

type PressureRiskScatterArtifact = {
  artifact?: string;
  artifactVersion?: number;
  generatedAt?: string;
  points?: ScatterPoint[];
};

type FreshnessSource = {
  sourceId: string;
  label: string;
  artifactPath: string;
  source: string;
  generatedAt: string;
  ageDays: number;
  status: string;
  rowCount: number | null;
  notes?: string[];
};

type SourceFreshnessArtifact = {
  artifact?: string;
  artifactVersion?: number;
  generatedAt?: string;
  sources?: FreshnessSource[];
};

type PersistedWatchlistItemMetadata = {
  version: 1;
  sourceId: string;
  kind: string;
  href: string;
  summary: string;
  detail: string;
  surface: string;
};

type FeedSource = {
  id: string;
  label: string;
  path: string;
  generatedAt: string | null;
  available: boolean;
  status?: string;
  note?: string;
};

type FeedArtifactStatus = {
  id: string;
  path: string;
  available: boolean;
  generatedAt: string | null;
  note: string | null;
};

type BaseFeedEntry = {
  id: string;
  itemId: string;
  itemType: WatchlistItemRow["itemType"];
  itemKey: string;
  label: string;
  href: string;
  status: "matched" | "no-model" | "unmatched" | "artifact-unavailable";
  signalType: "county-analytics" | "operator-watchlist-metadata" | "permit-watchlist-metadata";
  headline: string;
  summary: string;
  detail: string;
  createdAt: string;
  updatedAt: string;
  sources: FeedSource[];
  signals: Record<string, unknown>;
};

export type WatchlistFeedEntry = BaseFeedEntry;

export type WatchlistFeedWatchlist = {
  id: string;
  label: string;
  notes: string | null;
  itemCount: number;
  updatedAt: string;
  entries: WatchlistFeedEntry[];
};

export type WatchlistFeedResponse = {
  generatedAt: string;
  watchlists: WatchlistFeedWatchlist[];
  artifacts: {
    countyMovers: FeedArtifactStatus;
    pressureRiskScatter: FeedArtifactStatus;
    sourceFreshness: FeedArtifactStatus;
  };
};

type LoadedArtifact<T> = {
  id: string;
  path: string;
  available: boolean;
  generatedAt: string | null;
  note: string | null;
  data: T | null;
};

type LoadedAnalyticsArtifacts = {
  countyMovers: LoadedArtifact<CountyMoversArtifact>;
  pressureRiskScatter: LoadedArtifact<PressureRiskScatterArtifact>;
  sourceFreshness: LoadedArtifact<SourceFreshnessArtifact>;
};

type FeedBuildInput = {
  watchlists: readonly WatchlistDetailRow[];
  artifacts: LoadedAnalyticsArtifacts;
  generatedAt?: string;
};

const ANALYTICS_DIR = path.join(process.cwd(), "public", "cache", "analytics");

const QUADRANT_LABELS: Record<string, string> = {
  "high-pressure-high-risk": "High pressure + high risk",
  "high-pressure-lower-risk": "High pressure + lower risk",
  "lower-pressure-high-risk": "Lower pressure + high risk",
  "lower-pressure-lower-risk": "Lower pressure + lower risk",
};

export async function getWatchlistFeed(watchlistId?: string | null): Promise<WatchlistFeedResponse> {
  const watchlists = await loadTargetWatchlists(watchlistId);
  const artifacts = await loadAnalyticsArtifacts();
  return buildWatchlistFeed({ watchlists, artifacts });
}

export function buildWatchlistFeed(input: FeedBuildInput): WatchlistFeedResponse {
  const moverMap = new Map(
    (input.artifacts.countyMovers.data?.movers ?? []).map((mover) => [mover.county.slug, mover] as const),
  );
  const scatterMap = new Map(
    (input.artifacts.pressureRiskScatter.data?.points ?? []).map((point) => [point.county.slug, point] as const),
  );
  const freshnessSources = (input.artifacts.sourceFreshness.data?.sources ?? []).map((source) => ({
    sourceId: source.sourceId,
    label: source.label,
    generatedAt: source.generatedAt,
    status: source.status,
    ageDays: source.ageDays,
    rowCount: source.rowCount,
    artifactPath: source.artifactPath,
    source: source.source,
    notes: [...(source.notes ?? [])],
  }));

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    watchlists: input.watchlists.map((watchlist) => ({
      id: watchlist.id,
      label: watchlist.label,
      notes: watchlist.notes,
      itemCount: watchlist.itemCount,
      updatedAt: watchlist.updatedAt.toISOString(),
      entries: watchlist.items.map((item) =>
        buildFeedEntry({
          watchlist,
          item,
          moverMap,
          scatterMap,
          freshnessSources,
          artifacts: input.artifacts,
        }),
      ),
    })),
    artifacts: {
      countyMovers: toArtifactStatus(input.artifacts.countyMovers),
      pressureRiskScatter: toArtifactStatus(input.artifacts.pressureRiskScatter),
      sourceFreshness: toArtifactStatus(input.artifacts.sourceFreshness),
    },
  };
}

async function loadTargetWatchlists(watchlistId?: string | null): Promise<WatchlistDetailRow[]> {
  if (watchlistId?.trim()) {
    const detail = await getWatchlistDetail(watchlistId.trim());
    if (!detail) {
      throw new WatchlistNotFoundError();
    }
    return [detail];
  }

  const summaries = await listWatchlists();
  const details = await Promise.all(summaries.map((summary) => getWatchlistDetail(summary.id)));
  return details.filter((detail): detail is WatchlistDetailRow => detail !== null);
}

function buildFeedEntry(args: {
  watchlist: WatchlistDetailRow;
  item: WatchlistItemRow;
  moverMap: Map<string, CountyMover>;
  scatterMap: Map<string, ScatterPoint>;
  freshnessSources: Array<{
    sourceId: string;
    label: string;
    generatedAt: string;
    status: string;
    ageDays: number;
    rowCount: number | null;
    artifactPath: string;
    source: string;
    notes: string[];
  }>;
  artifacts: LoadedAnalyticsArtifacts;
}): WatchlistFeedEntry {
  const metadata = parsePersistedWatchlistItemMetadata(args.item.notes);

  if (args.item.itemType === "county") {
    return buildCountyFeedEntry({
      item: args.item,
      metadata,
      mover: resolveCountyMover(args.item, metadata, args.moverMap),
      scatterPoint: resolveScatterPoint(args.item, metadata, args.scatterMap),
      freshnessSources: args.freshnessSources,
      artifacts: args.artifacts,
    });
  }

  if (args.item.itemType === "operator") {
    return buildOperatorFeedEntry({ item: args.item, metadata, freshnessSources: args.freshnessSources, artifacts: args.artifacts });
  }

  return buildPermitFeedEntry({ item: args.item, metadata, freshnessSources: args.freshnessSources, artifacts: args.artifacts });
}

function buildCountyFeedEntry(args: {
  item: WatchlistItemRow;
  metadata: PersistedWatchlistItemMetadata | null;
  mover: CountyMover | null;
  scatterPoint: ScatterPoint | null;
  freshnessSources: Array<{
    sourceId: string;
    label: string;
    generatedAt: string;
    status: string;
    ageDays: number;
    rowCount: number | null;
    artifactPath: string;
    source: string;
    notes: string[];
  }>;
  artifacts: LoadedAnalyticsArtifacts;
}): WatchlistFeedEntry {
  const base = baseEntry(args.item, args.metadata);
  const hasAnalytics = Boolean(args.mover || args.scatterPoint);
  const missingCount = [args.artifacts.countyMovers, args.artifacts.pressureRiskScatter].filter((artifact) => !artifact.available).length;

  return {
    ...base,
    status: hasAnalytics ? "matched" : missingCount > 0 ? "artifact-unavailable" : "unmatched",
    signalType: "county-analytics",
    headline: hasAnalytics
      ? buildCountyHeadline(base.label, args.mover, args.scatterPoint)
      : `${base.label} has no current county analytics match because the required artifacts are unavailable.`,
    summary: hasAnalytics
      ? buildCountySummary(args.mover, args.scatterPoint)
      : missingCount > 0
        ? `County movers and scatter artifacts are missing or unreadable for this saved county.`
        : `This saved county is not present in the current committed analytics artifacts.`,
    detail: hasAnalytics
      ? buildCountyDetail(args.mover, args.scatterPoint)
      : "Atlas only reports county feed movement from committed analytics artifacts; it does not fabricate changes when artifacts are absent.",
    sources: [
      toFeedSource(args.artifacts.countyMovers, "County movers artifact"),
      toFeedSource(args.artifacts.pressureRiskScatter, "Pressure vs. risk artifact"),
      ...args.freshnessSources.map((source) => ({
        id: `freshness:${source.sourceId}`,
        label: source.label,
        path: source.artifactPath,
        generatedAt: source.generatedAt,
        available: true,
        status: source.status,
        note: `${formatAgeDays(source.ageDays)} old`,
      })),
    ],
    signals: {
      county: {
        name: args.mover?.county.name ?? args.scatterPoint?.county.name ?? base.label,
        slug: args.mover?.county.slug ?? args.scatterPoint?.county.slug ?? inferCountySlug(args.item, args.metadata),
      },
      movement: args.mover
        ? {
            movement: args.mover.movement,
            currentRank: args.mover.currentRank,
            previousRank: args.mover.previousRank,
            rankDelta: args.mover.rankDelta,
            currentRiskScore: args.mover.currentRiskScore,
            previousRiskScore: args.mover.previousRiskScore,
            scoreDelta: args.mover.scoreDelta,
            currentPressureScore: args.mover.currentPressureScore,
            previousPressureScore: args.mover.previousPressureScore,
            comparisonWindow: {
              baselineSnapshotAt: args.artifacts.countyMovers.data?.baselineSnapshotAt ?? null,
              comparisonSnapshotAt: args.artifacts.countyMovers.data?.comparisonSnapshotAt ?? null,
            },
          }
        : null,
      scatter: args.scatterPoint
        ? {
            pressureScore: args.scatterPoint.x,
            countyRiskScore: args.scatterPoint.y,
            quadrant: args.scatterPoint.quadrant,
            quadrantLabel: QUADRANT_LABELS[args.scatterPoint.quadrant] ?? args.scatterPoint.quadrant,
            impairedSegmentCount: args.scatterPoint.impairedSegmentCount,
            hydrologyLayerHitCount: args.scatterPoint.hydrologyLayerHitCount,
            systemCount: args.scatterPoint.systemCount,
            violationCount: args.scatterPoint.violationCount,
            population: args.scatterPoint.population,
          }
        : null,
      freshness: args.freshnessSources,
    },
  };
}

function buildOperatorFeedEntry(args: {
  item: WatchlistItemRow;
  metadata: PersistedWatchlistItemMetadata | null;
  freshnessSources: Array<{
    sourceId: string;
    label: string;
    generatedAt: string;
    status: string;
    ageDays: number;
    rowCount: number | null;
    artifactPath: string;
    source: string;
    notes: string[];
  }>;
  artifacts: LoadedAnalyticsArtifacts;
}): WatchlistFeedEntry {
  const base = baseEntry(args.item, args.metadata);

  return {
    ...base,
    status: "no-model",
    signalType: "operator-watchlist-metadata",
    headline: `${base.label} is saved on the watchlist, but Atlas does not yet ship operator movement history in committed artifacts.`,
    summary: args.metadata?.summary || `${base.label} remains saved for manual operator review.`,
    detail: args.metadata?.detail || "Atlas can only return persisted watchlist metadata for operators until a committed operator history model lands.",
    sources: [
      toFeedSource(args.artifacts.sourceFreshness, "Source freshness artifact"),
    ],
    signals: {
      operator: {
        slug: args.item.itemKey,
        label: base.label,
        kind: args.metadata?.kind ?? "Operator",
        surface: args.metadata?.surface ?? "watchlists",
        sourceId: args.metadata?.sourceId ?? null,
      },
      watchlistMetadata: {
        summary: args.metadata?.summary ?? null,
        detail: args.metadata?.detail ?? null,
        href: base.href,
      },
      freshness: args.freshnessSources,
      fallbackReason: "no operator movement model yet",
    },
  };
}

function buildPermitFeedEntry(args: {
  item: WatchlistItemRow;
  metadata: PersistedWatchlistItemMetadata | null;
  freshnessSources: Array<{
    sourceId: string;
    label: string;
    generatedAt: string;
    status: string;
    ageDays: number;
    rowCount: number | null;
    artifactPath: string;
    source: string;
    notes: string[];
  }>;
  artifacts: LoadedAnalyticsArtifacts;
}): WatchlistFeedEntry {
  const base = baseEntry(args.item, args.metadata);

  return {
    ...base,
    status: "no-model",
    signalType: "permit-watchlist-metadata",
    headline: `${base.label} is saved on the watchlist, but Atlas does not yet ship a permit movement model in committed artifacts.`,
    summary: args.metadata?.summary || `${base.label} remains saved for permit-by-permit review.`,
    detail: args.metadata?.detail || "Atlas can only return persisted watchlist metadata for permits until permit history and movement signals are committed.",
    sources: [
      toFeedSource(args.artifacts.sourceFreshness, "Source freshness artifact"),
    ],
    signals: {
      permit: {
        tceqId: args.item.itemKey,
        label: base.label,
        kind: args.metadata?.kind ?? "Permit",
        surface: args.metadata?.surface ?? "watchlists",
        sourceId: args.metadata?.sourceId ?? null,
      },
      watchlistMetadata: {
        summary: args.metadata?.summary ?? null,
        detail: args.metadata?.detail ?? null,
        href: base.href,
      },
      freshness: args.freshnessSources,
      fallbackReason: "no permit movement model yet",
    },
  };
}

function resolveCountyMover(
  item: WatchlistItemRow,
  metadata: PersistedWatchlistItemMetadata | null,
  moverMap: Map<string, CountyMover>,
): CountyMover | null {
  const slug = inferCountySlug(item, metadata);
  return moverMap.get(slug) ?? null;
}

function resolveScatterPoint(
  item: WatchlistItemRow,
  metadata: PersistedWatchlistItemMetadata | null,
  scatterMap: Map<string, ScatterPoint>,
): ScatterPoint | null {
  const slug = inferCountySlug(item, metadata);
  return scatterMap.get(slug) ?? null;
}

function inferCountySlug(item: WatchlistItemRow, metadata: PersistedWatchlistItemMetadata | null): string {
  const hrefMatch = metadata?.href.match(/^\/counties\/([^/?#]+)/)?.[1];
  if (hrefMatch) {
    return hrefMatch;
  }

  if (item.itemKey.includes("-county")) {
    return item.itemKey;
  }

  const candidate = item.displayLabel ?? item.itemKey;
  return countySlug(candidate);
}

function parsePersistedWatchlistItemMetadata(value: string | null): PersistedWatchlistItemMetadata | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    if (
      record.version !== 1 ||
      typeof record.sourceId !== "string" ||
      typeof record.kind !== "string" ||
      typeof record.href !== "string" ||
      typeof record.summary !== "string" ||
      typeof record.detail !== "string"
    ) {
      return null;
    }

    return {
      version: 1,
      sourceId: record.sourceId,
      kind: record.kind,
      href: record.href,
      summary: record.summary,
      detail: record.detail,
      surface: typeof record.surface === "string" ? record.surface : "watchlists",
    };
  } catch {
    return null;
  }
}

function baseEntry(item: WatchlistItemRow, metadata: PersistedWatchlistItemMetadata | null) {
  const label = item.displayLabel ?? item.itemKey;
  const href = metadata?.href ?? defaultHref(item.itemType, item.itemKey);

  return {
    id: `${item.watchlistId}:${item.id}`,
    itemId: item.id,
    itemType: item.itemType,
    itemKey: item.itemKey,
    label,
    href,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function defaultHref(itemType: WatchlistItemRow["itemType"], itemKey: string): string {
  if (itemType === "county") return `/counties/${itemKey}`;
  if (itemType === "operator") return `/operators/${itemKey}`;
  return `/permits/${itemKey}`;
}

function buildCountyHeadline(label: string, mover: CountyMover | null, scatterPoint: ScatterPoint | null): string {
  if (mover) {
    return `${label} is ${movementVerb(mover)} at rank ${mover.currentRank} in the current county movers artifact.`;
  }

  if (scatterPoint) {
    return `${label} is currently in the ${QUADRANT_LABELS[scatterPoint.quadrant] ?? scatterPoint.quadrant} quadrant.`;
  }

  return `${label} does not have a current county analytics match.`;
}

function buildCountySummary(mover: CountyMover | null, scatterPoint: ScatterPoint | null): string {
  const parts: string[] = [];
  if (mover) {
    parts.push(`Risk score ${formatMaybeNumber(mover.currentRiskScore)} with pressure score ${formatMaybeNumber(mover.currentPressureScore)}.`);
    if (typeof mover.scoreDelta === "number") {
      parts.push(`Score delta ${formatSignedNumber(mover.scoreDelta)} versus the baseline snapshot.`);
    }
  }

  if (scatterPoint) {
    parts.push(`${QUADRANT_LABELS[scatterPoint.quadrant] ?? scatterPoint.quadrant}; ${scatterPoint.violationCount} violations and ${scatterPoint.impairedSegmentCount} impaired segments in the current scatter artifact.`);
  }

  return parts.join(" ");
}

function buildCountyDetail(mover: CountyMover | null, scatterPoint: ScatterPoint | null): string {
  if (mover && scatterPoint) {
    return `Movement is taken from the committed county movers snapshot, while quadrant and burden counts come from the committed pressure-risk scatter artifact.`;
  }

  if (mover) {
    return `Movement is taken from the committed county movers snapshot; scatter context is not currently available for this county.`;
  }

  if (scatterPoint) {
    return `Quadrant and burden counts come from the committed pressure-risk scatter artifact; no separate mover record is currently available for this county.`;
  }

  return `Atlas only reports county feed changes when they appear in committed analytics artifacts.`;
}

function movementVerb(mover: CountyMover): string {
  if (mover.movement === "up") return `up ${Math.abs(mover.rankDelta ?? 0)} slot${Math.abs(mover.rankDelta ?? 0) === 1 ? "" : "s"}`;
  if (mover.movement === "down") return `down ${Math.abs(mover.rankDelta ?? 0)} slot${Math.abs(mover.rankDelta ?? 0) === 1 ? "" : "s"}`;
  if (mover.movement === "new") return "new to the comparison window";
  return "steady";
}

function formatMaybeNumber(value: number | null): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2).replace(/\.00$/, "") : "n/a";
}

function formatSignedNumber(value: number): string {
  const fixed = value.toFixed(2).replace(/\.00$/, "");
  return value > 0 ? `+${fixed}` : fixed;
}

function formatAgeDays(value: number): string {
  return `${value.toFixed(2).replace(/\.00$/, "")}d`;
}

function toArtifactStatus<T>(artifact: LoadedArtifact<T>): FeedArtifactStatus {
  return {
    id: artifact.id,
    path: artifact.path,
    available: artifact.available,
    generatedAt: artifact.generatedAt,
    note: artifact.note,
  };
}

function toFeedSource<T>(artifact: LoadedArtifact<T>, label: string): FeedSource {
  return {
    id: artifact.id,
    label,
    path: artifact.path,
    generatedAt: artifact.generatedAt,
    available: artifact.available,
    note: artifact.note ?? undefined,
  };
}

async function loadAnalyticsArtifacts(): Promise<LoadedAnalyticsArtifacts> {
  const [countyMovers, pressureRiskScatter, sourceFreshness] = await Promise.all([
    readAnalyticsArtifact<CountyMoversArtifact>("county-movers", "county-movers.json"),
    readAnalyticsArtifact<PressureRiskScatterArtifact>("pressure-risk-scatter", "pressure-risk-scatter.json"),
    readAnalyticsArtifact<SourceFreshnessArtifact>("source-freshness", "source-freshness.json"),
  ]);

  return { countyMovers, pressureRiskScatter, sourceFreshness };
}

async function readAnalyticsArtifact<T extends { generatedAt?: string }>(
  id: string,
  fileName: string,
): Promise<LoadedArtifact<T>> {
  const artifactPath = path.join(ANALYTICS_DIR, fileName);

  try {
    const raw = await readFile(artifactPath, "utf8");
    const data = JSON.parse(raw) as T;
    return {
      id,
      path: artifactPath,
      available: true,
      generatedAt: typeof data.generatedAt === "string" ? data.generatedAt : null,
      note: null,
      data,
    };
  } catch (error) {
    const note = error instanceof Error ? error.message : "Unable to read artifact";
    return {
      id,
      path: artifactPath,
      available: false,
      generatedAt: null,
      note,
      data: null,
    };
  }
}
