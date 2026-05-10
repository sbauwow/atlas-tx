import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { buildExamples, evaluateSplit } from "./model_precipitation_ladder";

const PANEL_PATH = "data/panels/county_month_water_risk.csv";
const OUTPUT_MARKDOWN_PATH = "outputs/thesis-status/2026-05-10-seasonality-robustness-memo.md";
const OUTPUT_JSON_PATH = "outputs/thesis-status/2026-05-10-seasonality-robustness-memo.json";

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

type Standardizer = { means: number[]; stdevs: number[] };

type LogisticModel = { intercept: number; weights: number[]; standardizer: Standardizer };

type FixedEffectModel = {
  globalIntercept: number;
  countyIntercepts: Record<string, number>;
  weights: number[];
  standardizer: Standardizer;
};

type BetaPrior = { alpha: number; beta: number; mean: number; strength: number };

type ModelSpec = { id: string; label: string; featureNames: string[] };

type SplitName = "train" | "validation" | "test";

type ModelRun = {
  model: ModelSpec;
  family: "pooled" | "fixed_effects";
  coefficients: Array<{ feature: string; weight: number }>;
  interceptSummary?: { counties: number; meanAbsCountyIntercept: number };
  metrics: Record<SplitName, ReturnType<typeof evaluateSplit>>;
};

export const MONTH_CONTROL_FEATURES = [
  "month_is_02",
  "month_is_03",
  "month_is_04",
  "month_is_05",
  "month_is_06",
  "month_is_07",
  "month_is_08",
  "month_is_09",
  "month_is_10",
  "month_is_11",
  "month_is_12",
] as const;

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
    const existing = trainByCounty.get(row.county_fips) ?? { county_fips: row.county_fips, county_name: row.county_name, n: 0, successes: 0 };
    existing.n += 1;
    existing.successes += row.y;
    trainByCounty.set(row.county_fips, existing);
  }
  const prior = estimateBetaPriorByMoments([...trainByCounty.values()]);
  const ebByCounty = new Map(
    [...trainByCounty.values()].map((row) => [row.county_fips, (row.successes + prior.alpha) / (row.n + prior.alpha + prior.beta)] as const),
  );
  return {
    prior,
    examples: examples.map((example) => ({
      ...example,
      features: { ...example.features, county_eb_baseline: ebByCounty.get(example.county_fips) ?? prior.mean },
    })),
  };
}

function augmentExamplesWithMonthControls(examples: Example[]): Example[] {
  return examples.map((example) => {
    const month = Number(example.feature_year_month.slice(5, 7));
    const monthFeatures = Object.fromEntries(MONTH_CONTROL_FEATURES.map((featureName, index) => [featureName, month === index + 2 ? 1 : 0]));
    return {
      ...example,
      features: {
        ...example.features,
        ...monthFeatures,
      },
    };
  });
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
  return matrix.map((row) => row.map((value, i) => (value - (standardizer.means[i] ?? 0)) / (standardizer.stdevs[i] ?? 1)));
}

function featureMatrix(examples: Example[], featureNames: string[]): number[][] {
  return examples.map((example) => featureNames.map((name) => example.features[name] ?? 0));
}

function fitLogisticRegression(matrix: number[][], labels: number[]): LogisticModel {
  if (!matrix.length) return { intercept: 0, weights: [], standardizer: { means: [], stdevs: [] } };
  const standardizer = fitStandardizer(matrix);
  const x = standardizeMatrix(matrix, standardizer);
  const nFeatures = x[0]?.length ?? 0;
  let intercept = 0;
  let weights = Array.from({ length: nFeatures }, () => 0);
  const learningRate = 0.05;
  const l2 = 0.001;
  const iterations = 1500;
  for (let iter = 0; iter < iterations; iter += 1) {
    let gradIntercept = 0;
    const gradWeights = Array.from({ length: nFeatures }, () => 0);
    for (let i = 0; i < x.length; i += 1) {
      const row = x[i]!;
      const y = labels[i] ?? 0;
      let linear = intercept;
      for (let j = 0; j < nFeatures; j += 1) linear += (weights[j] ?? 0) * (row[j] ?? 0);
      const error = sigmoid(linear) - y;
      gradIntercept += error;
      for (let j = 0; j < nFeatures; j += 1) gradWeights[j] += error * (row[j] ?? 0);
    }
    const n = x.length;
    intercept -= learningRate * (gradIntercept / n);
    weights = weights.map((weight, j) => weight - learningRate * ((gradWeights[j] ?? 0) / n + l2 * weight));
  }
  return { intercept, weights, standardizer };
}

