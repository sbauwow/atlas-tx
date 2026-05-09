---
title: APD — Active Protest Density
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.75
source_count: 1
decay_profile: slow
tags: [concept, score, derived-signal, protest, tceq, cid]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: derives_from, target: datasets/tceq-cid-search-one.md}
  - {type: derives_from, target: datasets/tceq-cid-search-two.md}
  - {type: derives_from, target: datasets/census-acs5-2023-county.md}
  - {type: depends_on, target: datasets/tceq-cid-search-one.md}
  - {type: depends_on, target: datasets/tceq-cid-search-two.md}
  - {type: references, target: concepts/burden-vs-harm.md}
stale: false
---

# APD — Active Protest Density

Atlas-tx derived signal that turns the [TCEQ Central Index](../datasets/tceq-cid-search-one.md) protest data into a per-county "how much regulatory friction is happening here right now" score.

Lives at `src/lib/scoring/protest_density.ts`. Added in dataset-registry v0.2.0; full design in `docs/plans/2026-05-08-protests-extension.md`.

## Definition (from the contract)

```
filing_pressure_per_item = (
    1.0                                          # base: a pending permit exists
  + 0.35 * log1p(comment_count)                  # comments matter, but are flood-prone
  + 0.75 * public_meeting_request_count          # stronger than comments, weaker than hearing requests
  + 1.25 * hearing_request_count                 # stronger procedural escalation
  + 2.5  * (soah_docket_number != null ? 1 : 0)  # contested-case referral is the hardest signal
)

APD_raw          = sum(filing_pressure_per_item over open CID items in county)
APD_per_1k       = APD_raw / (county_population / 1000)
APD_normalized   = min-max scale of APD_per_1k to 0..100 statewide
```

## What the weights are saying

The weights encode an opinionated hierarchy of signals:

1. **A base 1.0** for having a pending permit at all. Empty case files get no score; one open case is the floor.
2. **Comments are noisy.** Log-damped at 0.35 so a 5,000-comment campaign can't dominate the score.
3. **Public meeting requests** are stronger than comments because they're a procedural step — someone went to the trouble of filing the form.
4. **Hearing requests** are stronger again because they're attempting to escalate to contested-case status.
5. **SOAH docket assignment** is the hardest, hardest signal — TCEQ actually referred the matter to administrative law. Heaviest single-item weight.

## Per-capita normalization

Two reasons the score is normalized per 1,000 county residents:

- **Rural counties brighten** without normalization, which can be misleading — but it can *also* be the right answer (a rural county with one contested permit has a real story). The score emits **both** raw and per-capita columns; product surfaces should never expose per-capita alone.
- **Comparability across counties** of vastly different population is the point.

`min-max` to 0–100 statewide makes it a **state-relative** score (always). National comparison is meaningless because the data is TX-only.

## Caveats (per the contract; always emit)

- Reflects only **currently-open** CID items; historical protests excluded.
- Filing counts come from [Search Two](../datasets/tceq-cid-search-two.md) and may include duplicate people, repeat submissions, or organization campaigns.
- `comment_count` is log-damped intentionally so high-volume comment blasts do not dominate.
- **Hearing request ≠ contested case granted.** SOAH docket # is the harder signal.
- Per-capita normalization brightens rural counties; emit **both** raw and per-capita columns, never per-capita alone.

## Relationship to burden-vs-harm

APD is a **regulatory-friction indicator**, not a harm measurement. A high APD county has more permitting controversy — that may correlate with environmental harm, with engaged civil society, with a single coordinated campaign, or with idiosyncratic permit applications nobody else cares about. Surface as "regulatory pressure", never as "this county has bad permits". Mirrors [Burden vs Harm](burden-vs-harm.md).

## Where it lives

- Code: `src/lib/scoring/protest_density.ts`
- Data: [Search One cases](../datasets/tceq-cid-search-one.md), [Search Two filings](../datasets/tceq-cid-search-two.md), [ACS county population](../datasets/census-acs5-2023-county.md).
- Contract: `docs/contracts/dataset-registry.md` § "Active Protest Density (APD)".
- Plan: `docs/plans/2026-05-08-protests-extension.md`.
- MCP tools (optional): `list_protested_permits`, `score_protest_density`.
