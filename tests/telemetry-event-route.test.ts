import { afterEach, describe, expect, it, vi } from "vitest";

describe("POST /api/event", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts valid telemetry envelopes", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const routeModule = await import("@/app/api/event/route");
    const response = await routeModule.POST(new Request("https://atlastexas.org/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "map_mode_changed",
        props: { mode: "oil", path: "/analytics?mode=oil" },
        session_id: "session-123",
        ts: "2026-05-10T00:00:00.000Z",
      }),
    }));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ ok: true });
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0]?.[0]).toContain('"app":"atlas-tx"');
    expect(logSpy.mock.calls[0]?.[0]).toContain('"event_name":"map_mode_changed"');
  });

  it("rejects invalid telemetry bodies", async () => {
    const routeModule = await import("@/app/api/event/route");
    const response = await routeModule.POST(new Request("https://atlastexas.org/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ props: { mode: "oil" } }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid telemetry body" });
  });
});
