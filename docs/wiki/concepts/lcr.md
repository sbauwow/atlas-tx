---
title: LCR — Lead and Copper Rule
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.65
source_count: 1
decay_profile: slow
tags: [concept, water, sdwa, regulation, lead]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: references, target: concepts/mcl.md}
  - {type: references, target: concepts/sdwa-violation-types.md}
  - {type: references, target: datasets/epa-sdwis-violations.md}
stale: false
---

# LCR — Lead and Copper Rule

Federal SDWA rule governing lead and copper in drinking water. The rule lead-violations actually live under in [SDWIS](../datasets/epa-sdwis-violations.md) — important to understand because **lead doesn't have a conventional MCL**.

## Action levels, not MCLs

For most contaminants, the SDWA enforcement model is "tap-water concentration > [MCL](mcl.md) ⇒ violation". For lead and copper:

- Sampling is at **consumer taps**, on a sampling pool drawn from highest-risk locations (older homes with lead service lines or lead solder).
- The metric is the **90th percentile** of those samples.
- If the 90th-percentile lead concentration exceeds **15 µg/L** ("lead action level"), or the copper 90th-percentile exceeds **1.3 mg/L**, the system has an **action-level exceedance** — and the rule then triggers a sequence of required actions: corrosion-control treatment, public education, and (for lead) lead-service-line replacement.

So the legal trigger is statistical (a percentile of a tap-water sampling pool), not a single sample, and the consequence is **mandated process** rather than a simple "shut down the system" outcome.

## How LCR violations show up in SDWIS

Atlas-tx consumes [SDWIS violations](../datasets/epa-sdwis-violations.md) filtered to **health-based**. LCR violations land in that filter, but the **violation type** isn't "MCL exceedance" in the strict sense:

- **Treatment Technique (TT) violations** — failure to implement required corrosion control, failure to perform required service-line replacement, etc.
- **Action Level Exceedances** are technically reported separately from violations in some SDWIS interfaces, though they trigger TT obligations whose failure becomes a TT violation.

In atlas-tx language, an "LCR violation" in the score is almost always a TT violation, not an MCL. ([SDWA Violation Types](sdwa-violation-types.md) covers the broader taxonomy.)

## LCRR / LCRI — the rule is moving

EPA has been actively revising the LCR:

- **LCRR (Lead and Copper Rule Revisions)** — finalized 2021, compliance dates phased in.
- **LCRI (Lead and Copper Rule Improvements)** — proposed 2023, finalized 2024 — pushes toward full lead-service-line replacement nationwide on a 10-year compliance window, lowers the action level toward 10 µg/L, expands sampling.

For atlas-tx, this means:

- The set of *what counts as an LCR violation* changes over time. Recency-tier framing in DWRS may need to weight modern LCR violations more heavily as the rule tightens.
- **Lead service line inventories (LSLIs)** are now a federal-required inventory artifact. When TX LSLI data is publicly accessible at scale, it becomes a high-value atlas-tx layer (currently not in the registry).

## Caveats

- **Action level ≠ safe level.** EPA's MCLG for lead is **0** µg/L. The action level is a *regulatory trigger*, not a health threshold. Atlas-tx language must distinguish "above the action level" from "at safe levels".
- **Sampling pool matters.** LCR samples are drawn from a system-managed sampling pool — not random taps. Documented gaming risks exist.
- **Lead service lines are upstream of the tap.** A system can pass LCR sampling and still have homes with lead service lines that show high lead under different flow conditions.
- **Texas LCR implementation** is run by TCEQ as primacy agency; data flows up to federal SDWIS.

## See also

- [MCL concept](mcl.md) — why lead is special.
- [SDWA Violation Types](sdwa-violation-types.md) — where LCR fits in the taxonomy.
- [SDWIS dataset](../datasets/epa-sdwis-violations.md).
