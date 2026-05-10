---
title: FEMA — Federal Emergency Management Agency
type: agency
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.6
source_count: 1
decay_profile: slow
tags: [agency, federal, flood, disaster, gis]
sources:
  - docs/research/texas-gis-inventory.md
relationships:
  - {type: references, target: agencies/noaa.md}
  - {type: references, target: concepts/nri.md}
  - {type: references, target: concepts/sfha.md}
  - {type: references, target: concepts/firm.md}
stale: false
---

# FEMA — Federal Emergency Management Agency

Federal disaster-management agency. Most relevant to atlas-tx as the publisher of **regulatory flood-hazard maps** and **disaster-declaration history**, both of which sit naturally next to a county-level water-risk story.

## What it publishes that we (could) use

### National Flood Hazard Layer (NFHL)
- Polygon layer of regulatory flood-hazard zones from FEMA Flood Insurance Rate Maps (FIRMs). Includes Special Flood Hazard Areas (SFHAs), 0.2% annual chance areas, regulatory floodway, base flood elevations. See [`datasets/fema-nfhl`](../datasets/fema-nfhl.md).
- Hosted as ArcGIS feature services on FEMA's MSC and on the NFHL Map Service.

### OpenFEMA datasets
- **Disaster Declarations Summaries** — every Stafford Act declaration with declaration type (DR major disaster, EM emergency, FM fire management).
- **Public Assistance Funded Projects** / **Individual Assistance** — amounts and categories obligated.
- **Hazard Mitigation Assistance** — pre/post-disaster mitigation grants.

### National Risk Index (NRI)
- Composite county-level (and tract-level) indicator combining 18 natural hazards with social vulnerability and community resilience scores. Could substitute for or augment EJScreen-style burden indicators on the *natural-hazard* axis.

### USGS / USACE coordination
FEMA's regulatory floodplain depends on hydrologic and hydraulic studies — typically performed by USGS, USACE, or contractors. The floodplain *polygon* is FEMA's; the *science under it* lives elsewhere.

## Authority

- **Authoritative** for the regulatory floodplain in the US — NFHL is the layer used for flood-insurance and local zoning decisions.
- Authoritative for federal disaster declarations.
- The NRI is **indicator-grade** — useful as a screening overlay, not a decision-quality risk model.

## Things to know

- **NFHL is regulatory, not predictive.** A property outside the SFHA is *not* "no flood risk" — it's just not in the regulatory 1%-annual-chance zone for insurance purposes. Climate-change-driven flooding regularly happens outside FEMA SFHAs.
- **Map vintage varies.** FIRMs are updated on multi-year cycles; some TX counties have very old effective FIRMs while others are recent. Always check the FIRM effective date for the area in question.
- **Post-Harvey TX**: NFHL usefulness in TX has been actively contested since 2017's Harvey flooding showed extensive flooding outside FEMA SFHAs. Surface this if a UI claims "flood risk" using NFHL alone.
- **Letter of Map Change (LOMC)** filings can move structures into / out of SFHA without a full FIRM revision — NFHL incorporates these.

## Status in atlas-tx

Not currently registered. NFHL is the natural first registration — flood-zone overlap with PWS service areas, treatment-plant locations, and EJ-vulnerable block groups is a high-value story. Disaster Declaration history (county × year) is a strong second.

## See also

- [NOAA](noaa.md) — precipitation / Atlas 14 inputs feed flood frequency studies.
- [USGS](usgs.md) — hydrology / streamflow data underlies many FIRMs.
