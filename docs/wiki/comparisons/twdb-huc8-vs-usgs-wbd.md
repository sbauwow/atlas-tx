---
title: TWDB HUC8 vs USGS WBD — same codes, different attribution
type: comparison
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.7
source_count: 1
decay_profile: slow
tags: [comparison, hydrology, huc, twdb, usgs, watershed]
sources:
  - docs/contracts/dataset-registry.md
relationships:
  - {type: references, target: datasets/twdb-huc8.md}
  - {type: references, target: agencies/usgs.md}
  - {type: references, target: concepts/huc.md}
stale: false
---

# TWDB HUC8 vs USGS WBD

Both publish HUC8 polygons for Texas. Same codes, different attribution. Use the right one for the job.

## At a glance

| Axis | [TWDB HUC8](../datasets/twdb-huc8.md) | USGS WBD HUC8 |
|---|---|---|
| **Authoritative for HUC codes?** | No (mirrors USGS) | Yes |
| **Codes themselves** | USGS-WBD codes verbatim | Authoritative |
| **Attribution** | TX-friendly (TWDB-named subbasins, BASIN/REGION/SUBREGION roll-ups) | Federal-standard (HUC names per WBD, no TX-state-planning roll-up) |
| **Geometry source** | Cached statewide extent in atlas-tx (bbox-only currently); polygon source is TWDB | USGS-WBD authoritative polygons |
| **Update lag** | TWDB updates downstream of USGS | USGS WBD revisions land here first |
| **Geographic coverage** | Texas (subset / clip) | National |
| **Atlas-tx access** | Registered: `twdb-huc8`, `accessType: external` | Not registered |
| **When to use** | TX-only analysis, especially when TWDB roll-up names are useful | Cross-state work, comparison to non-TX, modeling that depends on the freshest WBD revision |

## When the difference actually matters

For most atlas-tx work, **the codes are the same and you can treat the two as interchangeable**. The HUC8 code `12090301` means the same thing in both. If you're tagging a TX PWS with its HUC8, either source gives you the right tag.

The difference matters when:

1. **WBD has been revised but TWDB hasn't synced yet.** USGS occasionally publishes WBD revisions that adjust boundaries (rare for HUC8; common for HUC10/12). For a brief window, TWDB-cached polygons differ from USGS-current. For TX-only analysis this rarely matters; for "what does USGS think today" prefer USGS.
2. **You need national comparisons.** A "TX HUC8 vs CA HUC8" analysis must use USGS WBD on both sides — TWDB doesn't cover CA.
3. **You need TWDB roll-up attribution.** TWDB groups its HUC8s into BASIN / REGION / SUBREGION TX-state planning units. USGS WBD doesn't carry those — it has its own HUC2 / HUC4 / HUC6 hierarchy. If you want to ask "which TWDB region does this HUC8 belong to?", TWDB attribution is the friendly path.

## Code-format pitfall

Both store HUC8 as an 8-character string. **Keep as string.** Numericizing drops the leading zero on HUCs in regions 01–09 (rare in TX — almost all TX HUCs start with `11`, `12`, or `13` — but it's still bad practice).

## Atlas-tx default

Use TWDB HUC8 (already registered, already cached). Cross-walk to USGS WBD only when one of the three "matters" cases above applies.

## Caveats

- **Bbox-only atlas-tx snapshot.** The atlas-tx-cached TWDB HUC8 is bounding-box-only as of contract v0.4.0 — same caveat as the rest of the [TWDB hydrology trio](../datasets/twdb-major-aquifers.md). True polygon intersection requires a geometry refresh.
- **HUC8 is a coarse unit.** Most TX HUC8s span multiple counties. For sub-county resolution, you want HUC10 or HUC12, neither of which is currently in atlas-tx (or registered).
- **Same code, slightly different polygon** can occur after a WBD revision. If your downstream math is sensitive to boundary changes, pin the source.

## See also

- [TWDB HUC8 dataset](../datasets/twdb-huc8.md)
- [USGS agency](../agencies/usgs.md)
- [HUC concept](../concepts/huc.md) — the scheme itself.
