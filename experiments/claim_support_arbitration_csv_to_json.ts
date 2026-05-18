import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_INPUT_CSV = "data/claim-support/claim_support_arbitration_review_sheet.csv";
const DEFAULT_OUTPUT_JSON = "data/claim-support/claim_support_arbitration_dataset.json";
const OUTPUT_REPORT_PATH = "outputs/research/2026-05-10-claim-support-arbitration-csv-import-report.md";

const ANALYTES = ["free_chlorine", "total_alkalinity", "ph", "total_hardness"] as const;
const QA_FLAG_COLUMNS = {
  qa_blur: "blur",
  qa_low_light: "low-light",
  qa_saturation_clip: "saturation-clip",
  qa_glare: "glare",
  qa_underfill: "underfill",
  qa_no_chart_detected: "no-chart-detected",
} as const;

export type CsvImportRow = {
  id: string;
  image_path_or_url?: string;
  stripBrand?: string;
  chartVisible: string;
  imageQualityLabel: string;
  readabilityLabel: string;
  client_free_chlorine_band?: string;
  client_total_alkalinity_band?: string;
  client_ph_band?: string;
  client_total_hardness_band?: string;
  second_free_chlorine_band?: string;
  second_total_alkalinity_band?: string;
  second_ph_band?: string;
  second_total_hardness_band?: string;
  manual_free_chlorine_band?: string;
  manual_total_alkalinity_band?: string;
  manual_ph_band?: string;
  manual_total_hardness_band?: string;
  qa_blur?: string;
  qa_low_light?: string;
  qa_saturation_clip?: string;
  qa_glare?: string;
  qa_underfill?: string;
  qa_no_chart_detected?: string;
  notes?: string;
};

export type JsonBenchmarkRow = {
  id: string;
  stripBrand: string | null;
  chartVisible: boolean;
  imageQualityLabel: "valid" | "marginal" | "invalid";
  readabilityLabel: "readable" | "uncertain" | "unreadable";
  clientBandByAnalyte: Record<string, number | null>;
  secondReaderBandByAnalyte: Record<string, number | null>;
  manualBandByAnalyte: Record<string, number | null>;
  qaFlags: string[];
  notes?: string | null;
};

function parseCsv(text: string): CsvImportRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0] ?? "");
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ""])) as CsvImportRow;
  });
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
}

function parseBoolean(value: string, field: string): boolean {
  const v = value.trim().toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  throw new Error(`Field ${field} must be true or false, got: ${value}`);
}

function parseEnum<T extends string>(value: string, allowed: readonly T[], field: string): T {
  const v = value.trim() as T;
  if (allowed.includes(v)) return v;
  throw new Error(`Field ${field} must be one of ${allowed.join(", ")}, got: ${value}`);
}

function parseNullableInt(value: string | undefined): number | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) throw new Error(`Expected integer band or blank, got: ${value}`);
  return parsed;
}

function normalizeOptionalString(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function analyteKey(prefix: "client" | "second" | "manual", analyte: typeof ANALYTES[number]): keyof CsvImportRow {
  return `${prefix}_${analyte}_band` as keyof CsvImportRow;
}

export function convertCsvRows(rows: CsvImportRow[]): JsonBenchmarkRow[] {
  return rows.map((row) => {
    const clientBandByAnalyte: Record<string, number | null> = {};
    const secondReaderBandByAnalyte: Record<string, number | null> = {};
    const manualBandByAnalyte: Record<string, number | null> = {};
    for (const analyte of ANALYTES) {
      clientBandByAnalyte[analyte] = parseNullableInt(row[analyteKey("client", analyte)] as string | undefined);
      secondReaderBandByAnalyte[analyte] = parseNullableInt(row[analyteKey("second", analyte)] as string | undefined);
      manualBandByAnalyte[analyte] = parseNullableInt(row[analyteKey("manual", analyte)] as string | undefined);
    }

    const qaFlags = Object.entries(QA_FLAG_COLUMNS)
      .filter(([column]) => parseBoolean((row[column as keyof CsvImportRow] as string | undefined) ?? "false", column))
      .map(([, flag]) => flag);

    return {
      id: row.id.trim(),
      stripBrand: normalizeOptionalString(row.stripBrand),
      chartVisible: parseBoolean(row.chartVisible, "chartVisible"),
      imageQualityLabel: parseEnum(row.imageQualityLabel, ["valid", "marginal", "invalid"], "imageQualityLabel"),
      readabilityLabel: parseEnum(row.readabilityLabel, ["readable", "uncertain", "unreadable"], "readabilityLabel"),
      clientBandByAnalyte,
      secondReaderBandByAnalyte,
      manualBandByAnalyte,
      qaFlags,
      notes: normalizeOptionalString(row.notes),
    };
  });
}

function buildReport(inputCsv: string, outputJson: string, rowCount: number): string {
  return `# Claim-support arbitration CSV import report\n\nGenerated: ${new Date().toISOString()}\n\n## Conversion summary\n\n- Input CSV: \`${inputCsv}\`\n- Output JSON: \`${outputJson}\`\n- Rows converted: **${rowCount}**\n\n## Conversion rules applied\n\n- blank analyte band cells become \`null\`\n- QA boolean columns are converted into the \`qaFlags\` array\n- empty notes become \`null\`\n- only exact \`true\` / \`false\` are accepted for boolean columns\n- image quality and readability labels must match the benchmark rubric exactly\n\n## Recommended next step\n\nRun:\n\n\`npm run analyze:claim-support-arbitration\`\n\nto evaluate the newly converted JSON benchmark dataset.\n`;
}

export async function runClaimSupportArbitrationCsvImport(
  inputCsv = DEFAULT_INPUT_CSV,
  outputJson = DEFAULT_OUTPUT_JSON,
) {
  const csvText = await fs.readFile(path.resolve(process.cwd(), inputCsv), "utf8");
  const csvRows = parseCsv(csvText);
  const jsonRows = convertCsvRows(csvRows);
  await fs.mkdir(path.dirname(path.resolve(process.cwd(), outputJson)), { recursive: true });
  await fs.writeFile(path.resolve(process.cwd(), outputJson), JSON.stringify(jsonRows, null, 2));
  await fs.mkdir(path.dirname(path.resolve(process.cwd(), OUTPUT_REPORT_PATH)), { recursive: true });
  await fs.writeFile(path.resolve(process.cwd(), OUTPUT_REPORT_PATH), buildReport(inputCsv, outputJson, jsonRows.length));
  return { inputCsv, outputJson, rowCount: jsonRows.length };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runClaimSupportArbitrationCsvImport().then((result) => {
    console.log(`Converted ${result.rowCount} rows`);
    console.log(`Wrote ${result.outputJson}`);
    console.log(`Wrote ${OUTPUT_REPORT_PATH}`);
  });
}
