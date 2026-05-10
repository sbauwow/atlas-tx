---
title: Marey chart
type: concept
tier: semantic
created: 2026-05-10
updated: 2026-05-10
last_confirmed: 2026-05-10
confidence: 0.7
source_count: 2
decay_profile: slow
tags: [concept, visualization, time-series, tufte]
sources:
  - Edward Tufte, "The Visual Display of Quantitative Information"
  - Étienne-Jules Marey, "La méthode graphique" (1885)
relationships:
  - {type: implements, target: projects/author-an-svg-viz-primitive.md}
  - {type: depends_on, target: datasets/7fq8-wig2-tceq-water-permits.md}
stale: false
---

# Marey chart

A Marey chart (a.k.a. train-schedule chart) renders durations as **diagonals** in a time × lane grid:

- **x-axis** is time.
- **y-axis** is a small number of named lanes — typically counties, lines, or actors.
- Each entity is one diagonal segment from `(startAt, lane top)` to `(endAt, lane bottom)`.
- An open-ended record draws to "now" and gets an open-circle terminator.

It compresses three things into one read: **density** (how many diagonals share a lane), **tenure** (how steep / shallow the diagonal is), and **alignment** (which lanes lit up in the same window).

## Why it matters here

Atlas TX uses a Marey on `/permits` to show **permit coverage tenure by county**: each ACTIVE row in [`7fq8-wig2`](../datasets/7fq8-wig2-tceq-water-permits.md) becomes one diagonal from `date_coverage_began` → today. The chart replaces a 1D "pending count" KPI tile with the full tenure distribution per county. A county with many decades-old diagonals reads as having long-running coverage; a county with all diagonals clustered to the right reads as recently-issued.

Pending rows can't be shown in this view — the source dataset has no application-received column. The chart caption must say so.

## Atlas implementation

`MareyChart` lives at `src/app/components/data-viz/marey-chart.tsx`. Pure SVG, no deps, follows the [SVG-primitive procedural pattern](../projects/author-an-svg-viz-primitive.md):

- Lane order from input order (caller pre-sorts by basin, count, or whatever ranking matters).
- Year gridlines auto-strided by axis range.
- Zebra rows for legibility.
- Each segment is a `<line>` with optional open-circle terminator.
- Hover title carries `lane · detail · startAt → endAt`.
- Entry animation: each `<g>` fades in, staggered left-to-right by `(startAt − axisStart) / span`.

## Caveats

- Marey is for **paired durations**, not point events. A dataset with only one date per row degrades into a strip plot.
- Lane count above ~20 starts to mush. Always pre-rank and cap.
- Diagonal slope encodes nothing structural — both endpoints land in the same lane. Don't mistake it for a slope chart.

## See also

- [Author an SVG viz primitive](../projects/author-an-svg-viz-primitive.md) — the repeatable pattern this primitive follows.
- [TCEQ Water Quality Individual Permits (7fq8-wig2)](../datasets/7fq8-wig2-tceq-water-permits.md) — the dataset the Marey on `/permits` reads.
