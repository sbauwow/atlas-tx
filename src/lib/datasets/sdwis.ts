/**
 * EPA SDWIS — Safe Drinking Water Information System
 *
 * Source: EPA Envirofacts public REST API (no auth required)
 *   https://www.epa.gov/enviro/envirofacts-data-service-api
 *
 * Texas-only (PRIMACY_AGENCY_CODE = 'TX'). National fetches are deliberately
 * out of scope per the workstream charter.
 *
 * Snapshot filter (applied to fit the committed-snapshot budget):
 *   - is_health_based_ind = 'Y'
 *   - compl_per_begin_date > 2023-04-01
 *
 * Why this window: Texas reports ~25k health-based violations going back to
 * 2020. At ~390 bytes per normalized row, a 2020+ snapshot lands near 9 MB,
 * well over the 5 MB committed-snapshot budget in
 * docs/contracts/dataset-registry.md. A 2023-04-01+ window holds ~11.7k rows
 * (~4.5 MB) and is still a strong recency-weighted dataset for the Drinking
 * Water Risk Score. Both filters are documented in the loader output as
 * caveats.
 *
 * If you need wider coverage for analysis, call
 * `fetchSdwis({ healthBasedOnly: false, since: undefined })` directly and
 * write the result to `data/sdwis-tx.json` (gitignored) instead of
 * public/cache/.
 *
 * Coverage gaps you should know about before using these rows:
 *   - SDWIS is self-reported by primacy agencies; recent quarters lag.
 *   - Small / non-community systems are spottier than CWS.
 *   - county_served comes from the GEOGRAPHIC_AREA table; some PWSs have no
 *     row there and end up with county = null.
 *   - pws_name comes from WATER_SYSTEM; deactivated systems may still appear
 *     in the violation table.
 *
 * Snapshot last regenerated: see `generatedAt` inside
 * public/cache/sdwis-tx.json.
 *
 * To regenerate the cache: call `loadSdwis({ live: true })` from any node
 * entrypoint (e.g. an MCP tool with a `--refresh` flag, or a one-off vitest
 * with `test.skipIf(!process.env.REFRESH_SDWIS)`). Allow ~40 s — the API
 * paginates 10k rows per request.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { normalizeCountyName } from "@/lib/counties";

// --- Types --------------------------------------------------------------

/**
 * Raw record from the Envirofacts VIOLATION table. Field names are the
 * lowercase column names returned by the API. We only declare the fields we
 * read; the API returns several more we deliberately drop on normalize.
 */
export type SdwisViolationRaw = {
  pwsid: string;
  violation_id?: string | null;
  facility_id?: string | null;
  population_served_count?: number | null;
  primacy_agency_code?: string | null;
  pws_type_code?: string | null;
  violation_code?: string | null;
  violation_category_code?: string | null;
  is_health_based_ind?: "Y" | "N" | null;
  contaminant_code?: string | null;
  compliance_status_code?: string | null;
  compl_per_begin_date?: string | null;
  compl_per_end_date?: string | null;
  rule_code?: string | null;
  rule_group_code?: string | null;
  rule_family_code?: string | null;
  public_notification_tier?: number | null;
};

/** Raw record from the Envirofacts WATER_SYSTEM table (subset we use). */
export type SdwisWaterSystemRaw = {
  pwsid: string;
  pws_name?: string | null;
  pws_type_code?: string | null;
  pws_activity_code?: string | null;
  population_served_count?: number | null;
  city_name?: string | null;
  state_code?: string | null;
};

/** Raw record from the Envirofacts GEOGRAPHIC_AREA table (subset we use). */
export type SdwisGeographicAreaRaw = {
  pwsid: string;
  area_type_code?: string | null;
  county_served?: string | null;
};

/** Bag of raw responses, exposed for the normalizer. */
export type SdwisRaw = {
  violations: SdwisViolationRaw[];
  waterSystems: SdwisWaterSystemRaw[];
  geographicAreas: SdwisGeographicAreaRaw[];
};

/**
 * Normalized row. Field names are the lowerCamelCase mirror of the
 * `epa-sdwis-violations` keyFields entry in `mvp-datasets.ts`, plus a small
 * number of derived fields (pwsName, county) sourced from the WATER_SYSTEM
 * and GEOGRAPHIC_AREA joins.
 */
export type SdwisRow = {
  pwsid: string;
  pwsName: string | null;
  county: string | null;
  populationServed: number | null;
  violationId: string | null;
  violationCode: string | null;
  violationCategory: string | null;
  isHealthBased: boolean;
  contaminantCode: string | null;
  complianceStatusCode: string | null;
  complPerBeginDate: string | null;
  complPerEndDate: string | null;
  pwsTypeCode: string | null;
  ruleCode: string | null;
  ruleGroupCode: string | null;
  publicNotificationTier: number | null;
};

