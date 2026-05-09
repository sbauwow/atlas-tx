---
title: SDWA Violation Types
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.65
source_count: 1
decay_profile: slow
tags: [concept, water, sdwa, regulation]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: references, target: datasets/epa-sdwis-violations.md}
  - {type: depends_on, target: concepts/mcl.md}
stale: false
---

# SDWA Violation Types

The Safe Drinking Water Act distinguishes between **violation categories** that mean very different things for risk. Atlas TX deliberately filters to *health-based* violations for the [DWRS](dwrs-score.md) score — this page documents what's in vs out and why.

## The two big buckets

### Health-based violations
A water system delivered water that exceeded a regulatory limit, or failed a treatment requirement designed to protect health. Subtypes Atlas TX cares about:

- **MCL violation** — a contaminant exceeded its [Maximum Contaminant Level](mcl.md). Examples: lead, arsenic, nitrate, total coliform, disinfection byproducts (TTHM, HAA5), radionuclides.
- **MRDL violation** — Maximum Residual Disinfectant Level exceeded (chlorine, chloramines, chlorine dioxide).
- **Treatment Technique (TT) violation** — failure of a required treatment (e.g. surface water treatment rule turbidity / disinfection requirements; lead and copper rule corrosion-control; ground water rule disinfection).

These are the rows DWRS weights.

### Monitoring & reporting violations
The system *failed to monitor* or *failed to report* on schedule. The water may or may not have been bad — we don't know, because the test wasn't run or the result wasn't filed. Atlas TX intentionally **excludes these from DWRS** so the score reflects "evidence of bad water" rather than "evidence of bad paperwork".

This is a deliberate, opinionated filter. Surface it in product language: "no violations" in a DWRS-style score does **not** mean "fully compliant" — there could still be M&R lapses. M&R coverage stories belong in a separate signal if/when we build one.

## Other categories worth knowing

- **Public Notification (PN) violations** — the system failed to tell its customers about a problem in time. Often co-occurs with health-based violations; typically not a separate score input.
- **Other** — schema, certification, recordkeeping. Rarely actionable for risk modeling.

## Why this matters for product surfaces

Atlas TX consistently treats environmental data as **indicator / proxy**, not measurement. SDWA violations are unusually close to "actual bad water" because MCL violations are confirmed laboratory exceedances — but even here:

- A single MCL exceedance ≠ chronic exposure for any individual customer.
- Population served × violation count is the standard rough proxy for population-weighted exposure.
- Recency decay matters: a 2019 nitrate spike is not the same as a 2025 one for risk-now.

## See also

- [`mcl`](mcl.md) — what the limits actually are.
- [SDWIS violations dataset](../datasets/epa-sdwis-violations.md) — where the rows come from.
- [DWRS score](dwrs-score.md) — how Atlas TX weights them.
