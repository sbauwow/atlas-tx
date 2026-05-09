---
title: TCEQ Central Index — Search Two (filings)
type: dataset
tier: semantic
created: 2026-05-09
updated: 2026-05-09
last_confirmed: 2026-05-09
confidence: 0.7
source_count: 1
decay_profile: medium
tags: [dataset, tceq, cid, protest, filings, scraping]
sources:
  - docs/contracts/dataset-registry.md
registry_id: tceq-cid-search-two
relationships:
  - {type: published_by, target: agencies/tceq.md}
  - {type: references, target: datasets/tceq-cid-search-one.md}
stale: false
---

# TCEQ Central Index — Search Two

`registry_id: tceq-cid-search-two` · `accessType: external` · added in dataset-registry v0.2.0.

## What it is

Per-filing protest records — comments, hearing requests, public-meeting requests filed against TCEQ permit cases. One row per filing. Joins to [Search One](tceq-cid-search-one.md) cases on `tceqId`.

Schema (from the contract):

```ts
type CidProtestRow = {
  tceqId: string;                 // joins to CidCaseRow.tceqId
  filingType: "comment" | "hearing_request" | "public_meeting_request";
  filerOrganization: string | null;
  filedAt: string;                // ISO date
  // No filer name fields are normalized — see protests-extension plan guardrails.
};
```

**Note the deliberate omission of filer-name fields.** This is a guardrail from `docs/plans/2026-05-08-protests-extension.md` — atlas-tx does not surface individual filers, only counts and (where present) organizations.

## Why it matters here

The other half of the [APD score](../concepts/apd-score.md). Filing counts go into the score's `filing_pressure_per_item` term:

```
filing_pressure_per_item = (
    1.0
  + 0.35 * log1p(comment_count)
  + 0.75 * public_meeting_request_count
  + 1.25 * hearing_request_count
  + 2.5  * (soah_docket_number != null ? 1 : 0)   // from Search One
)
```

Comments are log-damped intentionally so high-volume comment blasts don't dominate. Hearing requests are heavier than comments; SOAH referral (from Search One) is the heaviest single signal.

## Access shape

Same ColdFusion form pattern as Search One. **Search Two has been live-verified with scripted POST** (per the contract; status as of 2026-05-08) — broad queries work. This is the more reliable of the two CID endpoints.

## Caveats (always emit downstream)

- **Filer counts include duplicates and organized campaigns.** A coordinated postcard campaign can inflate `comment_count` for a single permit; the log-damp on comments in APD is the structural mitigation.
- **Hearing request ≠ contested case granted.** Just filing a hearing request doesn't mean TCEQ accepted it. SOAH docket # (from Search One) is the harder signal that the case actually escalated.
- **Open items only**, by design — same window-of-attention scope as Search One.
- **No filer names exposed by the schema.** Don't add them downstream either.

## Refresh

- Refresh entrypoint: `scripts/refresh-cid.ts` (broad query path, more reliable than Search One chunks).
- Snapshot: `public/cache/cid-protests-tx.json` (or `data/` if oversized).
- Parser pinned to `tests/fixtures/cid/`.

## See also

- [Search One](tceq-cid-search-one.md) — case metadata that filings attach to.
- [APD score](../concepts/apd-score.md) — the score formula.
- Plan: `docs/plans/2026-05-08-protests-extension.md` — original scope + guardrails.
