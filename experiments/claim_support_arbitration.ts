import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const DEFAULT_DATASET_PATH = "data/claim-support/claim_support_arbitration_dataset.json";
export const OUTPUT_SCAFFOLD_MARKDOWN_PATH = "outputs/research/2026-05-10-claim-support-arbitration-scaffold.md";
export const OUTPUT_SCAFFOLD_JSON_PATH = "outputs/research/2026-05-10-claim-support-arbitration-scaffold.json";
export const OUTPUT_EVAL_MARKDOWN_PATH = "outputs/research/2026-05-10-claim-support-arbitration-eval.md";
export const OUTPUT_EVAL_JSON_PATH = "outputs/research/2026-05-10-claim-support-arbitration-eval.json";

export type ImageQualityLabel = "valid" | "marginal" | "invalid";
export type ReadabilityLabel = "readable" | "uncertain" | "unreadable";
export type HumanBandLabel = number | null;
export type ArbitrationArmId = "A0_single_reader" | "A1_qa_only" | "A2_second_reader_only" | "A3_full_workflow";
export type PredictedState = "accepted" | "accepted_warn" | "review" | "rejected";

export type ArbitrationCaseRow = {
  id: string;
  stripBrand: string | null;
  chartVisible: boolean;
  imageQualityLabel: ImageQualityLabel;
  readabilityLabel: ReadabilityLabel;
  clientBandByAnalyte: Record<string, HumanBandLabel>;
  secondReaderBandByAnalyte: Record<string, HumanBandLabel>;
  manualBandByAnalyte: Record<string, HumanBandLabel>;
  qaFlags: string[];
  notes?: string | null;
};

export type ArbitrationDatasetSummary = {
  totalRows: number;
  withChartVisible: number;
  imageQualityCounts: Record<ImageQualityLabel, number>;
  readabilityCounts: Record<ReadabilityLabel, number>;
  rowsWithAnyManualBand: number;
  rowsWithAnyQaFlag: number;
};

export type ArmMetrics = {
  acceptedishCount: number;
  reviewOrRejectedCount: number;
  falseAcceptRateOnProblemCases: number | null;
  acceptedPrecision: number | null;
  invalidCaptureRecall: number | null;
  reviewRejectedEnrichment: number | null;
};

export type ArmResult = { arm: ArbitrationArmId; metrics: ArmMetrics };

function makeEmptySummary(): ArbitrationDatasetSummary {
  return {
    totalRows: 0,
    withChartVisible: 0,
    imageQualityCounts: { valid: 0, marginal: 0, invalid: 0 },
    readabilityCounts: { readable: 0, uncertain: 0, unreadable: 0 },
    rowsWithAnyManualBand: 0,
    rowsWithAnyQaFlag: 0,
  };
}

export function summarizeArbitrationDataset(rows: ArbitrationCaseRow[]): ArbitrationDatasetSummary {
  const summary = makeEmptySummary();
  summary.totalRows = rows.length;
  for (const row of rows) {
    if (row.chartVisible) summary.withChartVisible += 1;
    summary.imageQualityCounts[row.imageQualityLabel] += 1;
    summary.readabilityCounts[row.readabilityLabel] += 1;
    if (Object.values(row.manualBandByAnalyte).some((value) => value !== null)) summary.rowsWithAnyManualBand += 1;
    if (row.qaFlags.length > 0) summary.rowsWithAnyQaFlag += 1;
  }
  return summary;
}

export function scaffoldExampleRows(): ArbitrationCaseRow[] {
  return [
    {
      id: "example-good-001",
      stripBrand: "JED Pool Tools 5-way",
      chartVisible: true,
      imageQualityLabel: "valid",
      readabilityLabel: "readable",
      clientBandByAnalyte: { free_chlorine: 2, total_alkalinity: 1, ph: 3, total_hardness: 1 },
      secondReaderBandByAnalyte: { free_chlorine: 2, total_alkalinity: 1, ph: 3, total_hardness: 1 },
      manualBandByAnalyte: { free_chlorine: 2, total_alkalinity: 1, ph: 3, total_hardness: 1 },
      qaFlags: [],
      notes: "Clean daylight capture with chart fully visible.",
    },
    {
      id: "example-bad-001",
      stripBrand: "JED Pool Tools 5-way",
      chartVisible: false,
      imageQualityLabel: "invalid",
      readabilityLabel: "unreadable",
      clientBandByAnalyte: { free_chlorine: 2, total_alkalinity: 3, ph: 2, total_hardness: 0 },
      secondReaderBandByAnalyte: { free_chlorine: null, total_alkalinity: null, ph: null, total_hardness: null },
      manualBandByAnalyte: { free_chlorine: null, total_alkalinity: null, ph: null, total_hardness: null },
      qaFlags: ["blur", "low-light", "no-chart-detected"],
      notes: "Illustrative invalid sample showing why review/reject states exist.",
    },
    {
      id: "example-marginal-001",
      stripBrand: "JED Pool Tools 5-way",
      chartVisible: true,
      imageQualityLabel: "marginal",
      readabilityLabel: "uncertain",
      clientBandByAnalyte: { free_chlorine: 1, total_alkalinity: 2, ph: 3, total_hardness: 1 },
      secondReaderBandByAnalyte: { free_chlorine: 2, total_alkalinity: 2, ph: 2, total_hardness: 1 },
      manualBandByAnalyte: { free_chlorine: null, total_alkalinity: 2, ph: null, total_hardness: 1 },
      qaFlags: ["saturation-clip"],
      notes: "Illustrative uncertain sample with partial disagreement and warning-level quality issue.",
    },
  ];
}

