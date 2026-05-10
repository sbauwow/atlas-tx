import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { buildExamples } from "./model_precipitation_ladder";

const PANEL_PATH = "data/panels/county_month_water_risk.csv";
const OUTPUT_MARKDOWN_PATH = "outputs/model-results/2026-05-09-fixed-effects-precipitation-backtest.md";
const OUTPUT_JSON_PATH = "outputs/model-results/2026-05-09-fixed-effects-precipitation-backtest.json";

type PanelRow = {
  county_fips: string;
  county_name: string;
  year: number;
  month: number;
  year_month: string;
  sdwis_event_any: number;
  sdwis_prior_1m_any: number;
  sdwis_prior_3m_count: number;
  sdwis_prior_6m_count: number;
  sdwis_prior_12m_count: number;
  sdwis_cumulative_prior_count: number;
  overflow_any: number;
  overflow_count: number;
  overflow_gallons_sum: number;
  overflow_log_gallons_sum: number;
  overflow_severe_any: number | null;
  overflow_reaches_water_count: number | null;
  overflow_count_3m: number;
  overflow_gallons_sum_3m: number;
  overflow_repeat_3m_any: number;
  overflow_months_since_last: number | null;
  permit_count_current: number | null;
  impaired_segments_current: number | null;
  hydrology_context_score_current: number | null;
  precip_total_mm: number | null;
  precip_anomaly_z: number | null;
  heavy_rain_days: number | null;
  precip_max_1d_mm: number | null;
  temp_mean_anomaly_z: number | null;
  heat_days: number | null;
  freeze_days: number | null;
  flood_warning_any: number | null;
  flood_warning_count: number | null;
  flash_flood_warning_any: number | null;
  streamflow_high_count: number | null;
  streamflow_low_count: number | null;
  streamflow_extreme_high_any: number | null;
  streamflow_extreme_low_any: number | null;
  drought_fraction_d1plus: number | null;
  drought_fraction_d3plus: number | null;
  overflow_x_precip_anomaly: number | null;
  overflow_x_flood_warning: number | null;
  overflow_x_drought: number | null;
  overflow_x_heat: number | null;
  overflow_x_streamflow_high: number | null;
  overflow_x_streamflow_low: number | null;
  weather_data_complete_flag: number;
  row_usable_for_trigger_models: number;
};

type Example = ReturnType<typeof buildExamples>[number];

type ModelSpec = {
  id: string;
  label: string;
  featureNames: string[];
};

type Standardizer = { means: number[]; stdevs: number[] };

type FixedEffectModel = {
  globalIntercept: number;
  countyIntercepts: Record<string, number>;
  weights: number[];
  standardizer: Standardizer;
};

type SplitMetrics = {
  count: number;
  positives: number;
  prevalence: number;
  auroc: number;
  auprc: number;
  brier: number;
  precisionAtTopDecile: number;
  liftAtTopDecile: number;
};

type ModelRun = {
  model: ModelSpec;
  interceptSummary: { counties: number; meanAbsCountyIntercept: number };
  coefficients: Array<{ feature: string; weight: number }>;
  metrics: Record<"train" | "validation" | "test", SplitMetrics>;
};

type BetaPrior = { alpha: number; beta: number; mean: number; strength: number };

