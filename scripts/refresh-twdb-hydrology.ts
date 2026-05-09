import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import {
  normalizeTwdbHydrologyRawSnapshot,
  type TwdbHydrologyGeometryType,
  type TwdbHydrologyLayerId,
  type TwdbHydrologyRawRow,
  type TwdbHydrologySnapshot,
} from "../src/lib/datasets/twdb-hydrology";

const execFileAsync = promisify(execFile);

export type TwdbHydrologyRefreshLayer = {
  layerId: TwdbHydrologyLayerId;
  layerName: string;
  sourceUrl: string;
};

export const TWDB_HYDROLOGY_REFRESH_PLAN: TwdbHydrologyRefreshLayer[] = [
  {
    layerId: "twdb-major-aquifers",
    layerName: "Major Aquifers",
    sourceUrl: "https://www.twdb.texas.gov/mapping/gisdata/doc/major_aquifers.zip",
  },
  {
    layerId: "twdb-river-basins",
    layerName: "Major River Basins",
    sourceUrl: "https://www.twdb.texas.gov/mapping/gisdata/doc/Major_River_Basins_Shapefile.zip",
  },
  {
    layerId: "twdb-huc8",
    layerName: "HUC 8 Hydrologic Units",
    sourceUrl: "https://www.twdb.texas.gov/mapping/gisdata/doc/USGS_HUC_8_Shapefile.zip",
  },
];

export function buildDefaultTwdbHydrologyRefreshPlan(): TwdbHydrologyRefreshLayer[] {
  return [...TWDB_HYDROLOGY_REFRESH_PLAN];
}

function asNumber(value: string): number | string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : trimmed;
}

function parseDbfRows(buffer: Buffer): Array<Record<string, unknown>> {
  const recordCount = buffer.readUInt32LE(4);
  const headerLength = buffer.readUInt16LE(8);
  const recordLength = buffer.readUInt16LE(10);

  const fields: Array<{ name: string; type: string; length: number }> = [];
  let offset = 32;
  while (offset < headerLength && buffer[offset] !== 0x0d) {
    const name = buffer.subarray(offset, offset + 11).toString("ascii").replace(/\0.*$/, "").trim();
    const type = String.fromCharCode(buffer[offset + 11] ?? 0x43);
    const length = buffer[offset + 16] ?? 0;
    fields.push({ name, type, length });
    offset += 32;
  }

  const rows: Array<Record<string, unknown>> = [];
  for (let recordIndex = 0; recordIndex < recordCount; recordIndex += 1) {
    const recordOffset = headerLength + recordIndex * recordLength;
    if (buffer[recordOffset] === 0x2a) continue;

    let fieldOffset = recordOffset + 1;
    const row: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = buffer.subarray(fieldOffset, fieldOffset + field.length).toString("latin1");
      const trimmed = raw.trim();
      row[field.name] = field.type === "N" || field.type === "F" ? asNumber(trimmed) : trimmed;
      fieldOffset += field.length;
    }
    rows.push(row);
  }

  return rows;
}

function parseShpBoundingBoxes(buffer: Buffer): Array<{ bbox: [number, number, number, number]; geometryType: TwdbHydrologyGeometryType }> {
  const rows: Array<{ bbox: [number, number, number, number]; geometryType: TwdbHydrologyGeometryType }> = [];
  let offset = 100;

  while (offset + 8 <= buffer.length) {
    const contentLengthWords = buffer.readInt32BE(offset + 4);
    const contentLengthBytes = contentLengthWords * 2;
    const contentOffset = offset + 8;
    if (contentOffset + contentLengthBytes > buffer.length) break;

    const shapeType = buffer.readInt32LE(contentOffset);
    if (shapeType !== 0 && contentLengthBytes >= 36) {
      rows.push({
        bbox: [
          Number(buffer.readDoubleLE(contentOffset + 4).toFixed(6)),
          Number(buffer.readDoubleLE(contentOffset + 12).toFixed(6)),
          Number(buffer.readDoubleLE(contentOffset + 20).toFixed(6)),
          Number(buffer.readDoubleLE(contentOffset + 28).toFixed(6)),
        ],
        geometryType: shapeType === 5 || shapeType === 15 || shapeType === 25 || shapeType === 31 ? "polygon" : "other",
      });
    }

    offset = contentOffset + contentLengthBytes;
  }

  return rows;
}

