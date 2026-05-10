/**
 * EPA SDWIS — `SDWA/WATER_SYSTEM_FACILITY` Texas slice.
 *
 * Companion to `sdwis.ts` (which loads VIOLATION + WATER_SYSTEM rows). This
 * module pulls the facility-level rows so that for any Public Water System
 * we can list its storage facilities (water towers / ground storage tanks /
 * reservoirs), wells, treatment plants, and distribution-system entries.
 *
 * Source:
 *   https://data.epa.gov/efservice/SDWA/WATER_SYSTEM_FACILITY/PRIMACY_AGENCY_CODE/TX/JSON
 *
 * Key caveats:
 *   - This table has no latitude / longitude. Geographic context comes via
 *     the joined `pwsid` (and the existing GEOGRAPHIC_AREA county join in
 *     `sdwis.ts`).
 *   - `facility_type_code` values include ST (storage), WL (well), IN (intake),
 *     TP (treatment plant), DS (distribution system), PC (pump). The default
 *     loader is filtered to ST + active to fit the committed snapshot budget.
 *   - `facility_name` often embeds capacity hints like "0.2 MG GST" or
 *     "15 MG RES". Treat as descriptive, not authoritative volume.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const ENVIROFACTS_BASE = "https://data.epa.gov/efservice";
const TX_PRIMACY_CODE = "TX";

export type SdwisFacilityTypeCode =
  | "ST"
  | "WL"
  | "IN"
  | "TP"
  | "DS"
  | "PC"
  | "OT";

export type SdwisFacilityRaw = {
  pwsid?: string;
  primacy_agency_code?: string;
  epa_region?: string;
  facility_id?: string;
  facility_name?: string;
  state_facility_id?: string;
  facility_activity_code?: string;
  facility_deactivation_date?: string | null;
  facility_type_code?: string;
  submission_status_code?: string;
  is_source_ind?: string;
  water_type_code?: string | null;
  availability_code?: string | null;
  filtration_status_code?: string | null;
  pws_activity_code?: string;
  pws_deactivation_date?: string | null;
  pws_type_code?: string;
  is_source_treated_ind?: string | null;
};

export type SdwisFacility = {
  pwsid: string;
  facilityId: string;
  facilityName: string | null;
  stateFacilityId: string | null;
  facilityTypeCode: SdwisFacilityTypeCode;
  isActive: boolean;
};

export type SdwisFacilityFetchParams = {
  /** Default ['ST'] (storage). Use ['ST','WL','TP','PC'] for a wider snapshot. */
  facilityTypeCodes?: SdwisFacilityTypeCode[];
  activeOnly?: boolean;
  pageSize?: number;
  maxRows?: number;
};

const DEFAULT_PARAMS: Required<SdwisFacilityFetchParams> = {
  facilityTypeCodes: ["ST"],
  activeOnly: true,
  pageSize: 10_000,
  maxRows: 60_000,
};

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`SDWIS facility fetch failed (${res.status}) for ${url}`);
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
    const url = `${ENVIROFACTS_BASE}/${pathSegments.join("/")}/ROWS/${offset}:${upper}/JSON`;
    const page = await fetchJson<T[]>(url);
    if (!Array.isArray(page) || page.length === 0) break;
    out.push(...page);
    if (page.length < pageSize) break;
  }
  return out;
}

function pathFor(typeCode: SdwisFacilityTypeCode, activeOnly: boolean): string[] {
  const parts = [
    "SDWA",
    "WATER_SYSTEM_FACILITY",
    "PRIMACY_AGENCY_CODE",
    TX_PRIMACY_CODE,
    "FACILITY_TYPE_CODE",
    typeCode,
  ];
  if (activeOnly) {
    parts.push("FACILITY_ACTIVITY_CODE", "A");
  }
  return parts;
}

export function normalizeSdwisFacility(raw: SdwisFacilityRaw): SdwisFacility | null {
  if (!raw.pwsid || !raw.facility_id) return null;
  const code = (raw.facility_type_code ?? "").trim().toUpperCase();
  const validCodes: SdwisFacilityTypeCode[] = ["ST", "WL", "IN", "TP", "DS", "PC", "OT"];
  const facilityTypeCode = (validCodes as string[]).includes(code)
    ? (code as SdwisFacilityTypeCode)
    : "OT";
  return {
    pwsid: raw.pwsid,
    facilityId: raw.facility_id,
    facilityName: raw.facility_name?.trim() || null,
    stateFacilityId: raw.state_facility_id?.trim() || null,
    facilityTypeCode,
    isActive: (raw.facility_activity_code ?? "").toUpperCase() === "A",
  };
}

