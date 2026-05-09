import { buildCidSearchOneRefreshPlan } from '../src/lib/datasets/cid';

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

export async function main() {
  const searchOnePlan = buildDefaultCidRefreshPlan({
    counties: [],
    programAreas: [],
    resultsPerPage: 25,
  });
  const searchTwoParams = buildCidRefreshSearchTwoParams();

  console.log(
    JSON.stringify(
      {
        searchOnePlan,
        searchTwoParams,
        summary: summarizeCidRefreshPlan({ searchOnePlan, searchTwoParams }),
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
