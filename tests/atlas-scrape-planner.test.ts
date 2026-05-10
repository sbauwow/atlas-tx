import { describe, expect, it } from "vitest";
import {
  buildAtlasParallelScrapePlan,
  type AtlasScrapeSourceDescriptor,
} from "@/lib/atlas-scrape-planner";

describe("buildAtlasParallelScrapePlan", () => {
  it("defines hierarchy and canonical schema before execution tuning", () => {
    const plan = buildAtlasParallelScrapePlan({
      sources: [
        {
          sourceId: "permits",
          label: "Permits",
          category: "environment",
          collectionType: "structured-api",
          reliabilityScore: 0.95,
          baseRateLimitPerMinute: 60,
        },
        {
          sourceId: "water-districts",
          label: "Water districts",
          category: "infrastructure",
          collectionType: "structured-api",
          reliabilityScore: 0.9,
          baseRateLimitPerMinute: 60,
        },
      ],
    });

    expect(plan.hierarchy.map((node) => node.sourceId)).toEqual(["permits", "water-districts"]);
    expect(plan.hierarchy[0]?.tier).toBe("critical");
    expect(plan.canonicalSchema).toMatchObject({
      rowId: "string",
      countyName: "string",
      countySlug: "string",
      sourceId: "string",
      metrics: "record<string, number|string|null>",
    });
  });

  it("scales parallelism by aggressiveness and source risk", () => {
    const sources: AtlasScrapeSourceDescriptor[] = [
      {
        sourceId: "permits",
        label: "Permits",
        category: "environment",
        collectionType: "structured-api",
        reliabilityScore: 0.95,
        baseRateLimitPerMinute: 60,
      },
      {
        sourceId: "search-one",
        label: "CID Search One",
        category: "environment",
        collectionType: "html-scrape",
        reliabilityScore: 0.55,
        baseRateLimitPerMinute: 24,
      },
    ];

    const conservative = buildAtlasParallelScrapePlan({ sources, aggressiveness: "conservative" });
    const aggressive = buildAtlasParallelScrapePlan({ sources, aggressiveness: "aggressive" });

    const conservativePermits = conservative.sourcePlans.find((source) => source.sourceId === "permits");
    const aggressivePermits = aggressive.sourcePlans.find((source) => source.sourceId === "permits");
    const conservativeSearchOne = conservative.sourcePlans.find((source) => source.sourceId === "search-one");

    expect(aggressive.maxGlobalParallelRequests).toBeGreaterThanOrEqual(conservative.maxGlobalParallelRequests);
    expect((aggressivePermits?.targetRequestsPerMinute ?? 0)).toBeGreaterThan(
      conservativePermits?.targetRequestsPerMinute ?? 0,
    );
    expect((conservativeSearchOne?.targetRequestsPerMinute ?? 0)).toBeLessThan(
      conservativePermits?.targetRequestsPerMinute ?? 0,
    );
  });
});
