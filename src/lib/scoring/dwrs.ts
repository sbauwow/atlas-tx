import type { SdwisRow } from "../datasets/sdwis";
import { normalizeCountyName } from "../counties";

export type DrinkingWaterRiskInput = {
  violations: SdwisRow[];
  county?: string;
  minPopulation?: number;
  asOf?: string;
};

export type DrinkingWaterRiskRow = {
  pwsId: string;
  pwsName: string | null;
  county: string | null;
  populationServed: number;
  violationCount: number;
  rawScore: number;
  score: number;
  components: {
    violationSeverity: number;
    populationWeight: number;
    recencyWeight: number;
  };
  topViolations: Array<{
    code: string | null;
    date: string | null;
  }>;
  caveats: string[];
};

type PwsAccumulator = {
  pwsId: string;
  pwsName: string | null;
  county: string | null;
  populationServed: number;
  violationCount: number;
  rawScore: number;
  violationSeverity: number;
  populationWeight: number;
  recencyWeight: number;
  topViolations: Array<{
    code: string | null;
    date: string | null;
    contribution: number;
  }>;
};

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function normalizeScore(value: number, min: number, max: number): number {
  if (max === min) return 100;
  return Math.round(((value - min) / (max - min)) * 10000) / 100;
}

function monthsBetween(start: Date, end: Date): number {
  return (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
}

function severityWeight(publicNotificationTier: number | null): number {
  if (publicNotificationTier === 1) return 2;
  if (publicNotificationTier === 2) return 1.5;
  if (publicNotificationTier === 3) return 1;
  return 1;
}

function recencyWeight(date: string | null, asOf: Date): number {
  if (!date) return 0.25;
  const months = monthsBetween(new Date(`${date}T00:00:00Z`), asOf);
  if (months <= 3) return 1;
  if (months <= 12) return 0.5;
  return 0.25;
}

function populationWeight(populationServed: number | null): number {
  if (!populationServed || populationServed <= 0) return 0;
  return populationServed / 5000;
}

export function scoreDrinkingWaterRisk(input: DrinkingWaterRiskInput): DrinkingWaterRiskRow[] {
  const targetCounty = input.county ? normalizeCountyName(input.county) : null;
  const asOf = new Date(`${input.asOf ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const accumulators = new Map<string, PwsAccumulator>();

  for (const row of input.violations) {
    if (!row.isHealthBased) continue;
    const county = row.county ? normalizeCountyName(row.county) : null;
    if (targetCounty && county !== targetCounty) continue;

    const popWeight = populationWeight(row.populationServed);
    if (popWeight < ((input.minPopulation ?? 0) / 5000)) continue;

    const sevWeight = severityWeight(row.publicNotificationTier);
    const recWeight = recencyWeight(row.complPerBeginDate, asOf);
    const contribution = sevWeight * popWeight * recWeight;

    const acc = accumulators.get(row.pwsid) ?? {
      pwsId: row.pwsid,
      pwsName: row.pwsName,
      county,
      populationServed: row.populationServed ?? 0,
      violationCount: 0,
      rawScore: 0,
      violationSeverity: 0,
      populationWeight: popWeight,
      recencyWeight: 0,
      topViolations: [],
    };

    acc.violationCount += 1;
    acc.rawScore += contribution;
    acc.violationSeverity += sevWeight;
    acc.populationWeight = popWeight;
    acc.recencyWeight += recWeight;
    acc.topViolations.push({
      code: row.violationCode,
      date: row.complPerBeginDate,
      contribution,
    });
    accumulators.set(row.pwsid, acc);
  }

  const rows = [...accumulators.values()].map((acc) => ({
    pwsId: acc.pwsId,
    pwsName: acc.pwsName,
    county: acc.county,
    populationServed: acc.populationServed,
    violationCount: acc.violationCount,
    rawScore: round4(acc.rawScore),
    components: {
      violationSeverity: round4(acc.violationSeverity),
      populationWeight: round4(acc.populationWeight),
      recencyWeight: round4(acc.recencyWeight),
    },
    topViolations: acc.topViolations
      .sort((a, b) => b.contribution - a.contribution || (b.date ?? "").localeCompare(a.date ?? ""))
      .slice(0, 3)
      .map(({ code, date }) => ({ code, date })),
    caveats: [
      "DWRS is a risk indicator derived from SDWIS violation history, not a measurement of present harm.",
      "Small systems may be underrepresented because SDWIS coverage and population counts are imperfect.",
      "Recency is bucketed in code: <=3 months = 1.0, <=12 months = 0.5, older = 0.25.",
    ],
  }));

  const rawScores = rows.map((row) => row.rawScore);
  const min = rawScores.length ? Math.min(...rawScores) : 0;
  const max = rawScores.length ? Math.max(...rawScores) : 0;

  return rows
    .map((row) => ({
      ...row,
      score: normalizeScore(row.rawScore, min, max),
    }))
    .sort((a, b) => b.score - a.score || b.rawScore - a.rawScore);
}