export function normalizeSdwisFacilities(rows: SdwisFacilityRaw[]): SdwisFacility[] {
  const out: SdwisFacility[] = [];
  for (const row of rows) {
    const normalized = normalizeSdwisFacility(row);
    if (normalized) out.push(normalized);
  }
  return out;
}

/** Live fetch — hits the EPA Envirofacts API. Cache miss path. */
export async function fetchSdwisFacilities(
  params: SdwisFacilityFetchParams = {},
): Promise<SdwisFacility[]> {
  const merged: Required<SdwisFacilityFetchParams> = { ...DEFAULT_PARAMS, ...params };
  const allRaw: SdwisFacilityRaw[] = [];
  for (const code of merged.facilityTypeCodes) {
    const page = await fetchPaginated<SdwisFacilityRaw>(
      pathFor(code, merged.activeOnly),
      merged.pageSize,
      merged.maxRows,
    );
    allRaw.push(...page);
  }
  return normalizeSdwisFacilities(allRaw);
}

export type SdwisFacilitySnapshot = {
  generatedAt: string;
  source: string;
  filter: {
    primacyAgencyCode: string;
    facilityTypeCodes: SdwisFacilityTypeCode[];
    activeOnly: boolean;
  };
  caveats: string[];
  rowCount: number;
  rows: SdwisFacility[];
};

const SNAPSHOT_REL_PATH = "public/cache/sdwis-storage-tx.json";

function snapshotPath(): string {
  return path.resolve(process.cwd(), SNAPSHOT_REL_PATH);
}

async function readSnapshot(): Promise<SdwisFacilitySnapshot> {
  const buf = await fs.readFile(snapshotPath(), "utf8");
  return JSON.parse(buf) as SdwisFacilitySnapshot;
}

async function writeSnapshot(snapshot: SdwisFacilitySnapshot): Promise<void> {
  const file = snapshotPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  // Minified to keep the committed snapshot under budget (active storage only ≈ 28.5 k rows).
  await fs.writeFile(file, JSON.stringify(snapshot));
}

export type LoadSdwisFacilitiesOpts = {
  /**
   * If true, refetch from EPA, normalize, and rewrite the cache before
   * returning. Default false — reads the committed snapshot.
   */
  live?: boolean;
  fetchParams?: SdwisFacilityFetchParams;
};

/**
 * Default loader. Reads from `public/cache/sdwis-storage-tx.json`. Pass
 * `live: true` to refetch + rewrite. The MCP / web workstreams should
 * import this and never call `fetchSdwisFacilities` directly.
 */
export async function loadSdwisFacilities(
  opts: LoadSdwisFacilitiesOpts = {},
): Promise<SdwisFacility[]> {
  if (opts.live) {
    const merged: Required<SdwisFacilityFetchParams> = {
      ...DEFAULT_PARAMS,
      ...(opts.fetchParams ?? {}),
    };
    const rows = await fetchSdwisFacilities(merged);
    const snapshot: SdwisFacilitySnapshot = {
      generatedAt: new Date().toISOString(),
      source: ENVIROFACTS_BASE,
      filter: {
        primacyAgencyCode: TX_PRIMACY_CODE,
        facilityTypeCodes: merged.facilityTypeCodes,
        activeOnly: merged.activeOnly,
      },
      caveats: [
        "WATER_SYSTEM_FACILITY rows have no latitude/longitude; geography is via the joined pwsid only.",
        "facility_name may embed capacity hints like '0.2 MG GST' (Ground Storage Tank) — treat as descriptive, not authoritative volume.",
        "Default snapshot is filtered to active storage facilities (FACILITY_TYPE_CODE=ST, FACILITY_ACTIVITY_CODE=A) for size; widen via fetchSdwisFacilities({facilityTypeCodes: [...]}) into data/ for analysis runs.",
        "PWS-level join: a deactivated PWS may still own active facility rows in this table.",
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

export async function loadSdwisFacilitiesSnapshot(): Promise<SdwisFacilitySnapshot> {
  return readSnapshot();
}

export const FACILITY_TYPE_LABELS: Record<SdwisFacilityTypeCode, string> = {
  ST: "Storage",
  WL: "Well",
  IN: "Intake",
  TP: "Treatment plant",
  DS: "Distribution system",
  PC: "Pump",
  OT: "Other",
};
