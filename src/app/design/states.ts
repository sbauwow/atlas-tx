/**
 * Maps raw scores and status strings to design-token state levels.
 * Tokens live in `src/app/globals.css` under @theme inline.
 *
 * Severity thresholds preserve the legacy /water page behavior: risk score
 * caps at level 3, mismatch score jumps directly 0 → 3 → 4 because the
 * underlying scorer increments in 25-point chunks.
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

export function freshnessFromCacheMeta(
  meta: { expiresAt: string | null; ttlMs?: number | null } | null | undefined,
): Freshness {
  if (!meta) return "missing";
  if (!meta.expiresAt) return "stale";
  const expires = Date.parse(meta.expiresAt);
  if (Number.isNaN(expires)) return "missing";
  return expires > Date.now() ? "fresh" : "stale";
}

/* ---------- Class lookups (Tailwind v4 needs literal strings) ---------- */

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

export const FRESHNESS_TEXT_CLASS: Record<Freshness, string> = {
  fresh: "text-fresh-fresh",
  stale: "text-fresh-stale",
  missing: "text-fresh-missing",
};

/* ---------- Raw hex (for SVG fill/stroke where utility classes don't apply) ---------- */

export const SEVERITY_HEX: Record<SeverityLevel, string> = {
  0: "#475569",
  1: "#38bdf8",
  2: "#facc15",
  3: "#f97316",
  4: "#ef4444",
};

export const ACCENT_HEX = "#22d3ee";