function parseNumber(value: string): number | null {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readPanelRows(): Promise<PanelRow[]> {
  const raw = await fs.readFile(path.resolve(process.cwd(), PANEL_PATH), "utf8");
  const [headerLine, ...lines] = raw.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.map((line) => {
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
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    return {
      county_fips: row.county_fips,
      county_name: row.county_name,
      year: Number(row.year),
      month: Number(row.month),
      year_month: row.year_month,
      sdwis_event_any: Number(row.sdwis_event_any),
      sdwis_prior_1m_any: Number(row.sdwis_prior_1m_any),
      sdwis_prior_3m_count: Number(row.sdwis_prior_3m_count),
      sdwis_prior_6m_count: Number(row.sdwis_prior_6m_count),
      sdwis_prior_12m_count: Number(row.sdwis_prior_12m_count),
      sdwis_cumulative_prior_count: Number(row.sdwis_cumulative_prior_count),
      overflow_any: Number(row.overflow_any),
      overflow_count: Number(row.overflow_count),
      overflow_gallons_sum: Number(row.overflow_gallons_sum),
      overflow_log_gallons_sum: Number(row.overflow_log_gallons_sum),
      overflow_severe_any: parseNumber(row.overflow_severe_any),
      overflow_reaches_water_count: parseNumber(row.overflow_reaches_water_count),
      overflow_count_3m: Number(row.overflow_count_3m),
      overflow_gallons_sum_3m: Number(row.overflow_gallons_sum_3m),
      overflow_repeat_3m_any: Number(row.overflow_repeat_3m_any),
      overflow_months_since_last: parseNumber(row.overflow_months_since_last),
      permit_count_current: parseNumber(row.permit_count_current),
      impaired_segments_current: parseNumber(row.impaired_segments_current),
      hydrology_context_score_current: parseNumber(row.hydrology_context_score_current),
      precip_total_mm: parseNumber(row.precip_total_mm),
      precip_anomaly_z: parseNumber(row.precip_anomaly_z),
      heavy_rain_days: parseNumber(row.heavy_rain_days),
      precip_max_1d_mm: parseNumber(row.precip_max_1d_mm),
      temp_mean_anomaly_z: parseNumber(row.temp_mean_anomaly_z),
      heat_days: parseNumber(row.heat_days),
      freeze_days: parseNumber(row.freeze_days),
      flood_warning_any: parseNumber(row.flood_warning_any),
      flood_warning_count: parseNumber(row.flood_warning_count),
      flash_flood_warning_any: parseNumber(row.flash_flood_warning_any),
      streamflow_high_count: parseNumber(row.streamflow_high_count),
      streamflow_low_count: parseNumber(row.streamflow_low_count),
      streamflow_extreme_high_any: parseNumber(row.streamflow_extreme_high_any),
      streamflow_extreme_low_any: parseNumber(row.streamflow_extreme_low_any),
      drought_fraction_d1plus: parseNumber(row.drought_fraction_d1plus),
      drought_fraction_d3plus: parseNumber(row.drought_fraction_d3plus),
      overflow_x_precip_anomaly: parseNumber(row.overflow_x_precip_anomaly),
      overflow_x_flood_warning: parseNumber(row.overflow_x_flood_warning),
      overflow_x_drought: parseNumber(row.overflow_x_drought),
      overflow_x_heat: parseNumber(row.overflow_x_heat),
      overflow_x_streamflow_high: parseNumber(row.overflow_x_streamflow_high),
      overflow_x_streamflow_low: parseNumber(row.overflow_x_streamflow_low),
      weather_data_complete_flag: Number(row.weather_data_complete_flag),
      row_usable_for_trigger_models: Number(row.row_usable_for_trigger_models),
    } satisfies PanelRow;
  });
}

function estimateBetaPriorByMoments(summaries: Array<{ n: number; successes: number }>): BetaPrior {
  const countyRates = summaries.filter((row) => row.n > 0).map((row) => row.successes / row.n);
  const mean = countyRates.reduce((sum, value) => sum + value, 0) / Math.max(countyRates.length, 1);
  const variance = countyRates.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / Math.max(countyRates.length, 1);
  const maxVariance = Math.max(mean * (1 - mean) - 1e-6, 1e-6);
  const clippedVariance = Math.min(Math.max(variance, 1e-6), maxVariance);
  const strength = Math.max((mean * (1 - mean)) / clippedVariance - 1, 2);
  return { alpha: mean * strength, beta: (1 - mean) * strength, mean, strength };
}

function augmentExamplesWithEbBaseline(examples: Example[]): { examples: Example[]; prior: BetaPrior } {
  const trainByCounty = new Map<string, { county_fips: string; county_name: string; n: number; successes: number }>();
  for (const row of examples.filter((example) => example.split === "train")) {
    const existing = trainByCounty.get(row.county_fips) ?? {
      county_fips: row.county_fips,
      county_name: row.county_name,
      n: 0,
      successes: 0,
    };
    existing.n += 1;
    existing.successes += row.y;
    trainByCounty.set(row.county_fips, existing);
  }
  const prior = estimateBetaPriorByMoments([...trainByCounty.values()]);
  const ebByCounty = new Map(
    [...trainByCounty.values()].map((row) => [
      row.county_fips,
      (row.successes + prior.alpha) / (row.n + prior.alpha + prior.beta),
    ] as const),
  );
  return {
    prior,
    examples: examples.map((example) => ({
      ...example,
      features: {
        ...example.features,
        county_eb_baseline: ebByCounty.get(example.county_fips) ?? prior.mean,
      },
    })),
  };
}

function sigmoid(x: number): number {
  if (x >= 0) {
    const z = Math.exp(-x);
    return 1 / (1 + z);
  }
  const z = Math.exp(x);
  return z / (1 + z);
}

function fitStandardizer(matrix: number[][]): Standardizer {
  const n = matrix[0]?.length ?? 0;
  const means = Array.from({ length: n }, (_, j) => matrix.reduce((s, row) => s + (row[j] ?? 0), 0) / Math.max(matrix.length, 1));
  const stdevs = Array.from({ length: n }, (_, j) => {
    const mean = means[j] ?? 0;
    const variance = matrix.reduce((s, row) => s + (((row[j] ?? 0) - mean) ** 2), 0) / Math.max(matrix.length, 1);
    const stdev = Math.sqrt(variance);
    return stdev > 1e-8 ? stdev : 1;
  });
  return { means, stdevs };
}

function standardizeMatrix(matrix: number[][], standardizer: Standardizer): number[][] {
  return matrix.map((row) => row.map((value, j) => (value - (standardizer.means[j] ?? 0)) / (standardizer.stdevs[j] ?? 1)));
}

function featureMatrix(examples: Example[], featureNames: string[]): number[][] {
  return examples.map((example) => featureNames.map((name) => example.features[name] ?? 0));
}

function fitFixedEffectLogisticRegression(examples: Example[], featureNames: string[]): FixedEffectModel {
  if (!featureNames.length) {
    return { globalIntercept: 0, countyIntercepts: {}, weights: [], standardizer: { means: [], stdevs: [] } };
  }
  const matrix = featureMatrix(examples, featureNames);
  const standardizer = fitStandardizer(matrix);
  const x = standardizeMatrix(matrix, standardizer);
  const y = examples.map((row) => row.y);
  const countyIds = examples.map((row) => row.county_fips);
  const countyIntercepts: Record<string, number> = {};
  let globalIntercept = 0;
  let weights = Array.from({ length: featureNames.length }, () => 0);
  const learningRate = 0.03;
  const l2 = 0.001;
  const countyL2 = 0.01;
  const iterations = 1800;

  for (let iter = 0; iter < iterations; iter += 1) {
    let gradGlobalIntercept = 0;
    const gradWeights = Array.from({ length: featureNames.length }, () => 0);
    const gradCountyIntercepts: Record<string, number> = {};

    for (let i = 0; i < x.length; i += 1) {
      const row = x[i]!;
      const county = countyIds[i]!;
      let linear = globalIntercept + (countyIntercepts[county] ?? 0);
      for (let j = 0; j < weights.length; j += 1) {
        linear += (weights[j] ?? 0) * (row[j] ?? 0);
      }
      const p = sigmoid(linear);
      const error = p - (y[i] ?? 0);
      gradGlobalIntercept += error;
      gradCountyIntercepts[county] = (gradCountyIntercepts[county] ?? 0) + error;
      for (let j = 0; j < weights.length; j += 1) {
        gradWeights[j] += error * (row[j] ?? 0);
      }
    }

    const n = x.length;
    globalIntercept -= learningRate * (gradGlobalIntercept / n);
    weights = weights.map((weight, j) => weight - learningRate * ((gradWeights[j] ?? 0) / n + l2 * weight));
    for (const [county, grad] of Object.entries(gradCountyIntercepts)) {
      countyIntercepts[county] = (countyIntercepts[county] ?? 0) - learningRate * (grad / n + countyL2 * (countyIntercepts[county] ?? 0));
    }
  }

  return { globalIntercept, countyIntercepts, weights, standardizer };
}

function predictProbabilities(model: FixedEffectModel, examples: Example[], featureNames: string[]): number[] {
  if (!featureNames.length) {
    const prevalence = sigmoid(model.globalIntercept);
    return examples.map(() => prevalence);
  }
  const x = standardizeMatrix(featureMatrix(examples, featureNames), model.standardizer);
  return x.map((row, i) => {
    const county = examples[i]!.county_fips;
    let linear = model.globalIntercept + (model.countyIntercepts[county] ?? 0);
    for (let j = 0; j < model.weights.length; j += 1) {
      linear += (model.weights[j] ?? 0) * (row[j] ?? 0);
    }
    return sigmoid(linear);
  });
}

function rocAuc(labels: number[], scores: number[]): number {
  const positives: number[] = [];
  const negatives: number[] = [];
  for (let i = 0; i < labels.length; i += 1) {
    if (labels[i] === 1) positives.push(scores[i] ?? 0);
    else negatives.push(scores[i] ?? 0);
  }
  if (!positives.length || !negatives.length) return 0.5;
  let wins = 0;
  let ties = 0;
  for (const p of positives) {
    for (const n of negatives) {
      if (p > n) wins += 1;
      else if (p === n) ties += 1;
    }
  }
  return (wins + 0.5 * ties) / (positives.length * negatives.length);
}

function prAuc(labels: number[], scores: number[]): number {
  const pairs = labels.map((label, i) => ({ label, score: scores[i] ?? 0 })).sort((a, b) => b.score - a.score);
  const totalPositives = labels.reduce((sum, value) => sum + value, 0);
  if (!totalPositives) return 0;
  let tp = 0;
  let fp = 0;
  let prevRecall = 0;
  let area = 0;
  for (const pair of pairs) {
    if (pair.label === 1) tp += 1;
    else fp += 1;
    const recall = tp / totalPositives;
    const precision = tp / Math.max(tp + fp, 1);
    area += precision * (recall - prevRecall);
    prevRecall = recall;
  }
  return area;
}

function brierScore(labels: number[], probs: number[]): number {
  return labels.reduce((sum, label, i) => sum + (((probs[i] ?? 0) - label) ** 2), 0) / Math.max(labels.length, 1);
}

function topDecileMetrics(labels: number[], probs: number[]): { precisionAtTopDecile: number; liftAtTopDecile: number } {
  const prevalence = labels.reduce((sum, value) => sum + value, 0) / Math.max(labels.length, 1);
  const pairs = labels.map((label, i) => ({ label, prob: probs[i] ?? 0 })).sort((a, b) => b.prob - a.prob);
  const topK = Math.max(1, Math.round(labels.length * 0.1));
  const top = pairs.slice(0, topK);
  const precision = top.reduce((sum, row) => sum + row.label, 0) / Math.max(top.length, 1);
  return { precisionAtTopDecile: precision, liftAtTopDecile: prevalence > 0 ? precision / prevalence : 0 };
}

function evaluateSplit(labels: number[], probs: number[]): SplitMetrics {
  const positives = labels.reduce((sum, value) => sum + value, 0);
  const prevalence = positives / Math.max(labels.length, 1);
  const top = topDecileMetrics(labels, probs);
  return {
    count: labels.length,
    positives,
    prevalence,
    auroc: rocAuc(labels, probs),
    auprc: prAuc(labels, probs),
    brier: brierScore(labels, probs),
    precisionAtTopDecile: top.precisionAtTopDecile,
    liftAtTopDecile: top.liftAtTopDecile,
  };
}

const MODEL_SPECS: ModelSpec[] = [
  {
    id: "fe_persistence",
    label: "County FE + persistence",
    featureNames: ["sdwis_prior_1m_any", "sdwis_prior_3m_count", "sdwis_prior_12m_count", "sdwis_cumulative_prior_count"],
  },
  {
    id: "fe_persistence_eb",
    label: "County FE + persistence + EB baseline",
    featureNames: ["sdwis_prior_1m_any", "sdwis_prior_3m_count", "sdwis_prior_12m_count", "sdwis_cumulative_prior_count", "county_eb_baseline"],
  },
  {
    id: "fe_persistence_overflow",
    label: "County FE + persistence + overflow",
    featureNames: ["sdwis_prior_1m_any", "sdwis_prior_3m_count", "sdwis_prior_12m_count", "sdwis_cumulative_prior_count", "overflow_any", "overflow_count", "overflow_log_gallons_sum", "overflow_repeat_3m_any", "overflow_severe_any"],
  },
  {
    id: "fe_persistence_precip",
    label: "County FE + persistence + precipitation",
    featureNames: ["sdwis_prior_1m_any", "sdwis_prior_3m_count", "sdwis_prior_12m_count", "sdwis_cumulative_prior_count", "precip_total_mm", "precip_anomaly_z", "heavy_rain_days", "precip_max_1d_mm"],
  },
  {
    id: "fe_persistence_overflow_precip_interaction",
    label: "County FE + persistence + overflow + precipitation + interaction",
    featureNames: ["sdwis_prior_1m_any", "sdwis_prior_3m_count", "sdwis_prior_12m_count", "sdwis_cumulative_prior_count", "overflow_any", "overflow_count", "overflow_log_gallons_sum", "overflow_repeat_3m_any", "overflow_severe_any", "precip_total_mm", "precip_anomaly_z", "heavy_rain_days", "precip_max_1d_mm", "overflow_x_precip_anomaly"],
  },
  {
    id: "fe_persistence_eb_overflow_precip_flood",
    label: "County FE + persistence + EB baseline + overflow + precipitation + NWS flood",
    featureNames: ["sdwis_prior_1m_any", "sdwis_prior_3m_count", "sdwis_prior_12m_count", "sdwis_cumulative_prior_count", "county_eb_baseline", "overflow_any", "overflow_count", "overflow_log_gallons_sum", "overflow_repeat_3m_any", "overflow_severe_any", "precip_total_mm", "precip_anomaly_z", "heavy_rain_days", "precip_max_1d_mm", "flood_warning_any", "flood_warning_count", "flash_flood_warning_any", "overflow_x_precip_anomaly", "overflow_x_flood_warning"],
  },
  {
    id: "fe_persistence_eb_overflow_precip_flood_streamflow",
    label: "County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow",
    featureNames: ["sdwis_prior_1m_any", "sdwis_prior_3m_count", "sdwis_prior_12m_count", "sdwis_cumulative_prior_count", "county_eb_baseline", "overflow_any", "overflow_count", "overflow_log_gallons_sum", "overflow_repeat_3m_any", "overflow_severe_any", "precip_total_mm", "precip_anomaly_z", "heavy_rain_days", "precip_max_1d_mm", "flood_warning_any", "flood_warning_count", "flash_flood_warning_any", "streamflow_high_count", "streamflow_low_count", "streamflow_extreme_high_any", "streamflow_extreme_low_any", "overflow_x_precip_anomaly", "overflow_x_flood_warning", "overflow_x_streamflow_high", "overflow_x_streamflow_low"],
  },
  {
    id: "fe_persistence_eb_overflow_precip_flood_streamflow_drought",
    label: "County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought",
    featureNames: ["sdwis_prior_1m_any", "sdwis_prior_3m_count", "sdwis_prior_12m_count", "sdwis_cumulative_prior_count", "county_eb_baseline", "overflow_any", "overflow_count", "overflow_log_gallons_sum", "overflow_repeat_3m_any", "overflow_severe_any", "precip_total_mm", "precip_anomaly_z", "heavy_rain_days", "precip_max_1d_mm", "flood_warning_any", "flood_warning_count", "flash_flood_warning_any", "streamflow_high_count", "streamflow_low_count", "streamflow_extreme_high_any", "streamflow_extreme_low_any", "drought_fraction_d1plus", "drought_fraction_d3plus", "overflow_x_precip_anomaly", "overflow_x_flood_warning", "overflow_x_streamflow_high", "overflow_x_streamflow_low", "overflow_x_drought"],
  },
  {
    id: "fe_persistence_eb_overflow_precip_flood_streamflow_drought_heat",
    label: "County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat",
    featureNames: ["sdwis_prior_1m_any", "sdwis_prior_3m_count", "sdwis_prior_12m_count", "sdwis_cumulative_prior_count", "county_eb_baseline", "overflow_any", "overflow_count", "overflow_log_gallons_sum", "overflow_repeat_3m_any", "overflow_severe_any", "precip_total_mm", "precip_anomaly_z", "heavy_rain_days", "precip_max_1d_mm", "temp_mean_anomaly_z", "heat_days", "freeze_days", "flood_warning_any", "flood_warning_count", "flash_flood_warning_any", "streamflow_high_count", "streamflow_low_count", "streamflow_extreme_high_any", "streamflow_extreme_low_any", "drought_fraction_d1plus", "drought_fraction_d3plus", "overflow_x_precip_anomaly", "overflow_x_flood_warning", "overflow_x_heat", "overflow_x_streamflow_high", "overflow_x_streamflow_low", "overflow_x_drought"],
  },
  {
    id: "fe_persistence_eb_overflow_precip_interaction",
    label: "County FE + persistence + EB baseline + overflow + precipitation + interaction",
    featureNames: ["sdwis_prior_1m_any", "sdwis_prior_3m_count", "sdwis_prior_12m_count", "sdwis_cumulative_prior_count", "county_eb_baseline", "overflow_any", "overflow_count", "overflow_log_gallons_sum", "overflow_repeat_3m_any", "overflow_severe_any", "precip_total_mm", "precip_anomaly_z", "heavy_rain_days", "precip_max_1d_mm", "overflow_x_precip_anomaly"],
  },
];

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function formatMetricsRow(run: ModelRun, split: keyof ModelRun["metrics"]): string {
  const m = run.metrics[split];
  return `| ${run.model.label} | ${split} | ${m.count} | ${m.positives} | ${round(m.prevalence)} | ${round(m.auroc)} | ${round(m.auprc)} | ${round(m.brier)} | ${round(m.precisionAtTopDecile)} | ${round(m.liftAtTopDecile)} |`;
}

function coefficientSummary(run: ModelRun): string {
  return run.coefficients
    .slice()
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 8)
    .map((row) => `- ${row.feature}: ${round(row.weight)}`)
    .join("\n");
}

