import type {
  AnalyticsMetricBuckets,
  AnalyticsMetricMap,
  AnalyticsPrimitive,
  CountyAnalyticsCountyRef,
  CountyAnalyticsSnapshot,
  CountyAnalyticsSnapshotInput,
  CountyAnalyticsSourceDescriptor,
  CountyDriverContribution,
  CountyDriverDecompositionInput,
  SourceFreshnessRecord,
} from "@/lib/analytics/types";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizePrimitive(value: unknown): AnalyticsPrimitive {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (isFiniteNumber(value)) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return null;
}

function normalizeMetricMap(record: Record<string, unknown> | undefined): AnalyticsMetricMap {
  if (!record) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, normalizePrimitive(value)]),
  );
}

function normalizeMetricBuckets(buckets: Record<string, Record<string, unknown>> | undefined): AnalyticsMetricBuckets {
  if (!buckets) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(buckets).map(([bucketId, metrics]) => [bucketId, normalizeMetricMap(metrics)]),
  );
}

function percentileForRank(rank: number, totalCount: number): number {
  if (totalCount <= 1) {
    return 100;
  }

  return Number((((totalCount - rank) / (totalCount - 1)) * 100).toFixed(2));
}

function roundToTwo(value: number): number {
  return Number(value.toFixed(2));
}

function toSourceDescriptorMap(
  sourceMetadata: CountyAnalyticsSourceDescriptor[] | undefined,
  profile: CountyAnalyticsSnapshotInput["profile"],
): Map<string, CountyAnalyticsSourceDescriptor> {
  const descriptorMap = new Map<string, CountyAnalyticsSourceDescriptor>();

  for (const descriptor of sourceMetadata ?? []) {
    descriptorMap.set(descriptor.sourceId, descriptor);
  }

  for (const slice of profile?.slices ?? []) {
    const existing = descriptorMap.get(slice.sourceId);
    descriptorMap.set(slice.sourceId, {
      sourceId: slice.sourceId,
      label: existing?.label ?? slice.name,
      category: existing?.category ?? slice.category,
    });
  }

  return descriptorMap;
}

function collectSourceIds(input: CountyDriverDecompositionInput): string[] {
  const sourceIds = new Set<string>();

  for (const sourceId of Object.keys(input.ranks ?? {})) {
    if (sourceId !== "composite") {
      sourceIds.add(sourceId);
    }
  }

  for (const sourceId of Object.keys(input.sourceValues ?? {})) {
    sourceIds.add(sourceId);
  }

  for (const sourceId of Object.keys(input.metrics ?? {})) {
    sourceIds.add(sourceId);
  }

  for (const highlight of input.highlights ?? []) {
    sourceIds.add(highlight.sourceId);
  }

  for (const descriptor of input.sourceMetadata ?? []) {
    sourceIds.add(descriptor.sourceId);
  }

  return Array.from(sourceIds);
}

