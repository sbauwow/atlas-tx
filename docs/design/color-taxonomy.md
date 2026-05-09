# Atlas TX color taxonomy

> Public-facing reference for the Atlas TX state→color system. Every page in the app draws from this taxonomy. New visualizations must reuse these tokens, not invent new ones. Tokens are defined in `src/app/globals.css` under `@theme inline`; resolvers live in `src/app/design/`.

## Why a taxonomy

Atlas TX surfaces multiple contradictory data layers — drinking-water risk, environmental burden, alerts, permits, governance, hydrology — and the journalists/analysts who use it have to compare counties at a glance. Color drift between pages (red means "severe" here but "deleted" there) destroys that.

The rule: **every state in the data model maps to exactly one of four palettes**, and every palette is paired with a glyph so meaning never depends on color alone.

## Palettes

### 1. Severity (ordered, 5 stops)

Use for any indicator that ramps from "no signal" to "critical": county risk score, mismatch score, alert severity, impaired-segment count.

| Token       | Hex       | Glyph | Meaning           |
|-------------|-----------|-------|-------------------|
| `--color-sev-0` | `#475569` | ○     | none / no signal  |
| `--color-sev-1` | `#38bdf8` | ◔     | low               |
| `--color-sev-2` | `#facc15` | ◑     | moderate          |
| `--color-sev-3` | `#f97316` | ◕     | high              |
| `--color-sev-4` | `#ef4444` | ●     | critical          |

Resolvers (`src/app/design/states.ts`):

- `severityFromRiskScore(score)` — county operational risk thresholds (1 / 4 / 8). Caps at level 3 to preserve the legacy /water page behavior.
- `severityFromMismatch(score)` — contradiction-detection thresholds (40 / 75). Levels are non-contiguous (0 → 3 → 4) by design: the score itself jumps in 25-point chunks per flag.
- `severityFromAlertString(value)` — NWS vocabulary (Minor / Moderate / Severe / Extreme).

Class lookups: `SEVERITY_BG_CLASS`, `SEVERITY_TEXT_CLASS`, `SEVERITY_BORDER_CLASS`. Hex lookup: `SEVERITY_HEX` (use only for SVG `fill` / `stroke` attributes).

### 2. Lifecycle status (categorical, 4+1 values)

Use for permit lifecycle, governance entity activity, alert urgency, anything with a "where in the workflow is this" question. Distinct hue family from severity so an "expired permit" and a "low-risk county" never read as the same thing.

| Token                    | Hex       | Glyph | Meaning  |
|--------------------------|-----------|-------|----------|
| `--color-status-active`  | `#34d399` | ●     | active   |
| `--color-status-pending` | `#fcd34d` | ◐     | pending  |
| `--color-status-expired` | `#94a3b8` | ○     | expired  |
| `--color-status-inactive`| `#475569` | ⊘     | inactive |

`unknown` falls back to inactive styling. Resolver: `lifecycleFromStatusString(value)`.

### 3. Categorical taxonomy (Okabe-Ito CB-safe, 7 hues)

Reused across three categorical domains. Each hue is paired with a domain-specific glyph so the same `--cat-N` can mean different things on different pages without confusion.

| Token            | Hex       |
|------------------|-----------|
| `--color-cat-1`  | `#56b4e9` |
| `--color-cat-2`  | `#009e73` |
| `--color-cat-3`  | `#f0e442` |
| `--color-cat-4`  | `#e69f00` |
| `--color-cat-5`  | `#d55e00` |
| `--color-cat-6`  | `#cc79a7` |
| `--color-cat-7`  | `#0072b2` |

Domains and mappings live in `src/app/design/categories.ts`:

- **Dataset categories** (`MvpDataset["category"]`): environment / infrastructure / social / fiscal / debt / demographic / compliance — each gets a distinct glyph (❋ ⌬ ✦ $ ⊟ ◬ ✓).
- **FEMA flood zones** (`classifyFemaZone`): AE / X / D / OTHER. Future overlay use only.
- **Surface-water impairment use flags**: aquaticLife / contactRecreation / generalUse / fishConsumption / publicWaterSupply / oysterWaters. Future radar use only.

### 4. Trend + freshness

| Token                    | Hex       | Glyph | When            |
|--------------------------|-----------|-------|-----------------|
| `--color-trend-up`       | `#34d399` | ▲     | sparkline up    |
| `--color-trend-down`     | `#fb7185` | ▼     | sparkline down  |
| `--color-trend-flat`     | `#94a3b8` | ▬     | no movement     |
| `--color-fresh-fresh`    | `#34d399` | ●     | within TTL      |
| `--color-fresh-stale`    | `#fbbf24` | ◐     | expired / pending |
| `--color-fresh-missing`  | `#64748b` | ⊘     | never cached    |

Trend-down uses rose (not red-500) so it doesn't read as severity-critical. Trend-up reuses status-active green; that overlap is intentional — both mean "good direction."

### 5. Surface tokens (chrome, no state meaning)

`--color-accent` (`#22d3ee`) is the selection / primary-action color. It is **not** part of the severity ramp. Reserved for: the active map mode toggle, the selected county map ring, primary CTA buttons.

Page background, card surfaces, body/secondary/tertiary text, and borders use Tailwind's slate scale directly (slate-950 → slate-300). These aren't tokenized because they don't carry data state.

## Rules

- **No new hex codes in components.** If a UI element needs a state-bearing color, route through a token. If it doesn't carry state (chrome), use Tailwind's slate scale.
- **Pair color with a glyph or label.** The `aria-hidden` glyph + visible text + accessible name pattern is the default. See `src/app/water/page.tsx` mismatch column and severity legend.
- **Don't redefine palettes per page.** Adding a new state? Extend `src/app/design/states.ts` and update this file.
- **Tailwind v4 won't pick up dynamic class strings.** Use the literal class lookups (`SEVERITY_TEXT_CLASS[level]`) — never `` `text-sev-${level}` ``.

## Migration notes

PR1 (the change that introduced this taxonomy) is plumbing only: visual output is identical to the previous /water page, with two intentional additions:
- Mismatch-column glyph + severity tinting in the county table.
- Glyph-prefixed legend items.

The old `countyFill(score, mismatch, isSelected)` function is gone — call sites now compute a `SeverityLevel` and look up via `SEVERITY_HEX[level]` (or `ACCENT_HEX` when selected).
