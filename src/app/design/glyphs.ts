/**
 * Glyphs paired with each state. A11y rule: never rely on color alone.
 * Glyphs render alongside or in place of color swatches so meaning survives
 * colorblind simulation, screenshots, and print.
 */

import type { Freshness, SeverityLevel } from "./states";

export const SEVERITY_GLYPH: Record<SeverityLevel, string> = {
  0: "○",
  1: "◔",
  2: "◑",
  3: "◕",
  4: "●",
};

export const FRESHNESS_GLYPH: Record<Freshness, string> = {
  fresh: "●",
  stale: "◐",
  missing: "⊘",
};
