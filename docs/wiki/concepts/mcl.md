---
title: MCL — Maximum Contaminant Level
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.7
source_count: 1
decay_profile: slow
tags: [concept, water, sdwa, regulation, standard]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: references, target: concepts/sdwa-violation-types.md}
  - {type: references, target: datasets/epa-sdwis-violations.md}
stale: false
---

# MCL — Maximum Contaminant Level

The legal upper limit for a regulated contaminant in drinking water delivered by a Public Water System under the Safe Drinking Water Act.

## The terms

- **MCL** — Maximum Contaminant Level. Enforceable. The number you cannot exceed.
- **MCLG** — Maximum Contaminant Level *Goal*. Aspirational, non-enforceable. Set at the level "below which there is no known or expected risk to health, allowing an adequate margin of safety". For carcinogens MCLG is often 0; the enforceable MCL sits above it because of treatment feasibility / measurement-limit realities.
- **TT** — Treatment Technique. Used in place of an MCL when measuring the contaminant itself is impractical (e.g. *Cryptosporidium*) — instead the rule mandates a treatment process.
- **MRDL** — Maximum Residual Disinfectant Level. The MCL-equivalent for chlorine / chloramines / chlorine dioxide *in* the distribution system (these are added intentionally; too much creates its own risk).

## What's regulated (categories, not exhaustive)

- **Inorganics**: arsenic, lead (TT under LCR, see below), copper (TT/AL), nitrate, nitrite, fluoride, mercury, ...
- **Organics — VOCs**: benzene, vinyl chloride, TCE, PCE, ...
- **Organics — SOCs**: pesticides, herbicides (atrazine, ...).
- **Disinfection byproducts (DBPs)**: TTHM (total trihalomethanes), HAA5 (haloacetic acids).
- **Microbials**: total coliform / E. coli (revised total coliform rule), *Giardia* (TT), *Cryptosporidium* (TT), enteric viruses (TT).
- **Radionuclides**: combined radium, gross alpha, gross beta / photon emitters, uranium.

## Lead is special

The Lead and Copper Rule (LCR) does **not** set a conventional MCL for lead in tap water; it sets an **action level** (15 µg/L for lead at the 90th percentile of consumer-tap samples) and prescribes corrosion control + service-line replacement triggers. So "lead exceedance" in SDWIS is typically an LCR action-level / TT violation, not an MCL violation in the strict sense — schema-wise it shows up as a TT violation type. Worth flagging when the wiki crosses lead context.

## Why this matters here

DWRS treats MCL exceedances and TT violations as the high-severity tier. The exact severity weighting lives in code (`src/lib/scoring/dwrs.ts`); the principle is that an MCL exceedance is closer to "confirmed bad water" than any other SDWA signal Atlas TX consumes.

## Caveats

- **MCLs evolve.** EPA periodically tightens limits (e.g. arsenic 50 → 10 µg/L in 2001; PFAS limits added 2024). DWRS is implicitly comparing samples to the MCL **in effect at the violation date**, not today's MCL.
- **An MCL exceedance is a system-level violation**, not a per-tap measurement. Customers in different parts of the same PWS may experience very different exposures.
- **Some contaminants of concern are unregulated.** UCMR (Unregulated Contaminant Monitoring Rule) data sits outside SDWIS violations; PFAS data lived there (UCMR5) before the 2024 rulemaking.

## See also

- [SDWA Violation Types](sdwa-violation-types.md)
- [SDWIS dataset](../datasets/epa-sdwis-violations.md)
