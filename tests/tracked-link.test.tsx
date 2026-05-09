import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("TrackedLink", () => {
  it("fires telemetry before delegating to the provided click handler", async () => {
    const trackSpy = vi.fn();
    const onClick = vi.fn();

    vi.doMock("@/app/components/track", () => ({
      track: trackSpy,
    }));

    const { default: TrackedLink } = await import("@/app/components/tracked-link");
    const element = TrackedLink({
      event: "outbound",
      eventTarget: "repo:github.com/sbauwow/atlas-tx@home",
      href: "https://github.com/sbauwow/atlas-tx",
      onClick,
      children: "GitHub repo",
    });

    element.props.onClick?.({ type: "click" });

    expect(trackSpy).toHaveBeenCalledWith("outbound", "repo:github.com/sbauwow/atlas-tx@home");
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
