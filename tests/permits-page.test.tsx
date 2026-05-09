import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tceq-permits", () => ({
  getTceqPendingPermitsPageData: vi.fn(async (county?: string) => ({
    countyFilter: county ?? null,
    generatedAt: "2026-05-09T00:00:00.000Z",
    summary: {
      pendingPermitCount: 3,
      activePermitCount: 9,
      countyCount: 2,
      authorizationTypeCount: 2,
      topCounties: [
        { county: "Travis County", count: 2 },
        { county: "Hays County", count: 1 },
      ],
    },
    permits: [
      {
        permitNumber: "WQ0001",
        authorizationType: "IND WW",
        authorizationStatus: "PENDING",
        permitteeName: "Alpha Water LLC",
        county: "Travis County",
        nearestCity: "Austin",
        latitude: 30.27,
        longitude: -97.74,
      },
    ],
  })),
}));

describe("permits page", () => {
  it("renders statewide pending permit tracking", async () => {
    const pageModule = await import("@/app/permits/page");
    const page = await pageModule.default({ searchParams: Promise.resolve({}) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("TCEQ pending permits");
    expect(text).toContain("Pending permit tracker for Texas");
    expect(text).toContain("Travis County");
    expect(text).toContain("WQ0001");
    expect(text).toContain("Alpha Water LLC");
  });

  it("renders the selected county filter when present", async () => {
    const pageModule = await import("@/app/permits/page");
    const page = await pageModule.default({ searchParams: Promise.resolve({ county: "travis-county" }) });
    const text = renderToStaticMarkup(page);

    expect(text).toContain("County filter");
    expect(text).toContain("travis-county");
  });
});
