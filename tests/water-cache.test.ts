import { beforeEach, describe, expect, it, vi } from "vitest";
import { createWaterDataCache } from "@/lib/water/cache";

describe("water data cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T00:00:00.000Z"));
  });

  it("reuses cached loader results inside the ttl window", async () => {
    const cache = createWaterDataCache();
    const loader = vi.fn().mockResolvedValue({ alerts: 2 });

    const first = await cache.getOrLoad("alerts", 60_000, loader);
    const second = await cache.getOrLoad("alerts", 60_000, loader);

    expect(first).toEqual({ alerts: 2 });
    expect(second).toEqual({ alerts: 2 });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("refreshes cached values after the ttl expires", async () => {
    const cache = createWaterDataCache();
    const loader = vi
      .fn()
      .mockResolvedValueOnce({ gauges: 1 })
      .mockResolvedValueOnce({ gauges: 3 });

    const first = await cache.getOrLoad("gauges", 60_000, loader);
    vi.advanceTimersByTime(60_001);
    const second = await cache.getOrLoad("gauges", 60_000, loader);

    expect(first).toEqual({ gauges: 1 });
    expect(second).toEqual({ gauges: 3 });
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("exposes freshness metadata for cached keys", async () => {
    const cache = createWaterDataCache();
    await cache.getOrLoad("permits", 60_000, async () => ({ permits: 5 }));

    expect(cache.getFreshness("permits")).toEqual({
      cached: true,
      cachedAt: "2026-05-09T00:00:00.000Z",
      expiresAt: "2026-05-09T00:01:00.000Z",
      ttlMs: 60000,
    });
  });
});
