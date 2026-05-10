/**
 * Shared per-county aggregators for the interactive /maps choropleth view modes.
 * Each view exposes a label, color buckets, and a Promise<map<countySlug, value>>.
 *
 * Used by:
 *   - GET /api/maps/views/[view]
 *   - (future) the legacy /maps/<theme> pages, once they migrate to this contract.
 */
import { countySlug } from "@/lib/counties";
import { loadSdwisSnapshot } from "@/lib/datasets/sdwis";
import { getTceqPendingPermitsPageData } from "@/lib/tceq-permits";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const COUNTY_VIEW_IDS = ["ej", "operators", "swq", "citizen"] as const;
export type CountyViewId = (typeof COUNTY_VIEW_IDS)[number];

export type CountyViewBucket = {
  label: string;
  fill: string;
  min?: number;
  max?: number;
};

export type CountyViewRow = {
  slug: string;
  name: string;
  value: number;
  context?: string;
};

export type CountyViewPayload = {
  view: CountyViewId;
  title: string;
  description: string;
  valueLabel: string;
  format: "integer" | "decimal" | "percent";
  buckets: CountyViewBucket[];
  generatedAt: string;
  rows: CountyViewRow[];
};

const NO_DATA_FILL = "rgba(15,23,42,0.55)";

const VIEW_META: Record<CountyViewId, Pick<CountyViewPayload, "title" | "description" | "valueLabel" | "format" | "buckets">> = {
  ej: {
    title: "Drinking-water risk",
    description: "Cached SDWIS health-based violations per county since 2023-04-01.",
    valueLabel: "violations",
    format: "integer",
    buckets: [
      { label: "0", fill: NO_DATA_FILL, min: 0, max: 0 },
      { label: "1–9", fill: "rgba(56,189,248,0.55)", min: 1, max: 9 },
      { label: "10–29", fill: "rgba(34,211,238,0.7)", min: 10, max: 29 },
      { label: "30–99", fill: "rgba(249,168,212,0.78)", min: 30, max: 99 },
      { label: "100+", fill: "rgba(244,63,94,0.85)", min: 100 },
    ],
  },
  operators: {
    title: "Operator pressure",
    description: "Pending TCEQ water-quality individual permits per county.",
    valueLabel: "permits",
    format: "integer",
    buckets: [
      { label: "0", fill: NO_DATA_FILL, min: 0, max: 0 },
      { label: "1", fill: "rgba(56,189,248,0.55)", min: 1, max: 1 },
      { label: "2–3", fill: "rgba(34,211,238,0.7)", min: 2, max: 3 },
      { label: "4–7", fill: "rgba(249,168,212,0.78)", min: 4, max: 7 },
      { label: "8+", fill: "rgba(244,63,94,0.85)", min: 8 },
    ],
  },
  swq: {
    title: "Surface-water impairment",
    description: "TCEQ-classified impaired surface-water segments per county.",
    valueLabel: "impaired segments",
    format: "integer",
    buckets: [
      { label: "0", fill: NO_DATA_FILL, min: 0, max: 0 },
      { label: "1", fill: "rgba(56,189,248,0.55)", min: 1, max: 1 },
      { label: "2–3", fill: "rgba(34,211,238,0.7)", min: 2, max: 3 },
      { label: "4–7", fill: "rgba(249,168,212,0.78)", min: 4, max: 7 },
      { label: "8+", fill: "rgba(244,63,94,0.85)", min: 8 },
    ],
  },
  citizen: {
    title: "Citizen activity",
    description: "Recent strip-test observations submitted via the citizen API.",
    valueLabel: "observations",
    format: "integer",
    buckets: [
      { label: "0", fill: NO_DATA_FILL, min: 0, max: 0 },
      { label: "1", fill: "rgba(56,189,248,0.55)", min: 1, max: 1 },
      { label: "2–4", fill: "rgba(34,211,238,0.7)", min: 2, max: 4 },
      { label: "5–9", fill: "rgba(125,211,252,0.78)", min: 5, max: 9 },
      { label: "10+", fill: "rgba(186,230,253,0.9)", min: 10 },
    ],
  },
};

export function isCountyViewId(value: unknown): value is CountyViewId {
  return typeof value === "string" && (COUNTY_VIEW_IDS as readonly string[]).includes(value);
}

export function bucketFillFor(view: CountyViewId, value: number): string {
  for (const b of VIEW_META[view].buckets) {
    const minOk = b.min === undefined || value >= b.min;
    const maxOk = b.max === undefined || value <= b.max;
    if (minOk && maxOk) return b.fill;
  }
  return NO_DATA_FILL;
}

function nameFromSlug(slug: string): string {
  const tokens = slug.split("-");
  const cased = tokens.map((token) => (token ? token[0].toUpperCase() + token.slice(1) : token)).join(" ");
  return /county$/i.test(cased) ? cased : `${cased} County`;
}

