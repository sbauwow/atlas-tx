import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PANEL_PATH = "data/panels/county_month_water_risk.csv";
const OUTPUT_MARKDOWN_PATH = "papers/2026-05-09-shrinkage-experiment-plan-and-eb-baseline.md";
const OUTPUT_JSON_PATH = "outputs/model-results/2026-05-09-shrinkage-eb-baseline.json";

type PanelRow = {
  county_fips: string;
  county_name: string;
  year_month: string;
  sdwis_event_any: number;
};

type Example = {
  county_fips: string;
  county_name: string;
  year_month: string;
  y: number;
  split: "train" | "validation" | "test";
};

type CountySummary = {
  county_fips: string;
  county_name: string;
  n: number;
  successes: number;
  rawRate: number;
  shrunkRate: number;
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

type ModelResult = {
  id: string;
  label: string;
  metrics: Record<"train" | "validation" | "test", SplitMetrics>;
};

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

async function readPanelRows(): Promise<PanelRow[]> {
  const raw = await fs.readFile(path.resolve(process.cwd(), PANEL_PATH), "utf8");
  const [headerLine, ...lines] = raw.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    return {
      county_fips: row.county_fips,
      county_name: row.county_name,
      year_month: row.year_month,
      sdwis_event_any: Number(row.sdwis_event_any),
    } satisfies PanelRow;
  });
}

function splitForMonth(yearMonth: string): Example["split"] | null {
  if (yearMonth >= "2020-01" && yearMonth <= "2023-12") return "train";
  if (yearMonth >= "2024-01" && yearMonth <= "2024-12") return "validation";
  if (yearMonth >= "2025-01" && yearMonth <= "2025-12") return "test";
  return null;
}

function buildExamples(rows: PanelRow[]): Example[] {
  return rows.flatMap((row) => {
    const split = splitForMonth(row.year_month);
    if (!split) return [];
    return [{
      county_fips: row.county_fips,
      county_name: row.county_name,
      year_month: row.year_month,
      y: row.sdwis_event_any,
      split,
    }];
  });
}

