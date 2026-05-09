# A11y verification — color tokens

> Verification record for the state→color taxonomy in `color-taxonomy.md`. Update whenever palettes change.

## Constraints honored

| Constraint                          | Status   | Notes |
|-------------------------------------|----------|-------|
| Colorblind-safe severity ramp       | pending verify | Current ramp inherited from pre-token state. Run Coblis on `/water?county=harris-county` in both modes. If yellow→orange flattens under deuteranopia or protanopia, swap to a viridis-derived ramp. |
| WCAG AA text contrast (4.5:1)       | partial  | Slate-300 on slate-950 = ~12:1 ✓. Slate-400 on slate-950 = ~7.5:1 ✓. Slate-500 on slate-950 = ~4.6:1 ✓ but at the edge — bump to slate-400 if any text turns body-weight.  |
| Don't rely on color alone           | partial  | Severity legend, mismatch column, dataset-category badges, gauge `<title>` all carry glyph + label. Map county circles still rely on color + tooltip; per-county glyph overlay deferred to PR3 (heatmap row replaces this need). |
| Light / print theme                 | deferred | Not in PR1 scope. |

## Manual checks to run

1. Coblis (or any deuteranopia/protanopia simulator) on:
   - `/` (dataset registry — verify category badges still distinguish)
   - `/water` risk mode (default)
   - `/water?mode=mismatch&county=...`
   - Save screenshots under `docs/design/screenshots/<date>-<view>-<sim>.png`.

2. Lighthouse a11y on `/water` — target ≥ 95.

3. Keyboard tab order through the /water page — every interactive element reachable, focus ring visible.

4. Screen-reader pass with VoiceOver / Orca:
   - County circle in map should announce: "<name> — <severity label> (<glyph>) · …".
   - Severity legend list should be navigable.
   - Mismatch column should announce severity even when value is 0.

## Known gaps

- No glyph on the map circle itself yet. Severity is announced via `<title>` and visible color; PR3 county-heatmap row will give every county an explicit glyph cell.
- Lifecycle status palette is defined but not yet exercised in the UI; rendering paths in `/water` permit/governance tables are deferred to a follow-up PR.

## Verification log

| Date       | Author | Action |
|------------|--------|--------|
| 2026-05-09 | claude | Tokens introduced; doc written; manual checks above pending. |
