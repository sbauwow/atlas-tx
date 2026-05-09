---
title: FRS — Facility Registry Service ID
type: concept
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.65
source_count: 1
decay_profile: slow
tags: [concept, federal, identifier, schema, cross-walk]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: references, target: datasets/epa-echo-violations.md}
  - {type: references, target: concepts/pwsid.md}
  - {type: references, target: agencies/epa.md}
stale: false
---

# FRS — Facility Registry Service ID

EPA's master cross-walking identifier for regulated entities. The thing that, in theory, lets you say "this SDWA Public Water System and this CWA NPDES discharger and this RCRA waste handler are all the same physical facility".

## What FRS is

The **Facility Registry Service** is EPA's program-agnostic facility registry. Each facility known to EPA — across SDWA, CWA, CAA, RCRA, CERCLA, EPCRA / TRI, and others — gets a stable **FRS Registry ID** (`REGISTRY_ID`).

FRS records carry:

- **FRS Registry ID** — primary key (long integer, kept as string in atlas-tx).
- **Facility name and address** — best-effort consolidated.
- **Lat/long + horizontal accuracy** — geocoded.
- **Program-system cross-references** — for each program, the facility's identifier in that program's database (e.g. PWSID for SDWA, NPDES permit # for CWA, EPA Identifier for RCRA).
- **NAICS / SIC** codes when applicable.
- **Parent organization** (when known).

## Why it matters here

Atlas-tx needs to cross-walk between:

- [PWSID](pwsid.md) (SDWIS / SDWA — drinking water systems)
- NPDES permit number (CWA — wastewater dischargers; cross-walks to TCEQ TPDES permits)
- TCEQ Regulated Entity Number (RN) — Texas state side
- TRI Facility ID (EPCRA — toxic releases)
- Other program identifiers

FRS is the spine that *should* let you join these. In practice:

- A single physical facility can hold a PWS *and* an NPDES permit (e.g. some utilities operate both treatment plants).
- [ECHO](../datasets/epa-echo-violations.md) is FRS-keyed and aggregates compliance across programs at the FRS level.
- TCEQ RN + EPA FRS are not always 1:1 — TCEQ can issue an RN before EPA registers an FRS, and vice versa.

## The unhappy join-quality reality

Despite FRS being the canonical answer, the join quality between FRS-IDs and program-specific IDs varies:

- **PWSID ↔ FRS** — incomplete coverage. Many small TX PWSs do not have an FRS cross-reference populated. ECHO claims this gap is closing but it's not solved.
- **TRI Facility ID ↔ FRS** — high coverage; FRS knows about every TRI reporter.
- **NPDES permit ↔ FRS** — high coverage for major dischargers; spotty for minor.

When the cross-reference is missing, the fallback is **spatial / name-fuzzy join**:

- Lat/long proximity (with horizontal-accuracy disclosure).
- Normalized facility-name similarity.

Atlas-tx should treat fuzzy joins as *low-confidence* signals — fine for "this might be the same facility, worth investigating" but not for "this PWS's EJScreen percentile maps directly to that ECHO violation count".

## Format

`REGISTRY_ID` is a **12-digit numeric string** in the FRS public data model. Keep as string. Like [PWSIDs](pwsid.md), do not numericize — leading zeros and storage stability matter.

## Caveats

- **FRS is incomplete.** Coverage gaps in small / non-major facilities are real. Atlas-tx must not claim "all TX water systems are cross-walked" — they're not.
- **Stable but evolving.** FRS Registry IDs are stable, but the program-cross-reference fields update as EPA discovers links. A row's `pwsid_xref` may be null today and populated next quarter.
- **Facility ≠ permit.** A facility can hold multiple permits across programs. FRS gives you the facility; the program tables give you the permits.
- **Program-system definition of "facility" varies.** SDWA's "system" is operational (a PWS may span multiple physical sites); CWA's is per-discharge-point. FRS rolls these into one record; the operational reality is messier.

## See also

- [ECHO violations dataset](../datasets/epa-echo-violations.md) — FRS-keyed, atlas-tx's main FRS consumer.
- [PWSID](pwsid.md) — the SDWA side of the cross-walk.
- [SDWIS vs ECHO](../comparisons/sdwis-vs-echo.md) — explains why the join quality matters.
- [EPA agency](../agencies/epa.md).
