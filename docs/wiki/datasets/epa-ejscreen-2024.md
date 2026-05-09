---
title: EPA EJScreen 2024
type: dataset
tier: semantic
created: 2026-05-08
updated: 2026-05-08
last_confirmed: 2026-05-08
confidence: 0.7
source_count: 2
decay_profile: medium
tags: [dataset, federal, ej, indicators]
sources:
  - docs/contracts/dataset-registry.md
  - docs/research/texas-gis-inventory.md
registry_id: epa-ejscreen-2024
relationships:
  - {type: published_by, target: agencies/epa.md}
stale: false
---

# EPA EJScreen — 2024 vintage

`registry_id: epa-ejscreen-2024` · `accessType: external` · category `social` (EJ-indicator).

## What it is

EPA's environmental-justice screening dataset, 2024 vintage. Block-group-level indicators combining ACS demographics with environmental-burden proxies (proximity to TRI / Superfund / RMP / treatment-storage-disposal facilities, traffic, lead-paint indicator, ozone, PM2.5, etc.) into composite indices.

## Schema notes (Atlas TX usage)

Joined to TX block groups by GEOID. Atlas TX consumes the demographic-burden percentile and per-burden index columns; canonical `keyFields` live in the registry contract. EJScreen ships **percentile** columns alongside raw values — Atlas TX prefers percentiles for cross-block-group comparison, and pins state-relative vs. national interpretation per call.

## Why it matters

Drives the **EJ Burden Overlap** score:
> Per-block-group score = EJScreen demographic-burden percentile × permit density within N-mile buffer.

(See `docs/contracts/dataset-registry.md` § Current registered signals.)

## Caveats (always emit downstream)

- **Indicator, not measurement.** EJScreen indices are *burden / exposure proxies*, not measured human-health outcomes. Product language must reflect this — atlas-tx contributors do not claim harm.
- **Buffer-based exposure** in the EJ Overlap score is itself a proxy. Two block groups with the same buffer-density can have very different real exposure.
- **Vintage drift.** EPA refreshes EJScreen on a roughly-annual cadence. When a newer vintage lands, this page becomes `supersedes`-target for `epa-ejscreen-2025` (or whatever); do not delete.
- **State-relative vs national percentiles** answer different questions. Pin one explicitly.

## Refresh

External; dedicated fetcher under `src/lib/datasets/`. Snapshot under `public/cache/` or `data/` per size.

## Lineage

EJScreen fuses ACS demographics with environmental-burden inputs. When Atlas TX wants raw ACS at block-group level we read it through EJScreen rather than double-pulling Census directly — see [Census Bureau](../agencies/census-bureau.md).
