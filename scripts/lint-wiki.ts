/**
 * Wiki linter — walks docs/wiki/, builds graph.md + lint-report.md,
 * applies decay math to confidence scores, surfaces orphans, dangling
 * relationships, registry drift, and promotion candidates.
 *
 * Run: `npx tsx scripts/lint-wiki.ts`
 *
 * Honors the schema in docs/wiki/CLAUDE.md. The script is
 * deterministic — re-running on an unchanged tree should produce no diff.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, posix, relative, resolve } from "node:path";

type Tier = 1 | 2 | 3 | 4;
type Relationship = { type: string; target: string };

type Frontmatter = {
  title?: string;
  type?: string;
  tier?: Tier;
  created?: string;
  updated?: string;
  last_confirmed?: string;
  confidence?: number;
  source_count?: number;
  decay_profile?: "fast" | "medium" | "slow";
  tags?: string[];
  sources?: string[];
  registry_id?: string | null;
  relationships?: Relationship[];
  stale?: boolean;
  superseded_by?: string;
  supersedes?: string[];
};

type Page = {
  relPath: string; // e.g. "agencies/tceq.md"
  category: string;
  frontmatter: Frontmatter;
  body: string;
  raw: string;
};

const REPO_ROOT = resolve(__dirname, "..");
const WIKI_DIR = join(REPO_ROOT, "docs", "wiki");
const REGISTRY_PATH = join(REPO_ROOT, "docs", "contracts", "dataset-registry.md");
const TODAY = new Date().toISOString().slice(0, 10);

const SKIP_FILENAMES = new Set([
  "CLAUDE.md",
  "index.md",
  "log.md",
  "graph.md",
  "lint-report.md",
  "overview.md",
]);

const HALVING_DAYS: Record<NonNullable<Frontmatter["decay_profile"]>, number> = {
  fast: 14,
  medium: 90,
  slow: 365,
};

function listMarkdown(dir: string, base = ""): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir).sort()) {
    if (entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    if (statSync(full).isDirectory()) {
      out.push(...listMarkdown(full, rel));
    } else if (entry.toLowerCase().endsWith(".md")) {
      out.push(rel);
    }
  }
  return out;
}

function parseFrontmatter(raw: string): { meta: Frontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const head = match[1];
  const body = match[2];
  const meta: Frontmatter = {};
  const lines = head.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) {
      i += 1;
      continue;
    }
    const key = kv[1];
    const valueRaw = kv[2];
    if (valueRaw === "" || valueRaw === undefined) {
      const items: string[] = [];
      let j = i + 1;
      while (j < lines.length && /^\s+-\s/.test(lines[j])) {
        items.push(lines[j].replace(/^\s+-\s+/, "").trim());
        j += 1;
      }
      if (items.length) {
        if (key === "sources" || key === "tags" || key === "supersedes") {
          (meta as Record<string, unknown>)[key] = items.map((entry) => entry.replace(/^['"]|['"]$/g, ""));
        } else if (key === "relationships") {
          meta.relationships = items
            .map((entry) => {
              const inline = entry.match(/^\{(.+)\}$/);
              if (!inline) return null;
              const fields: Record<string, string> = {};
              for (const part of inline[1].split(",")) {
                const idx = part.indexOf(":");
                if (idx === -1) continue;
                const fk = part.slice(0, idx).trim();
                const fv = part.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
                fields[fk] = fv;
              }
              if (!fields.type || !fields.target) return null;
              return { type: fields.type, target: fields.target };
            })
            .filter((entry): entry is Relationship => entry !== null);
        }
        i = j;
        continue;
      }
      i += 1;
      continue;
    }
    const value = valueRaw.trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1).trim();
      const items = inner ? inner.split(",").map((item) => item.trim().replace(/^['"]|['"]$/g, "")) : [];
      if (key === "tags") meta.tags = items;
      else if (key === "sources") meta.sources = items;
      else if (key === "supersedes") meta.supersedes = items;
      i += 1;
      continue;
    }
    const cleaned = value.replace(/^['"]|['"]$/g, "");
    switch (key) {
      case "tier":
        meta.tier = Number(cleaned) as Tier;
        break;
      case "confidence":
        meta.confidence = Number(cleaned);
        break;
      case "source_count":
        meta.source_count = Number(cleaned);
        break;
      case "stale":
        meta.stale = cleaned === "true";
        break;
      case "registry_id":
        meta.registry_id = cleaned === "null" || cleaned === "" ? null : cleaned;
        break;
      case "decay_profile":
        if (cleaned === "fast" || cleaned === "medium" || cleaned === "slow") meta.decay_profile = cleaned;
        break;
      default:
        (meta as Record<string, unknown>)[key] = cleaned;
    }
    i += 1;
  }
  return { meta, body };
}

function categoryOf(relPath: string): string {
  const top = relPath.split(posix.sep)[0];
  if (relPath.includes("/")) return top;
  return "root";
}

function loadPages(): Page[] {
  const files = listMarkdown(WIKI_DIR);
  const pages: Page[] = [];
  for (const rel of files) {
    if (SKIP_FILENAMES.has(rel)) continue; // root meta files
    const full = join(WIKI_DIR, rel);
    const raw = readFileSync(full, "utf8");
    const { meta, body } = parseFrontmatter(raw);
    pages.push({ relPath: rel, category: categoryOf(rel), frontmatter: meta, body, raw });
  }
  return pages;
}

type DecayInfo = { page: Page; nominal: number; decayed: number; days: number };

/**
 * Compute decayed confidence ANALYTICALLY only.
 *
 * Frontmatter `confidence` is the value at `last_confirmed`. Decay is computed
 * lazily for the lint report and to detect newly-stale pages. We do NOT write
 * the decayed value back to the file — doing so would compound on every lint
 * run because it's iterative against an already-decayed source.
 *
 * If a page genuinely should sit at a lower nominal confidence, the human
 * curates by editing the page (which they then reflect by updating
 * `last_confirmed`).
 */
