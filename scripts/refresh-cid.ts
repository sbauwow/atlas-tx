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

export function buildDefaultCidRefreshPlan(
  options: RefreshCidCliOptions,
) {
  return buildCidSearchOneRefreshPlan({
    counties: options.counties,
    programAreas: options.programAreas,
    resultsPerPage: options.resultsPerPage ?? 25,
  });
}

export function buildCidRefreshSearchTwoParams() {
  return {
    itemStatus: 'open' as const,
    organizationName: '',
    permitNumber: '',
    firstName: '',
    lastName: '',
    resultsPerPage: 25 as const,
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

export async function executeCidRefresh(options: RefreshCidCliOptions & {
  generatedAt?: string;
  fetchSearchOneHtml?: typeof fetchCidSearchOneHtml;
  fetchSearchTwoHtml?: typeof fetchCidSearchTwoHtml;
  parseSearchOneHtml?: typeof parseCidCasesHtml;
  parseSearchTwoHtml?: typeof parseCidProtestsHtml;
}) {
  const searchOnePlan = buildDefaultCidRefreshPlan(options);
  const searchTwoParams = buildCidRefreshSearchTwoParams();
  const fetchOne = options.fetchSearchOneHtml ?? fetchCidSearchOneHtml;
  const fetchTwo = options.fetchSearchTwoHtml ?? fetchCidSearchTwoHtml;
  const parseOne = options.parseSearchOneHtml ?? parseCidCasesHtml;
  const parseTwo = options.parseSearchTwoHtml ?? parseCidProtestsHtml;
  const generatedAt = options.generatedAt ?? new Date().toISOString();

  const caseRows = dedupeByJson(
    (
      await Promise.all(
        searchOnePlan.map(async (params) => parseOne(await fetchOne(params))),
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
  const refreshResult = await executeCidRefresh({
    counties: [],
    programAreas: [],
    resultsPerPage: 25,
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
