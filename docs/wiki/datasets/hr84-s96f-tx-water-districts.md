---
title: Texas Water Districts (hr84-s96f)
type: dataset
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.6
source_count: 1
decay_profile: medium
tags: [dataset, tceq, water, district, jurisdiction, socrata]
sources:
  - docs/contracts/dataset-registry.md
registry_id: hr84-s96f
relationships:
  - {type: published_by, target: agencies/tceq.md}
  - {type: lives_on, target: portals/data-texas-gov.md}
  - {type: depends_on, target: concepts/socrata-soql.md}
stale: false
---

# Texas Water Districts

`registry_id: hr84-s96f` · `accessType: dataset` (Socrata, auto-built URL) · category `infrastructure`.

## What it is

A registry of Texas water-related special districts: Municipal Utility Districts (MUDs), Water Control and Improvement Districts (WCIDs), groundwater conservation districts, river authorities, and various other district types governed under Texas Water Code. Identity-level info: district name, type, county or counties, creation date, contact info; **not service-area geometry**.

## Why it matters here

Atlas-tx is built around county-level analysis, but real water service in TX is delivered by **districts** as much as by city utilities. Districts:

- Often hold their own [TPDES permits](7fq8-wig2-tceq-water-permits.md).
- Operate or contract operations of one or more [Public Water Systems](../concepts/pwsid.md) → cross-walk to [SDWIS violations](epa-sdwis-violations.md).
- Issue debt to fund infrastructure — a future surface (currently out of v1 scope, fiscal/debt is deferred per the refocus plan).

So this dataset is the **identity registry** that lets atlas-tx connect a county-level surface to the actual operating entities.

## Schema notes

Canonical `keyFields` per the registry contract. Join keys here are messy — districts cross county boundaries; one district can serve part of multiple counties; one county hosts dozens of districts. Many-to-many relationships are the rule.

The dataset does **not** carry service-area polygons. Service-area geometry, when available at all, comes from [TWDB GIS sources](../agencies/twdb.md) or the districts themselves; it is not part of `hr84-s96f`.

## Caveats (always emit downstream)

- **Identity, not geometry.** Don't try to spatially join `hr84-s96f` rows to anything — it's a directory.
- **Stale entries.** Districts get created, dissolved, merged. The Socrata refresh cadence smooths some of this, but historical authority over a particular service area is not always reconstructible from this row alone.
- **District ≠ utility ≠ PWS.** All three are legal/operational concepts that *partially* overlap. A MUD may operate one PWS or several; some districts deliver no water service at all (groundwater conservation districts, for example, regulate use rather than supply).

## Refresh

`accessType: "dataset"` ⇒ Socrata URL via `texas-open-data.ts`. SoQL filters apply.

## See also

- [TCEQ agency](../agencies/tceq.md)
- [data.texas.gov portal](../portals/data-texas-gov.md)
- [PWSID concept](../concepts/pwsid.md) — different identifier scheme, partially overlapping operational reality.
