---
title: SOAH — State Office of Administrative Hearings
type: concept
tier: semantic
created: 2026-05-10
updated: 2026-05-10
last_confirmed: 2026-05-10
confidence: 0.7
source_count: 1
decay_profile: slow
tags: [concept, texas, hearing, procedural, governance]
sources:
  - https://www.soah.texas.gov/
relationships:
  - {type: references, target: concepts/cid.md}
  - {type: references, target: agencies/tceq.md}
stale: false
---

# SOAH — State Office of Administrative Hearings

Independent Texas state agency that conducts formal contested-case hearings on behalf of other state agencies, including TCEQ. When a TCEQ permit application is contested by an affected party (e.g. via a hearing request filed through [CID](cid.md)), the case is referred to SOAH for a hearing before an Administrative Law Judge (ALJ).

SOAH does not decide permit outcomes itself; it produces a **proposal for decision** (PFD) that the originating agency's commissioners then accept, modify, or reject in a final order.

## Why it matters here

- A SOAH docket number on a [`tceq-cid-search-one`](../datasets/tceq-cid-search-one.md) row is the strongest signal that a permit case has reached **formal contested-case hearing** status — past comment, past public-meeting, past hearing-request review.
- Cases referred to SOAH typically involve multiple parties, multi-month timelines, and discoverable evidentiary records. They are the highest-stakes permits in the [APD](apd-score.md) lens.
- The presence vs. absence of a SOAH docket is itself a procedural-pressure signal independent of filing count.

## Caveats

- **SOAH ≠ outcome.** A referral to SOAH does not mean the permit will be denied — only that a hearing has been scheduled.
- **Not all hearing requests reach SOAH.** TCEQ commissioners can deny hearing requests (e.g. for lack of "affected person" status) before referral.

## See also

- [CID](cid.md) · [APD score](apd-score.md)
- [`tceq-cid-search-one`](../datasets/tceq-cid-search-one.md)
