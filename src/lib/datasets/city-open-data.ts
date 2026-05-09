export type CityOpenDataPortalId = "austin" | "dallas" | "houston" | "san-antonio";
export type CityOpenDataSourceType = "socrata" | "ckan";

export type CityOpenDataPortal = {
  id: CityOpenDataPortalId;
  name: string;
  host: string;
  portalUrl: string;
  sourceType: CityOpenDataSourceType;
};

export type CityOpenDataCatalogRow = {
  sourceId: CityOpenDataPortalId;
  sourceName: string;
  sourceType: CityOpenDataSourceType;
  datasetId: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  organization: string | null;
  assetType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  tagCount: number;
  resourceCount: number;
  formats: string[];
  pageUrl: string;
  apiUrl: string | null;
};

export type CityOpenDataPortalSnapshot = {
  portalId: CityOpenDataPortalId;
  portalName: string;
  portalUrl: string;
  sourceType: CityOpenDataSourceType;
  datasetCount: number;
  rowCount: number;
  rows: CityOpenDataCatalogRow[];
};

export type CityOpenDataSnapshot = {
  generatedAt: string;
  summary: {
    sourceCount: number;
    totalDatasetCount: number;
    totalRowCount: number;
  };
  sources: Record<CityOpenDataPortalId, CityOpenDataPortalSnapshot>;
};

export type CityOpenDataTheme = "water" | "permits" | "infrastructure";

export type CuratedCityOpenDataCatalogRow = CityOpenDataCatalogRow & {
  matchedThemes: CityOpenDataTheme[];
  matchReasons: string[];
};

export type CuratedCityOpenDataPortalSnapshot = Omit<CityOpenDataPortalSnapshot, "rows" | "rowCount"> & {
  rowCount: number;
  rows: CuratedCityOpenDataCatalogRow[];
};

export type CuratedCityOpenDataSnapshot = {
  generatedAt: string;
  summary: {
    sourceCount: number;
    totalDatasetCount: number;
    totalRowCount: number;
    totalMatchedRowCount: number;
    matchedByTheme: Record<CityOpenDataTheme, number>;
  };
  sources: Record<CityOpenDataPortalId, CuratedCityOpenDataPortalSnapshot>;
};

type SocrataSearchRow = {
  view?: {
    id?: string;
    name?: string;
    description?: string;
    assetType?: string;
    category?: string | null;
    createdAt?: number;
    lastModified?: number;
    tags?: string[];
    owner?: { displayName?: string };
  };
};

type SocrataSearchResponse = {
  count?: number;
  results?: SocrataSearchRow[];
};

type CkanTag = { display_name?: string; name?: string };
type CkanGroup = { display_name?: string; title?: string; name?: string };
type CkanResource = { format?: string; url?: string };
type CkanOrganization = { title?: string; name?: string };

type CkanPackage = {
  id?: string;
  name?: string;
  title?: string;
  notes?: string;
  metadata_created?: string;
  metadata_modified?: string;
  organization?: CkanOrganization;
  tags?: CkanTag[];
  resources?: CkanResource[];
  groups?: CkanGroup[];
  type?: string;
};

type CkanPackageSearchResponse = {
  help?: string;
  success?: boolean;
  result?: {
    count?: number;
    results?: CkanPackage[];
  };
};

export const CITY_OPEN_DATA_PORTALS: Record<CityOpenDataPortalId, CityOpenDataPortal> = {
  austin: {
    id: "austin",
    name: "City of Austin Open Data",
    host: "data.austintexas.gov",
    portalUrl: "https://data.austintexas.gov/",
    sourceType: "socrata",
  },
  dallas: {
    id: "dallas",
    name: "City of Dallas OpenData",
    host: "www.dallasopendata.com",
    portalUrl: "https://www.dallasopendata.com/",
    sourceType: "socrata",
  },
  houston: {
    id: "houston",
    name: "City of Houston Open Data",
    host: "data.houstontx.gov",
    portalUrl: "https://data.houstontx.gov/",
    sourceType: "ckan",
  },
  "san-antonio": {
    id: "san-antonio",
    name: "Open Data SA",
    host: "data.sanantonio.gov",
    portalUrl: "https://data.sanantonio.gov/",
    sourceType: "ckan",
  },
};

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeArray(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b));
}

function epochSecondsToIso(value: number | undefined): string | null {
  return typeof value === "number" && Number.isFinite(value) ? new Date(value * 1000).toISOString() : null;
}

