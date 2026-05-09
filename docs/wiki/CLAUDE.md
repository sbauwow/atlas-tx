# Atlas TX Data Wiki — Schema

LLM-maintained reference wiki for the data sources Atlas TX touches: Texas state agencies, EPA programs, adjacent federal data (Census, USGS, NOAA, FEMA), the portals they publish through, and the datasets and GIS layers that ingestion / scoring / map work depends on. The LLM (you) owns `docs/wiki/` entirely — create, update, cross-link, consolidate, decay. The human curates sources, directs research, asks questions, overrides judgment calls.

This schema extends the Karpathy LLM Wiki pattern with lifecycle, typed relationships, and crystallization. It is ported from `~/trading-wiki/CLAUDE.md` and retuned for govt-data: most pages decay slowly, contracts and registry IDs are authoritative, and the relationship vocabulary adds publisher / portal / derivation links. See `log.md` for the change history of this schema itself.

## Relationship to the rest of `docs/`

`docs/wiki/` is **descriptive**, not authoritative. The authoritative surfaces are still:

- [`docs/contracts/dataset-registry.md`](../contracts/dataset-registry.md) — canonical IDs and field contracts. **If the wiki disagrees with the registry, the registry wins.** Update the wiki page to match.
- [`docs/contracts/mcp-tools.md`](../contracts/mcp-tools.md) — MCP tool envelopes.
- [`docs/contracts/skill-protocol.md`](../contracts/skill-protocol.md) — skill invocation contract.
- [`docs/plans/`](../plans/) — direction and scope. The wiki documents what we touch, not what we plan to do.
- [`docs/research/`](../research/) — long-form research notes. Treat these as **raw sources**: cite them in page frontmatter, atomize their findings into wiki pages, never re-paste their prose verbatim.

The wiki is the place to record the *durable understanding* of an agency / dataset / layer — schema, gotchas, refresh cadence, who-publishes-what, how-it-relates — so that future agents do not have to re-research it from external portals.

## Directory structure

