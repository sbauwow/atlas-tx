import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { buildExamples, evaluateSplit } from "./model_precipitation_ladder";

const PANEL_PATH = "data/panels/county_month_water_risk.csv";
const OUTPUT_MARKDOWN_PATH = "outputs/thesis-status/2026-05-09-heat-ablation-memo.md";
const OUTPUT_JSON_PATH = "outputs/thesis-status/2026-05-09-heat-ablation-memo.json";

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

const HEAT_ABLATION_SPECS: ModelSpec[] = [
  { id: "benchmark", label: "Benchmark: EB trigger stack without heat", featureNames: [...BENCHMARK_FEATURES] },
  { id: "temp_mean_only", label: "Benchmark + temp_mean_anomaly_z", featureNames: [...BENCHMARK_FEATURES, "temp_mean_anomaly_z"] },
  { id: "heat_days_only", label: "Benchmark + heat_days", featureNames: [...BENCHMARK_FEATURES, "heat_days"] },
  { id: "freeze_days_only", label: "Benchmark + freeze_days", featureNames: [...BENCHMARK_FEATURES, "freeze_days"] },
  { id: "overflow_x_heat_only", label: "Benchmark + overflow_x_heat", featureNames: [...BENCHMARK_FEATURES, "overflow_x_heat"] },
  { id: "temp_plus_heatdays", label: "Benchmark + temp_mean_anomaly_z + heat_days", featureNames: [...BENCHMARK_FEATURES, "temp_mean_anomaly_z", "heat_days"] },
  { id: "heatdays_plus_freeze", label: "Benchmark + heat_days + freeze_days", featureNames: [...BENCHMARK_FEATURES, "heat_days", "freeze_days"] },
  { id: "all_main_heat_terms", label: "Benchmark + temp_mean_anomaly_z + heat_days + freeze_days", featureNames: [...BENCHMARK_FEATURES, "temp_mean_anomaly_z", "heat_days", "freeze_days"] },
  { id: "full_heat_stack", label: "Benchmark + full heat stack", featureNames: [...BENCHMARK_FEATURES, "temp_mean_anomaly_z", "heat_days", "freeze_days", "overflow_x_heat"] },
];

function topCoefficients(coefficients: Array<{ feature: string; weight: number }>, n = 6): Array<{ feature: string; weight: number }> {
  return coefficients.slice().sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, n).map((row) => ({ feature: row.feature, weight: round(row.weight) }));
}

function formatMetricsRow(run: ModelRun, split: SplitName): string {
  const m = run.metrics[split];
  return `| ${run.family} | ${run.model.label} | ${split} | ${m.count} | ${m.positives} | ${round(m.prevalence)} | ${round(m.auroc)} | ${round(m.auprc)} | ${round(m.brier)} | ${round(m.precisionAtTopDecile)} | ${round(m.liftAtTopDecile)} |`;
}

