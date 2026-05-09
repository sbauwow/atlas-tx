import { describe, expect, it, vi } from "vitest";
import { createCountyDataService } from "@/lib/county-data-service";
import { createAtlasCountyExplorerService } from "@/lib/atlas-county-explorer";

const countyDetailService = createCountyDataService({
  sources: [
    {
      sourceId: "permits",
      name: "Permits",
      category: "environment",
      async collect() {
        return { records: [{ id: 1 }], metrics: { permitCount: 4, activeCount: 3, pendingCount: 1 } };
      },
    },
    {
      sourceId: "cpi-investigations",
      name: "CPI investigations",
      category: "social",
      async collect() {
        return { records: [{ fiscal_year: 2025 }], metrics: { totalCompletedInvestigations: 81 } };
      },
    },
  ],
});

describe("atlas county explorer service", () => {
  it("merges statewide source rows into ranked county overview records", async () => {
    const service = createAtlasCountyExplorerService({
      centroids: {
        "travis-county": { lat: 30.28, lon: -97.75 },
        "harris-county": { lat: 29.86, lon: -95.39 },
      },
      detailService: countyDetailService,
      overviewSources: [
        {
          sourceId: "permits",
          category: "environment",
          label: "Permits",
          async collect() {
            return [
              { county: "Harris", value: 12, metrics: { permitCount: 12 } },
              { county: "Travis", value: 4, metrics: { permitCount: 4 } },
            ];
          },
        },
        {
          sourceId: "cpi-investigations",
          category: "social",
          label: "CPI investigations",
          async collect() {
            return [
              { county: "Travis County", value: 81, metrics: { totalCompletedInvestigations: 81 } },
              { county: "Harris County", value: 60, metrics: { totalCompletedInvestigations: 60 } },
            ];
          },
        },
      ],
    });

    const overview = await service.getCountyOverview();

    expect(overview.countyCount).toBe(2);
    expect(overview.counties.map((county) => county.county.slug)).toEqual(["harris-county", "travis-county"]);
    expect(overview.counties[0]).toMatchObject({
      county: { name: "Harris County", slug: "harris-county" },
      compositeScore: 50,
      ranks: { permits: 1, "cpi-investigations": 2, composite: 1 },
      metrics: {
        permits: { permitCount: 12 },
        "cpi-investigations": { totalCompletedInvestigations: 60 },
      },
    });
    expect(overview.counties[1]?.centroid).toEqual({ lat: 30.28, lon: -97.75 });
  });

  it("builds a county breakdown from overview ranks plus detailed source slices", async () => {
    const service = createAtlasCountyExplorerService({
      centroids: {
        "travis-county": { lat: 30.28, lon: -97.75 },
        "harris-county": { lat: 29.86, lon: -95.39 },
      },
      detailService: countyDetailService,
      overviewSources: [
        {
          sourceId: "permits",
          category: "environment",
          label: "Permits",
          async collect() {
            return [
              { county: "Harris County", value: 12, metrics: { permitCount: 12 } },
              { county: "Travis County", value: 4, metrics: { permitCount: 4 } },
            ];
          },
        },
        {
          sourceId: "cpi-investigations",
          category: "social",
          label: "CPI investigations",
          async collect() {
            return [
              { county: "Travis County", value: 81, metrics: { totalCompletedInvestigations: 81 } },
              { county: "Harris County", value: 60, metrics: { totalCompletedInvestigations: 60 } },
            ];
          },
        },
      ],
    });

    const breakdown = await service.getCountyBreakdown("travis");

    expect(breakdown.overview.county).toEqual({ name: "Travis County", slug: "travis-county" });
    expect(breakdown.overview.ranks).toEqual({ permits: 2, "cpi-investigations": 1, composite: 2 });
    expect(breakdown.profile.sliceCount).toBe(2);
    expect(breakdown.highlights).toEqual([
      {
        sourceId: "cpi-investigations",
        label: "CPI investigations",
        rank: 1,
        value: 81,
      },
      {
        sourceId: "permits",
        label: "Permits",
        rank: 2,
        value: 4,
      },
    ]);
  });

  it("throws when a requested county is missing from the statewide overview", async () => {
    const service = createAtlasCountyExplorerService({
      centroids: {},
      detailService: countyDetailService,
      overviewSources: [
        {
          sourceId: "permits",
          category: "environment",
          label: "Permits",
          collect: vi.fn().mockResolvedValue([{ county: "Travis County", value: 4, metrics: { permitCount: 4 } }]),
        },
      ],
    });

    await expect(service.getCountyBreakdown("bexar")).rejects.toThrow("County not found: bexar");
  });
});