async function loadDataset(datasetPath: string): Promise<ArbitrationCaseRow[]> {
  const raw = await fs.readFile(path.resolve(process.cwd(), datasetPath), "utf8");
  const parsed = JSON.parse(raw) as ArbitrationCaseRow[];
  if (!Array.isArray(parsed)) throw new Error(`Expected an array in ${datasetPath}`);
  return parsed;
}

export function computeAgreementFromBands(left: Record<string, HumanBandLabel>, right: Record<string, HumanBandLabel>): number | null {
  const analytes = Array.from(new Set([...Object.keys(left), ...Object.keys(right)]));
  let scored = 0;
  let matches = 0;
  for (const analyte of analytes) {
    const l = left[analyte] ?? null;
    const r = right[analyte] ?? null;
    if (l === null || r === null) continue;
    scored += 1;
    if (l === r) matches += 1;
  }
  return scored === 0 ? null : matches / scored;
}

function hasAnyNonNullBand(bands: Record<string, HumanBandLabel>): boolean {
  return Object.values(bands).some((value) => value !== null);
}

function hasFlag(row: ArbitrationCaseRow, flags: string[]): boolean {
  const set = new Set(row.qaFlags);
  return flags.some((flag) => set.has(flag));
}

function isProblemCase(row: ArbitrationCaseRow): boolean {
  return row.imageQualityLabel === "invalid" || row.readabilityLabel === "unreadable" || row.readabilityLabel === "uncertain";
}

function isAcceptedish(state: PredictedState): boolean {
  return state === "accepted" || state === "accepted_warn";
}

export function predictArmState(row: ArbitrationCaseRow, arm: ArbitrationArmId): PredictedState {
  const fatal = hasFlag(row, ["blur", "low-light", "no-chart-detected"]);
  const warn = hasFlag(row, ["glare", "saturation-clip", "underfill"]);
  const agreement = computeAgreementFromBands(row.clientBandByAnalyte, row.secondReaderBandByAnalyte);
  const clientAvailable = hasAnyNonNullBand(row.clientBandByAnalyte);
  const secondAvailable = hasAnyNonNullBand(row.secondReaderBandByAnalyte);

  switch (arm) {
    case "A0_single_reader":
      return clientAvailable ? "accepted" : "review";
    case "A1_qa_only":
      if (fatal) return "rejected";
      return warn ? "accepted_warn" : "accepted";
    case "A2_second_reader_only":
      return secondAvailable ? "accepted" : "review";
    case "A3_full_workflow":
      if (fatal) return "rejected";
      if (!secondAvailable || agreement === null) return "review";
      if (agreement >= 0.7 && !warn) return "accepted";
      if (agreement >= 0.7 && warn) return "accepted_warn";
      if (agreement >= 0.4) return "accepted_warn";
      return "review";
  }
}

export function evaluateArbitrationArm(rows: ArbitrationCaseRow[], arm: ArbitrationArmId): ArmResult {
  const predicted = rows.map((row) => ({ row, state: predictArmState(row, arm) }));
  const problemRows = predicted.filter(({ row }) => isProblemCase(row));
  const invalidRows = predicted.filter(({ row }) => row.imageQualityLabel === "invalid");
  const acceptedishRows = predicted.filter(({ state }) => isAcceptedish(state));
  const reviewRejectedRows = predicted.filter(({ state }) => !isAcceptedish(state));

  const falseAccepts = problemRows.filter(({ state }) => isAcceptedish(state)).length;
  const acceptedTrueNonProblem = acceptedishRows.filter(({ row }) => !isProblemCase(row)).length;
  const invalidProperlyCaught = invalidRows.filter(({ state }) => !isAcceptedish(state)).length;
  const reviewRejectedProblem = reviewRejectedRows.filter(({ row }) => isProblemCase(row)).length;

  return {
    arm,
    metrics: {
      acceptedishCount: acceptedishRows.length,
      reviewOrRejectedCount: reviewRejectedRows.length,
      falseAcceptRateOnProblemCases: problemRows.length ? falseAccepts / problemRows.length : null,
      acceptedPrecision: acceptedishRows.length ? acceptedTrueNonProblem / acceptedishRows.length : null,
      invalidCaptureRecall: invalidRows.length ? invalidProperlyCaught / invalidRows.length : null,
      reviewRejectedEnrichment: reviewRejectedRows.length ? reviewRejectedProblem / reviewRejectedRows.length : null,
    },
  };
}

