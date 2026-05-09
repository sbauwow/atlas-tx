import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/atlas-county-explorer", () => ({
  getDefaultAtlasCountyExplorerService: vi.fn(() => ({
    getCountyOverview: vi.fn().mockResolvedValue({
      countyCount: 1,
      counties: [
        {
          county: { name: "Travis County", slug: "travis-county" },
          compositeScore: 88,
          ranks: { composite: 1 },
          metrics: { permits: { permitCount: 4 } },
        },
      ],
      generatedAt: "2026-05-08T00:00:00.000Z",
      sourceIds: ["permits"],
    }),
    getCountyBreakdown: vi.fn().mockResolvedValue({
      overview: {
        county: { name: "Travis County", slug: "travis-county" },
        compositeScore: 88,
        ranks: { composite: 1 },
        metrics: { permits: { permitCount: 4 } },
      },
      profile: {
        county: { name: "Travis County", slug: "travis-county" },
        collectedAt: "2026-05-08T00:00:00.000Z",
        sliceCount: 1,
        slices: [],
        metrics: { permits: { permitCount: 4 } },
        annotations: [],
        errors: [],
      },
      highlights: [{ sourceId: "permits", label: "Permits", rank: 1, value: 4 }],
    }),
  })),
}));

describe("county API routes", () => {
  it("returns statewide overview JSON", async () => {
    const { GET } = await import("@/app/api/counties/overview/route");

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.countyCount).toBe(1);
    expect(payload.counties[0].county.slug).toBe("travis-county");
  });

  it("returns a selected county breakdown JSON", async () => {
    const { GET } = await import("@/app/api/counties/[slug]/route");

    const response = await GET(new Request("http://localhost/api/counties/travis-county"), {
      params: Promise.resolve({ slug: "travis-county" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.overview.county.slug).toBe("travis-county");
    expect(payload.highlights[0]).toEqual({ sourceId: "permits", label: "Permits", rank: 1, value: 4 });
  });
});
