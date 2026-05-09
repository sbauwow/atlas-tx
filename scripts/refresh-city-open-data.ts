import { promises as fs } from "node:fs";
import path from "node:path";

import { executeCityOpenDataRefresh } from "../src/lib/datasets/city-open-data";

async function main() {
  const snapshot = await executeCityOpenDataRefresh();
  const outputPath = path.join(process.cwd(), "public", "cache", "city-open-data-tx.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(snapshot), "utf8");

  console.log(JSON.stringify({
    outputPath,
    generatedAt: snapshot.generatedAt,
    sourceCount: snapshot.summary.sourceCount,
    totalDatasetCount: snapshot.summary.totalDatasetCount,
    totalRowCount: snapshot.summary.totalRowCount,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