function computeDecay(pages: Page[]): { decayInfos: DecayInfo[]; staleAdded: string[] } {
  const today = Date.parse(TODAY);
  const decayInfos: DecayInfo[] = [];
  const staleAdded: string[] = [];
  for (const page of pages) {
    const { decay_profile, last_confirmed, confidence, stale } = page.frontmatter;
    if (!decay_profile || !last_confirmed || typeof confidence !== "number") continue;
    const lastTs = Date.parse(last_confirmed);
    if (Number.isNaN(lastTs)) continue;
    const days = Math.max(0, (today - lastTs) / 86400000);
    const halving = HALVING_DAYS[decay_profile];
    const decayed = confidence * Math.pow(0.5, days / halving);
    const clamped = Math.max(0.05, Math.min(0.95, decayed));
    decayInfos.push({ page, nominal: confidence, decayed: clamped, days });
    if (clamped < 0.2 && !stale) {
      page.frontmatter.stale = true;
      staleAdded.push(page.relPath);
    }
  }
  return { decayInfos, staleAdded };
}

function buildInboundIndex(pages: Page[]): Map<string, Relationship[]> {
  const inbound = new Map<string, Relationship[]>();
  for (const page of pages) {
    for (const rel of page.frontmatter.relationships ?? []) {
      const key = rel.target;
      const list = inbound.get(key) ?? [];
      list.push({ type: rel.type, target: page.relPath });
      inbound.set(key, list);
    }
  }
  return inbound;
}

type EdgeGroup = { type: string; edges: Array<{ from: string; to: string }> };

function buildGraph(pages: Page[]): EdgeGroup[] {
  const groups = new Map<string, Set<string>>();
  for (const page of pages) {
    for (const rel of page.frontmatter.relationships ?? []) {
      const set = groups.get(rel.type) ?? new Set();
      set.add(`${page.relPath}|${rel.target}`);
      groups.set(rel.type, set);
    }
  }
  const out: EdgeGroup[] = [];
  for (const [type, set] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const edges = [...set]
      .map((entry) => {
        const [from, to] = entry.split("|");
        return { from, to };
      })
      .sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
    out.push({ type, edges });
  }
  return out;
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + " ".repeat(width - value.length);
}

function renderGraphMd(groups: EdgeGroup[], pageCount: number): string {
  const blocks: string[] = [];
  blocks.push("# Graph");
  blocks.push("");
  blocks.push("Derived edge list of all `relationships` in the wiki. Rebuilt by `npx tsx scripts/lint-wiki.ts`. Do not hand-edit between rebuilds — your edits will be overwritten.");
  blocks.push("");
  blocks.push("Format: `source -> type -> target`, grouped by relationship type, deduped, sorted within group.");
  blocks.push("");
  blocks.push(`Last rebuilt: ${TODAY} · ${pageCount} pages · ${groups.reduce((acc, g) => acc + g.edges.length, 0)} edges across ${groups.length} relationship types.`);
  blocks.push("");
  blocks.push("---");
  for (const group of groups) {
    blocks.push("");
    blocks.push(`## ${group.type}`);
    blocks.push("");
    blocks.push("```");
    const fromWidth = Math.min(56, group.edges.reduce((acc, e) => Math.max(acc, e.from.length), 0));
    for (const edge of group.edges) {
      blocks.push(`${pad(edge.from, fromWidth)}  -> ${group.type} -> ${edge.to}`);
    }
    blocks.push("```");
  }
  blocks.push("");
  return blocks.join("\n");
}

