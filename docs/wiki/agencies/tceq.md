---
title: TCEQ
type: agency
tier: semantic
created: 2026-05-08
updated: 2026-05-08
last_confirmed: 2026-05-08
confidence: 0.7
source_count: 2
decay_profile: slow
tags: [agency, texas, environment, water]
sources:
  - docs/research/texas-gis-inventory.md
  - docs/contracts/dataset-registry.md
relationships:
  - {type: published_by, target: portals/data-texas-gov.md}
  - {type: references, target: agencies/epa.md}
stale: false
---

# TCEQ — Texas Commission on Environmental Quality

State environmental agency. Primary publisher of TX water-quality, air, waste, and compliance data; reference data for Atlas TX.

## What it publishes that we use

- **Water Quality Individual Permits** — Socrata `7fq8-wig2` on [`data.texas.gov`](../portals/data-texas-gov.md). Active + pending wastewater discharge permits. Includes lat/long, regulated entity, county.
- **Texas Water Districts** — Socrata `hr84-s96f` on [`data.texas.gov`](../portals/data-texas-gov.md). District identity + jurisdictional info.
- **Central Index — Search One / Search Two** — registered as `tceq-cid-search-one` and `tceq-cid-search-two`. ColdFusion form, no API; scraped via session-cookie + form POST. Search One = case metadata + SOAH cross-ref; Search Two = comments / hearing-request / public-meeting-request filings. Backs the Active Protest Density score.
- **Surface Water Quality Segments** — registered as `tceq-swq-segments`. ArcGIS viewer; loader may require ArcGIS layer discovery. Atlas TX uses this as an *indicator* of impairment, not a verdict on harm.
- **TCEQ GIS Data Hub** — discovery surface for spatial layers complementary to the above.

## Things to know

- TCEQ datasets that flow through `data.texas.gov` use Socrata 4×4 IDs. TCEQ datasets that don't (CID, SWQ Viewer) are bespoke and need dedicated fetchers under `src/lib/datasets/`.
- "Impaired" on a SWQ segment is a *legal use-support* classification — not a direct measurement of human health risk. Surface accordingly in product language.
- County strings are messy. Normalize through `src/lib/counties.ts` before joining.

## Authority

- Datasets here are authoritative for Texas state environmental compliance.
- For *federal* compliance overlays on TX facilities, also consult [EPA ECHO / SDWIS](epa.md) — they tell different stories about the same facilities.

## See also

- Contract: [`docs/contracts/dataset-registry.md`](../../contracts/dataset-registry.md)
- Research: [Texas GIS inventory](../sources/texas-gis-inventory.md)
