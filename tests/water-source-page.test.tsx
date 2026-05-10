import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const getCountyProfile = vi.fn();

vi.mock("@/lib/water/source-provenance", () => ({
  getDefaultCountyWaterSourceProfileService: () => ({ getCountyProfile }),
}));

describe("/water/sources/[slug] page", () => {
  it("renders source descriptors, timeline, and community sample block", async () => {
    getCountyProfile.mockResolvedValueOnce({
      county: { slug: "travis-county", name: "Travis County" },
      generatedAt: "2026-05-10T00:00:00.000Z",
      sourceDescriptors: [
        { sourceType: "utility", name: "Austin Water", countyName: "Travis County", metadata: { sourceId: "puct-water-iou" } },
      ],
      openDataSummary: {
        activeWaterUtilities: 1,
        activeWaterDistricts: 2,
        trackedPermitSites: 3,
      },
      timeline: [
        { month: "2026-04", alertCount: 1, sewerOverflowCount: 2, permitCount: 3, communitySampleCount: 4 },
      ],
      communitySamples: [
        { id: "obs-1", createdAt: "2026-04-20T12:00:00.000Z", status: "accepted", stripBrand: "Generic" },
      ],
    });

    const pageModule = await import("@/app/water/sources/[slug]/page");
    const element = await pageModule.default({ params: Promise.resolve({ slug: "travis-county" }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Travis County water source analysis");
    expect(html).toContain("Austin Water");
    expect(html).toContain("Timeline matrix");
    expect(html).toContain("Coverage ratio");
    expect(html).toContain("Moderate mismatch pressure");
    expect(html).toContain("Top anomalous months");
    expect(html).toContain("Jump to timeline");
    expect(html).toContain("Open evidence API");
    expect(html).toContain("Community-curated samples");
    expect(html).toContain("obs-1");
  });
});
