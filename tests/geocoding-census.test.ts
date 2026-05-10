import { describe, expect, it, vi } from "vitest";

import { geocodeAddress } from "@/lib/geocoding/census";

const TRAVIS_HIT = {
  result: {
    addressMatches: [
      {
        matchedAddress: "1100 CONGRESS AVE, AUSTIN, TX, 78701",
        coordinates: { x: -97.7404, y: 30.2747 },
        geographies: {
          Counties: [
            { GEOID: "48453", NAME: "Travis County", STATE: "48", COUNTY: "453" },
          ],
          "Census Block Groups": [{ GEOID: "484530011001" }],
          "Census Tracts": [{ GEOID: "48453001100" }],
        },
      },
    ],
  },
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("geocodeAddress retry", () => {
  it("rejects short queries before fetching", async () => {
    const fetchImpl = vi.fn();
    const result = await geocodeAddress("a", { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("invalid-input");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("retries on HTTP 502 then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(502, { errors: ["bad gateway"] }))
      .mockResolvedValueOnce(jsonResponse(502, { errors: ["bad gateway"] }))
      .mockResolvedValueOnce(jsonResponse(200, TRAVIS_HIT));

    const result = await geocodeAddress("1100 Congress Ave Austin TX 78701", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      retryBackoffMs: [0, 0],
    });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.address.countyFips).toBe("48453");
  });

  it("retries when HTTP 200 wraps an in-body gateway error", async () => {
    const inBodyError = { errors: ["upstream gateway"], status: "502" };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, inBodyError))
      .mockResolvedValueOnce(jsonResponse(200, TRAVIS_HIT));

    const result = await geocodeAddress("1100 Congress Ave Austin TX 78701", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      retryBackoffMs: [0, 0],
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
  });

  it("returns network error after exhausting retries", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse(502, { errors: ["bad gateway"] }));

    const result = await geocodeAddress("1100 Congress Ave Austin TX 78701", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      retryAttempts: 2,
      retryBackoffMs: [0],
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("network");
  });

  it("does not retry on a 4xx fatal status", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(404, {}));
    const result = await geocodeAddress("1100 Congress Ave Austin TX 78701", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      retryBackoffMs: [0, 0],
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
  });

  it("returns no-match when Census responds 200 with empty addressMatches", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { result: { addressMatches: [] } }));
    const result = await geocodeAddress("zzzzzzzz nonsense", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      retryBackoffMs: [0, 0],
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("no-match");
  });

  it("flags out-of-state addresses by default", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        result: {
          addressMatches: [
            {
              matchedAddress: "100 N MAIN ST, ANYTOWN, OK, 73401",
              coordinates: { x: -97.1, y: 34.5 },
              geographies: {
                Counties: [{ GEOID: "40019", NAME: "Carter County", STATE: "40" }],
              },
            },
          ],
        },
      }),
    );
    const result = await geocodeAddress("100 N Main St Anytown OK", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      retryBackoffMs: [0, 0],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("out-of-state");
  });
});
