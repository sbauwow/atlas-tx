---
title: TCEQ Central Index (CID)
type: concept
tier: semantic
created: 2026-05-10
updated: 2026-05-10
last_confirmed: 2026-05-10
confidence: 0.7
source_count: 2
decay_profile: medium
tags: [concept, texas, tceq, public-records, procedural]
sources:
  - https://www14.tceq.texas.gov/epic/eCID/
  - docs/wiki/datasets/tceq-cid-search-one.md
relationships:
  - {type: references, target: agencies/tceq.md}
  - {type: references, target: datasets/tceq-cid-search-one.md}
  - {type: references, target: datasets/tceq-cid-search-two.md}
  - {type: references, target: concepts/apd-score.md}
  - {type: references, target: concepts/soah.md}
stale: false
---

# TCEQ Central Index (CID)

Public-record system run by [TCEQ](../agencies/tceq.md) at `www14.tceq.texas.gov/epic/eCID/`. Two complementary search surfaces ("Search One" and "Search Two") expose:

1. **Cases** — every permit-adjudication item under TCEQ jurisdiction: permit type, regulated entity, applicant, county, current procedural status, optional [SOAH](soah.md) docket cross-reference.
2. **Filings** — comments, hearing requests, and public-meeting requests filed against a specific case, keyed by TCEQ ID and filer organization.

CID is the **only** public surface where comment / hearing-request / public-meeting activity is queryable in one place. There is no Socrata mirror, no documented API; atlas-tx accesses it via session-cookie + form-POST scrape, normalized into [`tceq-cid-search-one`](../datasets/tceq-cid-search-one.md) and [`tceq-cid-search-two`](../datasets/tceq-cid-search-two.md).

## Why it matters here

- **Active Protest Density** — the [APD score](apd-score.md) is built directly from CID filings, weighted by procedural type (hearing request > public-meeting request > comment).
- **Permit cross-walk** — every CID case carries the TCEQ ID of the underlying permit, joining back to [`7fq8-wig2`](../datasets/7fq8-wig2-tceq-water-permits.md) and other TCEQ permit datasets.
- **Procedural pressure** — county-level and program-level concentration of CID filings is a leading signal for "permit fights" worth journalistic / policy attention.

## Schema gotchas

- ColdFusion form, no API. Sessions expire; pagination is link-driven.
- "Search One" returns case metadata; "Search Two" returns filings. They do not join automatically — atlas-tx joins by TCEQ ID.
- Filer names: CID exposes individual filer names. **Atlas TX guardrail**: never surface individual filer names. Aggregate by organization or by count only. Privacy-by-design, not optional.
- "Item Status" is `OPEN` / `CLOSED`, but a closed case can have new filings logged after closure for archival reasons. Treat with skepticism.

## Caveats

- **CID activity ≠ controversy.** A case with zero filings can still be high-impact; a case with many filings can be procedurally healthy. APD is a density signal, not a verdict.
- **CID lag.** Filings appear in CID 1–7 days after submission. Real-time pressure analysis is not a CID story.

## See also

- [APD score](apd-score.md) · [SOAH](soah.md) · [TPDES](tpdes.md)
- [`tceq-cid-search-one`](../datasets/tceq-cid-search-one.md) · [`tceq-cid-search-two`](../datasets/tceq-cid-search-two.md)
