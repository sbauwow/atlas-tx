import { createCountyDataService } from "@/lib/county-data-service";
import { createSocrataCountySource } from "@/lib/texas-open-data";

function countBy<TRecord>(records: TRecord[], selector: (record: TRecord) => string | null | undefined) {
  return records.reduce<Record<string, number>>((accumulator, record) => {
    const key = selector(record)?.trim();
    if (!key) {
      return accumulator;
    }

    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
}

function numberValue(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export const ATLAS_COUNTY_SOURCES = [
  createSocrataCountySource({
    sourceId: "permits",
    datasetId: "7fq8-wig2",
    category: "environment",
    name: "TCEQ permits",
    description: "Regulated water-quality permit records by county.",
    summarize(records: Array<{ authorization_status?: string }>) {
      const statusCounts = countBy(records, (record) => record.authorization_status);
      return {
        metrics: {
          permitCount: records.length,
          activeCount: statusCounts.Active ?? 0,
          pendingCount: statusCounts.Pending ?? 0,
          statusCounts,
        },
      };
    },
  }),
  createSocrataCountySource({
    sourceId: "water-districts",
    datasetId: "hr84-s96f",
    category: "infrastructure",
    name: "Texas water districts",
    description: "Water district registry coverage and type diversity by county.",
    summarize(records: Array<{ district_type?: string; activity_status?: string }>) {
      const typeCounts = countBy(records, (record) => record.district_type);
      const statusCounts = countBy(records, (record) => record.activity_status);
      return {
        metrics: {
          districtCount: records.length,
          typeCount: Object.keys(typeCounts).length,
          typeCounts,
          statusCounts,
        },
      };
    },
  }),
  createSocrataCountySource({
    sourceId: "cpi-investigations",
    datasetId: "waxz-c9q5",
    category: "social",
    name: "CPI investigations",
    description: "Completed abuse/neglect investigations by county and fiscal year.",
    summarize(records: Array<{ fiscal_year?: string | number; completed_investigations?: string | number }>) {
      const rows = records
        .map((record) => ({
          fiscalYear: Number(record.fiscal_year),
          completedInvestigations: numberValue(record.completed_investigations),
        }))
        .filter((record) => Number.isFinite(record.fiscalYear));
      const latest = [...rows].sort((left, right) => right.fiscalYear - left.fiscalYear)[0];
      const totalCompletedInvestigations = rows.reduce(
        (sum, record) => sum + record.completedInvestigations,
        0,
      );

      return {
        metrics: {
          rowCount: records.length,
          latestFiscalYear: latest?.fiscalYear ?? null,
          latestCompletedInvestigations: latest?.completedInvestigations ?? null,
          totalCompletedInvestigations,
        },
      };
    },
  }),
  createSocrataCountySource({
    sourceId: "county-returns",
    datasetId: "ctj5-pypw",
    category: "fiscal",
    name: "County returns",
    description: "County-level remittance and taxpayer activity context.",
    query: { limit: 5000 },
    summarize(records: Array<{ tax_description?: string; taxpayers?: string | number; total_due?: string | number }>) {
      const taxTypeCounts = countBy(records, (record) => record.tax_description);
      const totalTaxpayers = records.reduce((sum, record) => sum + numberValue(record.taxpayers), 0);
      const totalDue = records.reduce((sum, record) => sum + numberValue(record.total_due), 0);
      return {
        metrics: {
          rowCount: records.length,
          taxTypeCount: Object.keys(taxTypeCounts).length,
          taxTypeCounts,
          totalTaxpayers,
          totalDue,
        },
      };
    },
  }),
  createSocrataCountySource({
    sourceId: "sales-tax-rates",
    datasetId: "tmhs-ahbh",
    category: "fiscal",
    name: "Sales tax rates",
    description: "Jurisdiction-level sales tax rate change context.",
    query: { limit: 5000 },
    summarize(records: Array<{ city_name?: string; new_rate?: string | number; effective_date?: string }>) {
      const latestEffectiveDate = records
        .map((record) => record.effective_date)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1);
      const jurisdictionCount = new Set(
        records.map((record) => record.city_name?.trim()).filter((value): value is string => Boolean(value)),
      ).size;
      const maxRate = records.reduce((max, record) => Math.max(max, numberValue(record.new_rate)), 0);

      return {
        metrics: {
          rowCount: records.length,
          jurisdictionCount,
          latestEffectiveDate: latestEffectiveDate ?? null,
          maxRate,
        },
      };
    },
  }),
];

export function createAtlasCountyDataService() {
  return createCountyDataService({ sources: ATLAS_COUNTY_SOURCES });
}
