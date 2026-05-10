import { describe, expect, it, vi } from "vitest";

const fetchPermitsMock = vi.fn();

vi.mock("@/lib/water/tceq-general-permits", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/water/tceq-general-permits")>();
  return {
    ...actual,
    fetchGeneralWaterPermits: (...args: unknown[]) => fetchPermitsMock(...args),
  };
});

describe("GET /api/water/oil-gas-extraction", () => {
  it("filters TXG31 oil and gas extraction permits and summarizes counties", async () => {
    fetchPermitsMock.mockResolvedValueOnce([
      {
        sourceId: "tceq-general-water-permits",
        permitNumber: "TXG310001",
        countyName: "Fayette County",
        permitStatus: "ACTIVE",
        permitType: "GENERAL",
        siteName: "Pad A",
        raw: {},
      },
      {
        sourceId: "tceq-general-water-permits",
        permitNumber: "TXG310099",
        countyName: "Fayette County",
        permitStatus: "PENDING",
        permitType: "GENERAL",
        siteName: "Pad B",
        raw: {},
      },
      {
        sourceId: "tceq-general-water-permits",
        permitNumber: "TXG340100",
        countyName: "Harris County",
        permitStatus: "ACTIVE",
        permitType: "GENERAL",
        siteName: "Terminal",
        raw: {},
      },
    ]);

    const routeModule = await import("@/app/api/water/oil-gas-extraction/route");
    const response = await routeModule.GET(new Request("https://atlastexas.org/api/water/oil-gas-extraction?county=fayette-county"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.summary.totalPermits).toBe(2);
    expect(payload.summary.countyCount).toBe(1);
    expect(payload.summary.topCounties).toEqual([{ countyName: "Fayette County", count: 2, countySlug: "fayette-county" }]);
    expect(payload.permits.map((record: { permitNumber: string }) => record.permitNumber)).toEqual(["TXG310001", "TXG310099"]);
    expect(payload.freshness).toBeDefined();
  });
});