function stringDateToIso(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function datasetSlugFromName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const CURATION_THEME_KEYWORDS: Record<CityOpenDataTheme, string[]> = {
  water: ["water", "wastewater", "stormwater", "sewer", "flood", "drainage", "utility", "utilities"],
  permits: ["permit", "permits", "inspection", "inspections", "construction permit", "building permit"],
  infrastructure: ["infrastructure", "capital improvement", "capital project", "road", "roads", "bridge", "bridges", "main break", "repair"],
};

function collectHaystack(row: CityOpenDataCatalogRow): Array<[string, string]> {
  return [
    ["name", row.name],
    ["description", row.description ?? ""],
    ["category", row.category ?? ""],
    ["organization", row.organization ?? ""],
  ];
}

function classifyCityDataset(row: CityOpenDataCatalogRow): { matchedThemes: CityOpenDataTheme[]; matchReasons: string[] } {
  const haystack = collectHaystack(row).map(([field, value]) => [field, value.toLowerCase()] as const);
  const matchedThemes: CityOpenDataTheme[] = [];
  const matchReasons: string[] = [];

  for (const [theme, keywords] of Object.entries(CURATION_THEME_KEYWORDS) as Array<[CityOpenDataTheme, string[]]>) {
    const themeReasons = new Set<string>();
    for (const keyword of keywords) {
      for (const [field, value] of haystack) {
        if (value.includes(keyword)) {
          themeReasons.add(`${field}:${keyword}`);
        }
      }
    }
    if (themeReasons.size) {
      matchedThemes.push(theme);
      matchReasons.push(...Array.from(themeReasons).sort((left, right) => left.localeCompare(right)));
    }
  }

  return { matchedThemes, matchReasons };
}

export function normalizeSocrataDataset(portal: CityOpenDataPortal, row: SocrataSearchRow): CityOpenDataCatalogRow {
  const view = row.view ?? {};
  const datasetId = normalizeText(view.id) ?? "unknown";
  const name = normalizeText(view.name) ?? datasetId;
  const slug = datasetSlugFromName(datasetId);
  const tags = Array.isArray(view.tags) ? view.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0) : [];
  return {
    sourceId: portal.id,
    sourceName: portal.name,
    sourceType: portal.sourceType,
    datasetId,
    slug,
    name,
    description: normalizeText(view.description),
    category: normalizeText(view.category),
    organization: normalizeText(view.owner?.displayName),
    assetType: normalizeText(view.assetType),
    createdAt: epochSecondsToIso(view.createdAt),
    updatedAt: epochSecondsToIso(view.lastModified),
    tagCount: tags.length,
    resourceCount: 1,
    formats: ["JSON"],
    pageUrl: `https://${portal.host}/d/${datasetId}`,
    apiUrl: `https://${portal.host}/resource/${datasetId}.json`,
  };
}

export function normalizeCkanDataset(portal: CityOpenDataPortal, row: CkanPackage): CityOpenDataCatalogRow {
  const datasetId = normalizeText(row.id) ?? normalizeText(row.name) ?? "unknown";
  const slug = normalizeText(row.name) ?? datasetSlugFromName(datasetId);
  const tags = normalizeArray((row.tags ?? []).map((tag) => normalizeText(tag.display_name) ?? normalizeText(tag.name) ?? null));
  const formats = normalizeArray((row.resources ?? []).map((resource) => normalizeText(resource.format)));
  const category = normalizeText(row.groups?.[0]?.display_name) ?? normalizeText(row.groups?.[0]?.title) ?? normalizeText(row.groups?.[0]?.name);
  return {
    sourceId: portal.id,
    sourceName: portal.name,
    sourceType: portal.sourceType,
    datasetId,
    slug,
    name: normalizeText(row.title) ?? slug,
    description: normalizeText(row.notes),
    category,
    organization: normalizeText(row.organization?.title) ?? normalizeText(row.organization?.name),
    assetType: normalizeText(row.type) ?? "dataset",
    createdAt: stringDateToIso(row.metadata_created),
    updatedAt: stringDateToIso(row.metadata_modified),
    tagCount: tags.length,
    resourceCount: row.resources?.length ?? 0,
    formats,
    pageUrl: `https://${portal.host}/dataset/${slug}`,
    apiUrl: null,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}) for ${url}`);
  }
  return await response.json() as T;
}

export async function fetchSocrataPortal(portal: CityOpenDataPortal, pageSize = 1000): Promise<SocrataSearchResponse> {
  let page = 1;
  let count = 0;
  const results: SocrataSearchRow[] = [];

  while (true) {
    const url = new URL(`https://${portal.host}/api/search/views.json`);
    url.searchParams.set("q", "");
    url.searchParams.set("limit", String(pageSize));
    url.searchParams.set("page", String(page));
    const payload = await fetchJson<SocrataSearchResponse>(url.toString());
    count = payload.count ?? count;
    const batch = payload.results ?? [];
    results.push(...batch);
    if (batch.length < pageSize) break;
    page += 1;
  }

  return { count, results };
}

