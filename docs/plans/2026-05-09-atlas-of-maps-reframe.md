# Atlas TX — Atlas of Maps reframe

_Date: 2026-05-09_

> Strategic reframe of the homepage and information architecture. Does not supersede the water-risk refocus plan; it changes how Atlas TX presents that work to the user. Anchor user, datasets, scoring, MCP, skill, and contracts are unchanged.

---

## One-line product

> Atlas TX is a bound atlas of Texas — start with the water map, then weather, more to come. Every map stitches the open data behind it onto one surface.

## Why this reframe exists

The current homepage tries to be a portal: 6 hero CTAs, 3 nearly identical full-width "click here" sections (Watchlists, Analytics, Operators), 25+ inline dataset cards, and the actual map (TexasCountyChoropleth) hidden behind several routes.

Two problems:

1. **The map is the product but you cannot see it from the homepage.** Atlas TX is fundamentally cartographic; the journalist persona reads maps before tables. The current homepage hides the map behind multiple clicks.
2. **Information architecture is a flat list of surfaces, not an atlas.** Watchlists, Operators, Analytics, Permits, Counties, Water all sit at the same level even though most are subordinate to a map view.

The reframe collapses Atlas TX into what it already is: a collection of bound maps, each backed by stitched open data. No new datasets. No new scoring. No new MCP tools. Just rearranged surfaces and a real hero.

## Principle (do not violate)

The hero map is the product. Do not call it "the headliner" or "the map" in copy — give it the largest visual weight on the page and let users land on it.

## Anchor (unchanged)

- **Primary user:** Texas county-newsroom journalist.
- **Secondary user:** civic-tech analyst, county budget officer, water-utility planner, lobbyist.
- **Problem:** unchanged from the water-risk refocus plan.
- **Headline output:** unchanged from the water-risk refocus plan.

## Information architecture

### Top nav (new)

```
Overview  ·  Water  ·  Weather (soon)  ·  Permits  ·  Counties  ·  Education  ·  Glossary
```

Removed from top nav:

- **Watchlists** — hidden everywhere; route stays alive for any direct-link users.
- **Operators** — folded into `/permits` as a tab; route redirects.
- **Analytics** — moved to footer.

### Footer (new)

Atlas TX public-interest county intelligence · Analytics · Education · Glossary · API health · GitHub

(Watchlists is not linked in the footer either; only direct URL access works.)

### Map collection (the atlas)

Each map = a bound volume in the atlas. Initial collection:

| Map | Status | Route |
|---|---|---|
| Map I — Water | live | `/water` |
| Map II — Weather | scaffolded | `/weather` (placeholder, "soon") |
| Map III — Permits | live, expanded | `/permits` (Operators is a tab inside) |
| Map IV — Counties | live (workspace) | `/counties` |
| Map V — Energy & Data Centers | scaffolded | `/data-centers` (planned, see DCWP plan) |
| Map VI — Hydrology & Aquifers | scaffolded | `/hydrology` |
| Map VII — Floodplain | scaffolded | `/floodplain` |
| Map VIII — Drought | scaffolded | `/drought` |

Scaffolded maps each get a placeholder route that returns a "coming soon" page with: planned datasets, planned signals, ETA if known, and a link to the relevant plan doc in `docs/plans/`. The atlas roadmap is therefore visible inside the product.

## Homepage shape (new)

Five sections, top to bottom. Replaces the current nine-section homepage.

### 1. Hero — big map, light frame

- Eyebrow chip: "Atlas of Texas · vol. I"
- Headline (single line): "An atlas of Texas, one map at a time."
- Sub (one sentence): "Start with water. Weather is next. Every map binds the open data behind it onto one surface."
- **Big map** below: TexasCountyChoropleth at hero size (16:9 or taller, full content width). Default coloring: Drinking Water Risk Score quartile per county (`src/lib/scoring/dwrs.ts`). If DWRS is not yet computed at the time of execution, fall back to the current choropleth coloring with a documented note in the plan execution.
- Map title overlay: "Map I — Water."
- Subtle pulse on top-3 outlier counties so the eye lands. No autoplay; static otherwise.
- Map area is itself the primary CTA (whole map links to `/water`). No CTA buttons in the hero.

