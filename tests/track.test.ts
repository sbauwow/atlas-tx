import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  // @ts-expect-error test cleanup
  delete global.window;
  // @ts-expect-error test cleanup
  delete global.document;
  // @ts-expect-error test cleanup
  delete global.sessionStorage;
  // @ts-expect-error test cleanup
  delete global.Image;
});

describe("track", () => {
  it("sends a beacon with path and first-touch attribution", async () => {
    const storage = new Map<string, string>();
    let beaconUrl = "";

    class FakeImage {
      set src(value: string) {
        beaconUrl = value;
      }
    }

    // @ts-expect-error test shim
    global.window = { location: { origin: "https://atlastexas.org", pathname: "/", search: "" } };
    // @ts-expect-error test shim
    global.document = { referrer: "https://newsroom.example/investigation" };
    // @ts-expect-error test shim
    global.sessionStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    };
    // @ts-expect-error test shim
    global.Image = FakeImage;

    const { track } = await import("@/app/components/track");
    track("outbound", "repo:github.com/sbauwow/atlas-tx@home", "/water?utm_source=letter&utm_medium=email&utm_campaign=launch");

    const url = new URL(beaconUrl, "https://atlastexas.org");
    expect(url.pathname).toBe("/api/beacon");
    expect(url.searchParams.get("e")).toBe("outbound");
    expect(url.searchParams.get("t")).toBe("repo:github.com/sbauwow/atlas-tx@home");
    expect(url.searchParams.get("p")).toBe("/water?utm_source=letter&utm_medium=email&utm_campaign=launch");
    expect(url.searchParams.get("r")).toBe("newsroom.example");
    expect(url.searchParams.get("us")).toBe("letter");
    expect(url.searchParams.get("um")).toBe("email");
    expect(url.searchParams.get("uc")).toBe("launch");
  });
});
