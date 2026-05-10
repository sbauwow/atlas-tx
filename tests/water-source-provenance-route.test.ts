import { describe, expect, it, vi } from "vitest";

const getCountyProfile = vi.fn();

vi.mock("@/lib/water/source-provenance", () => ({
  getDefaultCountyWaterSourceProfileService: () => ({ getCountyProfile }),
}));

describe("GET /api/water/sources/[slug]", () => {
  it("returns source profile payload", async () => {
    getCountyProfile.mockResolvedValueOnce({ county: { slug: "travis", name: "Travis County" }, timeline: [] });

    const routeModule = await import("@/app/api/water/sources/[slug]/route");
    const response = await routeModule.GET(new Request("http://localhost/api/water/sources/travis"), {
      params: Promise.resolve({ slug: "travis" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ county: { slug: "travis", name: "Travis County" }, timeline: [] });
  });

  it("returns month-filtered evidence window", async () => {
    getCountyProfile.mockResolvedValueOnce({
      county: { slug: "travis", name: "Travis County" },
      timeline: [{ month: "2026-04", alertCount: 1, sewerOverflowCount: 2, permitCount: 3, communitySampleCount: 4 }],
      communitySamples: [
        { id: "obs-1", createdAt: "2026-04-02T00:00:00.000Z", status: "accepted", stripBrand: "Generic" },
        { id: "obs-2", createdAt: "2026-05-02T00:00:00.000Z", status: "accepted", stripBrand: "Generic" },
      ],
    });

    const routeModule = await import("@/app/api/water/sources/[slug]/route");
    const response = await routeModule.GET(new Request("http://localhost/api/water/sources/travis?month=2026-04"), {
      params: Promise.resolve({ slug: "travis" }),
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.evidenceWindow.month).toBe("2026-04");
    expect(payload.evidenceWindow.timelinePoint).toEqual({ month: "2026-04", alertCount: 1, sewerOverflowCount: 2, permitCount: 3, communitySampleCount: 4 });
    expect(payload.evidenceWindow.communitySamples).toEqual([
      { id: "obs-1", createdAt: "2026-04-02T00:00:00.000Z", status: "accepted", stripBrand: "Generic" },
    ]);
  });

  it("rejects invalid month format", async () => {
    getCountyProfile.mockResolvedValueOnce({ county: { slug: "travis", name: "Travis County" }, timeline: [], communitySamples: [] });

    const routeModule = await import("@/app/api/water/sources/[slug]/route");
    const response = await routeModule.GET(new Request("http://localhost/api/water/sources/travis?month=april"), {
      params: Promise.resolve({ slug: "travis" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid month format. Use YYYY-MM." });
  });
});
