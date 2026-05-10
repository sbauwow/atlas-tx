# Atlas TX — 3–5 minute judge demo

Primary live destination: https://atlastexas.org

Goal: show Atlas TX as one coherent evidence system across site, agent tooling, and field verification.

Core message:
Atlas TX is not just a static Texas dashboard. It is a county-intelligence product with a live public site, a reusable MCP + skill surface, and an additive Android field-verification lane.

## Recommended runtime
- target: 3–5 minutes
- ideal: 4 minutes

## Demo setup checklist
- atlastexas.org loaded and ready
- one county or permit workflow pre-chosen in case live navigation is slow
- terminal ready for MCP commands
- Atlas TX skill doc or agent environment ready if showing the skill path
- Android capture app ready on device or emulator
- optional: live water strip and cup/sample setup if doing the strip-screening ending

## Suggested flow

### 0:00–0:30 — Open with the live product
Say:
"Atlas TX is a live Texas county-intelligence system for public-interest evidence. The first place to look is atlastexas.org."

Show:
- homepage / entry path
- atlastexas.org URL visibly in the browser

What to emphasize:
- live public destination
- county-map-first framing
- Texas public-data utility

### 0:30–1:45 — Show the site as an investigation workspace
Navigate through one strong path on the live site.

Recommended path:
1. start from a county map or statewide county view
2. click into one county with interesting pressure / water / permit context
3. show that the county surface is not just decorative — it drills into evidence and workflows
4. if useful, jump to permits or water detail for one concrete example

Say:
"The point here is that Atlas starts from statewide county patterns and then lets you drill into the evidence, not just stare at a static score."

What to emphasize:
- county maps first
- concrete evidence path
- not an opaque black box

### 1:45–2:45 — Show the MCP surface
Open a terminal and run one or two MCP commands.

Suggested examples:
```bash
npm run mcp -- discover_datasets
npm run mcp -- summarize_water_risk_for_county '{"county":"Travis County"}'
```

Say:
"The same evidence stack that powers the website is also exposed through a local MCP server, so Atlas TX is usable from agent-native workflows and external tools."

What to emphasize:
- same evidence, different interface
- MCP is not bolted on marketing; it is another surface over the same system
- source-attributed, structured results

### 2:45–3:15 — Show the Atlas TX skill
Point to:
- `skills/atlas-tx/SKILL.md`
- or a prepared agent invocation path

Say:
"We also wrapped the MCP surface in a repo-local Atlas TX skill so an external agent can activate the right guardrails and query flow without needing the whole repo in its head."

What to emphasize:
- MCP + skill together
- safe agent activation
- reproducible workflow

### 3:15–4:30 — Show the app / field-verification lane
Use the Atlas TX Capture Android app as the bridge from desktop evidence to field evidence.

Show:
- app home or capture screen
- the fact that it posts to the Atlas TX observation route
- the evidence-class separation: screening only, not regulatory truth

Say:
"Atlas TX does not stop at desktop analysis. The app is the field-verification extension — an additive lane for capturing structured observations without collapsing them into the authoritative public-record risk layer."

What to emphasize:
- additive field workflow
- clear separation between official records and community/field observations
- app complements the site, it does not replace it

### Optional 4:30–5:00 — Live water strip test ending
If you have the setup ready, end with a live strip-screening moment.

Suggested flow:
1. show the strip and sample
2. capture or submit through the Android flow
3. explain that this is a screening signal / field observation, not a regulatory-grade result
4. tie it back to the main system:
   - public records establish the baseline
   - field observation becomes a follow-up / verification lead

Say:
"This is where Atlas TX becomes more than a website. You can move from county evidence to field observation in one governed workflow."

## If time is short (compressed 3-minute version)
1. atlastexas.org homepage and one county drilldown
2. one MCP command
3. one app/capture screen
4. one closing sentence tying web + MCP + app together

## Best closing line
"Atlas TX is a live Texas evidence system: a public site at atlastexas.org, a reusable MCP + skill surface for agents, and an additive field-verification lane through the app."

## Guardrails to preserve in the demo
- do not imply community strip results are regulatory truth
- do not imply causal or medical claims from water indicators
- do not let the Android lane overshadow the main public-record evidence story
- always keep atlastexas.org visually prominent so judges know where the live product is
