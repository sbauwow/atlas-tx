# Graph

Derived edge list of all `relationships` in the wiki. Rebuilt by lint. Do not hand-edit between rebuilds — your edits will be overwritten.

Format: `source -> type -> target`, grouped by relationship type, deduped, sorted within group.

Last rebuilt: 2026-05-09 (manual pass after registry-drift close; lint not yet run).

---

## published_by

```
datasets/7fq8-wig2-tceq-water-permits.md  -> published_by -> agencies/tceq.md
datasets/census-acs5-2023-county.md       -> published_by -> agencies/census-bureau.md
datasets/epa-echo-violations.md           -> published_by -> agencies/epa.md
datasets/epa-ejscreen-2024.md             -> published_by -> agencies/epa.md
datasets/epa-sdwis-violations.md          -> published_by -> agencies/epa.md
datasets/epa-tri-tx.md                    -> published_by -> agencies/epa.md
datasets/fema-nfhl.md                     -> published_by -> agencies/fema.md
datasets/hr84-s96f-tx-water-districts.md  -> published_by -> agencies/tceq.md
datasets/noaa-storm-events.md             -> published_by -> agencies/noaa.md
datasets/tceq-cid-search-one.md           -> published_by -> agencies/tceq.md
datasets/tceq-cid-search-two.md           -> published_by -> agencies/tceq.md
datasets/tceq-swq-segments.md             -> published_by -> agencies/tceq.md
datasets/twdb-huc8.md                     -> published_by -> agencies/twdb.md
datasets/twdb-major-aquifers.md           -> published_by -> agencies/twdb.md
datasets/twdb-river-basins.md             -> published_by -> agencies/twdb.md
datasets/usdm-drought-monitor.md          -> published_by -> agencies/noaa.md
portals/data-texas-gov.md                 -> published_by -> agencies/tceq.md
```

_Notes:_ `data.texas.gov` is published collectively by TX state agencies, not solely TCEQ — edge is provisional. USDM is jointly published by NOAA / USDA / UNL — only NOAA edge is recorded. CID Search One/Two are scraped TCEQ surfaces, not Socrata, but still TCEQ-published.

## lives_on

```
datasets/7fq8-wig2-tceq-water-permits.md   -> lives_on -> portals/data-texas-gov.md
datasets/hr84-s96f-tx-water-districts.md   -> lives_on -> portals/data-texas-gov.md
```

## depends_on

```
concepts/apd-score.md                       -> depends_on -> datasets/tceq-cid-search-one.md
concepts/apd-score.md                       -> depends_on -> datasets/tceq-cid-search-two.md
concepts/dwrs-score.md                      -> depends_on -> datasets/census-acs5-2023-county.md
concepts/dwrs-score.md                      -> depends_on -> datasets/epa-sdwis-violations.md
concepts/sdwa-violation-types.md            -> depends_on -> concepts/mcl.md
datasets/7fq8-wig2-tceq-water-permits.md    -> depends_on -> concepts/socrata-soql.md
datasets/hr84-s96f-tx-water-districts.md    -> depends_on -> concepts/socrata-soql.md
```

## derives_from

```
concepts/apd-score.md                       -> derives_from -> datasets/census-acs5-2023-county.md
concepts/apd-score.md                       -> derives_from -> datasets/tceq-cid-search-one.md
concepts/apd-score.md                       -> derives_from -> datasets/tceq-cid-search-two.md
concepts/dwrs-score.md                      -> derives_from -> datasets/census-acs5-2023-county.md
concepts/dwrs-score.md                      -> derives_from -> datasets/epa-sdwis-violations.md
datasets/tceq-cid-search-one.md             -> derives_from -> datasets/7fq8-wig2-tceq-water-permits.md
```

## references

```
agencies/fema.md                            -> references -> agencies/noaa.md
agencies/usgs.md                            -> references -> agencies/twdb.md
comparisons/sdwis-vs-echo.md                -> references -> datasets/epa-echo-violations.md
comparisons/sdwis-vs-echo.md                -> references -> datasets/epa-sdwis-violations.md
concepts/apd-score.md                       -> references -> concepts/burden-vs-harm.md
concepts/burden-vs-harm.md                  -> references -> concepts/dwrs-score.md
concepts/burden-vs-harm.md                  -> references -> concepts/ej-index.md
concepts/burden-vs-harm.md                  -> references -> datasets/epa-ejscreen-2024.md
concepts/burden-vs-harm.md                  -> references -> datasets/epa-sdwis-violations.md
concepts/dwrs-score.md                      -> published_by -> agencies/epa.md
concepts/ej-index.md                        -> references -> concepts/burden-vs-harm.md
concepts/ej-index.md                        -> references -> datasets/epa-ejscreen-2024.md
concepts/huc.md                             -> references -> agencies/usgs.md
concepts/huc.md                             -> references -> datasets/twdb-huc8.md
concepts/lcr.md                             -> references -> concepts/mcl.md
concepts/lcr.md                             -> references -> concepts/sdwa-violation-types.md
concepts/lcr.md                             -> references -> datasets/epa-sdwis-violations.md
concepts/mcl.md                             -> references -> concepts/sdwa-violation-types.md
concepts/mcl.md                             -> references -> datasets/epa-sdwis-violations.md
concepts/pwsid.md                           -> references -> datasets/epa-sdwis-violations.md
concepts/sdwa-violation-types.md            -> references -> datasets/epa-sdwis-violations.md
concepts/socrata-soql.md                    -> references -> portals/data-texas-gov.md
datasets/epa-echo-violations.md             -> references -> datasets/epa-sdwis-violations.md
datasets/epa-tri-tx.md                      -> references -> datasets/epa-ejscreen-2024.md
datasets/tceq-cid-search-one.md             -> references -> datasets/tceq-cid-search-two.md
datasets/tceq-cid-search-two.md             -> references -> datasets/tceq-cid-search-one.md
datasets/tceq-swq-segments.md               -> references -> concepts/burden-vs-harm.md
datasets/twdb-huc8.md                       -> references -> agencies/usgs.md
datasets/twdb-major-aquifers.md             -> references -> datasets/usdm-drought-monitor.md
sources/texas-gis-inventory.md              -> references -> agencies/epa.md
sources/texas-gis-inventory.md              -> references -> agencies/tceq.md
sources/texas-gis-inventory.md              -> references -> agencies/twdb.md
sources/texas-gis-inventory.md              -> references -> portals/data-texas-gov.md
```

## supersedes / superseded_by

_(none)_

## contradicts

_(none)_
