# Atlas TX — one-page speaker card

Goal
- Show Atlas TX as a real public product first
- Then prove it is an agent-usable evidence system through MCP + skill
- End with the app/field lane as an additive extension

North star line
- “Atlas TX is a live Texas county-intelligence system: public site, MCP surface, agent skill, and field-verification lane.”

Opening
- “This is Atlas TX, live at atlastexas.org.”
- “It’s a county-intelligence system for Texas public-interest evidence.”
- “The point is not just to display records — it’s to help people investigate them.”

## Part 1: web demo

What to show
- atlastexas.org homepage
- county map / statewide view
- one county drilldown
- one water or permit evidence path

What to say
- “Atlas TX is map-first, not dashboard-first.”
- “Texas public data is fragmented across agencies and counties.”
- “Atlas TX turns that fragmented surface into a usable evidence workflow.”
- “You can move from a statewide county pattern into concrete supporting evidence.”
- “This is built for investigation, not passive browsing.”

Key bullets to hit
- live public product
- county-map-first workflow
- evidence drilldown
- public-record intelligence
- not a black-box scorecard

Transition to MCP
- “What you just saw in the browser is also available as a structured agent interface.”

## Part 2: MCP demo

Suggested commands
```bash
npm run mcp -- discover_datasets
npm run mcp -- summarize_water_risk_for_county '{"county":"Travis County"}'
```

What to say
- “Atlas TX is not only a website.”
- “The same evidence stack is exposed through a local MCP server.”
- “That means agents and tools can query the same governed system the site uses.”
- “The outputs are structured, source-attributed, and caveated.”

Key bullets to hit
- same evidence stack as the site
- structured outputs
- source attribution
- caveats/guardrails
- reusable in AI-native workflows

Transition to repo
- “And this is documented directly in the public repo, so it’s reproducible and real.”

## Part 3: repo walkthrough

What to show
- README
- packages/mcp-server/
- packages/mcp-server/README.md
- skills/atlas-tx/SKILL.md
- docs/contracts/mcp-tools.md

What to say
- “This is the MCP server package.”
- “This is the tool contract.”
- “This is the Atlas TX skill that wraps the MCP surface for external agents.”
- “So the project is public, documented, and reusable — not demo-only glue.”

Key bullets to hit
- public repo
- live site linked in repo
- MCP package is visible
- skill is visible
- contract is visible
- release is public

## Optional Part 4: app / strip ending

What to show
- Android capture app screen
- capture flow
- optional live strip test

What to say
- “The app is the field-verification extension.”
- “This is additive evidence, not regulatory truth.”
- “The main evidence system stays grounded in public records.”
- “The field lane lets Atlas TX bridge desktop evidence and real-world verification.”

Key guardrail lines
- “This is screening, not a lab-grade compliance result.”
- “Community observations are additive, not replacements for the core evidence stack.”

## Closing
- “Atlas TX is a live Texas evidence system.”
- “Start at atlastexas.org.”
- “Use the county-map workflow as the public entry point.”
- “Use MCP + skill for agent-native access.”
- “Use the app as the field-verification extension.”

Best final line
- “Atlas TX is not just a map demo — it is one governed evidence stack across web, MCP, skill, and field workflows.”

## If time gets tight
1. atlastexas.org
2. one county workflow
3. one MCP command
4. quick repo path: MCP + skill
5. mention app, skip live strip

## If live strip fails
- “The live sample is optional — the core product is already the site plus the MCP/skill evidence system.”

## Do not forget
- keep atlastexas.org visible early
- keep the story on county evidence first
- don’t let the strip demo become the main thing
- frame MCP as a first-class product surface, not a side feature
