<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — Atlas TX collaboration spine

This file is read by every agent before it touches the repo. Keep it short and current. The block above is auto-managed — do not hand-edit between the BEGIN/END markers.

## 1. Ground state — read these before doing anything

| File | What it tells you |
|---|---|
| [`docs/plans/2026-05-08-water-risk-refocus.md`](docs/plans/2026-05-08-water-risk-refocus.md) | Current direction. The earlier plan in the same folder is **superseded** — do not work from it. |
| [`docs/STATE.md`](docs/STATE.md) | What is in-progress, what is blocked, what just shipped, what is up next. Live. |
| [`docs/OWNERSHIP.md`](docs/OWNERSHIP.md) | Which paths belong to which workstream. Cross-boundary changes need a contract update. |
| [`docs/contracts/`](docs/contracts/) | Cross-workstream APIs (dataset registry, MCP tools, skill protocol). Change a contract → notify the workstream that depends on it. |
| [`README.md`](README.md) | Outward-facing positioning. |

If you skip these you will rebuild work someone else just shipped, or step on a contract.

## 2. Workstreams

Five workstreams. Each owns a path. Each has one assigned agent at a time.

| Workstream | Owns | Reads contracts |
|---|---|---|
| **data** | `src/lib/`, `tests/` | `dataset-registry.md` |
| **web** | `src/app/`, `public/` | `dataset-registry.md` |
| **mcp** | `packages/mcp-server/` | `dataset-registry.md`, `mcp-tools.md` |
| **skill** | `skills/atlas-tx/` | `mcp-tools.md`, `skill-protocol.md` |
| **docs** | `docs/`, `README.md`, `AGENTS.md` | all |

Full path map: [`docs/OWNERSHIP.md`](docs/OWNERSHIP.md).

## 3. No-stomp protocol

Before you start work:
1. Read `docs/STATE.md`. If your intended task is already claimed (in-progress), do something else or coordinate.
2. Add a row to the **In-progress** section of `STATE.md` with: workstream, your agent name, branch, intent, started timestamp.
3. Branch from `main` as `<workstream>/<short-slug>` (e.g. `data/sdwis-fetcher`, `mcp/score-tool`).

While you work:
- Stay inside your workstream's owned paths. If you must change another workstream's file, leave a `// NOTE for <workstream>:` comment and a line in their next-up queue in STATE.md instead of editing in place. If you must edit, open a PR titled `cross-workstream:` and tag the owning workstream.
- If you change a file under `docs/contracts/`, you are changing a public API. Bump the contract version line at the top of the file and call it out in your STATE.md update.
- Pre-cache external API responses to `data/` (gitignored) or `public/cache/` (committed snapshots only). Don't ship demo paths that depend on live federal APIs.

When you finish:
1. Move your STATE.md row from In-progress to Recently-done with the commit/PR ref.
2. If you discovered follow-on work, add it to Next-up.
3. Update `docs/contracts/*` if you changed an API surface.

## 4. Branch + commit conventions

- Branches: `<workstream>/<slug>`. Examples: `data/sdwis-fetcher`, `mcp/dwrs-tool`, `web/county-map`, `skill/ej-guardrails`, `docs/m1-plan`.
- Commit prefix matches workstream: `data:`, `web:`, `mcp:`, `skill:`, `docs:`. Cross-cutting: `cross:`.
- One concept per commit. PR description should reference the milestone in `docs/plans/2026-05-08-water-risk-refocus.md`.

## 5. Things that fail demo (don't do)

- Live external API calls during the demo path. Always fall back to cached snapshot.
- Compare-N-counties UI shells with no scoring underneath. The point is the derived signal, not the chrome.
- Re-introducing the fiscal/debt datasets into the v1 scope. Those live behind a future plan.
- Adding dependencies without checking they support Next.js 16.
- Claims of harm, diagnosis, or financial advice. EJ outputs are *burden / exposure indicators*, not harm.

## 6. Definition of done (per workstream)

- **data**: fetcher + normalizer + test + cached fixture under `tests/fixtures/` or `public/cache/`. Documented in `docs/contracts/dataset-registry.md`.
- **mcp**: tool registered, returns `{ data, sources, caveats }` envelope per `docs/contracts/mcp-tools.md`, exercised by a smoke test.
- **web**: route renders against cached fixture without network; visible attribution footer.
- **skill**: `SKILL.md` example invocation runs against the MCP server end-to-end and returns a sourced answer.
- **docs**: contract or plan updated, STATE.md updated, no dangling references.
