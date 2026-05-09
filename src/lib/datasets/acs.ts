import { promises as fs } from 'node:fs';
import path from 'node:path';

import { normalizeCountyName } from '../counties';

export type AcsCountyPopulationRawRow = {
  NAME: string;
  B01003_001E: string | number;
};

export type AcsCountyPopulationSnapshot = {
  generatedAt: string;
  source: string;
  rows: AcsCountyPopulationRawRow[];
};

const SNAPSHOT_REL_PATH = 'public/cache/acs-county-tx.json';

function snapshotPath(): string {
  return path.resolve(process.cwd(), SNAPSHOT_REL_PATH);
}

export function normalizeAcsCountyPopulation(
  rows: AcsCountyPopulationRawRow[],
): Record<string, number> {
  const out: Record<string, number> = {};

  for (const row of rows) {
    if (!row?.NAME?.endsWith(', Texas')) continue;
    const countyPart = row.NAME.replace(/,\s*Texas$/, '');
    if (!/county$/i.test(countyPart)) continue;

    const population = Number(row.B01003_001E);
    if (!Number.isFinite(population)) continue;

    out[normalizeCountyName(countyPart)] = population;
  }

  return out;
}

export async function loadAcsCountyPopulationFromSnapshot(): Promise<
  Record<string, number>
> {
  const raw = await fs.readFile(snapshotPath(), 'utf8');
  const snapshot = JSON.parse(raw) as AcsCountyPopulationSnapshot;
  return normalizeAcsCountyPopulation(snapshot.rows);
}
