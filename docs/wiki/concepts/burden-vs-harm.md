---
title: Burden vs Harm — atlas-tx product stance
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.8
source_count: 2
decay_profile: slow
tags: [concept, product-stance, ethics, language]
sources:
  - docs/contracts/dataset-registry.md
  - AGENTS.md
relationships:
  - {type: references, target: datasets/epa-ejscreen-2024.md}
  - {type: references, target: datasets/epa-sdwis-violations.md}
  - {type: references, target: concepts/dwrs-score.md}
  - {type: references, target: concepts/ej-index.md}
stale: false
---

# Burden vs Harm — atlas-tx product stance

A high-confidence wiki page because it is encoded in `AGENTS.md` and `docs/contracts/dataset-registry.md`. Re-stated here because *every* page in the wiki should default to this stance.

## The rule

> Atlas TX environmental-burden layers are treated as **indicators / proxies**. Registry entries and downstream tools must distinguish legal-status or proxy signals from direct measurements of harm. EJ outputs are *burden / exposure indicators*, not harm.

(Sources: `AGENTS.md` § 5; `docs/contracts/dataset-registry.md` § "Registry shape" rule on environmental-burden layers; `dataset-registry.md` § Surface-water impairment context.)

## Why it matters

Most of the data atlas-tx consumes is one of:

- **Compliance status** (SDWA violation reported, SWQ segment classified "impaired") — a *legal* outcome, not a clinical one.
- **Exposure proxy** (EJScreen indices, buffer-based permit density, TRI-proximity) — a *modeled* signal, not a measurement.
- **Population context** (ACS demographics) — *who lives where*, not *who was harmed*.

None of these justify a sentence of the form "people in county X are being harmed by Y". Atlas TX speaks the language of **risk, burden, exposure, and indicator** — never **harm, damage, or diagnosis**.

## How this shows up in code and content

| Surface | Right phrasing | Wrong phrasing |
|---|---|---|
| DWRS score | "drinking-water risk indicator" | "water-poisoning index" |
| EJScreen-derived | "demographic burden percentile" | "harm score" |
| SWQ segment "impaired" | "does not meet legal use-support" | "polluted to a dangerous level" |
| Permit density | "density of regulated activity" | "density of pollution" |
| TRI proximity | "proximity to reporting facilities" | "proximity to toxic dumps" |

The wrong-column phrasings are not just stylistically bad — they are **factually overclaimed**. Atlas TX cannot support them with the data it has.

## How this interacts with other rules

- **`AGENTS.md` § 5** lists "Claims of harm, diagnosis, or financial advice" as something that fails demo. This page is the long-form rationale.
- **Caveats are mandatory.** Every score row carries a non-empty `caveats` array in the registered scoring contract; the caveats are the place to surface the indicator-vs-harm distinction in machine-readable form.
- **MCL exceedances are the closest atlas-tx gets to "real" measurements.** Even there, exposure for any individual customer is uncertain. See [MCL](mcl.md).

## When a future signal pushes against this stance

If atlas-tx adds a dataset that genuinely *measures* health outcomes (e.g. CDC-published disease incidence), a new concept page should distinguish that measurement layer from the burden / indicator layer — and the product surfaces should be careful not to blur them. Until that happens, **assume the dataset is an indicator, not a measurement.**

## See also

- [DWRS score](dwrs-score.md) — caveats embody this stance.
- [EJ Index](ej-index.md) — methodology is intrinsically indicator-grade.
- [SDWA Violation Types](sdwa-violation-types.md) — health-based-only filter is one expression of this stance.