export function estimateBetaPriorByMoments(summaries: Array<{ n: number; successes: number }>): { alpha: number; beta: number; mean: number; strength: number } {
  const countyRates = summaries
    .filter((row) => row.n > 0)
    .map((row) => row.successes / row.n);
  const mean = countyRates.reduce((sum, value) => sum + value, 0) / Math.max(countyRates.length, 1);
  const variance = countyRates.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / Math.max(countyRates.length, 1);
  const maxVariance = Math.max(mean * (1 - mean) - 1e-6, 1e-6);
  const clippedVariance = Math.min(Math.max(variance, 1e-6), maxVariance);
  const strength = Math.max((mean * (1 - mean)) / clippedVariance - 1, 2);
  return {
    alpha: mean * strength,
    beta: (1 - mean) * strength,
    mean,
    strength,
  };
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

function evaluate(labels: number[], probs: number[]): SplitMetrics {
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

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function formatMetricsRow(model: ModelResult, split: keyof ModelResult["metrics"]): string {
  const m = model.metrics[split];
  return `| ${model.label} | ${split} | ${m.count} | ${m.positives} | ${round(m.prevalence)} | ${round(m.auroc)} | ${round(m.auprc)} | ${round(m.brier)} | ${round(m.precisionAtTopDecile)} | ${round(m.liftAtTopDecile)} |`;
}

export async function runShrinkageEbBaselineExperiment(): Promise<{
  markdownPath: string;
  jsonPath: string;
  prior: { alpha: number; beta: number; mean: number; strength: number };
  countySummaries: CountySummary[];
  models: ModelResult[];
}> {
  const rows = await readPanelRows();
  const examples = buildExamples(rows);
  const train = examples.filter((row) => row.split === "train");
  const validation = examples.filter((row) => row.split === "validation");
  const test = examples.filter((row) => row.split === "test");

  const trainByCounty = new Map<string, CountySummary>();
  for (const row of train) {
    const existing = trainByCounty.get(row.county_fips) ?? {
      county_fips: row.county_fips,
      county_name: row.county_name,
      n: 0,
      successes: 0,
      rawRate: 0,
      shrunkRate: 0,
    };
    existing.n += 1;
    existing.successes += row.y;
    trainByCounty.set(row.county_fips, existing);
  }

  const prior = estimateBetaPriorByMoments([...trainByCounty.values()]);
  const countySummaries = [...trainByCounty.values()].map((row) => ({
    ...row,
    rawRate: row.successes / Math.max(row.n, 1),
    shrunkRate: (row.successes + prior.alpha) / (row.n + prior.alpha + prior.beta),
  })).sort((a, b) => a.county_fips.localeCompare(b.county_fips));
  const summaryByCounty = new Map(countySummaries.map((row) => [row.county_fips, row] as const));

  const prevalence = train.reduce((sum, row) => sum + row.y, 0) / Math.max(train.length, 1);

  function probsFor(splitRows: Example[], kind: "prevalence" | "raw" | "shrunk"): number[] {
    return splitRows.map((row) => {
      const county = summaryByCounty.get(row.county_fips);
      if (kind === "prevalence") return prevalence;
      if (!county) return prevalence;
      return kind === "raw" ? county.rawRate : county.shrunkRate;
    });
  }

  const models: ModelResult[] = [
    { id: "prevalence", label: "Statewide prevalence baseline", metrics: { train: evaluate(train.map((r) => r.y), probsFor(train, "prevalence")), validation: evaluate(validation.map((r) => r.y), probsFor(validation, "prevalence")), test: evaluate(test.map((r) => r.y), probsFor(test, "prevalence")) } },
    { id: "raw_county", label: "Raw county historical rate", metrics: { train: evaluate(train.map((r) => r.y), probsFor(train, "raw")), validation: evaluate(validation.map((r) => r.y), probsFor(validation, "raw")), test: evaluate(test.map((r) => r.y), probsFor(test, "raw")) } },
    { id: "eb_county", label: "Empirical-Bayes county baseline", metrics: { train: evaluate(train.map((r) => r.y), probsFor(train, "shrunk")), validation: evaluate(validation.map((r) => r.y), probsFor(validation, "shrunk")), test: evaluate(test.map((r) => r.y), probsFor(test, "shrunk")) } },
  ];

  const strongestShrinkage = countySummaries
    .map((row) => ({ ...row, shrinkageGap: row.rawRate - row.shrunkRate }))
    .sort((a, b) => Math.abs(b.shrinkageGap) - Math.abs(a.shrinkageGap))
    .slice(0, 10);

  const markdown = `# Shrinkage experiment plan and first empirical-Bayes county baseline

Generated: ${new Date().toISOString()}

## Summary

This note tests whether **Stein-type / empirical-Bayes shrinkage** can improve Atlas TX county-level prediction by stabilizing noisy county baseline SDWIS event rates.

The first implementation here is a **beta-binomial empirical-Bayes county baseline** rather than a literal Gaussian James–Stein estimator. That is a better fit for county-month binary event data.

## Why shrinkage is plausible here

- County-month SDWIS events are sparse and heterogeneous.
- Some counties have very little training information.
- Raw county historical rates can overreact to small samples.
- A shrinkage baseline can borrow strength from the statewide distribution and reduce variance.

## Current implementation

Training window for county baseline estimation:
- 2020-01 through 2023-12

Evaluation windows:
- validation: 2024-01 through 2024-12
- test: 2025-01 through 2025-12

Method:
1. Estimate each county's historical event rate from training county-month rows.
2. Estimate a beta prior by method of moments across county rates.
3. Shrink each county rate toward the statewide prior mean:

\\[
\\tilde{p}_c = \\frac{y_c + \\alpha}{n_c + \\alpha + \\beta}
\\]

where:
- \\(y_c\\) is county training SDWIS-positive month count,
- \\(n_c\\) is county training month count,
- \\(\\alpha, \\beta\\) are empirical-Bayes prior parameters.

Estimated prior:
- alpha: ${round(prior.alpha)}
- beta: ${round(prior.beta)}
- prior mean: ${round(prior.mean)}
- prior strength: ${round(prior.strength)}

## Baseline comparison

| Model | Split | N | Positives | Prevalence | AUROC | AUPRC | Brier | Precision@top-decile | Lift@top-decile |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
${models.flatMap((model) => [formatMetricsRow(model, "train"), formatMetricsRow(model, "validation"), formatMetricsRow(model, "test")]).join("\n")}

## Read of the first shrinkage result

- The key comparison is **raw county historical rate** vs **empirical-Bayes county baseline**.
- In this first county-only baseline test, the reported ranking metrics are effectively identical because every county contributes the same 48 training months, so beta-binomial shrinkage preserves almost the same county ordering while only compressing the probabilities toward the statewide mean.
- That means the value of shrinkage here is currently **stability/calibration-oriented** more than ranking-oriented.
- A more informative next test is to inject the shrunk county baseline into the richer prediction ladder or move to settings with unequal exposure counts (for example PWS-month or counties with variable usable history windows).

## Counties with strongest shrinkage adjustments

| County | Train months | Train positives | Raw rate | Shrunk rate | Raw - Shrunk |
|---|---:|---:|---:|---:|---:|
${strongestShrinkage.map((row) => `| ${row.county_name} | ${row.n} | ${row.successes} | ${round(row.rawRate)} | ${round(row.shrunkRate)} | ${round(row.shrinkageGap)} |`).join("\n")}

## How James–Stein ideas fit the project

The classical James–Stein estimator is for simultaneous Gaussian mean estimation. Our data are county-month binary events, so the more appropriate implementation family is:

- empirical-Bayes beta-binomial shrinkage for county event probabilities,
- empirical-Bayes / Poisson-gamma shrinkage for count-like county rates,
- hierarchical logistic or Poisson partial-pooling models for richer prediction.

So for Atlas TX, the right reading is:

> Use **Stein-type shrinkage principles** to stabilize noisy county baselines and county-level feature rates, rather than applying the classical James–Stein formula directly to final classifier outputs.

## Recommended next shrinkage experiments

1. **Shrunk baseline inside the prediction ladder**
   - Replace or augment raw persistence features with a shrunk county baseline risk feature.

2. **Hierarchical county intercept model**
   - Replace unrestricted county fixed effects with partial pooling.

3. **Shrinkage for overflow burden**
   - Build shrunk county overflow-intensity and severe-overflow rates.

4. **Basin-level partial pooling**
   - Shrink counties toward basin- or region-level means, not only statewide mean.

5. **PWS-level shrinkage**
   - If the panel moves to PWS-month, use the same idea for system-level sparse event baselines.

## Paper implication

If the empirical-Bayes county baseline is competitive with or better than raw county rates, that helps justify a paper section on:
- small-area instability,
- shrinkage-based stabilization,
- and why raw county burden ranking should not be treated as equally reliable across counties.

## Sources

- Small Area Shrinkage Estimation  
  https://projecteuclid.org/journals/statistical-science/volume-27/issue-1/Small-Area-Shrinkage-Estimation/10.1214/11-STS374.full
- Empirical Bayes and the James–Stein Estimator  
  https://utstat.toronto.edu/reid/sta2212s/2021/LSIChapter1.pdf
- Small area estimation with mixed models: a review  
  https://link.springer.com/article/10.1007/s42081-020-00076-x?error=cookies_not_supported&code=b6c9b5c6-f540-4e9c-ba42-4d29099ad10b
- On Application of the Empirical Bayes Shrinkage in Epidemiological Settings  
  https://mdpi-res.com/d_attachment/ijerph/ijerph-07-00380/article_deploy/ijerph-07-00380.pdf?version=1403137707
- Poisson Counts, Square Root Transformation and Small Area Estimation  
  https://link.springer.com/content/pdf/10.1007/s13571-021-00269-8.pdf?error=cookies_not_supported&code=7e0b3ca1-49b9-4918-8b79-b6278b311977
`;

  await fs.mkdir(path.dirname(OUTPUT_MARKDOWN_PATH), { recursive: true });
  await fs.mkdir(path.dirname(OUTPUT_JSON_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_MARKDOWN_PATH, markdown, "utf8");
  await fs.writeFile(OUTPUT_JSON_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), prior, countySummaries, models }, null, 2), "utf8");

  return { markdownPath: OUTPUT_MARKDOWN_PATH, jsonPath: OUTPUT_JSON_PATH, prior, countySummaries, models };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runShrinkageEbBaselineExperiment()
    .then((result) => {
      console.log(JSON.stringify({ markdownPath: result.markdownPath, jsonPath: result.jsonPath, prior: result.prior }, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
