import { describe, expect, it, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("telemetry beacon route", () => {
  it("returns a tracking pixel, refreshes a session cookie, and logs normalized telemetry", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(crypto, "randomUUID").mockReturnValue("atlas-session-1234");

    const { GET } = await import("@/app/api/beacon/route");
    const request = new NextRequest(
      "https://atlastexas.org/api/beacon?e=pageview&t=landing:home&p=%2Fwater%3Futm_source%3Dnewsletter%26utm_medium%3Demail%26utm_campaign%3Dlaunch",
      {
        headers: {
          "user-agent": "Mozilla/5.0",
          referer: "https://example.com/story",
          "x-forwarded-for": "203.0.113.10",
        },
      },
    );

    const response = await GET(request);
    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] ?? "{}");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/gif");
    expect(response.cookies.get("atlas_tx_sid")?.value).toBe("atlas-session-1234");
    expect(payload.msg).toBe("telemetry");
    expect(payload.event_type).toBe("pageview");
    expect(payload.path).toBe("/water");
    expect(payload.referrer).toBe("example.com");
    expect(payload.utm_source).toBe("newsletter");
    expect(payload.utm_medium).toBe("email");
    expect(payload.utm_campaign).toBe("launch");
  });
});