### 2. Map collection grid

- Three-column grid; one card per atlas map.
- Card states: `live` (full link, color), `coming-soon` (ghosted, no link), `scaffolded` (ghosted, links to placeholder route).
- Each card: small static map thumbnail or hatched placeholder, 1-line subtitle naming what the map binds.
- Cards visually communicate the atlas concept by simply existing in a grid.

### 3. What this atlas binds — collection + stitching overview

- Replaces the verbose dataset registry section.
- Frames data as *what gets bound into the maps*, not as a flat list.
- Source counts grouped by stitch class:
  - **State (TX)** — TCEQ, TWDB, Texas Water Districts, ERCOT (planned), Texas Stream sites
  - **Federal** — SDWIS, EJScreen, ACS, NWS, USGS, FEMA, EPA ECHO
  - **City open data** — Austin, Dallas, Houston, San Antonio (curated from existing `city-open-data-ranked-tx.json` snapshot)
  - **Regional authorities** — LCRA, GBRA, EAA
- "See all N sources →" link to a new dedicated `/sources` route that holds the full dataset registry currently inlined in the homepage.

### 4. Education primer (kept, trimmed)

- Keep the `waterPrimerCards` row + the 5-step `texasWaterDiagram`.
- Cut the surface-vs-groundwater dual cards (content already covered by the primer cards).
- Section becomes ~one screen instead of three.

### 5. Footer (existing, lightly trimmed)

Drop Watchlists from footer link list. Keep Analytics, Operators-replaced-by-Permits, Glossary, Education.

## Subtle polish layer (civic-trust scope)

Apply only after the cuts and structural reshape land. All polish must respect `prefers-reduced-motion`.

| Touch | Where | Rationale |
|---|---|---|
| Pulse on hero live-dot | hero eyebrow chip | signals "live data" without ad feel |
| Top-3 outlier county pulse on hero map | hero map | draws the eye to the journalist-relevant counties |
| Soft fill-bar under entry-path metrics | map collection cards | reads as "water level"; on-brand without saying so |
| One-shot count-up on metrics | map collection cards | one paint, ~600ms, then static |
| Card hover ripple | map collection cards | pure CSS radial gradient on hover, no JS |
| Hero gradient drift | hero backdrop | very low amplitude, paused under reduced-motion |
| Smooth glossary tooltip fade | existing component | audit only |

Out of scope: water-drop cursor on homepage. Cursor is reserved for `/water` and water-context routes only (homepage stays standard cursor for civic-trust restraint).

## Operators → Permits fold

- `/operators` route is preserved as a redirect to `/permits?tab=operators` so existing links and bookmarks keep working.
- Inside `/permits`, add a tab/panel "Operators" backed by the same data the current `/operators` page renders.
- Remove "Operators" from top nav and from the homepage entry-path cards.
- Remove the standalone "Operator directory" section from the homepage.

This is a route-level redirect plus a tab inside `/permits` plus a nav diff. No data work required; the operator data layer is unchanged.

## Watchlists kill

- Remove "Watchlists" from top nav.
- Remove "Watchlists" from footer.
- Remove the standalone "Watchlists" section from the homepage.
- Keep `/watchlists` route alive so direct links continue to work.
- Optionally add a small "Saved screen → Watchlists" pill inside the user-relevant surfaces later if usage justifies; not part of this reframe.

## Future-map scaffold pattern

Every scaffolded map needs the same shape so the atlas grows uniformly:

- A card on the homepage map collection grid (greyed; status `scaffolded` or `coming-soon`).
- A placeholder route that returns a "Map N — <name>, coming soon" page containing:
  - planned datasets (citing dataset-registry entries where they exist)
  - planned signals
  - ETA if known
  - a link to the relevant plan doc in `docs/plans/`
- Once the real map ships, the scaffold page is replaced by the live map. The card status flips from `scaffolded` → `live`.