export async function fetchCkanPortal(portal: CityOpenDataPortal, pageSize = 1000): Promise<CkanPackageSearchResponse> {
  let start = 0;
  let count = 0;
  const results: CkanPackage[] = [];

  while (true) {
    const url = new URL(`https://${portal.host}/api/3/action/package_search`);
    url.searchParams.set("rows", String(pageSize));
    url.searchParams.set("start", String(start));
    const payload = await fetchJson<CkanPackageSearchResponse>(url.toString());
    const batch = payload.result?.results ?? [];
    count = payload.result?.count ?? count;
    results.push(...batch);
    if (batch.length < pageSize) break;
    start += pageSize;
  }

  return { success: true, result: { count, results } };
}

export async function executeCityOpenDataRefresh(options?: {
  generatedAt?: string;
  fetchSocrataPortal?: (portal: CityOpenDataPortal) => Promise<SocrataSearchResponse>;
  fetchCkanPortal?: (portal: CityOpenDataPortal) => Promise<CkanPackageSearchResponse>;
}): Promise<CityOpenDataSnapshot> {
  const generatedAt = options?.generatedAt ?? new Date().toISOString();
  const socrataFetcher = options?.fetchSocrataPortal ?? fetchSocrataPortal;
  const ckanFetcher = options?.fetchCkanPortal ?? fetchCkanPortal;

  const entries = await Promise.all(Object.values(CITY_OPEN_DATA_PORTALS).map(async (portal) => {
    if (portal.sourceType === "socrata") {
      const payload = await socrataFetcher(portal);
      const rows = (payload.results ?? []).map((row) => normalizeSocrataDataset(portal, row));
      return [portal.id, {
        portalId: portal.id,
        portalName: portal.name,
        portalUrl: portal.portalUrl,
        sourceType: portal.sourceType,
        datasetCount: payload.count ?? rows.length,
        rowCount: rows.length,
        rows,
      } satisfies CityOpenDataPortalSnapshot] as const;
    }

    const payload = await ckanFetcher(portal);
    const rows = (payload.result?.results ?? []).map((row) => normalizeCkanDataset(portal, row));
    return [portal.id, {
      portalId: portal.id,
      portalName: portal.name,
      portalUrl: portal.portalUrl,
      sourceType: portal.sourceType,
      datasetCount: payload.result?.count ?? rows.length,
      rowCount: rows.length,
      rows,
    } satisfies CityOpenDataPortalSnapshot] as const;
  }));

  const sources = Object.fromEntries(entries) as Record<CityOpenDataPortalId, CityOpenDataPortalSnapshot>;
  return {
    generatedAt,
    summary: {
      sourceCount: entries.length,
      totalDatasetCount: Object.values(sources).reduce((sum, source) => sum + source.datasetCount, 0),
      totalRowCount: Object.values(sources).reduce((sum, source) => sum + source.rowCount, 0),
    },
    sources,
  };
}

export function buildCuratedCityOpenDataSnapshot(snapshot: CityOpenDataSnapshot): CuratedCityOpenDataSnapshot {
  const matchedByTheme: Record<CityOpenDataTheme, number> = {
    water: 0,
    permits: 0,
    infrastructure: 0,
  };

  const sources = Object.fromEntries(Object.entries(snapshot.sources).map(([portalId, portal]) => {
    const rows = portal.rows
      .map((row) => {
        const match = classifyCityDataset(row);
        if (!match.matchedThemes.length) return null;
        match.matchedThemes.forEach((theme) => {
          matchedByTheme[theme] += 1;
        });
        return {
          ...row,
          matchedThemes: match.matchedThemes,
          matchReasons: match.matchReasons,
        } satisfies CuratedCityOpenDataCatalogRow;
      })
      .filter((row): row is CuratedCityOpenDataCatalogRow => Boolean(row));

    return [portalId, {
      ...portal,
      rowCount: rows.length,
      rows,
    } satisfies CuratedCityOpenDataPortalSnapshot] as const;
  })) as Record<CityOpenDataPortalId, CuratedCityOpenDataPortalSnapshot>;

  return {
    generatedAt: snapshot.generatedAt,
    summary: {
      ...snapshot.summary,
      totalMatchedRowCount: Object.values(sources).reduce((sum, source) => sum + source.rowCount, 0),
      matchedByTheme,
    },
    sources,
  };
}
