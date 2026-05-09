import { promises as fs } from "node:fs";
import path from "node:path";

import { buildCuratedCityOpenDataSnapshot, executeCityOpenDataRefresh } from "../src/lib/datasets/city-open-data";

async function main() {
  const snapshot = await executeCityOpenDataRefresh();
  const curated = buildCuratedCityOpenDataSnapshot(snapshot);
  const outputPath = path.join(process.cwd(), "public", "cache", "city-open-data-curated-tx.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(curated), "utf8");

  console.log(JSON.stringify({
    outputPath,
    generatedAt: curated.generatedAt,
    sourceCount: curated.summary.sourceCount,
    totalDatasetCount: curated.summary.totalDatasetCount,
    totalMatchedRowCount: curated.summary.totalMatchedRowCount,
    matchedByTheme: curated.summary.matchedByTheme,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
