import { describe, expect, it } from "vitest";

import {
  buildDefaultTwdbHydrologyRefreshPlan,
  executeTwdbHydrologyRefresh,
  writeTwdbHydrologySnapshot,
} from "../scripts/refresh-twdb-hydrology";

describe("refresh-twdb-hydrology", () => {
  it("builds the default refresh plan for the three TWDB hydrology layers", () => {
    expect(buildDefaultTwdbHydrologyRefreshPlan()).toEqual([
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
    ]);
  });

  it("executes the refresh plan, normalizes rows, and builds a committed snapshot payload", async () => {
    const result = await executeTwdbHydrologyRefresh({
      generatedAt: "2026-05-09T04:00:00.000Z",
      collectLayerRows: async (layer) => {
        if (layer.layerId === "twdb-major-aquifers") {
          return [
            {
              attributes: { AQUIFER: 1, AQ_NAME: "SEYMOUR" },
              bbox: [-100.5, 34.6, -100, 35] as [number, number, number, number],
              geometryType: "polygon" as const,
            },
          ];
        }
        if (layer.layerId === "twdb-river-basins") {
          return [
            {
              attributes: { basin_num: 12, basin_name: "Brazos" },
              bbox: [-103, 28.8, -95.3, 34.6] as [number, number, number, number],
              geometryType: "polygon" as const,
            },
          ];
        }
        return [
          {
            attributes: {
              HUC_8: "11080006",
              SUBBASIN: "Upper Canadian-Ute Reservoir",
              BASIN: "Upper Canadian",
              REGION: "Arkansas-White-Red Region",
              SUBREGION: "Upper Canadian",
            },
            bbox: [-103.04, 35.3, -103, 35.39] as [number, number, number, number],
            geometryType: "polygon" as const,
          },
        ];
      },
    });

    expect(result.summary).toEqual({
      layerCount: 3,
      rowCount: 3,
      rowsByLayer: {
        "twdb-major-aquifers": 1,
        "twdb-river-basins": 1,
        "twdb-huc8": 1,
      },
    });
    expect(result.snapshot).toMatchObject({
      generatedAt: "2026-05-09T04:00:00.000Z",
      source: "TWDB GIS downloads",
    });
    expect(result.snapshot.rows[2]).toMatchObject({
      layerId: "twdb-huc8",
      primaryCode: "11080006",
      basin: "Upper Canadian",
    });
  });

  it("writes the hydrology snapshot to the requested path", async () => {
    const writes: Array<{ path: string; content: string }> = [];

    await writeTwdbHydrologySnapshot(
      {
        generatedAt: "2026-05-09T04:00:00.000Z",
        source: "TWDB GIS downloads",
        rows: [],
      },
      {
        path: "public/cache/twdb-hydrology-tx.json",
        writeFile: async (path, content) => {
          writes.push({ path, content });
        },
      },
    );

    expect(writes).toHaveLength(1);
    expect(writes[0]).toEqual({
      path: "public/cache/twdb-hydrology-tx.json",
      content: JSON.stringify({
        generatedAt: "2026-05-09T04:00:00.000Z",
        source: "TWDB GIS downloads",
        rows: [],
      }),
    });
  });
});
