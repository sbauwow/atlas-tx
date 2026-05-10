import { ATLAS_COUNTY_SOURCES } from "@/lib/atlas-county-sources";

export type ScrapeAggressiveness = "conservative" | "balanced" | "aggressive";

export type SourceCollectionType = "structured-api" | "html-scrape";

export type AtlasScrapeSourceDescriptor = {
  sourceId: string;
  category: string;
  label: string;
  collectionType: SourceCollectionType;
  reliabilityScore: number; // 0..1
  baseRateLimitPerMinute: number;
};

export type AtlasHierarchyTier = "critical" | "supporting" | "context";

export type AtlasHierarchyNode = {
  sourceId: string;
  category: string;
  tier: AtlasHierarchyTier;
  rank: number;
};

export type AtlasCanonicalFieldSchema = {
  rowId: "string";
  countyName: "string";
  countySlug: "string";
  sourceId: "string";
  category: "string";
  capturedAt: "iso-datetime";
  metrics: "record<string, number|string|null>";
  provenance: "record<string, string|number|boolean|null>";
};

export type AtlasSourceExecutionPlan = {
  sourceId: string;
  collectionType: SourceCollectionType;
  tier: AtlasHierarchyTier;
  reliabilityScore: number;
  priorityRank: number;
  maxParallelRequests: number;
  targetRequestsPerMinute: number;
};

export type AtlasParallelScrapePlan = {
  hierarchy: AtlasHierarchyNode[];
  canonicalSchema: AtlasCanonicalFieldSchema;
  aggressiveness: ScrapeAggressiveness;
  maxGlobalParallelRequests: number;
  sourcePlans: AtlasSourceExecutionPlan[];
};

const AGGRESSIVENESS_MULTIPLIER: Record<ScrapeAggressiveness, number> = {
  conservative: 0.6,
  balanced: 1,
  aggressive: 1.6,
};

const TIER_WEIGHT: Record<AtlasHierarchyTier, number> = {
  critical: 1,
  supporting: 0.75,
  context: 0.55,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function tierForCategory(category: string): AtlasHierarchyTier {
  if (category === "environment") {
    return "critical";
  }

  if (category === "infrastructure" || category === "social") {
    return "supporting";
  }

  return "context";
}

function defaultDescriptor(sourceId: string, category: string, label: string): AtlasScrapeSourceDescriptor {
  return {
    sourceId,
    category,
    label,
    collectionType: "structured-api",
    reliabilityScore: 0.9,
    baseRateLimitPerMinute: 60,
  };
}

export function getDefaultAtlasScrapeDescriptors(): AtlasScrapeSourceDescriptor[] {
  return ATLAS_COUNTY_SOURCES.map((source) =>
    defaultDescriptor(source.sourceId, source.category, source.name),
  );
}

export function buildAtlasParallelScrapePlan(options: {
  sources?: AtlasScrapeSourceDescriptor[];
  aggressiveness?: ScrapeAggressiveness;
} = {}): AtlasParallelScrapePlan {
  const sources = options.sources ?? getDefaultAtlasScrapeDescriptors();
  const aggressiveness = options.aggressiveness ?? "balanced";
  const multiplier = AGGRESSIVENESS_MULTIPLIER[aggressiveness];

  const hierarchy = [...sources]
    .sort((left, right) => {
      const tierOrder = ["critical", "supporting", "context"] as const;
      const leftTier = tierForCategory(left.category);
      const rightTier = tierForCategory(right.category);
      if (leftTier !== rightTier) {
        return tierOrder.indexOf(leftTier) - tierOrder.indexOf(rightTier);
      }
      if (right.reliabilityScore !== left.reliabilityScore) {
        return right.reliabilityScore - left.reliabilityScore;
      }
      return left.sourceId.localeCompare(right.sourceId);
    })
    .map((source, index) => ({
      sourceId: source.sourceId,
      category: source.category,
      tier: tierForCategory(source.category),
      rank: index + 1,
    }));

  const sourcePlans = hierarchy.map((node) => {
    const source = sources.find((entry) => entry.sourceId === node.sourceId);
    if (!source) {
      throw new Error(`Missing source descriptor for ${node.sourceId}`);
    }

    const tierWeight = TIER_WEIGHT[node.tier];
    const collectionPenalty = source.collectionType === "html-scrape" ? 0.55 : 1;
    const estimatedRpm = Math.floor(
      source.baseRateLimitPerMinute * multiplier * source.reliabilityScore * tierWeight * collectionPenalty,
    );
    const targetRequestsPerMinute = clamp(estimatedRpm, 4, source.baseRateLimitPerMinute * 2);
    const maxParallelRequests = clamp(Math.floor(targetRequestsPerMinute / 15), 1, 8);

    return {
      sourceId: source.sourceId,
      collectionType: source.collectionType,
      tier: node.tier,
      reliabilityScore: source.reliabilityScore,
      priorityRank: node.rank,
      maxParallelRequests,
      targetRequestsPerMinute,
    } satisfies AtlasSourceExecutionPlan;
  });

  const maxGlobalParallelRequests = sourcePlans.reduce((sum, sourcePlan) => sum + sourcePlan.maxParallelRequests, 0);

  return {
    hierarchy,
    canonicalSchema: {
      rowId: "string",
      countyName: "string",
      countySlug: "string",
      sourceId: "string",
      category: "string",
      capturedAt: "iso-datetime",
      metrics: "record<string, number|string|null>",
      provenance: "record<string, string|number|boolean|null>",
    },
    aggressiveness,
    maxGlobalParallelRequests,
    sourcePlans,
  };
}
