import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/atlas-county-explorer", () => ({
  getDefaultAtlasCountyExplorerService: () => ({
    getCountyOverview: vi.fn(async () => ({
      generatedAt: "2026-05-09T00:00:00.000Z",
      countyCount: 3,
      sourceIds: ["permits", "water-districts", "cpi-investigations"],
      counties: [
        {
          county: { name: "Travis County", slug: "travis-county" },
          compositeScore: 91.2,
          ranks: { composite: 1, permits: 2 },
          metrics: { permits: { permitCount: 14 } },
          sourceValues: { permits: 14 },
        },
        {
          county: { name: "Harris County", slug: "harris-county" },
          compositeScore: 88.7,
          ranks: { composite: 2, permits: 1 },
          metrics: { permits: { permitCount: 18 } },
          sourceValues: { permits: 18 },
        },
        {
          county: { name: "Bexar County", slug: "bexar-county" },
          compositeScore: 82.1,
          ranks: { composite: 3, permits: 4 },
          metrics: { permits: { permitCount: 9 } },
          sourceValues: { permits: 9 },
        },
      ],
    })),
  }),
}));

describe("counties overview page", () => {
  it("renders statewide county workspace entry list", async () => {
    const pageModule = await import("@/app/counties/page");
    const page = await pageModule.default();
    const text = renderToStaticMarkup(page);

    expect(text).toContain("County workspace overview");
    expect(text).toContain("3 ranked counties");
    expect(text).toContain("href=\"/counties/travis-county\"");
    expect(text).toContain("href=\"/permits?county=travis-county\"");
    expect(text).toContain("href=\"/water/counties/travis-county\"");
    expect(text).toContain("Composite score");
    expect(text).toContain("Top counties");
    expect(text).toContain("Travis County");
    expect(text).toContain("Harris County");
  });
});
