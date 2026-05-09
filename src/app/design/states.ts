/**
 * Maps raw scores and status strings to design-token state levels.
 * Tokens live in `src/app/globals.css` under @theme inline.
 *
 * Severity thresholds preserve the existing /water page behavior so PR1
 * is a pure plumbing change: see the original countyFill in
 * src/app/water/page.tsx prior to this refactor.
 */

export type SeverityLevel = 0 | 1 | 2 | 3 | 4;
export type LifecycleStatus = "active" | "pending" | "expired" | "inactive" | "unknown";
export type Trend = "up" | "down" | "flat";
export type Freshness = "fresh" | "stale" | "missing";

export const SEVERITY_LABEL: Record<SeverityLevel, string> = {
  0: "none",
  1: "low",
  2: "moderate",
  3: "high",
  4: "critical",
};

export function severityFromRiskScore(score: number | null | undefined): SeverityLevel {
  const value = score ?? 0;
  if (value >= 8) return 3;
  if (value >= 4) return 2;
  if (value >= 1) return 1;
  return 0;
}

export function severityFromMismatch(score: number | null | undefined): SeverityLevel {
  const value = score ?? 0;
  if (value >= 75) return 4;
  if (value >= 40) return 3;
  return 0;
}

export function severityFromAlertString(severity: string | null | undefined): SeverityLevel {
  switch ((severity ?? "").toLowerCase()) {
    case "extreme":
      return 4;
    case "severe":
      return 3;
    case "moderate":
      return 2;
    case "minor":
      return 1;
    default:
      return 0;
  }
}

export function lifecycleFromStatusString(value: string | null | undefined): LifecycleStatus {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return "unknown";
  if (normalized.includes("inactive") || normalized === "withdrawn" || normalized === "void") return "inactive";
  if (normalized.includes("expire") || normalized.includes("terminat") || normalized.includes("revoke") || normalized === "closed") return "expired";
  if (normalized.includes("pending") || normalized.includes("review") || normalized.includes("application")) return "pending";
  if (normalized.includes("active") || normalized === "issued" || normalized === "open") return "active";
  return "unknown";
}

export function freshnessFromCacheMeta(meta: { expiresAt: string | null; ttlMs?: number | null } | null | undefined): Freshness {
  if (!meta) return "missing";
  if (!meta.expiresAt) return "stale";
  const expires = Date.parse(meta.expiresAt);
  if (Number.isNaN(expires)) return "missing";
  return expires > Date.now() ? "fresh" : "stale";
}

export function trendFromDelta(delta: number | null | undefined, epsilon = 0): Trend {
  const value = delta ?? 0;
  if (value > epsilon) return "up";
  if (value < -epsilon) return "down";
  return "flat";
}

/* ---------- Token name resolvers ----------
 * Tailwind v4 scans source for full class strings; dynamic interpolation
 * (`text-sev-${level}`) does not get picked up. Maps below preserve full
 * literal class names so the JIT can find them.
 */

export const SEVERITY_BG_CLASS: Record<SeverityLevel, string> = {
  0: "bg-sev-0",
  1: "bg-sev-1",
  2: "bg-sev-2",
  3: "bg-sev-3",
  4: "bg-sev-4",
};

export const SEVERITY_TEXT_CLASS: Record<SeverityLevel, string> = {
  0: "text-sev-0",
  1: "text-sev-1",
  2: "text-sev-2",
  3: "text-sev-3",
  4: "text-sev-4",
};

export const SEVERITY_BORDER_CLASS: Record<SeverityLevel, string> = {
  0: "border-sev-0",
  1: "border-sev-1",
  2: "border-sev-2",
  3: "border-sev-3",
  4: "border-sev-4",
};

export const LIFECYCLE_BG_CLASS: Record<LifecycleStatus, string> = {
  active: "bg-status-active",
  pending: "bg-status-pending",
  expired: "bg-status-expired",
  inactive: "bg-status-inactive",
  unknown: "bg-status-inactive",
};

export const LIFECYCLE_TEXT_CLASS: Record<LifecycleStatus, string> = {
  active: "text-status-active",
  pending: "text-status-pending",
  expired: "text-status-expired",
  inactive: "text-status-inactive",
  unknown: "text-status-inactive",
};

export const FRESHNESS_TEXT_CLASS: Record<Freshness, string> = {
  fresh: "text-fresh-fresh",
  stale: "text-fresh-stale",
  missing: "text-fresh-missing",
};

export const TREND_TEXT_CLASS: Record<Trend, string> = {
  up: "text-trend-up",
  down: "text-trend-down",
  flat: "text-trend-flat",
};

/* ---------- Raw hex resolvers (for SVG fill/stroke where Tailwind classes don't apply) ---------- */

export const SEVERITY_HEX: Record<SeverityLevel, string> = {
  0: "#475569",
  1: "#38bdf8",
  2: "#facc15",
  3: "#f97316",
  4: "#ef4444",
};

export const LIFECYCLE_HEX: Record<LifecycleStatus, string> = {
  active: "#34d399",
  pending: "#fcd34d",
  expired: "#94a3b8",
  inactive: "#475569",
  unknown: "#475569",
};

export const ACCENT_HEX = "#22d3ee";
