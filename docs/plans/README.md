# Atlas TX plan index

Use this file to decide which plan to read first and which ones are historical.

---

## Read in this order for current work

### 1. `2026-05-08-water-risk-refocus.md`
Status: canonical product anchor

Read first when deciding product scope, target user, demo shape, or what Atlas TX is actually for.

Use for:
- product direction
- named-user framing
- journalist/outlier workflow
- milestone priority at the strategic level

### 2. `2026-05-08-water-data-ingest-plan.md`
Status: active implementation plan for the water/hydrology lane

Read second when working on:
- water data ingestion
- source registry expansion
- county water summaries
- hydrology/flood/weather context grounded in official sources

Use for:
- implementation ordering inside the water lane
- source prioritization
- regional authority ingest sequencing

### 3. `2026-05-08-protests-extension.md`
Status: active additive extension

Read when working on protest density, CID, or public-record community-signal workflows.

Use for:
- APD / protest-density planning
- CID parser scope and guardrails
- additive journalist signal design

### 4. `2026-05-09-additive-weather-community-roadmap.md`
Status: sequencing memo for future additive layers

Read when deciding how weather, community sensing, hobbyist weather, Android color-strip observations, and ecology should fit without rescoping the project.

Use for:
- ordering questions
- ownership/sequencing clarity
- deferral decisions
- coordination with research and UI workstreams

### 5. `2026-05-10-county-dataset-roadmap.md`
Status: county-priority execution memo

Read when deciding which county datasets are live, strategic, legacy, or next in line.

Use for:
- county dataset prioritization
- Now / Next / Later execution order
- quickly aligning county work against the water-first thesis

---

## Historical / reference plans

### `2026-05-08-county-explorer-map.md`
Status: historical implementation slice, partly overtaken

Useful for:
- understanding how the county-overview/map pattern evolved
- code-shape history

Do not use as the primary scope document.

### `2026-05-08-initial-plan.md`
Status: fully superseded historical plan

Useful for:
- explaining the original compare-counties concept
- understanding why the project narrowed

Do not use for new implementation decisions.

---

## Quick routing guide

If you are asking...

- "What is Atlas TX actually trying to be?"
  - read `2026-05-08-water-risk-refocus.md`

- "What should the next data slice be in the water lane?"
  - read `2026-05-08-water-data-ingest-plan.md`
  - then `2026-05-09-additive-weather-community-roadmap.md`
  - then `2026-05-10-county-dataset-roadmap.md` if the question is county-specific

- "How should we handle weather vs hobbyist/community sensing?"
  - read `2026-05-09-additive-weather-community-roadmap.md`

- "How do protests fit the product?"
  - read `2026-05-08-protests-extension.md`

- "Can I use the original county explorer plan?"
  - no; read the refocus plan instead

---

## Current planning stance in one sentence

Atlas TX is a water-risk and journalist-first mismatch-detection product first; official weather context comes next, and community sensing/ecology come later as additive secondary layers.
