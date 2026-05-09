# Graph

Derived edge list of all `relationships` in the wiki. Rebuilt by lint. Do not hand-edit between rebuilds — your edits will be overwritten.

Format: `source -> type -> target`, grouped by relationship type, deduped, sorted within group.

Last rebuilt: 2026-05-08 (manual seed pass; lint not yet run).

---

## published_by

```
datasets/epa-sdwis-violations.md     -> published_by -> agencies/epa.md
datasets/epa-ejscreen-2024.md        -> published_by -> agencies/epa.md
datasets/census-acs5-2023-county.md  -> published_by -> agencies/census-bureau.md
portals/data-texas-gov.md            -> published_by -> agencies/tceq.md
```

_Note:_ `data.texas.gov` is published collectively by TX state agencies, not solely TCEQ. The edge above is provisional until a `agencies/state-of-texas.md` umbrella page exists or the relationship is refined.

## lives_on

_(populated as datasets gain portal links)_

## depends_on

```
concepts/dwrs-score.md -> depends_on -> datasets/epa-sdwis-violations.md
concepts/dwrs-score.md -> depends_on -> datasets/epa-ejscreen-2024.md
concepts/dwrs-score.md -> depends_on -> datasets/census-acs5-2023-county.md
```

## derives_from

```
concepts/dwrs-score.md -> derives_from -> datasets/epa-sdwis-violations.md
concepts/dwrs-score.md -> derives_from -> datasets/epa-ejscreen-2024.md
concepts/dwrs-score.md -> derives_from -> datasets/census-acs5-2023-county.md
```

## references

```
sources/texas-gis-inventory.md -> references -> agencies/tceq.md
sources/texas-gis-inventory.md -> references -> agencies/twdb.md
sources/texas-gis-inventory.md -> references -> agencies/epa.md
sources/texas-gis-inventory.md -> references -> portals/data-texas-gov.md
```

## supersedes / superseded_by

_(none)_

## contradicts

_(none)_