async function downloadZipBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TWDB hydrology download failed (${response.status}) for ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function unzipEntries(zipBuffer: Buffer): Promise<Record<string, Buffer>> {
  const workdir = await fs.mkdtemp(path.join(os.tmpdir(), "atlas-tx-twdb-"));
  const zipPath = path.join(workdir, "layer.zip");
  await fs.writeFile(zipPath, zipBuffer);

  try {
    const listing = await execFileAsync("unzip", ["-Z1", zipPath], {
      encoding: "utf8",
      maxBuffer: 10_000_000,
    });
    const files = String(listing.stdout)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((name) => !name.endsWith("/"));

    const entries = await Promise.all(
      files.map(async (name) => {
        const extracted = await execFileAsync("unzip", ["-p", zipPath, name], {
          encoding: "buffer",
          maxBuffer: 50_000_000,
        });
        return [name, extracted.stdout as Buffer] as const;
      }),
    );

    return Object.fromEntries(entries);
  } finally {
    await fs.rm(workdir, { recursive: true, force: true });
  }
}

function findEntry(entries: Record<string, Buffer>, suffix: string): Buffer {
  const match = Object.entries(entries).find(([name]) => name.toLowerCase().endsWith(suffix));
  if (!match) {
    throw new Error(`TWDB hydrology archive is missing a ${suffix} entry`);
  }
  return match[1];
}

async function collectLayerRowsFromZip(layer: TwdbHydrologyRefreshLayer): Promise<TwdbHydrologyRawRow[]> {
  const zipBuffer = await downloadZipBuffer(layer.sourceUrl);
  const entries = await unzipEntries(zipBuffer);
  const dbfRows = parseDbfRows(findEntry(entries, ".dbf"));
  const shpRows = parseShpBoundingBoxes(findEntry(entries, ".shp"));

  if (dbfRows.length !== shpRows.length) {
    throw new Error(
      `TWDB hydrology row count mismatch for ${layer.layerId}: dbf=${dbfRows.length} shp=${shpRows.length}`,
    );
  }

  return dbfRows.map((attributes, index) => ({
    attributes,
    bbox: shpRows[index]!.bbox,
    geometryType: shpRows[index]!.geometryType,
  }));
}

export function summarizeTwdbHydrologyRefresh(snapshot: TwdbHydrologySnapshot) {
  const rowsByLayer = snapshot.rows.reduce<Record<string, number>>((accumulator, row) => {
    accumulator[row.layerId] = (accumulator[row.layerId] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    layerCount: buildDefaultTwdbHydrologyRefreshPlan().length,
    rowCount: snapshot.rows.length,
    rowsByLayer,
  };
}

export async function executeTwdbHydrologyRefresh(options?: {
  generatedAt?: string;
  collectLayerRows?: (layer: TwdbHydrologyRefreshLayer) => Promise<TwdbHydrologyRawRow[]>;
}) {
  const plan = buildDefaultTwdbHydrologyRefreshPlan();
  const collectLayerRows = options?.collectLayerRows ?? collectLayerRowsFromZip;
  const generatedAt = options?.generatedAt ?? new Date().toISOString();

  const layerRows = await Promise.all(
    plan.map(async (layer) => ({
      layer,
      rows: await collectLayerRows(layer),
    })),
  );

  const rawSnapshot = {
    generatedAt,
    source: "TWDB GIS downloads",
    layers: Object.fromEntries(
      layerRows.map(({ layer, rows }) => [
        layer.layerId,
        {
          layerName: layer.layerName,
          sourceUrl: layer.sourceUrl,
          rows,
        },
      ]),
    ),
  };

  const snapshot: TwdbHydrologySnapshot = {
    generatedAt,
    source: "TWDB GIS downloads",
    rows: normalizeTwdbHydrologyRawSnapshot(rawSnapshot),
  };

  return {
    plan,
    rawSnapshot,
    snapshot,
    summary: summarizeTwdbHydrologyRefresh(snapshot),
  };
}

export async function writeTwdbHydrologySnapshot(
  snapshot: TwdbHydrologySnapshot,
  options?: {
    path?: string;
    writeFile?: (path: string, content: string) => Promise<void>;
  },
) {
  const outputPath = options?.path ?? "public/cache/twdb-hydrology-tx.json";
  const writeFile =
    options?.writeFile ??
    (async (targetPath: string, content: string) => {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, content);
    });

  await writeFile(outputPath, JSON.stringify(snapshot));
}

export async function main() {
  const result = await executeTwdbHydrologyRefresh();
  await writeTwdbHydrologySnapshot(result.snapshot);
  console.log(
    JSON.stringify(
      {
        summary: result.summary,
        snapshotPath: "public/cache/twdb-hydrology-tx.json",
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
