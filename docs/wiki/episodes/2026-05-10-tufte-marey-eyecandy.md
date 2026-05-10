---
title: 2026-05-10 — Tufte primitives, Marey unblock, eye-candy pass
type: episode
tier: episodic
created: 2026-05-10
updated: 2026-05-10
last_confirmed: 2026-05-10
confidence: 0.75
source_count: 3
decay_profile: medium
tags: [episode, visualization, tufte, marey, sankey, ui]
sources:
  - PR #16 (web/tufte-marey, merged 2026-05-10)
  - PR #18 (web/eye-candy, open)
  - https://data.texas.gov/resource/7fq8-wig2.json (live confirmation)
relationships:
  - {type: references, target: projects/author-an-svg-viz-primitive.md}
  - {type: references, target: concepts/marey-chart.md}
  - {type: references, target: concepts/sankey-flow.md}
  - {type: references, target: datasets/7fq8-wig2-tceq-water-permits.md}
stale: false
---

# 2026-05-10 — Tufte primitives, Marey unblock, eye-candy

## Question

Two interlocking questions:

1. Atlas TX UX is "clean dark dashboard." How do we make it both more **legible** (Tufte-honest) and more **immersive** (atmosphere) without breaking the data → ink contract?
2. The /permits page already has a county choropleth and a "filings need scrutiny" list. The next obvious chart is a Marey-style train chart of permit lifecycle. Can we render it from the dataset we already have?

## Findings

### Six SVG primitives generalize into a procedural pattern

The first PR shipped six primitives — `Sparkline`, `MicroBar` (with state-median tick), `MismatchStrip` (diverging two-bar), `TileCartogram` (geographic small-multiples), `Sankey`, `MareyChart` — all written to the same shape: pure SVG, no deps, server-component compatible, color from `src/app/design/states.ts` tokens. After the third primitive the pattern crystallized; by the sixth it earned a tier-4 page: [Author an SVG viz primitive](../projects/author-an-svg-viz-primitive.md).

### `7fq8-wig2` schema fact: `date_coverage_began` is ACTIVE-only

The Marey unblock investigation hit live Socrata directly. Confirmed:

- ACTIVE rows expose `date_coverage_began` (often as far back as `1962-10-04T00:00:00.000`, with `1800-01-01` as the legacy-permit sentinel — drop where year < 1950).
- PENDING rows ship **no date column at all**. There is no in-dataset path to recover an application-received date for pending permits.

This wasn't documented anywhere before — the existing dataset page mentioned schema only generically. The page now records this asymmetry and the Marey concept page records the chart-design implication: pending rows must be honestly omitted, not faked at "today."

### Eye-candy can ride on top of Tufte without breaking it

The follow-up PR added a motion layer (drifting topographic background, hero gradient sweep, pulse dots, ticker, sparkline draw-in, choropleth halo breathing) — all CSS keyframes / SVG `<animate>`, all gated behind `prefers-reduced-motion`. None of it touches the data → ink mapping. Atmosphere ≠ chartjunk when it sits behind the data and steps aside on demand.

### Two new visualization concepts earn pages

- [Marey chart](../concepts/marey-chart.md) — durations as diagonals; covers when the dataset shape supports it (paired endpoints) and when it degrades (single date per row).
- [Sankey flow](../concepts/sankey-flow.md) — flow widths; covers when the structure earns it (≤3 columns + variance in magnitudes) and when it doesn't (uniform weights or many-to-many across many columns).

## Pages touched

### Created

- `concepts/marey-chart.md` — semantic, confidence 0.7
- `concepts/sankey-flow.md` — semantic, confidence 0.7
- `projects/author-an-svg-viz-primitive.md` — procedural, confidence 0.75 (promotion bar met: six primitives implementing it)
- `episodes/2026-05-10-tufte-marey-eyecandy.md` — this page

### Updated

- `datasets/7fq8-wig2-tceq-water-permits.md` — added "Date columns — asymmetric across status" subsection. Bumped `last_confirmed` 2026-05-09 → 2026-05-10. `confidence` 0.7 → 0.8 (+0.1 for live Socrata confirmation, the third independent source). `source_count` 2 → 3. Added `depends_on: concepts/marey-chart.md`.

### To update on next housekeeping pass

- `index.md` — add new pages to the catalog.
- `log.md` — append this session entry.

## Lessons

1. **Live-confirm dataset schemas before designing visualizations.** Three minutes of `curl ?$limit=1` against Socrata saved the Marey from being broken on day one.
2. **Promotion to tier 4 is "≥3 implementations of the same shape," not "≥3 callers using it."** Six chart components share the SVG-primitive pattern; that earns the procedural page even though only one of those primitives — the choropleth — is used in three places.
3. **Atmosphere and Tufte aren't enemies if the motion lives behind the data layer.** Topographic background + hero gradient + pulse dots all sit at z-index ≤ 0 or modify ornament only; the data marks themselves stay still and honest. Reduced-motion support is non-negotiable.
4. **Dataset asymmetries are real schema facts.** "ACTIVE has X, PENDING does not" belongs in the dataset page alongside field types, not in a comment in a fetcher.

## Confidence math

- `datasets/7fq8-wig2-tceq-water-permits.md`: 0.7 → 0.8 (+0.1 for live Socrata confirmation as third independent source). `last_confirmed` reset.
- New concept pages: 0.7 (standard new-page level + 0.1 for being grounded in shipped code).
- New procedural page: 0.75 (matches `refresh-cached-snapshot.md` baseline; both distill from already-shipped patterns).

No contradictions surfaced. No pages went stale. No contracts touched.