async function loadEj(): Promise<{ rows: CountyViewRow[]; generatedAt: string }> {
  const snapshot = await loadSdwisSnapshot();
  const counts = new Map<string, { violations: number; populationExposed: number; pwsIds: Set<string> }>();
  for (const row of snapshot.rows) {
    if (!row.county) continue;
    const slug = countySlug(row.county);
    if (!slug) continue;
    let entry = counts.get(slug);
    if (!entry) {
      entry = { violations: 0, populationExposed: 0, pwsIds: new Set() };
      counts.set(slug, entry);
    }
    entry.violations += 1;
    if (!entry.pwsIds.has(row.pwsid)) {
      entry.pwsIds.add(row.pwsid);
      entry.populationExposed += row.populationServed ?? 0;
    }
  }
  const rows: CountyViewRow[] = [...counts.entries()].map(([slug, c]) => ({
    slug,
    name: nameFromSlug(slug),
    value: c.violations,
    context: c.populationExposed
      ? `${c.populationExposed.toLocaleString()} people across ${c.pwsIds.size} PWS`
      : `${c.pwsIds.size} PWS impacted`,
  }));
  return { rows, generatedAt: snapshot.generatedAt ?? new Date().toISOString() };
}

async function loadOperators(): Promise<{ rows: CountyViewRow[]; generatedAt: string }> {
  const data = await getTceqPendingPermitsPageData();
  const counts = new Map<string, { permits: number; operators: Map<string, number> }>();
  for (const permit of data.permits) {
    if (!permit.county) continue;
    const slug = countySlug(permit.county);
    if (!slug) continue;
    let entry = counts.get(slug);
    if (!entry) {
      entry = { permits: 0, operators: new Map() };
      counts.set(slug, entry);
    }
    entry.permits += 1;
    const op = permit.permitteeName ?? "Unknown";
    entry.operators.set(op, (entry.operators.get(op) ?? 0) + 1);
  }
  const rows: CountyViewRow[] = [...counts.entries()].map(([slug, c]) => {
    const top = [...c.operators.entries()].sort((a, b) => b[1] - a[1])[0];
    const share = top ? Math.round((top[1] / c.permits) * 100) : 0;
    return {
      slug,
      name: nameFromSlug(slug),
      value: c.permits,
      context: top ? `${top[0]} (${share}% of pending)` : `${c.operators.size} operators`,
    };
  });
  return { rows, generatedAt: new Date().toISOString() };
}

type SwqRow = {
  countyName?: string | null;
  isImpaired: boolean;
};
type SwqSnapshot = { generatedAt: string; rows: SwqRow[] };

async function loadSwq(): Promise<{ rows: CountyViewRow[]; generatedAt: string }> {
  const path = join(process.cwd(), "public", "cache", "surface-water-quality-tx.json");
  const snapshot = JSON.parse(await readFile(path, "utf8")) as SwqSnapshot;
  const counts = new Map<string, { impaired: number; total: number }>();
  for (const row of snapshot.rows) {
    if (!row.countyName) continue;
    const slug = countySlug(row.countyName);
    if (!slug) continue;
    let entry = counts.get(slug);
    if (!entry) {
      entry = { impaired: 0, total: 0 };
      counts.set(slug, entry);
    }
    entry.total += 1;
    if (row.isImpaired) entry.impaired += 1;
  }
  const rows: CountyViewRow[] = [...counts.entries()].map(([slug, c]) => ({
    slug,
    name: nameFromSlug(slug),
    value: c.impaired,
    context: `${c.total} segments assessed`,
  }));
  return { rows, generatedAt: snapshot.generatedAt };
}

async function loadCitizen(): Promise<{ rows: CountyViewRow[]; generatedAt: string }> {
  try {
    const { prisma } = await import("@/lib/db");
    const obs = await prisma.waterObservation.findMany({
      select: { countySlug: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });
    const counts = new Map<string, { total: number; completed: number; latestAt: Date | null }>();
    for (const row of obs) {
      if (!row.countySlug) continue;
      let entry = counts.get(row.countySlug);
      if (!entry) {
        entry = { total: 0, completed: 0, latestAt: null };
        counts.set(row.countySlug, entry);
      }
      entry.total += 1;
      if (row.status === "completed") entry.completed += 1;
      if (!entry.latestAt || row.createdAt > entry.latestAt) entry.latestAt = row.createdAt;
    }
    const rows: CountyViewRow[] = [...counts.entries()].map(([slug, c]) => ({
      slug,
      name: nameFromSlug(slug),
      value: c.total,
      context: c.latestAt ? `Latest ${c.latestAt.toISOString().slice(0, 10)}` : `${c.total} submissions`,
    }));
    return { rows, generatedAt: new Date().toISOString() };
  } catch {
    return { rows: [], generatedAt: new Date().toISOString() };
  }
}

const LOADERS: Record<CountyViewId, () => Promise<{ rows: CountyViewRow[]; generatedAt: string }>> = {
  ej: loadEj,
  operators: loadOperators,
  swq: loadSwq,
  citizen: loadCitizen,
};

export async function getCountyViewPayload(view: CountyViewId): Promise<CountyViewPayload> {
  const meta = VIEW_META[view];
  const { rows, generatedAt } = await LOADERS[view]();
  return {
    view,
    title: meta.title,
    description: meta.description,
    valueLabel: meta.valueLabel,
    format: meta.format,
    buckets: meta.buckets,
    generatedAt,
    rows: rows.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)),
  };
}
