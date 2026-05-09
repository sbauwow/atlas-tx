import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  // @ts-expect-error test cleanup
  delete global.window;
});

describe("PageViewBeacon", () => {
  it("tracks a pageview for the current path and query", async () => {
    const trackSpy = vi.fn();

    vi.doMock("next/navigation", () => ({
      usePathname: () => "/water",
      useSearchParams: () => new URLSearchParams("county=travis"),
    }));
    vi.doMock("react", async () => {
      const actual = await vi.importActual<typeof import("react")>("react");
      return {
        ...actual,
        useEffect: (effect: () => void) => effect(),
      };
    });
    vi.doMock("@/app/components/track", () => ({
      track: trackSpy,
    }));

    // @ts-expect-error test shim
    global.window = { location: { pathname: "/water", search: "?county=travis" } };

    const { default: PageViewBeacon } = await import("@/app/components/page-view-beacon");
    const result = PageViewBeacon();

    expect(result).toBeNull();
    expect(trackSpy).toHaveBeenCalledWith("pageview", undefined, "/water?county=travis");
  });
});