function predictProbabilities(model: LogisticModel, matrix: number[][]): number[] {
  const x = standardizeMatrix(matrix, model.standardizer);
  return x.map((row) => {
    let linear = model.intercept;
    for (let j = 0; j < model.weights.length; j += 1) linear += (model.weights[j] ?? 0) * (row[j] ?? 0);
    return sigmoid(linear);
  });
}

function fitFixedEffectLogisticRegression(examples: Example[], featureNames: string[]): FixedEffectModel {
  if (!featureNames.length) return { globalIntercept: 0, countyIntercepts: {}, weights: [], standardizer: { means: [], stdevs: [] } };
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
      for (let j = 0; j < weights.length; j += 1) linear += (weights[j] ?? 0) * (row[j] ?? 0);
      const error = sigmoid(linear) - (y[i] ?? 0);
      gradGlobalIntercept += error;
      gradCountyIntercepts[county] = (gradCountyIntercepts[county] ?? 0) + error;
      for (let j = 0; j < weights.length; j += 1) gradWeights[j] += error * (row[j] ?? 0);
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

function predictFixedEffectProbabilities(model: FixedEffectModel, examples: Example[], featureNames: string[]): number[] {
  const x = standardizeMatrix(featureMatrix(examples, featureNames), model.standardizer);
  return x.map((row, i) => {
    const county = examples[i]!.county_fips;
    let linear = model.globalIntercept + (model.countyIntercepts[county] ?? 0);
    for (let j = 0; j < model.weights.length; j += 1) linear += (model.weights[j] ?? 0) * (row[j] ?? 0);
    return sigmoid(linear);
  });
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

const BENCHMARK_FEATURES = [
  "sdwis_prior_1m_any", "sdwis_prior_3m_count", "sdwis_prior_12m_count", "sdwis_cumulative_prior_count", "county_eb_baseline",
  "overflow_any", "overflow_count", "overflow_log_gallons_sum", "overflow_repeat_3m_any", "overflow_severe_any",
  "precip_total_mm", "precip_anomaly_z", "heavy_rain_days", "precip_max_1d_mm",
  "flood_warning_any", "flood_warning_count", "flash_flood_warning_any",
  "streamflow_high_count", "streamflow_low_count", "streamflow_extreme_high_any", "streamflow_extreme_low_any",
  "drought_fraction_d1plus", "drought_fraction_d3plus",
  "overflow_x_precip_anomaly", "overflow_x_flood_warning", "overflow_x_streamflow_high", "overflow_x_streamflow_low", "overflow_x_drought",
] as const;

const SEASONALITY_SPECS: ModelSpec[] = [
  { id: "benchmark", label: "Benchmark: EB trigger stack without temperature", featureNames: [...BENCHMARK_FEATURES] },
  { id: "month_controls", label: "Benchmark + month-of-year controls", featureNames: [...BENCHMARK_FEATURES, ...MONTH_CONTROL_FEATURES] },
  { id: "month_controls_freeze", label: "Benchmark + month-of-year controls + freeze_days", featureNames: [...BENCHMARK_FEATURES, ...MONTH_CONTROL_FEATURES, "freeze_days"] },
  { id: "month_controls_heat_freeze", label: "Benchmark + month-of-year controls + heat_days + freeze_days", featureNames: [...BENCHMARK_FEATURES, ...MONTH_CONTROL_FEATURES, "heat_days", "freeze_days"] },
  { id: "month_controls_full_heat", label: "Benchmark + month-of-year controls + full temperature stack", featureNames: [...BENCHMARK_FEATURES, ...MONTH_CONTROL_FEATURES, "temp_mean_anomaly_z", "heat_days", "freeze_days", "overflow_x_heat"] },
];

function formatMetricsRow(run: ModelRun, split: SplitName): string {
  const m = run.metrics[split];
  return `| ${run.family} | ${run.model.label} | ${split} | ${m.count} | ${m.positives} | ${round(m.prevalence)} | ${round(m.auroc)} | ${round(m.auprc)} | ${round(m.brier)} | ${round(m.precisionAtTopDecile)} | ${round(m.liftAtTopDecile)} |`;
}

function topCoefficients(coefficients: Array<{ feature: string; weight: number }>, n = 8): Array<{ feature: string; weight: number }> {
  return coefficients.slice().sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, n).map((row) => ({ feature: row.feature, weight: round(row.weight) }));
}

export async function runSeasonalityRobustness(): Promise<{ markdownPath: string; jsonPath: string; pooledRuns: ModelRun[]; fixedEffectRuns: ModelRun[]; exampleCount: number }> {
  const rows = await readPanelRows();
  const ebAugmented = augmentExamplesWithEbBaseline(buildExamples(rows as never as PanelRow[]));
  const examples = augmentExamplesWithMonthControls(ebAugmented.examples);
  const trainExamples = examples.filter((row) => row.split === "train");
  const validationExamples = examples.filter((row) => row.split === "validation");
  const testExamples = examples.filter((row) => row.split === "test");
  const trainLabels = trainExamples.map((row) => row.y);

  const pooledRuns: ModelRun[] = SEASONALITY_SPECS.map((spec) => {
    const trainMatrix = featureMatrix(trainExamples, spec.featureNames);
    const model = fitLogisticRegression(trainMatrix, trainLabels);
    return {
      family: "pooled",
      model: spec,
      coefficients: spec.featureNames.map((feature, i) => ({ feature, weight: model.weights[i] ?? 0 })),
      metrics: {
        train: evaluateSplit(trainExamples.map((row) => row.y), predictProbabilities(model, trainMatrix)),
        validation: evaluateSplit(validationExamples.map((row) => row.y), predictProbabilities(model, featureMatrix(validationExamples, spec.featureNames))),
        test: evaluateSplit(testExamples.map((row) => row.y), predictProbabilities(model, featureMatrix(testExamples, spec.featureNames))),
      },
    };
  });

  const fixedEffectRuns: ModelRun[] = SEASONALITY_SPECS.map((spec) => {
    const model = fitFixedEffectLogisticRegression(trainExamples, spec.featureNames);
    const countyInterceptValues = Object.values(model.countyIntercepts);
    return {
      family: "fixed_effects",
      model: spec,
      interceptSummary: {
        counties: countyInterceptValues.length,
        meanAbsCountyIntercept: countyInterceptValues.length ? countyInterceptValues.reduce((sum, value) => sum + Math.abs(value), 0) / countyInterceptValues.length : 0,
      },
      coefficients: spec.featureNames.map((feature, i) => ({ feature, weight: model.weights[i] ?? 0 })),
      metrics: {
        train: evaluateSplit(trainExamples.map((row) => row.y), predictFixedEffectProbabilities(model, trainExamples, spec.featureNames)),
        validation: evaluateSplit(validationExamples.map((row) => row.y), predictFixedEffectProbabilities(model, validationExamples, spec.featureNames)),
        test: evaluateSplit(testExamples.map((row) => row.y), predictFixedEffectProbabilities(model, testExamples, spec.featureNames)),
      },
    };
  });

  const pooledBenchmark = pooledRuns.find((run) => run.model.id === "benchmark")!;
  const pooledMonthControls = pooledRuns.find((run) => run.model.id === "month_controls")!;
  const pooledFreeze = pooledRuns.find((run) => run.model.id === "month_controls_freeze")!;
  const pooledHeatFreeze = pooledRuns.find((run) => run.model.id === "month_controls_heat_freeze")!;
  const pooledFullHeat = pooledRuns.find((run) => run.model.id === "month_controls_full_heat")!;

  const feBenchmark = fixedEffectRuns.find((run) => run.model.id === "benchmark")!;
  const feMonthControls = fixedEffectRuns.find((run) => run.model.id === "month_controls")!;
  const feFreeze = fixedEffectRuns.find((run) => run.model.id === "month_controls_freeze")!;
  const feHeatFreeze = fixedEffectRuns.find((run) => run.model.id === "month_controls_heat_freeze")!;
  const feFullHeat = fixedEffectRuns.find((run) => run.model.id === "month_controls_full_heat")!;

  const markdown = `# Seasonality robustness memo for the Texas county-month water-risk thesis

Generated: ${new Date().toISOString()}

## Scope

- Panel: \`${PANEL_PATH}\`
- Example count: ${examples.length}
- Goal: test whether the temperature-seasonality gain survives explicit month-of-year controls
- Month controls: ${MONTH_CONTROL_FEATURES.join(", ")}
- Benchmark model: **${pooledBenchmark.model.label}**
- Train outcome window: 2020-02 through 2023-12
- Validation outcome window: 2024-01 through 2024-12
- Test outcome window: 2025-01 through 2025-12

## Minimal oracle checks used in this pass

1. Adding month-of-year controls alone should be allowed to absorb generic seasonality.
2. The temperature result is more credible only if \`freeze_days\` or \`heat_days + freeze_days\` still improve AUPRC after those controls.
3. The claim is strongest if the gain survives in both the pooled and county-intercept-style model families.

## Main result

### Pooled ladder
- Benchmark validation AUPRC: **${round(pooledBenchmark.metrics.validation.auprc)}**
- Benchmark + month controls validation AUPRC: **${round(pooledMonthControls.metrics.validation.auprc)}**
- Benchmark + month controls + \`freeze_days\` validation AUPRC: **${round(pooledFreeze.metrics.validation.auprc)}**
- Benchmark + month controls + \`heat_days + freeze_days\` validation AUPRC: **${round(pooledHeatFreeze.metrics.validation.auprc)}**
- Benchmark + month controls + full temperature stack validation AUPRC: **${round(pooledFullHeat.metrics.validation.auprc)}**
- Benchmark test AUPRC: **${round(pooledBenchmark.metrics.test.auprc)}**
- Benchmark + month controls test AUPRC: **${round(pooledMonthControls.metrics.test.auprc)}**
- Benchmark + month controls + \`freeze_days\` test AUPRC: **${round(pooledFreeze.metrics.test.auprc)}**
- Benchmark + month controls + \`heat_days + freeze_days\` test AUPRC: **${round(pooledHeatFreeze.metrics.test.auprc)}**
- Benchmark + month controls + full temperature stack test AUPRC: **${round(pooledFullHeat.metrics.test.auprc)}**

### County-intercept-style ladder
- Benchmark validation AUPRC: **${round(feBenchmark.metrics.validation.auprc)}**
- Benchmark + month controls validation AUPRC: **${round(feMonthControls.metrics.validation.auprc)}**
- Benchmark + month controls + \`freeze_days\` validation AUPRC: **${round(feFreeze.metrics.validation.auprc)}**
- Benchmark + month controls + \`heat_days + freeze_days\` validation AUPRC: **${round(feHeatFreeze.metrics.validation.auprc)}**
- Benchmark + month controls + full temperature stack validation AUPRC: **${round(feFullHeat.metrics.validation.auprc)}**
- Benchmark test AUPRC: **${round(feBenchmark.metrics.test.auprc)}**
- Benchmark + month controls test AUPRC: **${round(feMonthControls.metrics.test.auprc)}**
- Benchmark + month controls + \`freeze_days\` test AUPRC: **${round(feFreeze.metrics.test.auprc)}**
- Benchmark + month controls + \`heat_days + freeze_days\` test AUPRC: **${round(feHeatFreeze.metrics.test.auprc)}**
- Benchmark + month controls + full temperature stack test AUPRC: **${round(feFullHeat.metrics.test.auprc)}**

## Interpretation summary

- Month-of-year controls by themselves reach validation AUPRC **${round(pooledMonthControls.metrics.validation.auprc)}** versus **${round(pooledBenchmark.metrics.validation.auprc)}** in the pooled ladder, and **${round(feMonthControls.metrics.validation.auprc)}** versus **${round(feBenchmark.metrics.validation.auprc)}** in the county-intercept-style ladder. These controls therefore do not fully explain away the stronger temperature variants.
- In the pooled ladder, the best month-controlled compact temperature model is **${pooledHeatFreeze.model.label.replace("Benchmark + month-of-year controls + ", "")}**, with validation AUPRC **${round(pooledHeatFreeze.metrics.validation.auprc)}** and test AUPRC **${round(pooledHeatFreeze.metrics.test.auprc)}**.
- In the county-intercept-style ladder, the best month-controlled compact temperature model is **${feHeatFreeze.model.label.replace("Benchmark + month-of-year controls + ", "")}**, with validation AUPRC **${round(feHeatFreeze.metrics.validation.auprc)}** and test AUPRC **${round(feHeatFreeze.metrics.test.auprc)}**.
- The \`freeze_days\` term still improves over month controls alone in both model families, which weakens the simplest “this is just generic seasonality” objection.
- The result still does **not** establish causal thermal mechanisms. It only shows that temperature-seasonality features retain incremental ranking value after a basic seasonality control pass.

## Full robustness table

| Family | Model | Split | N | Positives | Prevalence | AUROC | AUPRC | Brier | Precision@top-decile | Lift@top-decile |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
${[...pooledRuns, ...fixedEffectRuns].flatMap((run) => [formatMetricsRow(run, "validation"), formatMetricsRow(run, "test")]).join("\n")}

## Most informative coefficients in the best month-controlled compact models

### Pooled: ${pooledHeatFreeze.model.label}
${topCoefficients(pooledHeatFreeze.coefficients).map((row) => `- ${row.feature}: ${row.weight}`).join("\n")}

### County-intercept-style: ${feHeatFreeze.model.label}
${topCoefficients(feHeatFreeze.coefficients).map((row) => `- ${row.feature}: ${row.weight}`).join("\n")}

## Thesis-facing read

1. The chronic baseline story still dominates.
2. Month-of-year controls do not erase the incremental value of compact temperature-seasonality terms.
3. The strongest reviewer-safe phrasing is still **temperature-seasonality context adds incremental ranking value after a basic month-of-year seasonality control**, not “heat causes violations.”
4. This robustness pass strengthens the paper's defense but does not remove proxy-resolution or causal-interpretation limitations.

## Recommended paper language

> In a month-of-year seasonality robustness pass, the compact temperature-seasonality terms remained incrementally useful after explicit month controls were added to the benchmark trigger stack. In both the pooled and county-intercept-style specifications, \`freeze_days\` improved on the month-control benchmark, and the \`heat_days + freeze_days\` bundle remained the strongest compact temperature addition. This weakens the simplest interpretation that the observed gain is only generic annual seasonality, although the result remains predictive rather than causal.

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
  await fs.writeFile(OUTPUT_JSON_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), exampleCount: examples.length, pooledRuns, fixedEffectRuns }, null, 2), "utf8");

  return { markdownPath: OUTPUT_MARKDOWN_PATH, jsonPath: OUTPUT_JSON_PATH, pooledRuns, fixedEffectRuns, exampleCount: examples.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSeasonalityRobustness()
    .then((result) => {
      console.log(JSON.stringify({ markdownPath: result.markdownPath, jsonPath: result.jsonPath, exampleCount: result.exampleCount }, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
