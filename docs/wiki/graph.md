# Graph

Derived edge list of all `relationships` in the wiki. Rebuilt by `npx tsx scripts/lint-wiki.ts`. Do not hand-edit between rebuilds — your edits will be overwritten.

Format: `source -> type -> target`, grouped by relationship type, deduped, sorted within group.

Last rebuilt: 2026-05-10 · 63 pages · 189 edges across 6 relationship types.

---

## depends_on

```
concepts/apd-score.md                     -> depends_on -> concepts/cid.md
concepts/apd-score.md                     -> depends_on -> datasets/tceq-cid-search-one.md
concepts/apd-score.md                     -> depends_on -> datasets/tceq-cid-search-two.md
concepts/dwrs-score.md                    -> depends_on -> datasets/census-acs5-2023-county.md
concepts/dwrs-score.md                    -> depends_on -> datasets/epa-sdwis-violations.md
concepts/marey-chart.md                   -> depends_on -> datasets/7fq8-wig2-tceq-water-permits.md
concepts/sdwa-violation-types.md          -> depends_on -> concepts/mcl.md
datasets/7fq8-wig2-tceq-water-permits.md  -> depends_on -> concepts/cwa.md
datasets/7fq8-wig2-tceq-water-permits.md  -> depends_on -> concepts/marey-chart.md
datasets/7fq8-wig2-tceq-water-permits.md  -> depends_on -> concepts/socrata-soql.md
datasets/epa-echo-violations.md           -> depends_on -> concepts/cwa.md
datasets/epa-echo-violations.md           -> depends_on -> concepts/npdes.md
datasets/hr84-s96f-tx-water-districts.md  -> depends_on -> concepts/socrata-soql.md
projects/author-an-svg-viz-primitive.md   -> depends_on -> concepts/burden-vs-harm.md
projects/refresh-cached-snapshot.md       -> depends_on -> agencies/epa.md
projects/refresh-cached-snapshot.md       -> depends_on -> agencies/tceq.md
projects/refresh-cached-snapshot.md       -> depends_on -> agencies/twdb.md
```

## derives_from

```
concepts/apd-score.md             -> derives_from -> datasets/census-acs5-2023-county.md
concepts/apd-score.md             -> derives_from -> datasets/tceq-cid-search-one.md
concepts/apd-score.md             -> derives_from -> datasets/tceq-cid-search-two.md
concepts/dwrs-score.md            -> derives_from -> datasets/census-acs5-2023-county.md
concepts/dwrs-score.md            -> derives_from -> datasets/epa-sdwis-violations.md
datasets/epa-sdwis-violations.md  -> derives_from -> agencies/epa.md
datasets/tceq-cid-search-one.md   -> derives_from -> datasets/7fq8-wig2-tceq-water-permits.md
```

## implements

```
concepts/marey-chart.md                   -> implements -> projects/author-an-svg-viz-primitive.md
concepts/sankey-flow.md                   -> implements -> projects/author-an-svg-viz-primitive.md
datasets/7fq8-wig2-tceq-water-permits.md  -> implements -> concepts/tpdes.md
datasets/census-acs5-2023-county.md       -> implements -> concepts/acs.md
datasets/epa-sdwis-violations.md          -> implements -> concepts/sdwa.md
datasets/epa-sdwis-violations.md          -> implements -> projects/refresh-cached-snapshot.md
datasets/epa-tri-tx.md                    -> implements -> concepts/tri.md
datasets/tceq-cid-search-one.md           -> implements -> concepts/cid.md
datasets/tceq-cid-search-two.md           -> implements -> concepts/cid.md
datasets/twdb-major-aquifers.md           -> implements -> projects/refresh-cached-snapshot.md
projects/author-an-svg-viz-primitive.md   -> implements -> concepts/marey-chart.md
projects/author-an-svg-viz-primitive.md   -> implements -> concepts/sankey-flow.md
projects/refresh-cached-snapshot.md       -> implements -> datasets/epa-sdwis-violations.md
projects/refresh-cached-snapshot.md       -> implements -> datasets/tceq-cid-search-one.md
projects/refresh-cached-snapshot.md       -> implements -> datasets/tceq-cid-search-two.md
projects/refresh-cached-snapshot.md       -> implements -> datasets/twdb-huc8.md
projects/refresh-cached-snapshot.md       -> implements -> datasets/twdb-major-aquifers.md
projects/refresh-cached-snapshot.md       -> implements -> datasets/twdb-river-basins.md
```

## lives_on

```
datasets/7fq8-wig2-tceq-water-permits.md  -> lives_on -> portals/data-texas-gov.md
datasets/hr84-s96f-tx-water-districts.md  -> lives_on -> portals/data-texas-gov.md
```

## published_by

```
agencies/tceq.md                          -> published_by -> portals/data-texas-gov.md
concepts/dwrs-score.md                    -> published_by -> agencies/epa.md
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
datasets/usgs-nwis.md                     -> published_by -> agencies/usgs.md
portals/data-texas-gov.md                 -> published_by -> agencies/tceq.md
```

