# Contract — Skill Protocol

> Contract version: **0.1.0** — bump on any breaking change to skill activation, guardrails, or expected MCP surface. Notify `mcp` workstream in `STATE.md` when bumping.

How an external agent (Claude in a conversation) should invoke and use the Atlas TX skill. The **skill** workstream owns `skills/atlas-tx/SKILL.md`; this contract describes what the skill is contractually required to do and what it is contractually forbidden from doing.

---

## Activation

An agent should activate the Atlas TX skill when the user asks for:
- Texas drinking-water risk, violations, or PWS-level water quality context
- environmental-justice burden / exposure indicators in Texas (county or block-group)
- Texas county-level environmental, infrastructure, or permit context

It should **not** activate for:
- Non-Texas geographies
- Health-outcome causation claims
- Investment / municipal-debt advice
- Personally identifying information about individuals

## Required behaviors

Every agent response that uses the skill must:

1. **Cite source datasets.** Surface every `Source.dataset_id` + publisher + URL from the MCP tool envelope.
2. **Surface caveats verbatim.** Pass through every entry in `caveats` without paraphrasing away the qualifier.
3. **Distinguish indicator from outcome.** Present DWRS as a *risk indicator* derived from violation history, not a measurement of present harm. Present EJ Burden Overlap as *burden / exposure*, not as proof of harm. Treat environmental burden as an inference assembled from indicator layers (for example impaired surface-water segments, permit density, and EJScreen), not a directly observed outcome.
4. **Stamp the snapshot date.** When `cache_state: "snapshot"` the response must say which snapshot date the data is from.
5. **Bound numeric claims.** Never extrapolate beyond the rows returned. If asked for a comparison the data does not support, say so.

## Forbidden behaviors

- No medical, diagnostic, or causal claims linking a water system or facility to specific health outcomes.
- No investor-grade or rating-agency claims about municipal entities (this skill is currently scoped to environment; fiscal/debt is out of scope per the v1 plan).
- No naming of individuals from any dataset (none of the registered v1 datasets contain individual names; if a future dataset does, gate on a separate guardrail).
- No invocation of unlisted MCP tools. The skill is bounded to the catalog in `mcp-tools.md`.
- No live-API calls outside the MCP server. The skill does not fetch data directly.

## Expected MCP surface

Skill assumes the tools listed in `mcp-tools.md` v0.1.0 are available. If a required tool is missing the skill must:
- Fall back to `discover_datasets` + `get_dataset_schema` to explain what *would* be answerable, and
- Decline the user's request with a clear explanation of which capability is missing.

## Reproducibility

The skill doc must include at least one fully worked example invocation that:
- Runs against a local MCP server with the cached snapshot.
- Returns a sourced answer.
- Is reproducible from a clean clone (`npm install` → start MCP → run the example).

This is the smoke test for the skill. If it doesn't reproduce, the skill is not done.

## Versioning

Skill version is tracked in the SKILL.md frontmatter `version` field (added when v0.2 lands). Skill consumers should pin a major version.
