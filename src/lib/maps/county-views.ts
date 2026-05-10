/**
 * Shared per-county aggregators for the interactive /maps choropleth view modes.
 * Each view exposes a label, color buckets, and a Promise<map<countySlug, value>>.
 *
 * SERVER-ONLY. Imports Prisma + filesystem; the matching client-safe types
 * live in `./county-views.types.ts` and are re-exported here for callers that
 * already imported from this module.
 *
 * Used by:
 *   - GET /api/maps/views/[view]
 *   - (future) the legacy /maps/<theme> pages, once they migrate to this contract.
 */
import "server-only";

import { countySlug } from "@/lib/counties";
import { loadSdwisSnapshot } from "@/lib/datasets/sdwis";
import { getTceqPendingPermitsPageData } from "@/lib/tceq-permits";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export {
  COUNTY_VIEW_IDS,
  NO_DATA_FILL,
  VIEW_META,
  bucketFillFor,
  isCountyViewId,
} from "./county-views.types";
export type {
  CountyViewId,
  CountyViewBucket,
  CountyViewRow,
  CountyViewPayload,
} from "./county-views.types";

import { VIEW_META, NO_DATA_FILL } from "./county-views.types";
import type { CountyViewId, CountyViewPayload, CountyViewRow } from "./county-views.types";

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
