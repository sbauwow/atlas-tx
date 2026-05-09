import { normalizeCountyName } from "@/lib/counties";

const CID_BASE_URL = "https://www14.tceq.texas.gov/epic/eCID/index.cfm";
const CID_RESULTS_URL = `${CID_BASE_URL}?fuseaction=main.reportResults`;

export type CidCaseRow = {
  tceqId: string;
  applicantName: string;
  county: string | null;
  programArea: string;
  itemStatus: "open" | "closed";
  tceqDocketNumber: string | null;
  soahDocketNumber: string | null;
  regulatedEntityNumber: string | null;
  customerNumber: string | null;
};

export type CidProtestRow = {
  tceqId: string;
  filingType: "comment" | "hearing_request" | "public_meeting_request";
  filerOrganization: string | null;
  filedAt: string;
};

export type CidSearchOneParams = {
  actions?: "open" | "all";
  sort?: "app" | "id" | "county";
  applicantName?: string;
  idNumber?: string;
  docketNumber?: string;
  entityNumber?: string;
  programArea?: string;
  county?: string;
  region?: string;
  regNumber?: string;
  customerNumber?: string;
  resultsPerPage?: 5 | 10 | 15 | 20 | 25;
  includeFilings?: boolean;
  includeProtestants?: boolean;
};

export type CidSearchTwoParams = {
  itemStatus?: "open" | "all";
  firstName?: string;
  lastName?: string;
  permitNumber?: string;
  organizationName?: string;
  resultsPerPage?: 5 | 10 | 15 | 20 | 25;
};

function decodeHtml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/g, "'");
}

function stripTags(value: string): string {
  return decodeHtml(value)
    .replace(/<br\s*\/?>(\s*)/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function coerceString(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function extractTableRows(html: string): string[][] {
  const rows: string[][] = [];
  const trMatches = html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi);
  for (const match of trMatches) {
    const inner = match[1];
    if (/<th\b/i.test(inner)) continue;
    const cells = [...inner.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      stripTags(m[1]),
    );
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

function extractTceqId(cell: string): string {
  return cell.split(" - ")[0]?.trim() ?? cell.trim();
}

function extractFiledAt(cell: string): string {
  const match = cell.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) throw new Error(`CID protest row missing parseable filed date: ${cell}`);
  return `${match[3]}-${match[1]}-${match[2]}`;
}

function extractOrganization(description: string): string | null {
  const patterns = [
    /(Sierra Club[^.,;]*)/i,
    /(Public Citizen)(?=\s+(?:requests?|filed|submitted)\b|[.,;]|$)/i,
    /Respectfully,\s*[^,]+,\s*([^.,;]+(?:Chapter|Coalition|Alliance|Committee|Association))/i,
  ];
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match?.[1]) return coerceString(match[1]) ?? null;
  }
  return null;
}

function mapItemStatus(cell: string): CidCaseRow["itemStatus"] {
  return /closed/i.test(cell) ? "closed" : "open";
}

function mapFilingType(cell: string): CidProtestRow["filingType"] {
  const value = cell.toLowerCase();
  if (value.includes("hearing request")) return "hearing_request";
  if (value.includes("public meeting")) return "public_meeting_request";
  return "comment";
}

export function parseCidCasesHtml(html: string): CidCaseRow[] {
  return extractTableRows(html)
    .filter((cells) => cells.length >= 5)
    .map((cells) => ({
      tceqId: extractTceqId(cells[0] ?? ""),
      applicantName: cells[1] ?? "",
      county: coerceString(cells[2]) ? normalizeCountyName(cells[2]!) : null,
      programArea: cells[3] ?? "",
      itemStatus: mapItemStatus(cells[4] ?? ""),
      tceqDocketNumber: coerceString(cells[5]),
      soahDocketNumber: coerceString(cells[6]),
      regulatedEntityNumber: coerceString(cells[7]),
      customerNumber: coerceString(cells[8]),
    }))
    .filter((row) => row.tceqId.length > 0 && row.applicantName.length > 0);
}

export function parseCidProtestsHtml(html: string): CidProtestRow[] {
  return extractTableRows(html)
    .filter((cells) => cells.length >= 7)
    .map((cells) => {
      const description = cells[6] ?? "";
      return {
        tceqId: extractTceqId(cells[0] ?? ""),
        filingType: mapFilingType(cells[5] ?? ""),
        filerOrganization: extractOrganization(description),
        filedAt: extractFiledAt(cells[4] ?? ""),
      };
    })
    .filter((row) => row.tceqId.length > 0);
}

async function assertOk(res: Response, url: string): Promise<string> {
  if (!res.ok) {
    throw new Error(`CID fetch failed (${res.status}) for ${url}`);
  }
  return await res.text();
}

function getSetCookieHeaders(res: Response): string[] {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

function cookieHeaderFromSetCookie(values: string[]): string | undefined {
  const cookies = values
    .map((value) => value.split(";", 1)[0]?.trim())
    .filter((value): value is string => Boolean(value));
  return cookies.length ? cookies.join("; ") : undefined;
}

async function warmCidSession(): Promise<string | undefined> {
  const res = await fetch(CID_BASE_URL, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0",
    },
  });
  await assertOk(res, CID_BASE_URL);
  return cookieHeaderFromSetCookie(getSetCookieHeaders(res));
}

function buildSearchOneBody(params: CidSearchOneParams = {}): string {
  const body = new URLSearchParams({
    Actions: params.actions ?? "open",
    Sort: params.sort ?? "app",
    ApplicantName: params.applicantName ?? "",
    IdNumber: params.idNumber ?? "",
    DocketNumber: params.docketNumber ?? "",
    EntityNumber: params.entityNumber ?? "",
    ProgramArea: params.programArea ?? "none",
    County: params.county ?? "",
    Region: params.region ?? "",
    RegNumber: params.regNumber ?? "",
    CustomerNumber: params.customerNumber ?? "",
    Results: String(params.resultsPerPage ?? 25),
    Search: "Search",
  });
  if (params.includeFilings) body.set("Filings", "YES");
  if (params.includeProtestants) body.set("Protestants", "YES");
  return body.toString();
}

function buildSearchTwoBody(params: CidSearchTwoParams = {}): string {
  return new URLSearchParams({
    ItemStatus: params.itemStatus ?? "open",
    first_name: params.firstName ?? "",
    last_name: params.lastName ?? "",
    permit_num: params.permitNumber ?? "",
    org_name: params.organizationName ?? "",
    IpResults: String(params.resultsPerPage ?? 25),
    Searchip: "Search",
  }).toString();
}

async function postCid(body: string, cookieHeader?: string): Promise<string> {
  const res = await fetch(CID_RESULTS_URL, {
    method: "POST",
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: CID_BASE_URL,
      "User-Agent": "Mozilla/5.0",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body,
  });
  return await assertOk(res, CID_RESULTS_URL);
}

export async function fetchCidSearchOneHtml(
  params: CidSearchOneParams = {},
): Promise<string> {
  const cookieHeader = await warmCidSession();
  return await postCid(buildSearchOneBody(params), cookieHeader);
}

export async function fetchCidSearchTwoHtml(
  params: CidSearchTwoParams = {},
): Promise<string> {
  const cookieHeader = await warmCidSession();
  return await postCid(buildSearchTwoBody(params), cookieHeader);
}