function findOrphans(pages: Page[], inbound: Map<string, Relationship[]>): string[] {
  const out: string[] = [];
  for (const page of pages) {
    const incoming = inbound.get(page.relPath) ?? [];
    if (incoming.length === 0) out.push(page.relPath);
  }
  return out.sort();
}

function findDangling(pages: Page[]): Array<{ from: string; rel: Relationship }> {
  // The walked `pages` list excludes top-level meta files (CLAUDE.md, index.md,
  // overview.md, log.md, graph.md, lint-report.md), but those files DO exist
  // and are valid relationship targets. Add them to the existence set.
  const exists = new Set(pages.map((p) => p.relPath));
  for (const meta of SKIP_FILENAMES) exists.add(meta);
  const out: Array<{ from: string; rel: Relationship }> = [];
  for (const page of pages) {
    for (const rel of page.frontmatter.relationships ?? []) {
      if (!exists.has(rel.target)) {
        out.push({ from: page.relPath, rel });
      }
    }
  }
  return out;
}

function readRegistryIds(): Set<string> {
  const ids = new Set<string>();
  try {
    const raw = readFileSync(REGISTRY_PATH, "utf8");
    // canonical IDs appear as backticked tokens that look like "<slug>" in tables/headings.
    // Best-effort scan for typical shapes: 4x4 Socrata IDs and registered string slugs.
    const matches = raw.match(/`([a-z0-9][a-z0-9-]{2,})`/gi) ?? [];
    for (const m of matches) {
      const stripped = m.replace(/`/g, "");
      // Filter to plausible registry IDs (letter + at least one hyphen, or 4x4)
      if (/^[a-z0-9]{4}-[a-z0-9]{4}$/i.test(stripped) || /^[a-z][a-z0-9-]+-[a-z0-9-]+$/i.test(stripped)) {
        ids.add(stripped);
      }
    }
  } catch {
    /* ignore */
  }
  return ids;
}

type RegistryDrift = {
  inWikiNotInRegistry: string[];
  inRegistryNotInWiki: string[];
};

function findRegistryDrift(pages: Page[]): RegistryDrift {
  const registry = readRegistryIds();
  const wikiIds = new Set<string>();
  for (const page of pages) {
    if (page.frontmatter.type === "dataset" && page.frontmatter.registry_id) {
      wikiIds.add(page.frontmatter.registry_id);
    }
  }
  const inWikiNotInRegistry = [...wikiIds].filter((id) => !registry.has(id)).sort();
  // For "in registry not in wiki" we'd need a parsed registry; rough heuristic instead:
  // accept that this is best-effort. We surface only the inverse direction confidently.
  return { inWikiNotInRegistry, inRegistryNotInWiki: [] };
}

function findContradictions(pages: Page[]): Array<{ from: string; to: string }> {
  const out: Array<{ from: string; to: string }> = [];
  for (const page of pages) {
    for (const rel of page.frontmatter.relationships ?? []) {
      if (rel.type === "contradicts") out.push({ from: page.relPath, to: rel.target });
    }
  }
  return out;
}

function findLowConfidence(decayInfos: DecayInfo[]): DecayInfo[] {
  return decayInfos.filter((d) => d.decayed < 0.4);
}

function scanMissingConcepts(pages: Page[]): Array<{ term: string; mentioned: string[] }> {
  // Best-effort: list capitalized acronyms / proper noun tokens mentioned ≥ 3 times in bodies
  // that don't have their own page of any kind. Match against:
  //  - any concept slug (concepts/<slug>.md)
  //  - any other page filename (anywhere in the wiki) — e.g. `usdm-drought-monitor` covers "USDM"
  //  - any page title (case-insensitive)
  const knownTerms = new Set<string>();
  for (const page of pages) {
    const fileSlug = page.relPath.replace(/\.md$/i, "").split("/").pop() ?? "";
    knownTerms.add(fileSlug.toLowerCase());
    for (const part of fileSlug.toLowerCase().split("-")) knownTerms.add(part);
    if (page.frontmatter.title) {
      knownTerms.add(page.frontmatter.title.toLowerCase());
      for (const word of page.frontmatter.title.toLowerCase().split(/[\s—\-/(),]+/)) {
        if (word) knownTerms.add(word);
      }
    }
  }
  const conceptSlugs = new Set(
    pages
      .filter((p) => p.category === "concepts")
      .map((p) => p.relPath.replace(/^concepts\//, "").replace(/\.md$/i, "")),
  );
  const candidates: Map<string, Set<string>> = new Map();
  // Heuristic dictionary — terms that historically appear in the corpus and may warrant a page.
  const watch = [
    "TPDES",
    "NPDES",
    "CWA",
    "SDWA",
    "UCMR",
    "NHDPlus",
    "WBD",
    "USDM",
    "DMA",
    "FRS",
    "ACS",
    "ECHO",
    "EJScreen",
    "TRI",
    "SOAH",
    "CID",
    "MUD",
    "WCID",
    "SUD",
    "ROSC",
    "Marey",
    "Sankey",
  ];
  for (const term of watch) {
    const lower = term.toLowerCase();
    if (conceptSlugs.has(lower)) continue;
    if (knownTerms.has(lower)) continue; // already covered by a non-concept page
    const mentioned = new Set<string>();
    const re = new RegExp(`\\b${term}\\b`, "g");
    for (const page of pages) {
      if (page.category === "concepts") continue;
      if (re.test(page.body)) mentioned.add(page.relPath);
    }
    if (mentioned.size >= 3) {
      candidates.set(term, mentioned);
    }
  }
  return [...candidates.entries()]
    .map(([term, set]) => ({ term, mentioned: [...set].sort() }))
    .sort((a, b) => b.mentioned.length - a.mentioned.length);
}

function buildLintReport(input: {
  pages: Page[];
  inbound: Map<string, Relationship[]>;
  decayInfos: DecayInfo[];
  staleAdded: string[];
  orphans: string[];
  dangling: Array<{ from: string; rel: Relationship }>;
  drift: RegistryDrift;
  contradictions: Array<{ from: string; to: string }>;
  lowConfidence: DecayInfo[];
  missingConcepts: Array<{ term: string; mentioned: string[] }>;
}): string {
  const blocks: string[] = [];
  blocks.push("# Lint Report");
  blocks.push("");
  blocks.push(`Auto-generated health snapshot. Rebuilt by \`npx tsx scripts/lint-wiki.ts\`. Do not hand-edit between rebuilds.`);
  blocks.push("");
  blocks.push(`Last rebuilt: ${TODAY}`);
  blocks.push("");
  blocks.push(`- Pages: ${input.pages.length}`);
  blocks.push(`- Pages with computed decay (display-only; nominal confidence in frontmatter is the value at \`last_confirmed\`): ${input.decayInfos.length}`);
  blocks.push(`- Newly stale: ${input.staleAdded.length}`);
  blocks.push("");
  blocks.push("---");

  blocks.push("");
  blocks.push("## Orphans");
  blocks.push("");
  blocks.push("Pages with **no** inbound `relationships` from any other page (excluding `index`/`overview`/`graph`/`log`/`lint-report`/`CLAUDE`).");
  blocks.push("");
  if (input.orphans.length) {
    for (const slug of input.orphans) blocks.push(`- \`${slug}\``);
  } else {
    blocks.push("_(none — every page has at least one inbound relationship)_");
  }

  blocks.push("");
  blocks.push("## Dangling");
  blocks.push("");
  blocks.push("Relationships pointing at nonexistent pages.");
  blocks.push("");
  if (input.dangling.length) {
    for (const item of input.dangling) {
      blocks.push(`- \`${item.from}\` -> \`${item.rel.type}\` -> \`${item.rel.target}\` ✗`);
    }
  } else {
    blocks.push("_(none)_");
  }

  blocks.push("");
  blocks.push("## Stale");
  blocks.push("");
  blocks.push("Pages moved to `stale: true` this lint pass (confidence < 0.2 after decay).");
  blocks.push("");
  if (input.staleAdded.length) {
    for (const slug of input.staleAdded) blocks.push(`- \`${slug}\``);
  } else {
    blocks.push("_(none)_");
  }

  blocks.push("");
  blocks.push("## Contradictions");
  blocks.push("");
  blocks.push("Unresolved `contradicts` edges.");
  blocks.push("");
  if (input.contradictions.length) {
    for (const item of input.contradictions) blocks.push(`- \`${item.from}\` ⇄ \`${item.to}\``);
  } else {
    blocks.push("_(none)_");
  }

  blocks.push("");
  blocks.push("## Registry drift");
  blocks.push("");
  blocks.push("Wiki dataset pages whose `registry_id` was not found in `docs/contracts/dataset-registry.md` (best-effort scan).");
  blocks.push("");
  if (input.drift.inWikiNotInRegistry.length) {
    for (const id of input.drift.inWikiNotInRegistry) blocks.push(`- \`${id}\``);
    blocks.push("");
    blocks.push("Note: registry-side scan is regex-only; some IDs may live in tables that don't backtick-quote them. Cross-check by hand before chasing fixes.");
  } else {
    blocks.push("_(none — every wiki dataset page's `registry_id` is grep-findable in the contract)_");
  }

  blocks.push("");
  blocks.push("## Missing concepts");
  blocks.push("");
  blocks.push("Terms mentioned ≥ 3 times across non-concept pages without their own concept page (best-effort heuristic).");
  blocks.push("");
  if (input.missingConcepts.length) {
    for (const item of input.missingConcepts) {
      blocks.push(`- **${item.term}** — mentioned in ${item.mentioned.length} pages: ${item.mentioned.map((p) => `\`${p}\``).join(", ")}`);
    }
  } else {
    blocks.push("_(none surfaced by the watchlist heuristic)_");
  }

  blocks.push("");
  blocks.push("## Low-confidence pages");
  blocks.push("");
  blocks.push("Pages whose **decayed** confidence sits under 0.4 (frontmatter `confidence` is the value at `last_confirmed`; this is what it would be today if no one re-confirms it).");
  blocks.push("");
  if (input.lowConfidence.length) {
    for (const info of input.lowConfidence) {
      blocks.push(`- \`${info.page.relPath}\` — nominal ${info.nominal.toFixed(2)} → decayed ${info.decayed.toFixed(2)} (${Math.floor(info.days)}d since confirmed)`);
    }
  } else {
    blocks.push("_(none)_");
  }

  blocks.push("");
  return blocks.join("\n");
}