export function decomposeCountyDrivers(input: CountyDriverDecompositionInput): CountyDriverContribution[] {
  const sourceIds = collectSourceIds(input);
  const metadataBySource = new Map<string, CountyAnalyticsSourceDescriptor>(
    (input.sourceMetadata ?? []).map((descriptor) => [descriptor.sourceId, descriptor]),
  );
  const highlightsBySource = new Map<string, NonNullable<CountyDriverDecompositionInput["highlights"]>[number]>(
    (input.highlights ?? []).map((highlight) => [highlight.sourceId, highlight]),
  );
  const driverCount = sourceIds.length;

  const contributions = sourceIds.map<CountyDriverContribution>((sourceId) => {
    const metadata = metadataBySource.get(sourceId);
    const highlight = highlightsBySource.get(sourceId);
    const rank = input.ranks?.[sourceId] ?? highlight?.rank ?? null;
    const totalCount = input.rankDenominators?.[sourceId] ?? null;
    const percentile = rank !== null && totalCount !== null ? percentileForRank(rank, totalCount) : null;
    const scoreContribution = percentile !== null && driverCount > 0 ? roundToTwo(percentile / driverCount) : null;
    const rawValue = input.sourceValues?.[sourceId] ?? highlight?.value ?? null;
    const metrics = normalizeMetricMap(input.metrics?.[sourceId]);

    return {
      sourceId,
      label: metadata?.label ?? highlight?.label ?? sourceId,
      category: metadata?.category,
      rank,
      totalCount,
      percentile,
      rawValue,
      scoreContribution,
      shareOfComposite:
        scoreContribution !== null && isFiniteNumber(input.compositeScore) && input.compositeScore > 0
          ? roundToTwo((scoreContribution / input.compositeScore) * 100)
          : null,
      highlight: Boolean(highlight),
      metrics,
    };
  });

  return contributions.sort((left, right) => {
    if (left.rank !== null && right.rank !== null && left.rank !== right.rank) {
      return left.rank - right.rank;
    }

    if (left.rank === null && right.rank !== null) {
      return 1;
    }

    if (left.rank !== null && right.rank === null) {
      return -1;
    }

    if (left.rawValue !== null && right.rawValue !== null && right.rawValue !== left.rawValue) {
      return right.rawValue - left.rawValue;
    }

    return left.label.localeCompare(right.label);
  });
}

function toCountyRef(input: CountyAnalyticsSnapshotInput): CountyAnalyticsCountyRef {
  if (input.overview?.county) {
    return input.overview.county;
  }

  if (input.profile?.county) {
    return input.profile.county;
  }

  throw new Error("County analytics snapshot requires county context");
}

function normalizeHighlights(input: CountyAnalyticsSnapshotInput["highlights"]): CountyAnalyticsSnapshot["highlights"] {
  return (input ?? []).map((highlight) => ({
    sourceId: highlight.sourceId,
    label: highlight.label,
    rank: highlight.rank,
    value: highlight.value,
  }));
}

function normalizeFreshness(input: SourceFreshnessRecord[] | undefined): SourceFreshnessRecord[] {
  return (input ?? []).map((record) => ({
    ...record,
    metadata: normalizeMetricMap(record.metadata),
  }));
}

export function buildCountyAnalyticsSnapshot(input: CountyAnalyticsSnapshotInput): CountyAnalyticsSnapshot {
  const county = toCountyRef(input);
  const sourceDescriptorMap = toSourceDescriptorMap(input.sourceMetadata, input.profile);
  const drivers = decomposeCountyDrivers({
    compositeScore: input.overview?.compositeScore,
    ranks: input.overview?.ranks,
    sourceValues: input.overview?.sourceValues,
    metrics: input.overview?.metrics,
    highlights: input.highlights,
    sourceMetadata: Array.from(sourceDescriptorMap.values()),
    rankDenominators: input.rankDenominators,
  });

  return {
    county,
    generatedAt: input.generatedAt ?? input.profile?.collectedAt ?? null,
    compositeScore: input.overview?.compositeScore ?? null,
    compositeRank: input.overview?.ranks?.composite ?? null,
    sourceCount: drivers.length,
    sourceValues: { ...(input.overview?.sourceValues ?? {}) },
    overviewMetrics: normalizeMetricBuckets(input.overview?.metrics),
    profileMetrics: normalizeMetricBuckets(input.profile?.metrics),
    highlights: normalizeHighlights(input.highlights),
    drivers,
    annotations: [...(input.profile?.annotations ?? [])],
    errorCount: input.profile?.errors?.length ?? 0,
    hydrology: {
      matchCount: input.hydrologyContext?.matches?.length ?? 0,
      layerHits: { ...(input.hydrologyContext?.layerHits ?? {}) },
      caveat: input.hydrologyContext?.caveat,
    },
    freshness: normalizeFreshness(input.freshness),
  };
}

export { normalizeMetricBuckets, normalizeMetricMap, normalizePrimitive };
