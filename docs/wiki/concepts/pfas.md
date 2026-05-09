---
title: PFAS / UCMR5 — Per- and Polyfluoroalkyl Substances
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.65
source_count: 1
decay_profile: medium
tags: [concept, water, pfas, sdwa, regulation, contaminant]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: references, target: concepts/mcl.md}
  - {type: references, target: concepts/sdwa-violation-types.md}
  - {type: references, target: datasets/epa-sdwis-violations.md}
stale: false
---

# PFAS / UCMR5

PFAS — **per- and polyfluoroalkyl substances** — are a family of ~10,000+ synthetic chemicals known for environmental persistence ("forever chemicals"). They are a current regulatory frontier in US drinking water and a high-traffic public-concern topic.

## Why they matter to atlas-tx

PFAS recently moved from "unregulated, monitored" to "regulated, with MCLs". This means:

- Pre-2024: PFAS data lived in **UCMR** (Unregulated Contaminant Monitoring Rule), not in SDWIS violations. A high PFAS reading in TX would not trigger an SDWIS violation.
- Post-April 2024: EPA finalized **MCLs for six PFAS compounds**. Compliance dates phase in (initial monitoring 2027; compliance 2029, with possible later extensions). Once compliance kicks in, PFAS exceedances become **MCL violations** in SDWIS — potentially shifting DWRS results substantially in affected regions.

Atlas-tx language about PFAS must track this transition explicitly.

## The 2024 final rule (in brief)

Six compounds with enforceable limits:

| Compound | MCL | MCLG |
|---|---|---|
| PFOA  | 4.0 ppt (ng/L) | 0 |
| PFOS  | 4.0 ppt | 0 |
| PFHxS | 10 ppt | 10 ppt |
| PFNA  | 10 ppt | 10 ppt |
| HFPO-DA (GenX) | 10 ppt | 10 ppt |
| Mixture (PFHxS + PFNA + GenX + PFBS) | Hazard Index ≤ 1.0 | Hazard Index = 1.0 |

The Hazard Index is the cumulative-exposure proxy for the four-compound mixture. PFOA / PFOS have MCLG = 0 (no known safe level for known/likely human carcinogens).

## UCMR5 (the prior data layer)

EPA's fifth UCMR cycle (2023–2025) required ~6,000 PWSs nationally to monitor for 29 PFAS compounds + lithium. UCMR5 results are the largest pre-rule PFAS dataset and remain valuable for:

- **Pre-rule baseline** — what TX PWSs detected before MCLs took effect.
- **Compounds outside the 6 regulated** — UCMR5 covers 29 PFAS; the rule covers 6. The remaining 23 are not regulated but are detectable.
- **Geographic targeting** — UCMR5 results inform where PFAS treatment investment should focus.

UCMR data is published by EPA but is **not in SDWIS violations** — it lives in EPA's UCMR data center as monitoring results.

## What atlas-tx is doing about it

- **Currently nothing PFAS-specific.** Atlas-tx scores depend on SDWIS violations; pre-2027 there are essentially no PFAS violations to score.
- **Watch the transition.** As compliance dates pass, PFAS-MCL violations should appear in SDWIS. DWRS's recency-decay window (months) will mean PFAS impacts accumulate gradually.
- **UCMR5 ingestion is queued.** A `epa-ucmr5-pfas` dataset would let atlas-tx surface PFAS detections *now*, well before they become SDWIS violations. High value for the EJ-burden story since PFAS contamination correlates with industrial / military presence.

## Caveats

- **The MCLs are litigated.** Industry groups challenged the 2024 rule; compliance dates have already shifted once and may shift again. Lock the wiki to the *current* compliance schedule when surfacing.
- **Detection ≠ exceedance.** UCMR data shows detections at trace levels far below the MCL. "Detected" is not "in violation".
- **PFOA / PFOS MCLG = 0** is not a target for treatment; it's an aspirational health-protective value. The enforceable MCL is what systems must meet.
- **PFAS detection method matters.** EPA Methods 533 / 537.1 vary in detection limits and the compounds covered. Apples-to-apples comparisons need method awareness.

## See also

- [MCL](mcl.md) — the framework PFAS just joined.
- [LCR](lcr.md) — companion "rule that's actively moving" page.
- [SDWIS violations dataset](../datasets/epa-sdwis-violations.md) — where PFAS MCL violations will appear post-compliance.
