import { promises as fs } from "node:fs";
import path from "node:path";

import { buildCuratedCityOpenDataSnapshot, buildRankedCityOpenDataSnapshot, executeCityOpenDataRefresh } from "../src/lib/datasets/city-open-data";

async function main() {
  const snapshot = await executeCityOpenDataRefresh();
  const curated = buildCuratedCityOpenDataSnapshot(snapshot);
  const ranked = buildRankedCityOpenDataSnapshot(curated);
  const outputPath = path.join(process.cwd(), "public", "cache", "city-open-data-ranked-tx.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(ranked), "utf8");

  console.log(JSON.stringify({
    outputPath,
    generatedAt: ranked.generatedAt,
    totalRankedRowCount: ranked.summary.totalRankedRowCount,
    topPriorityCount: ranked.summary.topPriorityCount,
    priorityLaneCounts: ranked.summary.priorityLaneCounts,
    topPriorityPreview: ranked.priorityTop25.slice(0, 5).map((row) => ({
      sourceId: row.sourceId,
      datasetId: row.datasetId,
      priorityLane: row.priorityLane,
      priorityScore: row.priorityScore,
    })),
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
