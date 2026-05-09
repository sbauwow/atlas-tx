/**
 * Filters us-atlas counties-10m.json to Texas (FIPS 48) and writes a small
 * snapshot to public/cache/tx-counties-topo.json. Run once, commit the output.
 *
 * Run via: npx tsx scripts/build-tx-counties-topo.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

type Topology = {
  type: "Topology";
  arcs: number[][][];
  bbox?: [number, number, number, number];
  transform?: { scale: [number, number]; translate: [number, number] };
  objects: Record<
    string,
    {
      type: string;
      geometries: Array<{
        type: string;
        id?: string | number;
        properties?: Record<string, unknown>;
        arcs?: unknown;
      }>;
    }
  >;
};

const inputPath = join(ROOT, "node_modules", "us-atlas", "counties-10m.json");
const outputPath = join(ROOT, "public", "cache", "tx-counties-topo.json");

const topo = JSON.parse(readFileSync(inputPath, "utf8")) as Topology;

// Texas state FIPS = 48; county FIPS are 48xxx (5-digit strings in us-atlas).
const TX_PREFIX = "48";

const countiesObj = topo.objects.counties;
if (!countiesObj || !Array.isArray(countiesObj.geometries)) {
  throw new Error("us-atlas counties-10m.json missing objects.counties.geometries");
}

const txGeometries = countiesObj.geometries.filter((geom) => {
  const id = String(geom.id ?? "");
  return id.startsWith(TX_PREFIX) && id.length === 5;
});

if (txGeometries.length < 200 || txGeometries.length > 260) {
  throw new Error(`expected 254 Texas counties, got ${txGeometries.length}`);
}

// Collect arc indices the TX counties reference. We keep ALL arcs (it's already
// only ~800KB; pruning saves ~half but the cost of recomputing arc indices for
// nested MultiPolygon structures is not worth it for a one-off snapshot).
const trimmed: Topology = {
  type: "Topology",
  bbox: topo.bbox,
  transform: topo.transform,
  arcs: topo.arcs,
  objects: {
    counties: {
      type: countiesObj.type,
      geometries: txGeometries,
    },
  },
};

writeFileSync(outputPath, JSON.stringify(trimmed));
const sizeBytes = readFileSync(outputPath).byteLength;
console.log(`wrote ${outputPath} (${txGeometries.length} counties, ${(sizeBytes / 1024).toFixed(0)} KB)`);