/**
 * Persist only the `stale: true` flag back to disk when decay carries a page
 * under 0.2. Confidence stays at its nominal `last_confirmed` value — decay
 * is shown analytically in the lint report, not written.
 */
function writeStaleFlag(page: Page): void {
  const original = parseFrontmatter(page.raw);
  if (page.frontmatter.stale === true && original.meta.stale !== true) {
    if (/\nstale:\s*false/.test(page.raw)) {
      page.raw = page.raw.replace(/\nstale:\s*false/, "\nstale: true");
    } else if (!/\nstale:/.test(page.raw)) {
      page.raw = page.raw.replace(/\n---\n/, "\nstale: true\n---\n");
    }
    writeFileSync(join(WIKI_DIR, page.relPath), page.raw, "utf8");
  }
}

function main(): void {
  const pages = loadPages();
  const { decayInfos, staleAdded } = computeDecay(pages);
  const inbound = buildInboundIndex(pages);
  const groups = buildGraph(pages);
  const orphans = findOrphans(pages, inbound);
  const dangling = findDangling(pages);
  const drift = findRegistryDrift(pages);
  const contradictions = findContradictions(pages);
  const lowConfidence = findLowConfidence(decayInfos);
  const missingConcepts = scanMissingConcepts(pages);

  const graphMd = renderGraphMd(groups, pages.length);
  const reportMd = buildLintReport({
    pages,
    inbound,
    decayInfos,
    staleAdded,
    orphans,
    dangling,
    drift,
    contradictions,
    lowConfidence,
    missingConcepts,
  });

  writeFileSync(join(WIKI_DIR, "graph.md"), graphMd, "utf8");
  writeFileSync(join(WIKI_DIR, "lint-report.md"), reportMd, "utf8");

  for (const page of pages) writeStaleFlag(page);

  console.log("Wiki lint complete.");
  console.log(`- Pages: ${pages.length}`);
  console.log(`- Pages with computed decay: ${decayInfos.length}`);
  console.log(`- Newly stale: ${staleAdded.length}`);
  console.log(`- Orphans: ${orphans.length}`);
  console.log(`- Dangling: ${dangling.length}`);
  console.log(`- Missing concepts surfaced: ${missingConcepts.length}`);
  console.log(`- Low-confidence (decayed < 0.4): ${lowConfidence.length}`);
  console.log(`- Output: ${relative(REPO_ROOT, join(WIKI_DIR, "graph.md"))}, ${relative(REPO_ROOT, join(WIKI_DIR, "lint-report.md"))}`);
}

main();
