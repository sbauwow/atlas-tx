# Wiki Index

Master catalog of `docs/wiki/`. Grouped by tier and category. Add a row when you create a page; remove when you delete (you should rarely delete — prefer `stale: true`).

For schema and conventions see [CLAUDE.md](CLAUDE.md). For ops history see [log.md](log.md). For the living synthesis see [overview.md](overview.md).

---

## Tier 4 — Procedural

_Repeatable atlas-tx workflows. Empty until ≥3 semantic pages share a pattern._

| Page | Topic |
|---|---|

---

## Tier 3 — Semantic

### Agencies

| Page | Role |
|---|---|
| [TCEQ](agencies/tceq.md) | Texas Commission on Environmental Quality — water permits, compliance, CID |
| [TWDB](agencies/twdb.md) | Texas Water Development Board — hydrology, aquifers, planning regions |
| [EPA](agencies/epa.md) | US EPA — SDWIS, ECHO, EJScreen, TRI |
| [Census Bureau](agencies/census-bureau.md) | ACS demographics for county-level normalization |
| [USGS](agencies/usgs.md) | National hydrography (NHD/WBD), streamflow gauges (NWIS), elevation (3DEP) |
| [NOAA](agencies/noaa.md) | Weather hazards, drought, precipitation, climate normals, tropical cyclones |
| [FEMA](agencies/fema.md) | Regulatory floodplain (NFHL), disaster declarations, National Risk Index |

### Portals

| Page | Hosts |
|---|---|
| [data.texas.gov](portals/data-texas-gov.md) | Texas Open Data — Socrata catalog for state-agency tabular datasets |

### Datasets

| Page | Registry ID | Publisher |
|---|---|---|
| [SDWIS Violations](datasets/epa-sdwis-violations.md) | `epa-sdwis-violations` | EPA |
| [ECHO Violations](datasets/epa-echo-violations.md) | `epa-echo-violations` | EPA |
| [EJScreen 2024](datasets/epa-ejscreen-2024.md) | `epa-ejscreen-2024` | EPA |
| [TRI (TX)](datasets/epa-tri-tx.md) | _(unregistered)_ | EPA |
| [ACS5 2023 County](datasets/census-acs5-2023-county.md) | `census-acs5-2023-county` | Census Bureau |
| [NFHL — Flood Hazard Layer](datasets/fema-nfhl.md) | _(unregistered)_ | FEMA |
| [NOAA Storm Events](datasets/noaa-storm-events.md) | _(unregistered)_ | NOAA |
| [USDM — Drought Monitor](datasets/usdm-drought-monitor.md) | _(unregistered)_ | NOAA / USDA / UNL |

### Layers

_(none yet — geometry-first pages will land when NFHL or NHD are cached as feature layers)_

| Page | Geometry |
|---|---|

### Concepts

| Page | What it is |
|---|---|
| [DWRS Score](concepts/dwrs-score.md) | Atlas TX Drinking Water Risk Score — derived signal |
| [SDWA Violation Types](concepts/sdwa-violation-types.md) | What gets weighted vs ignored in DWRS, and why |
| [MCL](concepts/mcl.md) | Maximum Contaminant Level — SDWA enforceable limits |
| [PWSID](concepts/pwsid.md) | Public Water System Identifier — the join key for SDWIS |
| [EJ Index](concepts/ej-index.md) | EJScreen index methodology, percentile semantics |
| [Burden vs Harm](concepts/burden-vs-harm.md) | Atlas TX product stance — indicator-grade, never harm claims |

### Comparisons

| Page | Subject |
|---|---|
| [SDWIS vs ECHO](comparisons/sdwis-vs-echo.md) | When to use which — drinking-water-only PWS view vs cross-program facility view |

### Sources

| Page | Backs |
|---|---|
| [Texas GIS Inventory](sources/texas-gis-inventory.md) | Summary of `docs/research/texas-gis-inventory.md` |

---

## Tier 2 — Episodic

| Page | Question |
|---|---|
| [2026-05-08 — Wiki init](episodes/2026-05-08-wiki-init.md) | Stand up the wiki, port schema, seed initial pages |
| [2026-05-09 — Water/env/weather expansion](episodes/2026-05-09-water-env-weather.md) | Add drinking-water-quality, environmental-factors, and weather-impact pages |

---

## Tier 1 — Working

_(empty)_
