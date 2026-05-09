# Graph

Derived edge list of all `relationships` in the wiki. Rebuilt by lint. Do not hand-edit between rebuilds — your edits will be overwritten.

Format: `source -> type -> target`, grouped by relationship type, deduped, sorted within group.

Last rebuilt: 2026-05-09 (manual pass after water/env/weather expansion; lint not yet run).

---

## published_by

```
datasets/census-acs5-2023-county.md  -> published_by -> agencies/census-bureau.md
datasets/epa-echo-violations.md      -> published_by -> agencies/epa.md
datasets/epa-ejscreen-2024.md        -> published_by -> agencies/epa.md
datasets/epa-sdwis-violations.md     -> published_by -> agencies/epa.md
datasets/epa-tri-tx.md               -> published_by -> agencies/epa.md
datasets/fema-nfhl.md                -> published_by -> agencies/fema.md
datasets/noaa-storm-events.md        -> published_by -> agencies/noaa.md
datasets/usdm-drought-monitor.md     -> published_by -> agencies/noaa.md
portals/data-texas-gov.md            -> published_by -> agencies/tceq.md
```

_Note:_ `data.texas.gov` is published collectively by TX state agencies, not solely TCEQ. The edge above is provisional. USDM is jointly published by NOAA / USDA / UNL — only the NOAA edge is recorded.

## lives_on

_(none yet — datasets that live on data.texas.gov should add this edge when their pages are written; e.g. `7fq8-wig2`, `hr84-s96f`)_

## depends_on

```
concepts/dwrs-score.md -> depends_on -> datasets/census-acs5-2023-county.md
concepts/dwrs-score.md -> depends_on -> datasets/epa-sdwis-violations.md
concepts/sdwa-violation-types.md -> depends_on -> concepts/mcl.md
```

## derives_from

```
concepts/dwrs-score.md -> derives_from -> datasets/census-acs5-2023-county.md
concepts/dwrs-score.md -> derives_from -> datasets/epa-sdwis-violations.md
```

## references

```
agencies/fema.md                    -> references -> agencies/noaa.md
agencies/usgs.md                    -> references -> agencies/twdb.md
comparisons/sdwis-vs-echo.md        -> references -> datasets/epa-echo-violations.md
comparisons/sdwis-vs-echo.md        -> references -> datasets/epa-sdwis-violations.md
concepts/burden-vs-harm.md          -> references -> concepts/dwrs-score.md
concepts/burden-vs-harm.md          -> references -> concepts/ej-index.md
concepts/burden-vs-harm.md          -> references -> datasets/epa-ejscreen-2024.md
concepts/burden-vs-harm.md          -> references -> datasets/epa-sdwis-violations.md
concepts/dwrs-score.md              -> published_by -> agencies/epa.md
concepts/ej-index.md                -> references -> concepts/burden-vs-harm.md
concepts/ej-index.md                -> references -> datasets/epa-ejscreen-2024.md
concepts/mcl.md                     -> references -> concepts/sdwa-violation-types.md
concepts/mcl.md                     -> references -> datasets/epa-sdwis-violations.md
concepts/pwsid.md                   -> references -> datasets/epa-sdwis-violations.md
concepts/sdwa-violation-types.md    -> references -> datasets/epa-sdwis-violations.md
datasets/epa-echo-violations.md     -> references -> datasets/epa-sdwis-violations.md
datasets/epa-tri-tx.md              -> references -> datasets/epa-ejscreen-2024.md
sources/texas-gis-inventory.md      -> references -> agencies/epa.md
sources/texas-gis-inventory.md      -> references -> agencies/tceq.md
sources/texas-gis-inventory.md      -> references -> agencies/twdb.md
sources/texas-gis-inventory.md      -> references -> portals/data-texas-gov.md
```

## supersedes / superseded_by

_(none)_

## contradicts

_(none)_