export async function runFixedEffectsPrecipitationBacktest(): Promise<{ markdownPath: string; jsonPath: string; runs: ModelRun[]; exampleCount: number }> {
  const rows = await readPanelRows();
  const augmented = augmentExamplesWithEbBaseline(buildExamples(rows as never as PanelRow[]));
  const examples = augmented.examples;
  const trainExamples = examples.filter((row) => row.split === "train");
  const validationExamples = examples.filter((row) => row.split === "validation");
  const testExamples = examples.filter((row) => row.split === "test");

  const runs: ModelRun[] = MODEL_SPECS.map((spec) => {
    const model = fitFixedEffectLogisticRegression(trainExamples, spec.featureNames);
    const trainProbs = predictProbabilities(model, trainExamples, spec.featureNames);
    const validationProbs = predictProbabilities(model, validationExamples, spec.featureNames);
    const testProbs = predictProbabilities(model, testExamples, spec.featureNames);
    const countyInterceptValues = Object.values(model.countyIntercepts);

    return {
      model: spec,
      interceptSummary: {
        counties: countyInterceptValues.length,
        meanAbsCountyIntercept: countyInterceptValues.length
          ? countyInterceptValues.reduce((sum, value) => sum + Math.abs(value), 0) / countyInterceptValues.length
          : 0,
      },
      coefficients: spec.featureNames.map((feature, i) => ({ feature, weight: model.weights[i] ?? 0 })),
      metrics: {
        train: evaluateSplit(trainExamples.map((row) => row.y), trainProbs),
        validation: evaluateSplit(validationExamples.map((row) => row.y), validationProbs),
        test: evaluateSplit(testExamples.map((row) => row.y), testProbs),
      },
    };
  });

  const bestValidation = runs.slice().sort((a, b) => b.metrics.validation.auprc - a.metrics.validation.auprc)[0]!;

  const markdown = `# Within-county / fixed-effects precipitation-trigger backtest

Generated: ${new Date().toISOString()}

## Scope

- Panel: \`data/panels/county_month_water_risk.csv\`
- Horizon: predict **any county-month SDWIS health-based event at \(t+1\)** from month \(t\) features
- Example count: ${examples.length}
- Train outcome window: 2020-02 through 2023-12
- Validation outcome window: 2024-01 through 2024-12
- Test outcome window: 2025-01 through 2025-12
- Design: pooled logistic models with **county-specific intercepts** to approximate a within-county / fixed-effects comparison
- EB county baseline prior mean: ${round(augmented.prior.mean)}
- EB county baseline prior strength: ${round(augmented.prior.strength)}

## Model ladder

| Model | Split | N | Positives | Prevalence | AUROC | AUPRC | Brier | Precision@top-decile | Lift@top-decile |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
${runs.flatMap((run) => [formatMetricsRow(run, "train"), formatMetricsRow(run, "validation"), formatMetricsRow(run, "test")]).join("\n")}

## Main read

- Best validation AUPRC in this within-county pass: **${bestValidation.model.label}** with validation AUPRC **${round(bestValidation.metrics.validation.auprc)}** and test AUPRC **${round(bestValidation.metrics.test.auprc)}**.
- The question here is narrower than in the pooled ladder: do overflow and precipitation help *after allowing each county to have its own baseline propensity*?
- If incremental gains stay small here, that is evidence that the trigger layers are weaker than the chronic county-risk story.

## Coefficient snapshots

${runs.map((run) => `### ${run.model.label}\n\n- County intercept count: ${run.interceptSummary.counties}\n- Mean absolute county intercept: ${round(run.interceptSummary.meanAbsCountyIntercept)}\n${coefficientSummary(run)}`).join("\n\n")}

## Interpretation notes

1. This is a first-pass fixed-effects-style approximation using county intercepts, not a full conditional logit implementation.
2. The key comparison is against the earlier pooled ladder: if overflow/precipitation effects shrink materially once county baselines are absorbed, they are behaving more like place markers than universal triggers.
3. Precipitation still means county-centroid Open-Meteo archive context only.
4. This pass now includes county-month NWS flood/flash-flood warning context, nearest-gauge streamflow context, county-month drought context, and county-centroid temperature/heat context.

## Sources

- Open-Meteo Historical Weather API  
  https://open-meteo.com/en/docs/historical-weather-api
- Open-Meteo historical weather OpenAPI spec  
  https://github.com/open-meteo/open-meteo/blob/main/openapi_historical_weather_api.yml
- EPA Envirofacts SDWIS API  
  https://www.epa.gov/enviro/envirofacts-data-service-api
- Texas Open Data portal  
  https://data.texas.gov/
`;

  await fs.mkdir(path.dirname(OUTPUT_MARKDOWN_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_MARKDOWN_PATH, markdown, "utf8");
  await fs.writeFile(OUTPUT_JSON_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), exampleCount: examples.length, runs }, null, 2), "utf8");

  return { markdownPath: OUTPUT_MARKDOWN_PATH, jsonPath: OUTPUT_JSON_PATH, runs, exampleCount: examples.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runFixedEffectsPrecipitationBacktest()
    .then((result) => {
      console.log(JSON.stringify({ markdownPath: result.markdownPath, jsonPath: result.jsonPath, exampleCount: result.exampleCount }, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