export type SdwisFetchParams = {
  /** Default true. Filters to is_health_based_ind = 'Y' on the API side. */
  healthBasedOnly?: boolean;
  /**
   * ISO date (YYYY-MM-DD). Filters compl_per_begin_date > since on the API
   * side. Default '2020-01-01' to keep snapshot < 5 MB.
   */
  since?: string;
  /** Hard cap on rows returned. Default 50_000. */
  maxRows?: number;
  /** Page size for paginated GETs. Default 10_000. */
  pageSize?: number;
};

// --- Fetcher ------------------------------------------------------------

const ENVIROFACTS_BASE = "https://data.epa.gov/efservice";
const TX_PRIMACY_CODE = "TX";

const DEFAULT_PARAMS: Required<SdwisFetchParams> = {
  healthBasedOnly: true,
  since: "2023-04-01",
  maxRows: 50_000,
  pageSize: 10_000,
};

function violationPathSegments(p: Required<SdwisFetchParams>): string[] {
  const parts = ["VIOLATION", "PRIMACY_AGENCY_CODE", TX_PRIMACY_CODE];
  if (p.healthBasedOnly) {
    parts.push("IS_HEALTH_BASED_IND", "Y");
  }
  if (p.since) {
    // Envirofacts uses URL-encoded operator chars between column and value.
    parts.push("COMPL_PER_BEGIN_DATE", encodeURIComponent(">"), p.since);
  }
  return parts;
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`SDWIS fetch failed (${res.status}) for ${url}`);
  }
  return (await res.json()) as T;
}

async function fetchPaginated<T>(
  pathSegments: string[],
  pageSize: number,
  maxRows: number,
): Promise<T[]> {
  const out: T[] = [];
  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const upper = Math.min(offset + pageSize - 1, maxRows - 1);
    const url = `${ENVIROFACTS_BASE}/${pathSegments.join(
      "/",
    )}/ROWS/${offset}:${upper}/JSON`;
    const page = await fetchJson<T[]>(url);
    if (!Array.isArray(page) || page.length === 0) break;
    out.push(...page);
    if (page.length < pageSize) break;
  }
  return out;
}

/** Live fetch — hits the Envirofacts API. Cache miss path. */
export async function fetchSdwis(
  params: SdwisFetchParams = {},
): Promise<SdwisRaw> {
  const merged: Required<SdwisFetchParams> = { ...DEFAULT_PARAMS, ...params };

  const violations = await fetchPaginated<SdwisViolationRaw>(
    violationPathSegments(merged),
    merged.pageSize,
    merged.maxRows,
  );

  // We only need WATER_SYSTEM / GEOGRAPHIC_AREA rows for PWSIDs that appear
  // in the violation set. Pulling ~16.5k rows of each is cheaper than
  // round-tripping per pwsid and bounded the same way as violations.
  const wsCap = 50_000;
  const waterSystems = await fetchPaginated<SdwisWaterSystemRaw>(
    ["WATER_SYSTEM", "PRIMACY_AGENCY_CODE", TX_PRIMACY_CODE],
    merged.pageSize,
    wsCap,
  );
  const geographicAreas = await fetchPaginated<SdwisGeographicAreaRaw>(
    [
      "GEOGRAPHIC_AREA",
      "PRIMACY_AGENCY_CODE",
      TX_PRIMACY_CODE,
      "AREA_TYPE_CODE",
      "CN",
    ],
    merged.pageSize,
    wsCap,
  );

  return { violations, waterSystems, geographicAreas };
}

// --- Normalizer ---------------------------------------------------------

function coerceIsoDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  // Envirofacts returns "YYYY-MM-DD HH:MM:SS"; sometimes "YYYY-MM-DD".
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  // Last resort: let Date parse, then format.
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function coerceHealthBased(raw: string | null | undefined): boolean {
  if (raw == null) return false;
  const v = String(raw).trim().toUpperCase();
  return v === "Y" || v === "YES" || v === "TRUE" || v === "1";
}

function coerceNumber(raw: number | string | null | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.length === 0) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return Number.isFinite(raw) ? raw : null;
}

function coerceString(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  return s.length === 0 ? null : s;
}

/**
 * Convert raw API responses to normalized rows. Pure — no I/O. Joins
 * violations to WATER_SYSTEM (pws_name) and GEOGRAPHIC_AREA (county_served).
 */
