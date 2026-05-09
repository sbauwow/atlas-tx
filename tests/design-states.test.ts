import { describe, expect, it, vi } from "vitest";

import {
  ACCENT_HEX,
  freshnessFromCacheMeta,
  lifecycleFromStatusString,
  SEVERITY_HEX,
  SEVERITY_LABEL,
  severityFromAlertString,
  severityFromMismatch,
  severityFromRiskScore,
  trendFromDelta,
} from "@/app/design/states";

describe("severityFromRiskScore", () => {
  it("returns 0 for null/undefined/zero", () => {
    expect(severityFromRiskScore(null)).toBe(0);
    expect(severityFromRiskScore(undefined)).toBe(0);
    expect(severityFromRiskScore(0)).toBe(0);
  });

  it("hits each boundary the legacy /water page used", () => {
    expect(severityFromRiskScore(1)).toBe(1);
    expect(severityFromRiskScore(3)).toBe(1);
    expect(severityFromRiskScore(4)).toBe(2);
    expect(severityFromRiskScore(7)).toBe(2);
    expect(severityFromRiskScore(8)).toBe(3);
    expect(severityFromRiskScore(50)).toBe(3);
  });
});

describe("severityFromMismatch", () => {
  it("returns 0 below 40 to preserve the legacy 'no signal' bucket", () => {
    expect(severityFromMismatch(0)).toBe(0);
    expect(severityFromMismatch(1)).toBe(0);
    expect(severityFromMismatch(39)).toBe(0);
  });

  it("escalates at 40 and 75", () => {
    expect(severityFromMismatch(40)).toBe(3);
    expect(severityFromMismatch(74)).toBe(3);
    expect(severityFromMismatch(75)).toBe(4);
    expect(severityFromMismatch(100)).toBe(4);
  });
});

describe("severityFromAlertString", () => {
  it("maps NWS severity vocabulary case-insensitively", () => {
    expect(severityFromAlertString("Extreme")).toBe(4);
    expect(severityFromAlertString("severe")).toBe(3);
    expect(severityFromAlertString("MODERATE")).toBe(2);
    expect(severityFromAlertString("Minor")).toBe(1);
    expect(severityFromAlertString(null)).toBe(0);
    expect(severityFromAlertString("Unknown")).toBe(0);
  });
});

describe("lifecycleFromStatusString", () => {
  it("classifies common Texas permit/governance status strings", () => {
    expect(lifecycleFromStatusString("Active")).toBe("active");
    expect(lifecycleFromStatusString("ACTIVE PERMIT")).toBe("active");
    expect(lifecycleFromStatusString("Issued")).toBe("active");
    expect(lifecycleFromStatusString("Pending review")).toBe("pending");
    expect(lifecycleFromStatusString("Application")).toBe("pending");
    expect(lifecycleFromStatusString("Expired")).toBe("expired");
    expect(lifecycleFromStatusString("Terminated")).toBe("expired");
    expect(lifecycleFromStatusString("Inactive")).toBe("inactive");
    expect(lifecycleFromStatusString("Withdrawn")).toBe("inactive");
    expect(lifecycleFromStatusString(null)).toBe("unknown");
    expect(lifecycleFromStatusString("")).toBe("unknown");
  });
});

describe("freshnessFromCacheMeta", () => {
  it("returns missing for null/empty meta", () => {
    expect(freshnessFromCacheMeta(null)).toBe("missing");
    expect(freshnessFromCacheMeta(undefined)).toBe("missing");
  });

  it("returns stale when expiresAt is null (cache pending)", () => {
    expect(freshnessFromCacheMeta({ expiresAt: null })).toBe("stale");
  });

  it("returns missing when expiresAt is unparseable", () => {
    expect(freshnessFromCacheMeta({ expiresAt: "not a date" })).toBe("missing");
  });

  it("compares against current time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T00:00:00Z"));
    expect(freshnessFromCacheMeta({ expiresAt: "2026-05-09T01:00:00Z" })).toBe("fresh");
    expect(freshnessFromCacheMeta({ expiresAt: "2026-05-08T23:00:00Z" })).toBe("stale");
    vi.useRealTimers();
  });
});

describe("trendFromDelta", () => {
  it("classifies positive/negative/zero", () => {
    expect(trendFromDelta(5)).toBe("up");
    expect(trendFromDelta(-5)).toBe("down");
    expect(trendFromDelta(0)).toBe("flat");
    expect(trendFromDelta(null)).toBe("flat");
  });

  it("respects an epsilon band", () => {
    expect(trendFromDelta(0.4, 0.5)).toBe("flat");
    expect(trendFromDelta(0.6, 0.5)).toBe("up");
  });
});

describe("token tables", () => {
  it("hex tables enumerate every severity level", () => {
    expect(Object.keys(SEVERITY_HEX)).toEqual(["0", "1", "2", "3", "4"]);
    expect(Object.keys(SEVERITY_LABEL)).toEqual(["0", "1", "2", "3", "4"]);
  });

  it("accent hex matches the documented token", () => {
    expect(ACCENT_HEX).toBe("#22d3ee");
  });
});