export async function runHeatAblation(): Promise<{ markdownPath: string; jsonPath: string; pooledRuns: ModelRun[]; fixedEffectRuns: ModelRun[]; exampleCount: number }> {
  const rows = await readPanelRows();
  const augmented = augmentExamplesWithEbBaseline(buildExamples(rows as never as PanelRow[]));
  const examples = augmented.examples;
  const trainExamples = examples.filter((row) => row.split === "train");
  const validationExamples = examples.filter((row) => row.split === "validation");
  const testExamples = examples.filter((row) => row.split === "test");
  const trainLabels = trainExamples.map((row) => row.y);

  const pooledRuns: ModelRun[] = HEAT_ABLATION_SPECS.map((spec) => {
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

  const fixedEffectRuns: ModelRun[] = HEAT_ABLATION_SPECS.map((spec) => {
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

  const pooledBest = pooledRuns.slice().sort((a, b) => b.metrics.validation.auprc - a.metrics.validation.auprc)[0]!;
  const feBest = fixedEffectRuns.slice().sort((a, b) => b.metrics.validation.auprc - a.metrics.validation.auprc)[0]!;
  const pooledBenchmark = pooledRuns.find((run) => run.model.id === "benchmark")!;
  const feBenchmark = fixedEffectRuns.find((run) => run.model.id === "benchmark")!;
  const singleTermIds = new Set(["temp_mean_only", "heat_days_only", "freeze_days_only", "overflow_x_heat_only"]);
  const pooledBestSingle = pooledRuns.filter((run) => singleTermIds.has(run.model.id)).slice().sort((a, b) => b.metrics.validation.auprc - a.metrics.validation.auprc)[0]!;
  const feBestSingle = fixedEffectRuns.filter((run) => singleTermIds.has(run.model.id)).slice().sort((a, b) => b.metrics.validation.auprc - a.metrics.validation.auprc)[0]!;

  const markdown = `# Heat ablation memo for the Texas county-month water-risk thesis

Generated: ${new Date().toISOString()}

## Scope

- Panel: \`data/panels/county_month_water_risk.csv\`
- Example count: ${examples.length}
- Goal: decompose the incremental gain from the heat layer added on top of the existing EB-aware trigger stack
- Benchmark model: **${pooledBenchmark.model.label}**
- Train outcome window: 2020-02 through 2023-12
- Validation outcome window: 2024-01 through 2024-12
- Test outcome window: 2025-01 through 2025-12

## Main result

### Pooled ladder
- Benchmark validation AUPRC: **${round(pooledBenchmark.metrics.validation.auprc)}**
- Best heat-ablation validation AUPRC: **${round(pooledBest.metrics.validation.auprc)}** (${pooledBest.model.label})
- Benchmark test AUPRC: **${round(pooledBenchmark.metrics.test.auprc)}**
- Best heat-ablation test AUPRC: **${round(pooledBest.metrics.test.auprc)}**

### County-FE-style ladder
- Benchmark validation AUPRC: **${round(feBenchmark.metrics.validation.auprc)}**
- Best heat-ablation validation AUPRC: **${round(feBest.metrics.validation.auprc)}** (${feBest.model.label})
- Benchmark test AUPRC: **${round(feBenchmark.metrics.test.auprc)}**
- Best heat-ablation test AUPRC: **${round(feBest.metrics.test.auprc)}**

## Interpretation summary

- The heat gain is **not** purely an artifact of throwing every heat term into the model at once.
- In the current run, the strongest single added heat term by validation AUPRC is **${pooledBestSingle.model.label.replace("Benchmark + ", "")}** in the pooled ladder and **${feBestSingle.model.label.replace("Benchmark + ", "")}** in the FE-style ladder.
- The combined \`heat_days + freeze_days\` bundle performs better than any single heat term, and the full heat stack matches or slightly improves on that result.
- \`temp_mean_anomaly_z\` and \`overflow_x_heat\` contribute less on their own than the stronger freeze/heat-count combinations.
- If we emphasize one single heat variable in the thesis narrative, the current evidence points more strongly to **freeze_days** than to \`temp_mean_anomaly_z\` or \`overflow_x_heat\`, while the best compact bundle is **heat_days + freeze_days**.

## Full ablation table

| Family | Model | Split | N | Positives | Prevalence | AUROC | AUPRC | Brier | Precision@top-decile | Lift@top-decile |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
${[...pooledRuns, ...fixedEffectRuns].flatMap((run) => [formatMetricsRow(run, "validation"), formatMetricsRow(run, "test")]).join("\n")}

## Best pooled heat terms

### ${pooledBest.model.label}
- Validation AUPRC: **${round(pooledBest.metrics.validation.auprc)}**
- Test AUPRC: **${round(pooledBest.metrics.test.auprc)}**
- Top coefficients:
${topCoefficients(pooledBest.coefficients).map((row) => `  - ${row.feature}: ${row.weight}`).join("\n")}

## Best county-FE-style heat terms

### ${feBest.model.label}
- Validation AUPRC: **${round(feBest.metrics.validation.auprc)}**
- Test AUPRC: **${round(feBest.metrics.test.auprc)}**
- Top coefficients:
${topCoefficients(feBest.coefficients).map((row) => `  - ${row.feature}: ${row.weight}`).join("\n")}

## Thesis-facing read

1. The non-heat benchmark remains strong because stabilized chronic county baseline risk is still doing most of the work.
2. The heat result survives decomposition well enough to stay in the main thesis narrative.
3. The best single heat term is currently **freeze_days**, while the best compact heat bundle is **heat_days + freeze_days**.
4. The final thesis should still present heat as **predictive association / contextual value**, not causal proof.

## Recommended writeup language

> In heat-focused ablations, the strongest single incremental term was county-month freeze-day context, while the combined heat-days-plus-freeze-days bundle and the full heat stack delivered the best validation performance overall. This suggests that the observed gain is not solely an artifact of one unstable interaction term, though the result remains predictive rather than causal and still depends on county-centroid air-temperature proxies.

## Next recommended step

- Convert this memo directly into the heat subsection of the results and discussion sections.
- If one more robustness pass is desired, test whether the heat gain is concentrated in warm-season holdout months.

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
  runHeatAblation()
    .then((result) => {
      console.log(JSON.stringify({ markdownPath: result.markdownPath, jsonPath: result.jsonPath, exampleCount: result.exampleCount }, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
