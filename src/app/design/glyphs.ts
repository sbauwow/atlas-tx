/**
 * Glyphs paired with each state. A11y rule: never rely on color alone.
 * Glyphs render alongside or in place of color swatches so the meaning
 * survives colorblind simulation, screenshots, and print.
 */

import type { Freshness, LifecycleStatus, SeverityLevel, Trend } from "./states";

export const SEVERITY_GLYPH: Record<SeverityLevel, string> = {
  0: "○",
  1: "◔",
  2: "◑",
  3: "◕",
  4: "●",
};

export const LIFECYCLE_GLYPH: Record<LifecycleStatus, string> = {
  active: "●",
  pending: "◐",
  expired: "○",
  inactive: "⊘",
  unknown: "·",
};

export const TREND_GLYPH: Record<Trend, string> = {
  up: "▲",
  down: "▼",
  flat: "▬",
};

export const FRESHNESS_GLYPH: Record<Freshness, string> = {
  fresh: "●",
  stale: "◐",
  missing: "⊘",
};
