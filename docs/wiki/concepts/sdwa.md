---
title: Safe Drinking Water Act (SDWA)
type: concept
tier: semantic
created: 2026-05-10
updated: 2026-05-10
last_confirmed: 2026-05-10
confidence: 0.75
source_count: 2
decay_profile: slow
tags: [concept, federal, law, drinking-water]
sources:
  - 42 U.S.C. § 300f et seq. (Safe Drinking Water Act)
  - docs/wiki/datasets/epa-sdwis-violations.md
relationships:
  - {type: references, target: agencies/epa.md}
  - {type: references, target: concepts/mcl.md}
  - {type: references, target: concepts/lcr.md}
  - {type: references, target: concepts/sdwa-violation-types.md}
  - {type: references, target: concepts/pwsid.md}
  - {type: references, target: concepts/lsli.md}
  - {type: references, target: concepts/pfas.md}
  - {type: references, target: comparisons/sdwis-vs-echo.md}
stale: false
---

# Safe Drinking Water Act

Federal law (1974, amended 1986/1996/2024) regulating public drinking-water supplies. Sets enforceable [Maximum Contaminant Levels](mcl.md) (MCLs), Treatment Techniques (TTs), monitoring requirements, and reporting duties for [Public Water Systems](pwsid.md). EPA writes the rules; states with primacy enforce. Texas has SDWA primacy administered by TCEQ.

## What atlas-tx touches downstream of SDWA

| Surface | Connection |
|---|---|
| [SDWIS violations (`epa-sdwis-violations`)](../datasets/epa-sdwis-violations.md) | The compliance-history feed for SDWA violations |
| [DWRS score](dwrs-score.md) | Atlas TX's drinking-water risk score, weighted by SDWA violation type / severity |
| [LCR](lcr.md) · [LSLI](lsli.md) | Lead and Copper Rule + Lead Service Line Inventory — both SDWA-driven |
| [PFAS](pfas.md) | UCMR5 + the 2024 SDWA MCLs for PFOA/PFOS et al. |

## Key rules worth knowing

- **National Primary Drinking Water Regulations (NPDWR)** — the rulemakings that set MCLs / TTs / monitoring frequencies. Each individual rule (LCR, DBPR, GWR, RTCR…) is an NPDWR.
- **Public Notification Rule** — requires PWSs to notify customers of certain violations within tiered timeframes.
- **Consumer Confidence Reports (CCR)** — annual water-quality summaries each community water system mails to customers.
- **Lead and Copper Rule Revisions (LCRR, 2021) → Improvements (LCRI, 2024)** — the regulatory chain pushing systems toward [Lead Service Line Inventory](lsli.md).

## Caveats

- **SDWA covers public systems.** Private wells (~13% of TX households) are out of scope.
- **MCL exceedance ≠ harm.** SDWA enforces compliance with health-based standards; an exceedance is a regulatory event, not necessarily a poisoning. Cf. [Burden vs Harm](burden-vs-harm.md).
- **"SDWA primacy" is the operative idea for TCEQ.** Federal SDWIS is fed by state primacy agencies.

## See also

- [SDWA violation types](sdwa-violation-types.md) · [MCL](mcl.md) · [LCR](lcr.md) · [PWSID](pwsid.md)
- [DWRS score](dwrs-score.md) · [Burden vs Harm](burden-vs-harm.md)
- [SDWIS vs ECHO](../comparisons/sdwis-vs-echo.md)
