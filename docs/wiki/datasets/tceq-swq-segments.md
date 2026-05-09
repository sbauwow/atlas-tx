---
title: TCEQ Surface Water Quality Segments
type: dataset
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.6
source_count: 1
decay_profile: medium
tags: [dataset, tceq, water, surface-water, impairment, gis, layer-ish]
sources:
  - docs/contracts/dataset-registry.md
registry_id: tceq-swq-segments
relationships:
  - {type: published_by, target: agencies/tceq.md}
  - {type: references, target: concepts/burden-vs-harm.md}
stale: false
---

# TCEQ Surface Water Quality Segments

`registry_id: tceq-swq-segments` · `accessType: external` · added in dataset-registry v0.4.0.

## What it is

TCEQ-classified water-quality assessment segments for Texas surface waters — rivers, reservoirs, bays, estuaries — with use-support / impairment classification per the Texas Integrated Report (TX's CWA §303(d) / §305(b) reporting). One feature per segment / assessment unit.

Registered shape (per contract):

```ts
{
  id: "tceq-swq-segments",
  name: "TCEQ Surface Water Quality Segments Viewer",
  category: "environment",
  publisher: "Texas Commission on Environmental Quality",
  keyFields: ["segmentId", "segmentName", "assessmentUnit", "waterBodyType", "status", "designatedUse"],
  accessType: "external",
}
```

## Why it matters here

Atlas-tx uses this as a **context / indicator layer** around counties, PWSs, and facilities — not as a standalone burden verdict.

The **product-language rule**, from the contract:

> A water source labeled `impaired` does not meet the legal water-quality standards for its intended use.

This is a **legal use-support classification**, not a causal claim about downstream human health outcomes. ([Burden vs Harm](../concepts/burden-vs-harm.md) is the wider rule.)

## Why it's especially careful

A segment can be classified "impaired" because it doesn't support its *intended* use (recreation, fishery, drinking-water source, etc.) — which is a real signal — but the impairment driver could be anything from elevated bacteria to legacy mercury to dissolved-oxygen deficits. "Impaired" without the driver field is information-poor.

`status` and `designatedUse` together carry the structural piece. The driver / cause field varies by Integrated Report cycle and may need separate ingestion.

## Access shape

The source is an **ArcGIS experience / viewer**, not a stable REST API in atlas-tx-friendly shape. A stable loader requires ArcGIS layer/service discovery before a dedicated fetcher is implemented.

## Caveats (always emit downstream)

- **"Impaired" is legal-use-support, not measured harm.** This is the contract-mandated framing.
- **Reporting cycles matter.** TCEQ Integrated Report is biennial; a segment's classification can change between cycles. Surface the report year.
- **Segment geometry varies.** Some segments are line features (rivers), some polygons (reservoirs, bays). Spatial join logic must handle both.
- **Probabilistic-burden context only.** Best used inside a compound-risk story alongside DWRS / permit density / EJScreen, not as a standalone burden verdict.

## Status in atlas-tx

Future loader at `src/lib/datasets/surface-water-quality.ts`. Per `STATE.md` recently-done, scaffold work has begun (untracked files in the primary worktree as of 2026-05-08).

## See also

- [TCEQ agency](../agencies/tceq.md)
- [Burden vs Harm](../concepts/burden-vs-harm.md) — product stance.
- Contract § "Surface-water impairment context source (added 0.4.0)".
