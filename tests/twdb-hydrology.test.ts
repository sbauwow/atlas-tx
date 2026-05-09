import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  loadTwdbHydrologyFromSnapshot,
  normalizeTwdbHydrologyRawSnapshot,
  type TwdbHydrologyRawSnapshot,
} from "@/lib/datasets/twdb-hydrology";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(here, "fixtures", "twdb-hydrology-raw-sample.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as TwdbHydrologyRawSnapshot;

describe("normalizeTwdbHydrologyRawSnapshot", () => {
  it("normalizes TWDB hydrology raw rows into canonical layer-tagged records", () => {
    const result = normalizeTwdbHydrologyRawSnapshot(fixture);

    expect(result).toHaveLength(6);
    expect(result[0]).toEqual({
      layerId: "twdb-major-aquifers",
      layerName: "Major Aquifers",
      primaryCode: "1",
      name: "SEYMOUR",
      basin: null,
      region: null,
      subregion: null,
      bbox: [-100.543503, 34.679629, -99.999031, 35.03237],
      geometryType: "polygon",
      sourceUrl: "https://www.twdb.texas.gov/mapping/gisdata/doc/major_aquifers.zip",
    });
    expect(result[2]).toEqual({
      layerId: "twdb-river-basins",
      layerName: "Major River Basins",
      primaryCode: "12",
      name: "Brazos",
      basin: "Brazos",
      region: null,
      subregion: null,
      bbox: [-103.051501, 28.875647, -95.37043, 34.618356],
      geometryType: "polygon",
      sourceUrl: "https://www.twdb.texas.gov/mapping/gisdata/doc/Major_River_Basins_Shapefile.zip",
    });
    expect(result[4]).toEqual({
      layerId: "twdb-huc8",
      layerName: "HUC 8 Hydrologic Units",
      primaryCode: "11080006",
      name: "Upper Canadian-Ute Reservoir",
      basin: "Upper Canadian",
      region: "Arkansas-White-Red Region",
      subregion: "Upper Canadian",
      bbox: [-103.042226, 35.306865, -103.007414, 35.39434],
      geometryType: "polygon",
      sourceUrl: "https://www.twdb.texas.gov/mapping/gisdata/doc/USGS_HUC_8_Shapefile.zip",
    });
  });
});

describe("loadTwdbHydrologyFromSnapshot", () => {
  it("loads the committed TWDB hydrology snapshot and can filter to one layer", async () => {
    const rows = await loadTwdbHydrologyFromSnapshot("twdb-huc8");

    expect(rows).toHaveLength(208);
    expect(rows[0]?.layerId).toBe("twdb-huc8");
    expect(rows[0]?.name).toBe("Upper Canadian-Ute Reservoir");
  });
});