```
docs/wiki/
├── CLAUDE.md           # this file — schema and conventions
├── index.md            # master catalog, grouped by tier and category
├── log.md              # chronological ops log
├── overview.md         # living synthesis of the TX water/EJ data landscape
├── graph.md            # derived edge list (rebuilt on lint)
├── lint-report.md      # derived health snapshot (rebuilt on lint)
├── working/            # tier 1 — raw observations, un-consolidated
├── episodes/           # tier 2 — crystallized session digests
├── agencies/           # tier 3 — publishers (state + federal)
├── portals/            # tier 3 — data portals / catalogs / hubs
├── datasets/           # tier 3 — canonical tabular datasets (stable ID + schema)
├── layers/             # tier 3 — GIS feature services / geometry layers
├── concepts/           # tier 3 — domain concepts and standards (HUC, MCL, EJ index, SoQL...)
├── comparisons/        # tier 3 — side-by-side analyses (SDWIS vs ECHO, EJScreen vintages)
├── sources/            # tier 3 — summaries of `docs/research/*.md` and external research
└── projects/           # tier 4 — repeatable atlas-tx workflows (ingest / refresh / score patterns)
```

No `raw/` directory inside the wiki. Raw research lives in [`docs/research/`](../research/) and is referenced by path.

## Consolidation tiers

Knowledge flows upward as evidence accumulates. Each tier is more compressed, more confident, longer-lived than the one below.

| Tier | Dirs | What lives here | Default decay |
|---|---|---|---|
| 1 Working | `working/` | "I saw the EJScreen API return 502 today", "this 4x4 ID redirects" — un-vetted | fast |
| 2 Episodic | `episodes/` | Session digests — what was researched, what was found, which pages touched | medium |
| 3 Semantic | `agencies/` `portals/` `datasets/` `layers/` `concepts/` `comparisons/` `sources/` | Established cross-session facts | slow |
| 4 Procedural | `projects/` | Repeatable atlas-tx patterns (refresh scripts, ingestion shape, scoring formulas) | slow |

**Promotion rules.** Working → episodic at session end. Episodic → semantic when an observation has been seen ≥2 times in different episodes or confirmed against an authoritative source (agency portal, contract, code). Semantic → procedural when the same pattern is referenced by ≥3 semantic pages and describes a repeatable workflow inside this repo.

## Page frontmatter

Every wiki page starts with YAML frontmatter:

```yaml
---
title: Page Title
type: agency | portal | dataset | layer | concept | comparison | project | source | overview | working | episode
tier: working | episodic | semantic | procedural
created: YYYY-MM-DD
updated: YYYY-MM-DD
last_confirmed: YYYY-MM-DD       # when an authoritative source last reinforced this
confidence: 0.0–1.0              # how much we trust this page's core claims
source_count: N                  # number of distinct supporting sources
decay_profile: slow | medium | fast
tags: [water, gis, federal, ...]
sources:                         # paths or URLs — atlas-tx repo files preferred
  - docs/research/texas-gis-inventory.md
  - https://data.texas.gov/...
registry_id: 7fq8-wig2           # OPTIONAL — canonical ID from dataset-registry, when applicable
relationships:
  - {type: published_by, target: agencies/tceq.md}
  - {type: lives_on,     target: portals/data-texas-gov.md}
  - {type: depends_on,   target: concepts/socrata-soql.md}
  - {type: derives_from, target: datasets/epa-sdwis-violations.md}
  - {type: contradicts,  target: datasets/older-id.md}
  - {type: supersedes,   target: datasets/older-id.md}
supersedes: [datasets/older-id.md]
superseded_by: datasets/newer-id.md
stale: false
---
```

### Type field values

- `agency` — a publishing body (TCEQ, EPA, Census Bureau, USGS, ...)
- `portal` — a catalog or hub through which datasets are served (data.texas.gov, StratMap, EJScreen tool)
- `dataset` — a single canonical tabular dataset, ideally with a stable identifier (Socrata 4x4, EPA stable ID, Census product code)
- `layer` — a GIS feature service / geometry layer (NHD flowlines, NFHL flood zones, TWDB aquifer polygons)
- `concept` — a standard, schema, or domain idea (HUC, MCL, EJ index, SoQL, SDWA violation type)
- `comparison` — two or more pages compared head-to-head
- `project` — a repeatable atlas-tx workflow (refresh script pattern, scoring formula composition)
- `source` — a summary of a `docs/research/*.md` file or external research artifact
- `overview` — `overview.md` only
- `working` / `episode` — tier-1 / tier-2 housekeeping types

### Relationship types

Use the minimum set that carries real semantic weight. Don't invent new ones without updating this list.

- `published_by` — dataset/layer/portal is run or published by an agency
- `lives_on` — dataset is served through a portal
- `uses` — A applies B (project uses concept; dataset uses a coding scheme)
- `depends_on` — A cannot work without B (project depends_on dataset)
- `derives_from` — A is computed from B (score derives_from dataset; comparison derives_from two datasets)
- `implements` — A is a concrete instance of B (project implements concept)
- `contradicts` — A and B make incompatible claims (different vintages, conflicting field semantics)
- `supersedes` / `superseded_by` — A replaces B (versioning, e.g. EJScreen 2024 supersedes EJScreen 2023)
- `references` — weak link, A mentions B without structural dependency

### Confidence scoring

Start a new page at 0.5. Adjust on every touch:

- +0.1 per additional independent source (cap at +0.3 per ingest)
- +0.05 per independent reinforcement across episodes
- +0.1 if the claim is mirrored in `docs/contracts/*` (contracts are authoritative — but only for the slice they cover)
- −0.2 on contradiction from a more recent or more authoritative source
- −0.05 per decay step (see below)
- Clamp to `[0.05, 0.95]`. Never 0.0 or 1.0 — the wiki is not omniscient.

Record the reasoning in `log.md` when confidence moves by ≥0.15 in one step.

### Decay

At lint time, every page loses confidence proportional to its decay profile and time since `last_confirmed`:

| Profile | Halving period | Use for |
|---|---|---|
| slow | 365 days | agency identity, portal architecture, mature concepts (HUC / MCL / SoQL), schemas that change on multi-year cycles |
| medium | 90 days | dataset refresh cadence, vintage-specific facts (EJScreen 2024 details), API quirks that may move |
| fast | 14 days | live observations ("today the endpoint timed out"), working-tier hunches |

Most govt-data wiki pages are `slow`. Use `medium` for anything tied to a specific data vintage or current API behavior. Use `fast` only in `working/`.

A reference, ingest, or confirmation resets the decay clock (updates `last_confirmed`). Pages under `confidence < 0.2` get `stale: true` and are surfaced in `lint-report.md` — they are not deleted.

## Cross-linking

Use standard markdown relative links: `[TCEQ](../agencies/tceq.md)`. Link aggressively — every mention of an agency / portal / dataset / concept / layer that has its own page should link on first mention per page. Orphan pages are a wiki smell; flag at lint time.

When a wiki page references a registered atlas-tx dataset, also link the contract: `[`7fq8-wig2`](../contracts/dataset-registry.md) (TCEQ Water Quality Permits)`.

## Naming

Filenames: lowercase, hyphens, no spaces.

- Agencies: short canonical name. `tceq.md`, `twdb.md`, `epa.md`, `txgio.md`, `rrc.md`, `txdot.md`, `census-bureau.md`, `usgs.md`, `noaa.md`, `fema.md`.
- Portals: domain-derived. `data-texas-gov.md`, `tceq-gis-data-hub.md`, `twdb-gis-downloads.md`, `stratmap.md`, `ejscreen-tool.md`, `echo-tool.md`, `sdwis-fed-reports.md`.
- Datasets: prefer the canonical registered ID + a slug. `7fq8-wig2-tceq-water-permits.md`, `hr84-s96f-tx-water-districts.md`, `epa-sdwis-violations.md`, `epa-ejscreen-2024.md`, `census-acs5-2023-county.md`. The `registry_id` frontmatter field carries the bare ID for tooling.
- Layers: `nhd-flowlines.md`, `nfhl-flood-zones.md`, `twdb-major-aquifers.md`, `huc8-watersheds.md`.
- Concepts: `huc.md`, `mcl.md`, `socrata-soql.md`, `sdwa-violation-types.md`, `ej-index.md`.
- Comparisons: short summary. `sdwis-vs-echo.md`, `ejscreen-2023-vs-2024.md`.
- Projects: imperative slug. `register-a-new-dataset.md`, `refresh-cached-snapshot.md`, `compose-a-derived-score.md`.
- Episodes: date-prefixed. `2026-05-08-wiki-init.md`.

## Workflows

### Ingest a research note

A human drops a note in `docs/research/` (or points at one already there) and asks for it to be ingested.

1. **Privacy filter.** Scan for API keys, tokens, internal credentials. Strip before writing. (Atlas TX is mostly public data, but raw source notes occasionally include scraped headers.)
2. Read the note completely.
3. Surface key takeaways before writing pages.
4. Create or update a `sources/<note-slug>.md` page with full frontmatter, `confidence: 0.6`, `tier: semantic`. The page summarizes the note and links the original.
5. Identify agencies / portals / datasets / layers / concepts / comparisons mentioned. For each:
   - If no page exists, create one.
   - If a page exists, update it: bump `source_count`, adjust `confidence`, reset `last_confirmed`, append to `sources`, add new `relationships`.
6. Cross-check against `docs/contracts/dataset-registry.md`. If a dataset page disagrees with the registry, the registry wins — update the wiki to match and note in `log.md`.
7. Check for contradictions between pages. If any, follow **Contradiction resolution** below.
8. Update `index.md` and (if the landscape shifted) `overview.md`.
9. Append an entry to `log.md`.

### Ingest a contract or code change

When `docs/contracts/dataset-registry.md` bumps version, when a new fetcher lands under `src/lib/datasets/`, or when `MVP_DATASETS` gains an entry:

1. Read the diff (or just the new state).
2. For each new / changed registered dataset, ensure a `datasets/<id-slug>.md` exists with the registry ID in `registry_id` frontmatter.
3. For each new fetcher, decide whether the implementation pattern warrants a `projects/` page (only if it generalizes across ≥3 datasets).
4. Update relationships: dataset `published_by` agency, `lives_on` portal, `depends_on` any concept (e.g. `socrata-soql`).
5. Append to `log.md`.

### Answer a query

1. Check `index.md` and `graph.md`.
2. Read relevant pages. Walk `relationships` outward one or two hops if the question is structural ("what breaks if EJScreen vintage changes").
3. Synthesize with inline links to the pages you used.
4. If the synthesis is reusable, offer to crystallize.

### Crystallize a session

At the end of a research session, or on "crystallize this":

1. Write `episodes/YYYY-MM-DD-short-slug.md` with `type: episode`, `tier: episodic`, `decay_profile: medium`.
2. Structure: **Question** — what was researched. **Findings** — what was discovered. **Pages touched** — pages read or written. **Lessons** — standalone facts (each is a candidate for promotion).
3. For each lesson: reinforce existing semantic page (bump confidence) or create a new one if it meets the promotion bar.
4. Append to `log.md`.

### Contradiction resolution

When new information clashes with an existing page:

1. **Do not smooth over.** Both sides belong in the wiki.
2. Pick a winner using: source recency, source authority (a contract or agency portal beats a third-party blog), number of independent supporting observations, strength of the reasoning.
3. If the new claim wins: mark the old page `stale: true` and `superseded_by:` the new one. Create the new page with `supersedes:` pointing back. Do not delete the old page.
4. If ambiguous: create a `comparisons/` page documenting both positions and the evidence. Drop both source pages' confidence by 0.1.
5. Surface the resolution in `log.md`. The human can override; if they do, note it.

### Lint / health check

When asked to lint:

1. Walk every page. Build `graph.md` as a deduped edge list from all `relationships`: `source -> type -> target`, one per line, grouped by type.
2. Apply decay: reduce each page's confidence per `decay_profile` and days since `last_confirmed`. Move pages under 0.2 to `stale: true`.
3. Rebuild `lint-report.md` with sections for:
   - **Orphans** — pages with no inbound relationships (excluding overview/index).
   - **Dangling** — relationships pointing at nonexistent pages.
   - **Stale** — pages moved to `stale: true` this lint.
   - **Contradictions** — unresolved `contradicts` edges.
   - **Registry drift** — `datasets/` pages whose `registry_id` is missing from `docs/contracts/dataset-registry.md`, or vice versa.
   - **Missing concepts** — terms mentioned but no page exists (best-effort scan).
   - **Low-confidence clusters** — pages under 0.4 in the same area.
   - **Promotion candidates** — working pages seen ≥2 times, episodic lessons referenced ≥2 times.
4. Propose fixes. Apply them only on human approval, except for:
   - Auto-rebuilding `graph.md` and `lint-report.md`.
   - Auto-applying decay math.
   - Auto-updating `last_confirmed` on touched pages.
5. Append to `log.md`.

## Domain context

Atlas TX is a Texas water-risk + environmental-justice intelligence platform. The wiki's job is to document the data landscape that platform draws on.

### Core source families

| Family | Why it matters here |
|---|---|
| TCEQ | Water quality permits, surface water impairment, Central Index, environmental compliance |
| TWDB | Hydrology — aquifers, river basins, HUCs, reservoirs, wells, planning regions |
| EPA | SDWIS (drinking water violations), ECHO (compliance), EJScreen (EJ indicators), TRI (toxic releases) |
| Census | ACS demographics for county-level normalization |
| TxGIO / StratMap | Statewide base layers — parcels, address points, hydrography, imagery, lidar |
| RRC | Oil, gas, pipeline overlays |
| TxDOT | Roadway / infrastructure overlays |
| USGS / NOAA / FEMA | Adjacent federal hydrology, weather, flood layers |

### Things that are NOT this wiki's job

- Reproducing the dataset registry contract. The registry is the authoritative spec; the wiki adds context, lineage, gotchas.
- Documenting atlas-tx code internals. That is the codebase's own job (read it).
- Tracking ephemeral plan / milestone state. That is `docs/STATE.md` and `docs/plans/`.
- Storing live snapshot data. That is `public/cache/` and `tests/fixtures/`.

## Principles

- **Density over length.** Say more in fewer words. No filler.
- **Cite sources.** Every claim traces back to a contract, a research note, or an agency portal.
- **Confidence, not certainty.** Flag uncertainty. Nothing is 1.0.
- **Contracts win.** When a wiki page disagrees with `docs/contracts/`, update the wiki.
- **Contradictions are signal.** Document both sides, resolve with evidence, preserve history.
- **Decay is a feature.** A wiki that never forgets becomes noise. Reinforcement resets the clock.
- **Promote on evidence.** Working → episodic → semantic → procedural. Don't skip tiers.
- **Supersede, don't delete.** Old pages become `stale: true` with a pointer to the new truth.
- **The schema is the product.** This file co-evolves with the wiki. Propose edits when you hit a gap.
