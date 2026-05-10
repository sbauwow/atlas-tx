---
title: TPDES — Texas Pollutant Discharge Elimination System
type: concept
tier: semantic
created: 2026-05-10
updated: 2026-05-10
last_confirmed: 2026-05-10
confidence: 0.75
source_count: 2
decay_profile: slow
tags: [concept, texas, water, permit, surface-water]
sources:
  - https://www.tceq.texas.gov/permitting/wastewater
  - docs/wiki/datasets/7fq8-wig2-tceq-water-permits.md
relationships:
  - {type: references, target: concepts/npdes.md}
  - {type: references, target: concepts/cwa.md}
  - {type: references, target: agencies/tceq.md}
  - {type: references, target: datasets/7fq8-wig2-tceq-water-permits.md}
stale: false
---

# TPDES — Texas Pollutant Discharge Elimination System

Texas's primacy implementation of [NPDES](npdes.md). EPA delegated NPDES authority to Texas in 1998; since then, [TCEQ](../agencies/tceq.md) has been the issuing authority for wastewater discharge permits in the state.

A TPDES permit is operationally equivalent to a federal NPDES permit for facilities located in Texas — same "discharge of a pollutant from a point source to waters of the U.S." trigger, same enforceable effluent limits, same monitoring/reporting duties. The difference is *who is the issuing authority and where do you send the paperwork* — TCEQ, not EPA Region 6.

## Where TPDES surfaces in atlas-tx

- [`7fq8-wig2`](../datasets/7fq8-wig2-tceq-water-permits.md) — TCEQ Water Quality Individual Permits is the TPDES individual-permit dataset (plus state-only water-quality permits where they exist).
- [TCEQ Central Index (CID)](cid.md) cross-references the TCEQ ID embedded in TPDES filings to procedural activity (comments, hearing requests, public meetings).
- [EPA ECHO](../datasets/epa-echo-violations.md) is the federal compliance overlay; TPDES facility records flow into ECHO via the primacy reporting path.

## What TPDES is *not*

- **Not a separate body of law.** TPDES is the TX-administered slice of [CWA](cwa.md) § 402. Substantive rules trace back to federal CWA + EPA NPDES regulations (with TCEQ-added state requirements where applicable).
- **Not the SDWA lane.** Drinking-water rules, MCLs, and PWS compliance live under the [Safe Drinking Water Act](sdwa.md).
- **Not state-only permits.** Some TX wastewater permits sit entirely under state authority (e.g. land-application permits for some domestic systems). Those appear in the same dataset but lack federal NPDES coverage.

## See also

- [NPDES](npdes.md) · [CWA](cwa.md)
- [TCEQ](../agencies/tceq.md) · [`7fq8-wig2`](../datasets/7fq8-wig2-tceq-water-permits.md)