export function evaluateArbitrationBenchmark(rows: ArbitrationCaseRow[]): ArmResult[] {
  const arms: ArbitrationArmId[] = ["A0_single_reader", "A1_qa_only", "A2_second_reader_only", "A3_full_workflow"];
  return arms.map((arm) => evaluateArbitrationArm(rows, arm));
}

function formatMetric(value: number | null): string {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function buildScaffoldMarkdown(summary: ArbitrationDatasetSummary, datasetPath: string, hasRealDataset: boolean): string {
  return `# Claim-support arbitration scaffold\n\nGenerated: ${new Date().toISOString()}\n\n## Dataset status\n\n- Dataset path: \`${datasetPath}\`\n- Real dataset loaded: **${hasRealDataset ? "yes" : "no"}**\n- Total rows: **${summary.totalRows}**\n- Chart visible rows: **${summary.withChartVisible}**\n- Rows with any manual analyte band: **${summary.rowsWithAnyManualBand}**\n- Rows with any QA flag: **${summary.rowsWithAnyQaFlag}**\n`;
}

function buildEvalMarkdown(summary: ArbitrationDatasetSummary, datasetPath: string, hasRealDataset: boolean, results: ArmResult[]): string {
  const lines = results.map(({ arm, metrics }) => `| ${arm} | ${metrics.acceptedishCount} | ${metrics.reviewOrRejectedCount} | ${formatMetric(metrics.falseAcceptRateOnProblemCases)} | ${formatMetric(metrics.acceptedPrecision)} | ${formatMetric(metrics.invalidCaptureRecall)} | ${formatMetric(metrics.reviewRejectedEnrichment)} |`).join("\n");
  return `# Claim-support arbitration evaluation\n\nGenerated: ${new Date().toISOString()}\n\n- Dataset path: \`${datasetPath}\`\n- Real dataset loaded: **${hasRealDataset ? "yes" : "no"}**\n- Total rows: **${summary.totalRows}**\n\n| Arm | Accepted-ish count | Review/rejected count | False accept rate on problem cases | Accepted precision | Invalid capture recall | Review/rejected enrichment |\n|---|---:|---:|---:|---:|---:|---:|\n${lines}\n`;
}

export async function runClaimSupportArbitrationScaffold(datasetPath = DEFAULT_DATASET_PATH) {
  let rows: ArbitrationCaseRow[];
  let hasRealDataset = true;
  try {
    rows = await loadDataset(datasetPath);
  } catch {
    rows = scaffoldExampleRows();
    hasRealDataset = false;
  }
  const summary = summarizeArbitrationDataset(rows);
  const results = evaluateArbitrationBenchmark(rows);
  const scaffoldPayload = { generatedAt: new Date().toISOString(), datasetPath, hasRealDataset, summary };
  const evalPayload = { generatedAt: new Date().toISOString(), datasetPath, hasRealDataset, summary, results };
  await fs.mkdir(path.dirname(path.resolve(process.cwd(), OUTPUT_SCAFFOLD_MARKDOWN_PATH)), { recursive: true });
  await fs.writeFile(path.resolve(process.cwd(), OUTPUT_SCAFFOLD_MARKDOWN_PATH), buildScaffoldMarkdown(summary, datasetPath, hasRealDataset));
  await fs.writeFile(path.resolve(process.cwd(), OUTPUT_SCAFFOLD_JSON_PATH), JSON.stringify(scaffoldPayload, null, 2));
  await fs.writeFile(path.resolve(process.cwd(), OUTPUT_EVAL_MARKDOWN_PATH), buildEvalMarkdown(summary, datasetPath, hasRealDataset, results));
  await fs.writeFile(path.resolve(process.cwd(), OUTPUT_EVAL_JSON_PATH), JSON.stringify(evalPayload, null, 2));
  return evalPayload;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runClaimSupportArbitrationScaffold().then((payload) => {
    console.log(`Wrote ${OUTPUT_SCAFFOLD_MARKDOWN_PATH}`);
    console.log(`Wrote ${OUTPUT_SCAFFOLD_JSON_PATH}`);
    console.log(`Wrote ${OUTPUT_EVAL_MARKDOWN_PATH}`);
    console.log(`Wrote ${OUTPUT_EVAL_JSON_PATH}`);
    console.log(JSON.stringify(payload.summary, null, 2));
  });
}
