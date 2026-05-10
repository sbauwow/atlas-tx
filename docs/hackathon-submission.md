# AITX Community x Codex Hackathon — Atlas TX Submission

Drafts for https://airtable.com/appWQWPtBqDUhCPPj/shr4HejRwpdTvxPxu

Anything in `[brackets]` is a fill-in.

---

## Team Name & Project Title

```
Atlas TX
```

(or `STATHIS — Atlas TX` if a separate team name is preferred)

---

## Submission Description

Atlas TX is a county-first OSINT workspace for Texas public-interest evidence. It joins TCEQ permits + Texas Water Districts with EPA SDWIS, EPA EJScreen, USGS hydrology, and Census ACS into one map-first investigation surface — and exposes the same evidence stack three ways: a public site at atlastexas.org, a local MCP server, and a packaged agent skill with safety guardrails.

Most public-data products stop at display. Atlas TX is built to investigate. You start on a county map, spot mismatch between regulatory signal and environmental-justice burden, drill into permits / violations / hydrology / operators, and — when the desk evidence is ambiguous — launch an Android field mission to capture a colorimetric water-strip observation that's stored as a banded community submission, never collapsed into the authoritative score.

What we shipped this hackathon:

- Interactive county choropleth (`/maps`) with view modes for EJ burden, operator concentration, surface-water quality, and citizen submissions
- Six Tufte-style SVG viz primitives (sparkline, micro-bar, mismatch strip, tile cartogram, Sankey, Marey) used across `/counties`, `/permits`, `/water/network`
- `/permits` Marey chart of TCEQ active-permit coverage tenure by county
- Citizen water-observation lane (`/citizen`) with strict non-regulatory framing — banded readings only, separate from SDWIS/TCEQ
- `@atlas-tx/mcp-server` exposing 10+ read-only tools (`score_pws_drinking_water_risk`, `overlay_ej_burden`, `summarize_water_risk_for_county`, `list_permit_filing_red_flags`, `build_permit_protest_prep`, analytics-spine tools, …) — every response carries `data + sources + caveats + generated_at + cache_state`
- Atlas TX agent skill (`skills/atlas-tx/SKILL.md`) with explicit guardrails: indicator-not-outcome framing, source attribution, verbatim caveats, no health-causation / individual-PII / muni-debt claims
- LLM-maintained Karpathy-style wiki (`docs/wiki/`) with confidence/decay/typed-relationships and an idempotent linter

The thesis: Texas has too much fragmented public data and too much county-by-county process hidden from view. Atlas turns that fragmentation into a usable, governed evidence layer that works for humans, journalists, and AI-native workflows on the same evidence.

---

## Demo Video Link

`[Loom URL]`

### Suggested 4-minute script

1. **0:00–0:30** — atlastexas.org. County map. Switch view modes (EJ → Operators → SWQ → Citizen).
2. **0:30–1:15** — Drill: pick a high-mismatch county → `/counties/[slug]` → micro-bars → `/permits` Marey + filing red flags.
3. **1:15–2:00** — `/water/network` Sankey + `/water/mechanism` evidence chain. Show that signal lives in multiple registers.
4. **2:00–2:45** — `/citizen` strip capture flow, strict non-regulatory framing, link to Android app.
5. **2:45–3:45** — Agent surface: `npm run mcp -- summarize_water_risk_for_county '{"county":"Comal County"}'` → show envelope (data + sources + caveats). Then run Claude/Codex against the skill, demonstrate guardrails (indicator-not-outcome, sources cited).
6. **3:45–4:00** — Repo, wiki, MCP. Three entry points to the same evidence.

---

## Tracks

Submit for both:

- **Agents Track** — MCP server + packaged skill with guardrails; every tool returns sourced+caveated envelope; agents can investigate Texas water/permit risk through the same evidence the website uses.
- **Brainforge / Vicinity Texas Open Data Track** — entire system is built on Texas + federal open data (TCEQ, SDWIS, EJScreen, ACS, USGS); county-first; public-record only; designed to make fragmented Texas data usable.

---

## Bounties

Apply for both **DeepInvent Top Science Hack** and **DeepInvent Best Patentable Hack**.

Atlas TX is a patent-pending system that links three layers most products keep apart: (1) authoritative public-record intelligence (TCEQ permits, SDWIS violations, EJScreen burden, ACS demographics, USGS hydrology), (2) modeled risk indicators (Drinking Water Risk Score, EJ Burden Overlap, mismatch strip), and (3) structured field verification via an Android workflow that captures colorimetric water-strip observations as banded, non-regulatory community submissions. The novelty is the integrated workflow — county-map entry → mismatch detection → field mission → governed evidence review — combined with strict separation between record / model / submission tiers so signals are never silently collapsed.

Science contributions:

- A reusable epidemiologic evidence-chain visualization (Geography → Conditions → Operational → Notice → People) implemented as a pure-SVG primitive.
- A freshness-aware choropleth that renders stale county data as dimmed + dashed rather than hiding it.
- A per-tool sources/caveats envelope that lets downstream agents satisfy attribution and safety constraints without rewriting prompts.

---

## Team Members

```
[Your Name] - [LinkedIn URL] - sdavidbauer@gmail.com
[Teammate] - [LinkedIn URL] - [email]
```

---

## GitHub Repo

```
https://github.com/sbauwow/atlas-tx
```

---

## X / Twitter Post

Optional — if posted, tag `@AITXCommunity` and `@OpenAI` for the two community-choice votes.

> Built Atlas TX for the @AITXCommunity x @OpenAI Codex hackathon — county-first Texas OSINT atlas. TCEQ + SDWIS + EJScreen + ACS + USGS in one map-first workspace, with an MCP server + agent skill so Codex can investigate Texas water risk on the same evidence.
>
> atlastexas.org

---

## Final Thoughts

Codex was load-bearing for this build — the agent loop wrote the SVG viz primitives, the MCP tool surface, and the wiki linter while we kept human attention on data semantics, safety framing, and the non-regulatory citizen lane. Would love a track next year for "evidence-grade" agent products specifically — where source attribution, caveat preservation, and tier separation are graded alongside capability. Thanks for running this.
