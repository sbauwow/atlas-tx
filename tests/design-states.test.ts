import { describe, expect, it, vi } from "vitest";

import {
  ACCENT_HEX,
  freshnessFromCacheMeta,
  SEVERITY_HEX,
  SEVERITY_LABEL,
  severityFromMismatch,
  severityFromRiskScore,
} from "@/app/design/states";

describe("severityFromRiskScore", () => {
  it("preserves the legacy /water thresholds (no severity-4 in risk mode)", () => {
    expect(severityFromRiskScore(null)).toBe(0);
    expect(severityFromRiskScore(0)).toBe(0);
    expect(severityFromRiskScore(1)).toBe(1);
    expect(severityFromRiskScore(3)).toBe(1);
    expect(severityFromRiskScore(4)).toBe(2);
    expect(severityFromRiskScore(7)).toBe(2);
    expect(severityFromRiskScore(8)).toBe(3);
    expect(severityFromRiskScore(50)).toBe(3);
  });
});

describe("severityFromMismatch", () => {
  it("preserves the legacy 0 → 3 → 4 jumps (mismatch scorer increments in 25s)", () => {
    expect(severityFromMismatch(0)).toBe(0);
    expect(severityFromMismatch(39)).toBe(0);
    expect(severityFromMismatch(40)).toBe(3);
    expect(severityFromMismatch(74)).toBe(3);
    expect(severityFromMismatch(75)).toBe(4);
    expect(severityFromMismatch(100)).toBe(4);
  });
});

describe("freshnessFromCacheMeta", () => {
  it("classifies cache meta against current time", () => {
    expect(freshnessFromCacheMeta(null)).toBe("missing");
    expect(freshnessFromCacheMeta({ expiresAt: null })).toBe("stale");
    expect(freshnessFromCacheMeta({ expiresAt: "not a date" })).toBe("missing");

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T00:00:00Z"));
    expect(freshnessFromCacheMeta({ expiresAt: "2026-05-09T01:00:00Z" })).toBe("fresh");
    expect(freshnessFromCacheMeta({ expiresAt: "2026-05-08T23:00:00Z" })).toBe("stale");
    vi.useRealTimers();
  });
});

describe("token tables", () => {
  it("hex tables enumerate every severity level and sev-3 matches the asserted /water orange", () => {
    expect(Object.keys(SEVERITY_HEX)).toEqual(["0", "1", "2", "3", "4"]);
    expect(SEVERITY_HEX[3]).toBe("#f97316");
    expect(Object.keys(SEVERITY_LABEL)).toEqual(["0", "1", "2", "3", "4"]);
    expect(ACCENT_HEX).toBe("#22d3ee");
  });
});
