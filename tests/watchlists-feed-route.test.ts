import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getWatchlistFeed = vi.fn();

vi.mock("@/lib/watchlists/feed", () => ({
  getWatchlistFeed,
}));

describe("GET /api/watchlists/feed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the watchlist feed and forwards watchlistId filters", async () => {
    getWatchlistFeed.mockResolvedValueOnce({
      generatedAt: "2026-05-10T00:00:00.000Z",
      watchlists: [],
      artifacts: {
        countyMovers: { id: "county-movers", path: "/tmp/county-movers.json", available: true, generatedAt: null, note: null },
        pressureRiskScatter: { id: "pressure-risk-scatter", path: "/tmp/pressure-risk-scatter.json", available: true, generatedAt: null, note: null },
        sourceFreshness: { id: "source-freshness", path: "/tmp/source-freshness.json", available: true, generatedAt: null, note: null },
      },
    });

    const { GET } = await import("@/app/api/watchlists/feed/route");
    const response = await GET(new NextRequest("http://localhost/api/watchlists/feed?watchlistId=wl_1"));

    expect(response.status).toBe(200);
    expect(getWatchlistFeed).toHaveBeenCalledWith("wl_1");
    expect(await response.json()).toMatchObject({ generatedAt: "2026-05-10T00:00:00.000Z" });
  });

  it("maps missing watchlists to 404", async () => {
    getWatchlistFeed.mockRejectedValueOnce({ name: "WatchlistNotFoundError", message: "watchlist not found" });

    const { GET } = await import("@/app/api/watchlists/feed/route");
    const response = await GET(new NextRequest("http://localhost/api/watchlists/feed?watchlistId=missing"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "watchlist not found" });
  });
});
