import {
  buildCidSearchOneRefreshPlan,
  fetchCidSearchOneHtml,
  fetchCidSearchTwoHtml,
  parseCidCasesHtml,
  parseCidProtestsHtml,
} from '../src/lib/datasets/cid';

export type RefreshCidCliOptions = {
  counties: string[];
  programAreas: string[];
  resultsPerPage?: 5 | 10 | 15 | 20 | 25;
};

export function buildCidRefreshRuntimeOptions(env: Record<string, string | undefined>) {
  const counties = (env.CID_COUNTIES ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const programAreas = (env.CID_PROGRAM_AREAS ?? '')
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    counties,
    programAreas,
    searchTwoOptions: {
      organizationName: env.CID_SEARCH_TWO_ORG_NAME ?? '',
      firstName: env.CID_SEARCH_TWO_FIRST_NAME ?? '',
      lastName: env.CID_SEARCH_TWO_LAST_NAME ?? '',
      permitNumber: env.CID_SEARCH_TWO_PERMIT_NUMBER ?? '',
      resultsPerPage: 25 as const,
    },
  };
}

export function buildDefaultCidRefreshPlan(
  options: RefreshCidCliOptions,
) {
  return buildCidSearchOneRefreshPlan({
    counties: options.counties,
    programAreas: options.programAreas,
    resultsPerPage: options.resultsPerPage ?? 25,
  });
}

export function buildCidRefreshSearchTwoParams(options?: {
  organizationName?: string;
  firstName?: string;
  lastName?: string;
  permitNumber?: string;
  resultsPerPage?: 5 | 10 | 15 | 20 | 25;
}) {
  return {
    itemStatus: 'open' as const,
    organizationName: options?.organizationName ?? '',
    permitNumber: options?.permitNumber ?? '',
    firstName: options?.firstName ?? '',
    lastName: options?.lastName ?? '',
    resultsPerPage: options?.resultsPerPage ?? 25 as const,
  };
}

export function summarizeCidRefreshPlan(input: {
  searchOnePlan: Array<{ county?: string; programArea?: string }>;
  searchTwoParams: { resultsPerPage: number };
}) {
  return {
    searchOneRequests: input.searchOnePlan.length,
    uniqueCounties: new Set(input.searchOnePlan.map((row) => row.county)).size,
    uniqueProgramAreas: new Set(input.searchOnePlan.map((row) => row.programArea)).size,
    searchTwoResultsPerPage: input.searchTwoParams.resultsPerPage,
  };
}

function dedupeByJson<T>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const key = JSON.stringify(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function assertSearchOneHtmlIsUsable(html: string) {
  if (/An unexpected error has occurred/i.test(html)) {
    throw new Error('CID Search One returned the upstream error page');
  }
}

export async function executeCidRefresh(options: RefreshCidCliOptions & {
  generatedAt?: string;
  searchTwoOptions?: Parameters<typeof buildCidRefreshSearchTwoParams>[0];
  fetchSearchOneHtml?: typeof fetchCidSearchOneHtml;
  fetchSearchTwoHtml?: typeof fetchCidSearchTwoHtml;
  parseSearchOneHtml?: typeof parseCidCasesHtml;
  parseSearchTwoHtml?: typeof parseCidProtestsHtml;
}) {
  const searchOnePlan = buildDefaultCidRefreshPlan(options);
  const searchTwoParams = buildCidRefreshSearchTwoParams(options.searchTwoOptions);
  const fetchOne = options.fetchSearchOneHtml ?? fetchCidSearchOneHtml;
  const fetchTwo = options.fetchSearchTwoHtml ?? fetchCidSearchTwoHtml;
  const parseOne = options.parseSearchOneHtml ?? parseCidCasesHtml;
  const parseTwo = options.parseSearchTwoHtml ?? parseCidProtestsHtml;
  const generatedAt = options.generatedAt ?? new Date().toISOString();

  const hasSearchTwoSeed = Boolean(
    searchTwoParams.organizationName ||
      searchTwoParams.permitNumber ||
      searchTwoParams.firstName ||
      searchTwoParams.lastName,
  );
  if (!options.fetchSearchTwoHtml && !hasSearchTwoSeed) {
    throw new Error(
      'Search Two refresh requires an organization, permit number, or person-name seed',
    );
  }

  const caseRows = dedupeByJson(
    (
      await Promise.all(
        searchOnePlan.map(async (params) => {
          const html = await fetchOne(params);
          assertSearchOneHtmlIsUsable(html);
          return parseOne(html);
        }),
      )
    ).flat(),
  );

  const protestRows = dedupeByJson(parseTwo(await fetchTwo(searchTwoParams)));

  const summary = summarizeCidRefreshPlan({ searchOnePlan, searchTwoParams });

  return {
    searchOnePlan,
    searchTwoParams,
    caseRows,
    protestRows,
    caseSnapshot: {
      generatedAt,
      source: 'https://www14.tceq.texas.gov/epic/eCID/index.cfm#searchone',
      rowCount: caseRows.length,
      rows: caseRows,
      caveats: [
        'Chunked Search One refresh by county and program area to avoid broad-query fragility.',
      ],
    },
    protestSnapshot: {
      generatedAt,
      source: 'https://www14.tceq.texas.gov/epic/eCID/index.cfm#searchtwo',
      rowCount: protestRows.length,
      rows: protestRows,
      caveats: [
        'Search Two refresh uses one broad open-items query and dedupes identical protest rows.',
      ],
    },
    summary,
  };
}

export function resolveCidSnapshotTargets(options: {
  caseBytes: number;
  protestBytes: number;
  maxCommittedBytes?: number;
}) {
  const maxCommittedBytes = options.maxCommittedBytes ?? 5_000_000;
  return {
    casePath:
      options.caseBytes > maxCommittedBytes
        ? 'data/cid-cases-tx.json'
        : 'public/cache/cid-cases-tx.json',
    protestPath:
      options.protestBytes > maxCommittedBytes
        ? 'data/cid-protests-tx.json'
        : 'public/cache/cid-protests-tx.json',
  };
}

export async function writeCidRefreshSnapshots(
  refreshResult: {
    caseSnapshot: unknown;
    protestSnapshot: unknown;
  },
  options: {
    casePath: string;
    protestPath: string;
    writeFile?: (path: string, content: string) => Promise<void>;
  },
) {
  const writeFile =
    options.writeFile ??
    (async (path: string, content: string) => {
      const fs = await import('node:fs/promises');
      await fs.mkdir((await import('node:path')).dirname(path), { recursive: true });
      await fs.writeFile(path, content);
    });

  await writeFile(options.casePath, JSON.stringify(refreshResult.caseSnapshot));
  await writeFile(options.protestPath, JSON.stringify(refreshResult.protestSnapshot));
}

export async function main() {
  const runtime = buildCidRefreshRuntimeOptions(process.env as Record<string, string | undefined>);
  const refreshResult = await executeCidRefresh({
    counties: runtime.counties,
    programAreas: runtime.programAreas,
    resultsPerPage: 25,
    searchTwoOptions: runtime.searchTwoOptions,
  });

  console.log(
    JSON.stringify(
      {
        searchOnePlan: refreshResult.searchOnePlan,
        searchTwoParams: refreshResult.searchTwoParams,
        caseSnapshot: refreshResult.caseSnapshot,
        protestSnapshot: refreshResult.protestSnapshot,
        summary: refreshResult.summary,
      },
      null,
      2,
    ),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