This pattern means the public roadmap is built into the product surface itself, which is a feature for journalists and civic-tech users who want to see what is coming.

## Milestones

### REFRAME.M1 — IA + nav + scaffolds (web workstream)

| workstream | task | notes |
|---|---|---|
| web | Restructure `src/app/components/top-nav.tsx` | drop Watchlists, drop Operators link; add Weather (soon); keep Permits, Counties, Education, Glossary |
| web | Trim `src/app/layout.tsx` footer link list | drop Watchlists; add Operators-replaced-by-Permits if not already present |
| web | Add `/weather` placeholder route | "Map II — Weather, coming soon"; cite planned NWS / USGS / drought / precipitation / temperature sources from `dataset-registry.md` 0.6.0 |
| web | Add scaffold routes for `/data-centers`, `/hydrology`, `/floodplain`, `/drought` | each cites its plan doc; greyed UI |
| web | `/operators` redirect to `/permits?tab=operators` | preserve direct links |
| web | Add Operators tab/panel to `/permits` | reuse existing operators data layer |

### REFRAME.M2 — homepage rewrite (web workstream)

| workstream | task | notes |
|---|---|---|
| web | Rewrite `src/app/page.tsx` per the new five-section shape | hero map + map collection grid + collection overview + trimmed primer + footer |
| web | Hero map: render TexasCountyChoropleth at hero size | DWRS quartile coloring if available; document fallback if DWRS not yet computed |
| web | Map collection grid component | one card per atlas map; statuses live/coming-soon/scaffolded |
| web | Move full dataset registry off the homepage to a new `/sources` route | include the existing per-dataset card layout there |
| web | Cut redundant homepage sections | Watchlists, Analytics terminal, Operator directory, StatTile trio, surface-vs-groundwater dual cards, Common-terms inline list |

### REFRAME.M3 — subtle polish (web workstream)

| workstream | task | notes |
|---|---|---|
| web | Hero live-dot pulse | custom 2.5s opacity ease, respect reduced-motion |
| web | Top-3 outlier pulse on hero map | static when reduced-motion |
| web | Card metric count-up | one-shot on first paint |
| web | Card hover ripple | pure CSS, no JS |
| web | Soft fill-bar under metrics | scaled to value/max |
| web | Hero gradient drift | low amplitude, paused under reduced-motion |

### REFRAME.M4 — water-context cursor (web workstream, deferred)

| workstream | task | notes |
|---|---|---|
| web | Water-drop cursor on `/water` and `/counties/[slug]/water` only | SVG cursor 16x16 via CSS; not on homepage; respect accessibility (must remain functional with default cursor) |

## Risks

- **DWRS not yet computed when this lands.** Fallback to the current choropleth coloring with a visible label so the hero map still works. Re-bind to DWRS once `src/lib/scoring/dwrs.ts` ships.
- **Operators tab data shape inside `/permits`.** Existing operators page may make assumptions that do not survive a tab embedding. Inspect during execution; degrade gracefully if so.
- **Scaffold route proliferation.** Eight placeholder routes is a lot of empty surface. Mitigate by building one shared `<MapScaffoldPage />` component that all scaffolds use; differences are content props only.
- **Hermes is on `web/color-tokens`.** Coordinate via STATE.md; my reframe touches CSS surfaces too. Branch off main and rebase if their PR lands first; minimize CSS changes that overlap with their token work.
- **Atlas concept could read as gimmicky.** Hold the line: the word "atlas" is already in the product name; framing maps as bound volumes is restrained, not cute. No skeuomorphic book or page-turn animations.

## Open questions

- Where does Analytics live long-term? Footer is the immediate move; if usage is high it may warrant returning as a top-level surface.
- Should scaffolded routes have any interactivity (e.g. an email-signup for "notify me when Map II ships"), or is "see the plan doc" enough?
- Does the hero map need a legend at hero scale, or only on `/water`? Default plan: minimal legend at hero scale, full legend on `/water`.
- Once the hero map is the product, do we still need the existing "ranked counties" entry-path cards at all? They may be redundant with the map and could fold into the map collection grid as one of the cards.
