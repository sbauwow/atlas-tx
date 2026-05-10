import { loadSdwisFacilities } from "../src/lib/datasets/sdwis-facilities";

async function main() {
  const rows = await loadSdwisFacilities({ live: true });
  const byType = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.facilityTypeCode] = (acc[row.facilityTypeCode] ?? 0) + 1;
    return acc;
  }, {});
  const distinctPwsids = new Set(rows.map((row) => row.pwsid)).size;
  console.log(
    JSON.stringify(
      {
        snapshotPath: "public/cache/sdwis-storage-tx.json",
        rowCount: rows.length,
        distinctPwsids,
        byType,
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