export function normalizeSdwis(raw: SdwisRaw): SdwisRow[] {
  const wsByPwsid = new Map<string, SdwisWaterSystemRaw>();
  for (const ws of raw.waterSystems) {
    if (!ws?.pwsid) continue;
    wsByPwsid.set(String(ws.pwsid), ws);
  }

  const countyByPwsid = new Map<string, string>();
  for (const ga of raw.geographicAreas) {
    if (!ga?.pwsid) continue;
    if (ga.area_type_code && ga.area_type_code !== "CN") continue;
    const c = coerceString(ga.county_served);
    if (!c) continue;
    // First entry wins; in practice TX rows are unique per pwsid for CN.
    if (!countyByPwsid.has(String(ga.pwsid))) {
      countyByPwsid.set(String(ga.pwsid), normalizeCountyName(c));
    }
  }

  const out: SdwisRow[] = [];
  for (const v of raw.violations) {
    if (!v?.pwsid) continue;
    const pwsid = String(v.pwsid);
    const ws = wsByPwsid.get(pwsid);
    out.push({
      pwsid,
      pwsName: coerceString(ws?.pws_name),
      county: countyByPwsid.get(pwsid) ?? null,
      populationServed:
        coerceNumber(v.population_served_count) ??
        coerceNumber(ws?.population_served_count),
      violationId: coerceString(v.violation_id),
      violationCode: coerceString(v.violation_code),
      violationCategory: coerceString(v.violation_category_code),
      isHealthBased: coerceHealthBased(v.is_health_based_ind),
      contaminantCode: coerceString(v.contaminant_code),
      complianceStatusCode: coerceString(v.compliance_status_code),
      complPerBeginDate: coerceIsoDate(v.compl_per_begin_date),
      complPerEndDate: coerceIsoDate(v.compl_per_end_date),
      pwsTypeCode: coerceString(v.pws_type_code),
      ruleCode: coerceString(v.rule_code),
      ruleGroupCode: coerceString(v.rule_group_code),
      publicNotificationTier: coerceNumber(v.public_notification_tier),
    });
  }
  return out;
}

// --- Snapshot loader ----------------------------------------------------

/** Wire format of the on-disk snapshot. */
export type SdwisSnapshot = {
  generatedAt: string;
  source: string;
  filter: {
    primacyAgencyCode: string;
    healthBasedOnly: boolean;
    since: string | null;
  };
  caveats: string[];
  rowCount: number;
  rows: SdwisRow[];
};

const SNAPSHOT_REL_PATH = "public/cache/sdwis-tx.json";

function snapshotPath(): string {
  return path.resolve(process.cwd(), SNAPSHOT_REL_PATH);
}

async function readSnapshot(): Promise<SdwisSnapshot> {
  const buf = await fs.readFile(snapshotPath(), "utf8");
  return JSON.parse(buf) as SdwisSnapshot;
}

async function writeSnapshot(snapshot: SdwisSnapshot): Promise<void> {
  const file = snapshotPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  // Minified to keep the committed snapshot under the 5 MB contract budget.
  // Pretty-printed at 24k+ rows is roughly 2.5x larger.
  await fs.writeFile(file, JSON.stringify(snapshot));
}

export type LoadSdwisOpts = {
  /**
   * If true, refetch from the API, normalize, and rewrite the cache before
   * returning. Default false — reads the committed snapshot.
   */
  live?: boolean;
  /** Pass-through fetch params when `live: true`. */
  fetchParams?: SdwisFetchParams;
};

/**
 * Default loader. Reads from `public/cache/sdwis-tx.json`. Pass `live: true`
 * to refetch + rewrite the cache. This is the stable entry point that the
 * MCP / web workstreams import — they should never call `fetchSdwis`
 * directly.
 */
export async function loadSdwis(
  opts: LoadSdwisOpts = {},
): Promise<SdwisRow[]> {
  if (opts.live) {
    const merged: Required<SdwisFetchParams> = {
      ...DEFAULT_PARAMS,
      ...(opts.fetchParams ?? {}),
    };
    const raw = await fetchSdwis(merged);
    const rows = normalizeSdwis(raw);
    const snapshot: SdwisSnapshot = {
      generatedAt: new Date().toISOString(),
      source: ENVIROFACTS_BASE,
      filter: {
        primacyAgencyCode: TX_PRIMACY_CODE,
        healthBasedOnly: merged.healthBasedOnly,
        since: merged.since || null,
      },
      caveats: [
        "SDWIS rows are self-reported by primacy agencies; recent quarters lag.",
        `Snapshot is filtered to TX health-based violations after ${merged.since || "epoch"}; widen via fetchSdwis({since: undefined}) and write to data/ (gitignored) for analysis runs.`,
        "county is sourced from GEOGRAPHIC_AREA (area_type_code=CN); some PWSs are missing this row.",
        "EJ outputs derived from this should be framed as exposure / burden, not harm.",
      ],
      rowCount: rows.length,
      rows,
    };
    await writeSnapshot(snapshot);
    return rows;
  }

  const snapshot = await readSnapshot();
  return snapshot.rows;
}

/** Load full snapshot (rows + caveats + metadata) from the cache. */
export async function loadSdwisSnapshot(): Promise<SdwisSnapshot> {
  return readSnapshot();
}
