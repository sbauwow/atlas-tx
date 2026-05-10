---
title: Author an SVG viz primitive — atlas-tx pattern
type: project
tier: procedural
created: 2026-05-10
updated: 2026-05-10
last_confirmed: 2026-05-10
confidence: 0.75
source_count: 1
decay_profile: slow
tags: [project, procedural, pattern, visualization, svg, tufte]
sources:
  - src/app/components/data-viz/
relationships:
  - {type: implements, target: concepts/marey-chart.md}
  - {type: implements, target: concepts/sankey-flow.md}
  - {type: depends_on, target: concepts/burden-vs-harm.md}
stale: false
---

# Author an SVG viz primitive

The repeatable pattern atlas-tx uses every time it adds a new chart to `src/app/components/data-viz/`. Distilled from the six primitives shipped on `web/tufte-marey` (PR #16) — `Sparkline`, `MicroBar`, `MismatchStrip`, `TileCartogram`, `Sankey`, `MareyChart`.

## Why it's a pattern

These are not generic visualizations — they all share the same constraints because of where they're used:

1. **Server-rendered.** Atlas TX pages are React Server Components. A primitive must work without `"use client"` — which means no `useEffect`, no Recharts, no D3-in-component hooks. Pure JSX from props.
2. **Honest defaults.** The Tufte rule: every painted pixel must trace to a number. No decorative gradients in the data area. No misleading axes.
3. **No dependency creep.** D3-sankey, recharts, visx-shape would each pull tens of KB and a peer-dep tree. The repo already pays for `@visx/geo` for choropleth — do not add more.
4. **Tokens, not hex.** Severity / freshness / accent come from `src/app/design/states.ts` (`SEVERITY_HEX`, `ACCENT_HEX`). Components import these — they never inline a hex literal except for safelisted neutrals (`#020617`, `#1e293b`, `#94a3b8`).
5. **Animation gated.** Hover transitions and entry animations are fine; they live in `globals.css` under `prefers-reduced-motion: reduce` overrides.

## The shape

Every primitive in `src/app/components/data-viz/` follows the same skeleton:

```tsx
import { SEVERITY_HEX } from "@/app/design/states";

export type FooProps = {
  /** The data the caller already shaped. */
  rows: FooRow[];
  width?: number;
  height?: number;
  ariaLabel?: string;
};

export default function Foo({ rows, width = 200, height = 60, ariaLabel }: FooProps) {
  if (!rows.length) {
    return <div className="rounded-xl bg-white/[0.02] px-4 py-8 text-sm text-slate-500 ring-1 ring-white/5">No rows.</div>;
  }
  // ... derive scales from rows
  return (
    <svg
      role="img"
      aria-label={ariaLabel ?? `default description with ${rows.length} rows`}
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* ... */}
    </svg>
  );
}
```

The default export is the component; a `FooProps` type is named-exported. `index.ts` re-exports both. No factory functions, no class components, no context.

## Conventions

- **`viewBox` first, percent width.** `width="100%"` + `viewBox` lets the chart fill its container. Caller controls aspect via `height`.
- **`role="img"` + `aria-label`.** Always. The chart is a single image to assistive tech. Detail goes in `<title>` per element.
- **`<title>` on every interactive element.** Hover tooltip without JS.
- **Empty state inline.** Render the gray fallback in the same component, not from the caller.
- **Numeric `viewBox`, not pixel `width`/`height` props.** This makes the primitive responsive without media queries.
- **Color from tokens.** Import `SEVERITY_HEX`, `ACCENT_HEX`, `FRESHNESS_*`. Don't hardcode brand colors.
- **No client state.** If selection/hover state is needed, hoist it to the page that owns the chart and pass `selectedId`/`onSelect` through.

## When to add a new primitive

Promotion bar (matches the wiki's tier-4 promotion rule): the same chart shape would be useful in **≥3 different places** in the app, OR the chart embodies a [named visualization concept](../concepts/marey-chart.md) that future agents will look up by name.

Anything more bespoke (a one-off chart for one page) lives next to the page that uses it, not in `data-viz/`.

## Animations

Entry / pulse / shimmer animations live in `src/app/globals.css` under `@keyframes atlas-*`. Components opt in by adding the matching class (`atlas-bar-grow`, `atlas-sparkline-path`, `atlas-pulse-halo`) — never inline `style={{animation:...}}`.

The `@media (prefers-reduced-motion: reduce)` block at the bottom of `globals.css` zeroes everything out. New keyframes need a corresponding entry there.

## See also

- [Marey chart](../concepts/marey-chart.md) — durations as diagonals.
- [Sankey flow](../concepts/sankey-flow.md) — flow widths.
- [Refresh a cached snapshot](refresh-cached-snapshot.md) — sister tier-4 page covering the data-side pattern.
