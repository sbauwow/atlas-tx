import { pathToFileURL } from "node:url";

import { buildCountyInfoIndex } from "../experiments/build_county_month_water_risk_panel";
import {
  buildUsdmCountyUrl,
  parseUsdmCsv,
  summarizeUsdmWeeklyRowsToMonthly,
  USDM_COUNTY_STATS_BASE_URL,
  writeCountyMonthDroughtSnapshot,
  type CountyMonthDroughtSnapshot,
} from "@/lib/datasets/drought";

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { Accept: "text/csv,text/plain,*/*" } });
  if (!response.ok) {
    throw new Error(`USDM county request failed (${response.status}) for ${url}`);
  }
  return await response.text();
}

export async function buildCountyMonthDroughtSnapshot(options?: {
  startDate?: string;
  endDate?: string;
  generatedAt?: string;
  fetchCountyText?: (countyFips: string, startDate: string, endDate: string) => Promise<string>;
}) {
  const counties = buildCountyInfoIndex();
  const startDate = options?.startDate ?? "2020-01-01";
  const endDate = options?.endDate ?? "2025-12-31";
  const generatedAt = options?.generatedAt ?? new Date().toISOString();
  const fetchCountyText = options?.fetchCountyText ?? ((countyFips: string, s: string, e: string) => fetchText(buildUsdmCountyUrl({ countyFips, startDate: s, endDate: e })));

  const rows = [] as ReturnType<typeof summarizeUsdmWeeklyRowsToMonthly>;
  for (const county of counties) {
    const csv = await fetchCountyText(county.county_fips, startDate, endDate);
    rows.push(...summarizeUsdmWeeklyRowsToMonthly(parseUsdmCsv(csv), county.county_fips, county.county_name));
  }

  const snapshot: CountyMonthDroughtSnapshot = {
    generatedAt,
    source: USDM_COUNTY_STATS_BASE_URL,
    methodology: "Weekly U.S. Drought Monitor county statistics aggregated to county-month mean fractions in D1+ and D3+ using county-level area-based severity totals.",
    rows,
  };

  return { snapshot, countyCount: counties.length, rowCount: rows.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildCountyMonthDroughtSnapshot()
    .then(async (result) => {
      await writeCountyMonthDroughtSnapshot(result.snapshot);
      console.log(JSON.stringify({ countyCount: result.countyCount, rowCount: result.rowCount }, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