## references

```
agencies/fema.md                                -> references -> agencies/noaa.md
agencies/fema.md                                -> references -> concepts/firm.md
agencies/fema.md                                -> references -> concepts/nri.md
agencies/fema.md                                -> references -> concepts/sfha.md
agencies/noaa.md                                -> references -> datasets/noaa-storm-events.md
agencies/noaa.md                                -> references -> datasets/usdm-drought-monitor.md
agencies/tceq.md                                -> references -> agencies/epa.md
agencies/tceq.md                                -> references -> concepts/cid.md
agencies/tceq.md                                -> references -> concepts/tpdes.md
agencies/tceq.md                                -> references -> datasets/hr84-s96f-tx-water-districts.md
agencies/tceq.md                                -> references -> datasets/tceq-swq-segments.md
agencies/twdb.md                                -> references -> agencies/tceq.md
agencies/usgs.md                                -> references -> agencies/twdb.md
agencies/usgs.md                                -> references -> concepts/nhd.md
agencies/usgs.md                                -> references -> datasets/usgs-nwis.md
comparisons/sdwis-vs-echo.md                    -> references -> datasets/epa-echo-violations.md
comparisons/sdwis-vs-echo.md                    -> references -> datasets/epa-sdwis-violations.md
comparisons/twdb-huc8-vs-usgs-wbd.md            -> references -> agencies/usgs.md
comparisons/twdb-huc8-vs-usgs-wbd.md            -> references -> concepts/huc.md
comparisons/twdb-huc8-vs-usgs-wbd.md            -> references -> datasets/twdb-huc8.md
comparisons/twdb-river-basins-vs-huc.md         -> references -> concepts/huc.md
comparisons/twdb-river-basins-vs-huc.md         -> references -> datasets/twdb-huc8.md
comparisons/twdb-river-basins-vs-huc.md         -> references -> datasets/twdb-river-basins.md
concepts/acs.md                                 -> references -> agencies/census-bureau.md
concepts/acs.md                                 -> references -> concepts/ej-index.md
concepts/acs.md                                 -> references -> datasets/census-acs5-2023-county.md
concepts/apd-score.md                           -> references -> concepts/burden-vs-harm.md
concepts/apd-score.md                           -> references -> concepts/soah.md
concepts/burden-vs-harm.md                      -> references -> concepts/dwrs-score.md
concepts/burden-vs-harm.md                      -> references -> concepts/ej-index.md
concepts/burden-vs-harm.md                      -> references -> datasets/epa-ejscreen-2024.md
concepts/burden-vs-harm.md                      -> references -> datasets/epa-sdwis-violations.md
concepts/cid.md                                 -> references -> agencies/tceq.md
concepts/cid.md                                 -> references -> concepts/apd-score.md
concepts/cid.md                                 -> references -> concepts/soah.md
concepts/cid.md                                 -> references -> datasets/tceq-cid-search-one.md
concepts/cid.md                                 -> references -> datasets/tceq-cid-search-two.md
concepts/cwa.md                                 -> references -> agencies/epa.md
concepts/cwa.md                                 -> references -> agencies/tceq.md
concepts/cwa.md                                 -> references -> comparisons/sdwis-vs-echo.md
concepts/cwa.md                                 -> references -> concepts/npdes.md
concepts/cwa.md                                 -> references -> concepts/tpdes.md
concepts/cwa.md                                 -> references -> datasets/tceq-swq-segments.md
concepts/ej-index.md                            -> references -> concepts/burden-vs-harm.md
concepts/ej-index.md                            -> references -> datasets/epa-ejscreen-2024.md
concepts/firm.md                                -> references -> agencies/fema.md
concepts/firm.md                                -> references -> concepts/sfha.md
concepts/firm.md                                -> references -> datasets/fema-nfhl.md
concepts/frs-id.md                              -> references -> agencies/epa.md
concepts/frs-id.md                              -> references -> concepts/pwsid.md
concepts/frs-id.md                              -> references -> datasets/epa-echo-violations.md
concepts/huc.md                                 -> references -> agencies/usgs.md
concepts/huc.md                                 -> references -> datasets/twdb-huc8.md
concepts/lcr.md                                 -> references -> concepts/lsli.md
concepts/lcr.md                                 -> references -> concepts/mcl.md
concepts/lcr.md                                 -> references -> concepts/sdwa-violation-types.md
concepts/lcr.md                                 -> references -> datasets/epa-sdwis-violations.md
concepts/lsli.md                                -> references -> concepts/lcr.md
concepts/lsli.md                                -> references -> concepts/pwsid.md
concepts/mcl.md                                 -> references -> concepts/sdwa-violation-types.md
concepts/mcl.md                                 -> references -> datasets/epa-sdwis-violations.md
concepts/nhd.md                                 -> references -> agencies/usgs.md
concepts/nhd.md                                 -> references -> concepts/huc.md
concepts/npdes.md                               -> references -> agencies/epa.md
concepts/npdes.md                               -> references -> concepts/cwa.md
concepts/npdes.md                               -> references -> concepts/tpdes.md
concepts/nri.md                                 -> references -> agencies/fema.md
concepts/nri.md                                 -> references -> concepts/burden-vs-harm.md
concepts/nri.md                                 -> references -> datasets/epa-ejscreen-2024.md
concepts/pfas.md                                -> references -> concepts/mcl.md
concepts/pfas.md                                -> references -> concepts/sdwa-violation-types.md
concepts/pfas.md                                -> references -> datasets/epa-sdwis-violations.md
concepts/pwsid.md                               -> references -> datasets/epa-sdwis-violations.md
concepts/sdwa-violation-types.md                -> references -> datasets/epa-sdwis-violations.md
concepts/sdwa.md                                -> references -> agencies/epa.md
concepts/sdwa.md                                -> references -> comparisons/sdwis-vs-echo.md
concepts/sdwa.md                                -> references -> concepts/lcr.md
concepts/sdwa.md                                -> references -> concepts/lsli.md
concepts/sdwa.md                                -> references -> concepts/mcl.md
concepts/sdwa.md                                -> references -> concepts/pfas.md
concepts/sdwa.md                                -> references -> concepts/pwsid.md
concepts/sdwa.md                                -> references -> concepts/sdwa-violation-types.md
concepts/sfha.md                                -> references -> agencies/fema.md
concepts/sfha.md                                -> references -> concepts/burden-vs-harm.md
concepts/sfha.md                                -> references -> datasets/fema-nfhl.md
concepts/soah.md                                -> references -> agencies/tceq.md
concepts/soah.md                                -> references -> concepts/cid.md
concepts/socrata-soql.md                        -> references -> portals/data-texas-gov.md
concepts/tpdes.md                               -> references -> agencies/tceq.md
concepts/tpdes.md                               -> references -> concepts/cwa.md
concepts/tpdes.md                               -> references -> concepts/npdes.md
concepts/tpdes.md                               -> references -> datasets/7fq8-wig2-tceq-water-permits.md
concepts/tri.md                                 -> references -> agencies/epa.md
concepts/tri.md                                 -> references -> concepts/burden-vs-harm.md
concepts/tri.md                                 -> references -> concepts/frs-id.md
concepts/tri.md                                 -> references -> datasets/epa-tri-tx.md
datasets/epa-echo-violations.md                 -> references -> datasets/epa-sdwis-violations.md
datasets/epa-tri-tx.md                          -> references -> datasets/epa-ejscreen-2024.md
datasets/fema-nfhl.md                           -> references -> concepts/firm.md
datasets/fema-nfhl.md                           -> references -> concepts/sfha.md
datasets/tceq-cid-search-one.md                 -> references -> concepts/soah.md
datasets/tceq-cid-search-one.md                 -> references -> datasets/tceq-cid-search-two.md
datasets/tceq-cid-search-two.md                 -> references -> datasets/tceq-cid-search-one.md
datasets/tceq-swq-segments.md                   -> references -> concepts/burden-vs-harm.md
datasets/twdb-huc8.md                           -> references -> agencies/usgs.md
datasets/twdb-huc8.md                           -> references -> comparisons/twdb-huc8-vs-usgs-wbd.md
datasets/twdb-huc8.md                           -> references -> comparisons/twdb-river-basins-vs-huc.md
datasets/twdb-major-aquifers.md                 -> references -> datasets/usdm-drought-monitor.md
datasets/twdb-major-aquifers.md                 -> references -> sources/texas-gis-inventory.md
datasets/usgs-nwis.md                           -> references -> agencies/twdb.md
datasets/usgs-nwis.md                           -> references -> datasets/usdm-drought-monitor.md
episodes/2026-05-08-wiki-init.md                -> references -> CLAUDE.md
episodes/2026-05-08-wiki-init.md                -> references -> index.md
episodes/2026-05-08-wiki-init.md                -> references -> overview.md
episodes/2026-05-09-close-registry-drift.md     -> references -> episodes/2026-05-09-water-env-weather.md
episodes/2026-05-09-concepts-and-procedural.md  -> references -> episodes/2026-05-09-close-registry-drift.md
episodes/2026-05-09-water-env-weather.md        -> references -> episodes/2026-05-08-wiki-init.md
episodes/2026-05-10-tufte-marey-eyecandy.md     -> references -> concepts/marey-chart.md
episodes/2026-05-10-tufte-marey-eyecandy.md     -> references -> concepts/sankey-flow.md
episodes/2026-05-10-tufte-marey-eyecandy.md     -> references -> datasets/7fq8-wig2-tceq-water-permits.md
episodes/2026-05-10-tufte-marey-eyecandy.md     -> references -> projects/author-an-svg-viz-primitive.md
sources/texas-gis-inventory.md                  -> references -> agencies/epa.md
sources/texas-gis-inventory.md                  -> references -> agencies/tceq.md
sources/texas-gis-inventory.md                  -> references -> agencies/twdb.md
sources/texas-gis-inventory.md                  -> references -> portals/data-texas-gov.md
```
