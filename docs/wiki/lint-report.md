# Lint Report

Auto-generated health snapshot. Rebuilt by `npx tsx scripts/lint-wiki.ts`. Do not hand-edit between rebuilds.

Last rebuilt: 2026-05-10

- Pages: 63
- Pages with computed decay (display-only; nominal confidence in frontmatter is the value at `last_confirmed`): 63
- Newly stale: 0

---

## Orphans

Pages with **no** inbound `relationships` from any other page (excluding `index`/`overview`/`graph`/`log`/`lint-report`/`CLAUDE`).

- `episodes/2026-05-09-concepts-and-procedural.md`
- `episodes/2026-05-10-tufte-marey-eyecandy.md`

## Dangling

Relationships pointing at nonexistent pages.

_(none)_

## Stale

Pages moved to `stale: true` this lint pass (confidence < 0.2 after decay).

_(none)_

## Contradictions

Unresolved `contradicts` edges.

_(none)_

## Registry drift

Wiki dataset pages whose `registry_id` was not found in `docs/contracts/dataset-registry.md` (best-effort scan).

- `epa-echo-violations`
- `hr84-s96f`

Note: registry-side scan is regex-only; some IDs may live in tables that don't backtick-quote them. Cross-check by hand before chasing fixes.

## Missing concepts

Terms mentioned ≥ 3 times across non-concept pages without their own concept page (best-effort heuristic).

_(none surfaced by the watchlist heuristic)_

## Low-confidence pages

Pages whose **decayed** confidence sits under 0.4 (frontmatter `confidence` is the value at `last_confirmed`; this is what it would be today if no one re-confirms it).

_(none)_
