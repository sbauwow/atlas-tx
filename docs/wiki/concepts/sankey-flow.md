---
title: Sankey flow diagram
type: concept
tier: semantic
created: 2026-05-10
updated: 2026-05-10
last_confirmed: 2026-05-10
confidence: 0.7
source_count: 1
decay_profile: slow
tags: [concept, visualization, network, flow, hydrology]
sources:
  - Matthew H. P. R. Sankey, original 1898 diagram of steam-engine energy efficiency
relationships:
  - {type: implements, target: projects/author-an-svg-viz-primitive.md}
stale: false
---

# Sankey flow diagram

A flow diagram where **ribbon width is proportional to magnitude**. Nodes sit in columns; ribbons route from one column to the next, conserving total flow. Originally an energy-efficiency diagram; now broadly used for any branching/coalescing system where you care about *what reaches where* and *how much*.

The win over a node-link "blob" is that nodes that **coalesce** flow (a river, a substation, a routing hub) become legible as the place a column-to-column ribbon converges, instead of disappearing into a hairball.

## Why it matters here

Atlas TX renders a 3-column Sankey on `/water/network` to show watershed lineage at the county level:

- Column 0: upstream counties.
- Column 1: rivers (the seeded `evidence` value on each `HydrologySeedEdge`).
- Column 2: downstream counties.

Each seeded edge becomes two ribbons (county→river, river→county). Ribbon width = `weight` from the seed table. The river column does the structural work — bottleneck rivers are visible because *all* their feeder counties converge into one ribbon.

## Atlas implementation

`Sankey` at `src/app/components/data-viz/sankey.tsx`. Pure SVG, no deps. Follows the [SVG-primitive pattern](../projects/author-an-svg-viz-primitive.md):

- Caller passes `{nodes, edges}` shaped lists. Nodes carry an explicit `column: 0|1|2|...`.
- The component lays nodes in columns, sizes each node bar by `max(inflow, outflow)`, and routes ribbons as cubic Beziers.
- Stacking is done in input order per column — caller sorts to taste.
- Hover title on each ribbon: `from → to: weight`.

## When NOT to reach for it

- When the relationship is many-to-many across **more than ~3 columns**, ribbons cross too much and the diagram regresses to a blob. Use a layered force-directed graph instead.
- When magnitudes are similar across all edges. The ribbon-width encoding only earns its keep when there's real variance.
- When direction matters but magnitude doesn't. A Sankey that's entirely uniform-weight is just a tilted bipartite graph.

## See also

- [Author an SVG viz primitive](../projects/author-an-svg-viz-primitive.md)
- [Marey chart](marey-chart.md) — sister primitive, also lane-and-time but sized by *count*, not flow.
