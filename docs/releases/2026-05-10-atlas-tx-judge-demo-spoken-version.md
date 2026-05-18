# Atlas TX — spoken presenter demo (3–5 minutes)

Primary live destination: https://atlastexas.org

Use this as the spoken version of the judge demo. It is written so you can read it almost verbatim while driving the product.

## Opening (0:00–0:20)

"This is Atlas TX. The main thing to know is that it is live at atlastexas.org. Atlas TX is a county-intelligence system for Texas public-interest evidence — water, permits, environmental burden, and field verification — all tied together in one workflow."

## Part 1 — start on the live site (0:20–1:20)

"I want to start where a judge or public user would start: the live site. Atlas TX is map-first, not dashboard-first. The point is to let someone see statewide county patterns first, then drill into real evidence instead of getting trapped in static filters or generic scorecards."

"Here I can move from the statewide view into a county, then into the supporting evidence around water, permits, hydrology, and related pressure signals. So the product is not just showing records — it is helping a user investigate them."

## Part 2 — show one concrete workflow (1:20–2:10)

"Let me take one concrete path. I can open a county or permit workflow, and from there I can inspect the evidence trail instead of just a black-box score. That is important because Atlas TX is designed for people who need to verify what they are seeing: journalists, civic-tech analysts, local operators, and eventually field teams."

"The product thesis is that Texas has a huge amount of fragmented public data, and Atlas TX turns that fragmentation into a usable county evidence layer."

## Part 3 — show the MCP surface (2:10–3:00)

"Now I want to show that Atlas TX is not only a website. The same evidence stack is available through a local MCP server."

Run one or two commands.

Suggested commands:
```bash
npm run mcp -- discover_datasets
npm run mcp -- summarize_water_risk_for_county '{"county":"Travis County"}'
```

Continue speaking:

"This matters because it means the system is agent-native. The website, the API, and the MCP surface are all looking at the same underlying evidence model. So if a user wants the human-facing map experience, they can use the site. If they want the agent/tool path, they can use the MCP layer."

## Part 4 — show the Atlas TX skill (3:00–3:30)

"On top of the MCP server, Atlas TX also ships with a repo-local skill. The skill is the guardrailed wrapper that tells an external agent how to activate the right workflow, what questions Atlas TX is for, and what claims it should not make."

"So the system is reusable both for humans and for AI-native workflows."

## Part 5 — show the app / field lane (3:30–4:20)

"The last part is the field-verification lane. Atlas TX Capture is the Android companion app for the citizen observation workflow. This is important because Atlas TX is not meant to stop at desktop research. It should be able to move from county evidence into a structured field observation flow."

"The guardrail here is explicit: app-based strip submissions are screening signals, not regulatory truth. They are additive evidence, not a replacement for the public-record backbone."

## Optional live strip ending (4:20–5:00)

"If I want to end with something concrete, I can do a live strip screening demo. I can capture the strip through the app flow and show how that becomes a structured observation. The key point is not that this is a lab-grade result. The key point is that Atlas TX can connect desktop evidence and field verification in one governed workflow."

## Closing line

"So Atlas TX is not just a Texas map demo. It is a live public site at atlastexas.org, an MCP-enabled evidence system for agents, a repo-local skill for safe activation, and an additive Android field-verification lane."

## Presenter reminders
- keep atlastexas.org visible early
- do not oversell strip readings as authoritative
- keep MCP and skill framed as first-class release surfaces, not side projects
- if time gets tight, compress to: site -> one workflow -> MCP -> app -> close
