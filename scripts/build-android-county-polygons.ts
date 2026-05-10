/**
 * Build a tiny pre-projected polygon asset for the android map screen.
 *
 * Reads `public/cache/tx-counties-topo.json`, runs the same Albers projection
 * as the web `/water` choropleth (rotate -99°, center 31.3°N, parallels
 * 28°/36°), and writes the result to
 * `android/app/src/main/assets/tx-counties-polygons.json`.
 *
 * Each county is reduced to its FIPS, name, and a list of rings, where each
 * ring is a flat array of `x, y` coordinates in a normalized 1000×550 viewbox
 * (width-major). The android client just scales to its actual canvas size, so
 * we never have to ship a TopoJSON parser or Albers projection to Kotlin.
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import { geoAlbers, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";

const VIEW_W = 1000;
const VIEW_H = 550;

type CountyTopology = Topology<{ counties: GeometryCollection<{ name?: string }> }>;
type CountyPolygon = {
  fips: string;
  name: string;
  rings: number[][];
};

function main() {
  const topoPath = join(process.cwd(), "public", "cache", "tx-counties-topo.json");
  const topo = JSON.parse(readFileSync(topoPath, "utf8")) as CountyTopology;
  const fc = feature(topo, topo.objects.counties) as unknown as FeatureCollection<Geometry, { name?: string }>;
  const geometries = topo.objects.counties.geometries;

  const projection = geoAlbers()
    .rotate([99, 0])
    .center([0, 31.3])
    .parallels([28, 36])
    .scale(Math.min(VIEW_W, VIEW_H) * 5.2)
    .translate([VIEW_W / 2, VIEW_H / 2]);
  const path = geoPath(projection);

  const counties: CountyPolygon[] = fc.features.map((f, i) => {
    const id = String(geometries[i]?.id ?? f.id ?? "");
    const name = f.properties?.name ?? "";
    const rings = ringsFromFeature(f, projection);
    return { fips: id, name, rings };
  });

  const outPath = join(
    process.cwd(),
    "android",
    "app",
    "src",
    "main",
    "assets",
    "tx-counties-polygons.json",
  );
  mkdirSync(dirname(outPath), { recursive: true });
  const payload = { viewWidth: VIEW_W, viewHeight: VIEW_H, counties };
  writeFileSync(outPath, JSON.stringify(payload));

  const totalRingPoints = counties.reduce(
    (sum, c) => sum + c.rings.reduce((s, r) => s + r.length / 2, 0),
    0,
  );
  console.log(
    `[android-polygons] wrote ${counties.length} counties, ${totalRingPoints} ring points → ${outPath}`,
  );
  // Touch the unused d3 path import so eslint stays quiet — geoPath is here in
  // case we later want to dump SVG path strings instead of raw points.
  void path;
}

function ringsFromFeature(
  f: Feature<Geometry, { name?: string }>,
  projection: ReturnType<typeof geoAlbers>,
): number[][] {
  const out: number[][] = [];
  const geom = f.geometry;
  if (!geom) return out;

  if (geom.type === "Polygon") {
    for (const ring of geom.coordinates) out.push(projectRing(ring, projection));
  } else if (geom.type === "MultiPolygon") {
    for (const polygon of geom.coordinates) {
      for (const ring of polygon) out.push(projectRing(ring, projection));
    }
  }
  return out;
}

function projectRing(
  ring: number[][],
  projection: ReturnType<typeof geoAlbers>,
): number[] {
  const flat: number[] = [];
  for (const [lon, lat] of ring) {
    const point = projection([lon, lat]);
    if (!point) continue;
    flat.push(round(point[0]), round(point[1]));
  }
  return flat;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

main();
