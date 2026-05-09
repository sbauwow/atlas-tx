import { describe, expect, it } from "vitest";

import {
  buildDefaultSurfaceWaterQualityRefreshPlan,
  executeSurfaceWaterQualityRefresh,
  writeSurfaceWaterQualitySnapshot,
} from "../scripts/refresh-surface-water-quality";

describe("refresh-surface-water-quality", () => {
  it("builds the default refresh plan for reservoir and stream segment layers", () => {
    expect(buildDefaultSurfaceWaterQualityRefreshPlan()).toEqual([
      {
        layerId: 7,
        layerName: "Reservoir Segments",
        sourceUrl: "https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer/7",
      },
      {
        layerId: 8,
        layerName: "Stream Segments",
        sourceUrl: "https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer/8",
      },
    ]);
  });

  it("executes the refresh plan, normalizes rows, and builds a committed snapshot payload", async () => {
    const result = await executeSurfaceWaterQualityRefresh({
      generatedAt: "2026-05-09T05:00:00.000Z",
      collectLayerFeatures: async (layer) => {
        if (layer.layerId === 7) {
          return [
            {
              attributes: {
                SEG_ID: "0102",
                SEG_NAME: "Lake Meredith",
                BASIN_NAME: "Canadian River Basin",
                SEG_CLASS: "Classified",
                SEG_TYPE: "Reservoir",
                SEG_DESCRIPTION: "Impounds Canadian River",
                SIZE_: 16235.89053532,
                SIZE_UNIT: "Acres",
                IR_YEAR: "2024",
                IMP_AQUATIC_LIFE: "N",
                IMP_CONTACT_REC: "N",
                IMP_GENERAL: "Y",
                IMP_FISH_CONSUMPTION: "Y",
                IMP_PWS: "N",
                IMP_OYSTER_WATERS: "N",
              },
            },
          ];
        }
        return [
          {
              attributes: {
                SEG_ID: "0304",
                SEG_NAME: "Days Creek",
                BASIN_NAME: "Sulphur River Basin",
                SEG_CLASS: "Classified",
                SEG_TYPE: "Freshwater Stream",
                SEG_DESCRIPTION: "From the state line to the confluence",
                SIZE_: 5.01746821,
SIZE_UNIT: "Miles",
              IR_YEAR: 2024,
              IMP_AQUATIC_LIFE: "N",
              IMP_CONTACT_REC: "Y",
              IMP_GENERAL: "N",
              IMP_FISH_CONSUMPTION: "N",
              IMP_PWS: "N",
              IMP_OYSTER_WATERS: "N",
            },
          },
        ];
      },
      collectCountyJoinFeatures: async (layer) => {
        if (layer.layerId === 2) {
          return [
            {
              attributes: {
                SEG_ID: "0102",
                AU_ID: "0102_01",
                AU_LOCATION_DESCRIPTION: "From Lake Meredith Dam in Potter County to the shoreline",
              },
            },
          ];
        }
        return [
          {
            attributes: {
              SEG_ID: "0304",
              AU_ID: "0304_01",
              AU_LOCATION_DESCRIPTION: "From the Arkansas State Line in Bowie County to the confluence",
            },
          },
        ];
      },
    });

    expect(result.summary).toEqual({
      layerCount: 2,
      rowCount: 2,
      rowsByLayer: {
        "7": 1,
        "8": 1,
      },
      impairedRowCount: 2,
      countyCoverage: {
        rowsWithCounty: 2,
        rowsWithoutCounty: 0,
        percentWithCounty: 100,
        impairedRowsWithCounty: 2,
        joinSources: {
          direct: 0,
          auFallback: 2,
          geometryFallback: 0,
          unresolved: 0,
        },
      },
    });
    expect(result.snapshot).toMatchObject({
      generatedAt: "2026-05-09T05:00:00.000Z",
      source: "https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer",
    });
    expect(result.snapshot.rows[0]).toMatchObject({
      layerId: 7,
      segmentId: "0102",
      countyName: "Potter County",
      isImpaired: true,
    });
    expect(result.snapshot.rows[1]).toMatchObject({
      layerId: 8,
      segmentId: "0304",
      countyName: "Bowie County",
      impairmentFlags: {
        contactRecreation: true,
      },
    });
  });

  it("can backfill unresolved county names via geometry county lookup", async () => {
    const result = await executeSurfaceWaterQualityRefresh({
      generatedAt: "2026-05-09T06:00:00.000Z",
      collectLayerFeatures: async () => [
        {
          attributes: {
            SEG_ID: "0802D",
            SEG_NAME: "Menard Creek",
            BASIN_NAME: "Trinity River Basin",
            SEG_CLASS: "Unclassified",
            SEG_TYPE: "Freshwater Stream",
            SEG_DESCRIPTION: "From the confluence with segment 0802 of the Trinity River up to the confluence with Meetinghouse Creek.",
            SIZE_: 12.88,
            SIZE_UNIT: "Miles",
            IR_YEAR: 2024,
            IMP_AQUATIC_LIFE: "N",
            IMP_CONTACT_REC: "N",
            IMP_GENERAL: "N",
            IMP_FISH_CONSUMPTION: "N",
            IMP_PWS: "N",
            IMP_OYSTER_WATERS: "N",
          },
        },
      ],
      collectCountyJoinFeatures: async () => [],
      collectGeometryFeatures: async () => [
        {
          attributes: { SEG_ID: "0802D" },
          geometry: { paths: [[[-94.720914444, 30.462837222], [-94.720948889, 30.462823333]]] },
        },
      ],
      resolveCountyForPoint: async () => "Liberty County",
    });

    expect(result.snapshot.rows[0]?.countyName).toBe("Liberty County");
    expect(result.summary.countyCoverage.joinSources).toEqual({
      direct: 0,
      auFallback: 0,
      geometryFallback: 2,
      unresolved: 0,
    });
  });

  it("builds a geometry query URL for unresolved segment ids", async () => {
    const mod = await import("../scripts/refresh-surface-water-quality");
    const url = mod.buildSurfaceWaterQualityGeometryQueryUrl(8, ["0802D", "0304"]);

    expect(url).toContain("/MapServer/8/query");
    expect(url).toContain("returnGeometry=true");
    expect(url).toContain("outFields=SEG_ID");
    expect(new URL(url).searchParams.get("where")).toBe("SEG_ID='0802D' OR SEG_ID='0304'");
  });

  it("writes the surface-water-quality snapshot to the requested path", async () => {
    const writes: Array<{ path: string; content: string }> = [];

    await writeSurfaceWaterQualitySnapshot(
      {
        generatedAt: "2026-05-09T05:00:00.000Z",
        source: "https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer",
        rows: [],
      },
      {
        path: "public/cache/surface-water-quality-tx.json",
        writeFile: async (path, content) => {
          writes.push({ path, content });
        },
      },
    );

    expect(writes).toEqual([
      {
        path: "public/cache/surface-water-quality-tx.json",
        content: JSON.stringify({
          generatedAt: "2026-05-09T05:00:00.000Z",
          source: "https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer",
          rows: [],
        }),
      },
    ]);
  });
});
