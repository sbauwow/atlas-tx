---
title: TCEQ Central Index — Search One (case metadata)
type: dataset
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.65
source_count: 1
decay_profile: medium
tags: [dataset, tceq, cid, protest, scraping, fragile]
sources:
  - docs/contracts/dataset-registry.md
registry_id: tceq-cid-search-one
relationships:
  - {type: published_by, target: agencies/tceq.md}
  - {type: references, target: datasets/tceq-cid-search-two.md}
  - {type: derives_from, target: datasets/7fq8-wig2-tceq-water-permits.md}
stale: false
---

# TCEQ Central Index — Search One

`registry_id: tceq-cid-search-one` · `accessType: external` · added in dataset-registry v0.2.0.

## What it is

Per-permit case metadata from the TCEQ **Central Index Database** (CID): which permit applications are open, what TCEQ docket and SOAH (State Office of Administrative Hearings) docket numbers are assigned, status, programmatic area, applicant. One row per CID case.

Schema (from the contract):

```ts
type CidCaseRow = {
  tceqId: string;
  applicantName: string;
  county: string | null;          // normalized via counties.ts
  programArea: string;            // e.g. "APO", "AQ", "WQ", "IHWHL"
  itemStatus: "open" | "closed";
  tceqDocketNumber: string | null;
  soahDocketNumber: string | null;
  regulatedEntityNumber: string | null;
  customerNumber: string | null;
};
```

`tceqId` is the join key to [Search Two](tceq-cid-search-two.md) protest filings.

## Why it matters here

Drives the **Active Protest Density (APD)** score (per [`concepts/apd-score`](../concepts/apd-score.md)). Search One identifies which permits *have an open case*, including the strongest APD signal — whether the case has a SOAH docket number (referred to contested-case proceedings).

## Access shape

**Not an API.** ColdFusion form. The fetcher (`src/lib/datasets/cid.ts`) must:

1. GET the search form page first to warm a session cookie.
2. POST search params with `Content-Type: application/x-www-form-urlencoded` and a `Referer` header.
3. Use sentinel `"none"` for "any program area"; use the blank/`ALL` option for County and Region (note: different sentinel than program area).

## Caveats (always emit downstream)

- **Live verification status (2026-05-08): broad statewide queries are FRAGILE.** Even county- and program-chunked POSTs return upstream "An unexpected error has occurred" pages. Treat full Search One refresh as a retry/manual-debug path, not unattended scraping.
- The chunked-refresh scaffold (`scripts/refresh-cid.ts`) supports a browser-automation fallback hook for Search One specifically because of this.
- **Open cases only** by intent — APD reflects current pressure, not historical protest record.

## Refresh

- Refresh entrypoint: `scripts/refresh-cid.ts` (chunked planning, fail-loud on the upstream error page).
- Snapshot: `public/cache/cid-cases-tx.json` (or `data/` if oversized).
- Parser is pinned to fixture HTML in `tests/fixtures/cid/` and fails loud on schema drift.

## See also

- [Search Two](tceq-cid-search-two.md) — the filing rows that join on `tceqId`.
- [APD score](../concepts/apd-score.md) — the formula that consumes both.
- [TCEQ Water Quality Permits](7fq8-wig2-tceq-water-permits.md) — the underlying permits being protested.
