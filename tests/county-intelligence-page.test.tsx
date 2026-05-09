import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/atlas-county-explorer", () => ({
  getDefaultAtlasCountyExplorerService: () => ({
    getCountyBreakdown: vi.fn(async (slug: string) => ({
      overview: {
        county: { name: "Travis County", slug },
        compositeScore: 91.2,
        ranks: { composite: 3, permits: 5 },
        metrics: {
          permits: { permitCount: 14 },
          "water-districts": { districtCount: 6 },
        },
        sourceValues: { permits: 14, "water-districts": 6 },
      },
      profile: {
        county: { name: "Travis County", slug },
        datasets: [
          { sourceId: "permits", label: "Permits", recordCount: 14, status: "ready" },
          { sourceId: "water-districts", label: "Water districts", recordCount: 6, status: "ready" },
        ],
      },
      highlights: [
        { sourceId: "permits", label: "Permits", rank: 5, value: 14 },
        { sourceId: "water-districts", label: "Water districts", rank: 8, value: 6 },
      ],
      hydrologyContext: {
        countyCentroid: { lat: 30.3, lon: -97.7 },
        layerHits: {
          "twdb-major-aquifers": 1,
          "twdb-river-basins": 2,
          "twdb-huc8": 3,
        },
        matches: [
          { layerId: "twdb-river-basins", layerName: "River basins", primaryCode: "12", name: "Colorado", basin: "Colorado", region: null, subregion: null },
        ],
        caveat: "Centroid overlap only.",
      },
    })),
  }),
}));

describe("county intelligence page", () => {
  it("renders shared county workspace header and county intelligence details", async () => {
    const pageModule = await import("@/app/counties/[slug]/page");
    const page = await pageModule.default({ params: Promise.resolve({ slug: "travis-county" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("County workspace");
    expect(text).toContain("Travis County county intelligence");
    expect(text).toContain("Texas Water Development Board");
    expect(text).toContain("Hydrologic Unit Code");
    expect(text).toContain('title="Texas Water Development Board"');
    expect(text).toContain('title="Hydrologic Unit Code"');
    expect(text).toContain('href=\"/permits?county=travis-county\"');
    expect(text).toContain('href=\"/water/counties/travis-county\"');
    expect(text).toContain('href=\"/counties/tom-green-county\"');
    expect(text).toContain('href=\"/counties/trinity-county\"');
    expect(text).toContain("Composite score");
    expect(text).toContain("91.2");
    expect(text).toContain("Colorado");
    expect(text).toContain("Centroid overlap only.");
  });
});
