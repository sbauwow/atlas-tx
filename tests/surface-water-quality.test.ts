import { describe, expect, it } from "vitest";

import {
  buildSurfaceWaterQualityQueryUrl,
  loadSurfaceWaterQualityFromSnapshot,
  buildSurfaceWaterQualityCountyIndex,
  normalizeSurfaceWaterQualityResponses,
} from "@/lib/datasets/surface-water-quality";

describe("surface-water-quality dataset", () => {
  it("builds the TCEQ ArcGIS query URL for stream and reservoir segment layers", () => {
    const url = buildSurfaceWaterQualityQueryUrl(7, { resultRecordCount: 2 });

    expect(url).toContain("https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer/7/query");
    expect(url).toContain("outFields=SEG_ID%2CSEG_NAME%2CBASIN_NAME");
    expect(url).toContain("resultRecordCount=2");
    expect(url).toContain("returnGeometry=false");
    expect(url).toContain("f=pjson");
  });

  it("normalizes stream and reservoir segment responses into burden-indicator rows", () => {
    const rows = normalizeSurfaceWaterQualityResponses({
      generatedAt: "2026-05-09T00:00:00.000Z",
      source: "https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer",
      layers: {
        7: {
          layerId: 7,
          layerName: "Reservoir Segments",
          features: [
            {
              attributes: {
                SEG_ID: "0102",
                SEG_NAME: "Lake Meredith",
                BASIN_NAME: "Canadian River Basin",
                SEG_CLASS: "Classified",
                SEG_TYPE: "Reservoir",
                SEG_DESCRIPTION: "Reservoir in Potter County and Moore County",
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
          ],
          exceededTransferLimit: true,
        },
        8: {
          layerId: 8,
          layerName: "Stream Segments",
          features: [
            {
              attributes: {
                SEG_ID: "0304",
                SEG_NAME: "Days Creek",
                BASIN_NAME: "Sulphur River Basin",
                SEG_CLASS: "Classified",
                SEG_TYPE: "Freshwater Stream",
                SEG_DESCRIPTION: "From the Arkansas State Line in Bowie County to the confluence of Swampoodle Creek and Nix Creek in Bowie County",
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
          ],
          exceededTransferLimit: true,
        },
      },
    });

    expect(rows).toEqual([
      {
        layerId: 7,
        layerName: "Reservoir Segments",
        segmentId: "0102",
        segmentName: "Lake Meredith",
        basinName: "Canadian River Basin",
        segmentClass: "Classified",
        segmentType: "Reservoir",
        countyName: "Potter County",
        size: 16235.8905,
        sizeUnit: "Acres",
        assessmentYear: 2024,
        isImpaired: true,
        impairmentFlags: {
          aquaticLife: false,
          contactRecreation: false,
          generalUse: true,
          fishConsumption: true,
          publicWaterSupply: false,
          oysterWaters: false,
        },
        sourceUrl: "https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer/7",
      },
      {
        layerId: 8,
        layerName: "Stream Segments",
        segmentId: "0304",
        segmentName: "Days Creek",
        basinName: "Sulphur River Basin",
        segmentClass: "Classified",
        segmentType: "Freshwater Stream",
        countyName: "Bowie County",
        size: 5.0175,
        sizeUnit: "Miles",
        assessmentYear: 2024,
        isImpaired: true,
        impairmentFlags: {
          aquaticLife: false,
          contactRecreation: true,
          generalUse: false,
          fishConsumption: false,
          publicWaterSupply: false,
          oysterWaters: false,
        },
        sourceUrl: "https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer/8",
      },
    ]);
  });

  it("can backfill county names from AU-layer descriptions when segment rows lack county text", () => {
    const countyBySegment = buildSurfaceWaterQualityCountyIndex({
      2: [
        {
          attributes: {
            SEG_ID: "1002",
            AU_ID: "1002_07",
            AU_LOCATION_DESCRIPTION: "From Lake Houston Dam in Harris County to the confluence of Spring Creek",
          },
        },
      ],
      3: [],
    });

    const rows = normalizeSurfaceWaterQualityResponses(
      {
        generatedAt: "2026-05-09T00:00:00.000Z",
        source: "https://gisweb.tceq.texas.gov/arcgis/rest/services/Segments/SegmentsViewer_PRD/MapServer",
        layers: {
          7: {
            layerId: 7,
            layerName: "Reservoir Segments",
            features: [
              {
                attributes: {
                  SEG_ID: "1002",
                  SEG_NAME: "Lake Houston",
                  BASIN_NAME: "San Jacinto River Basin",
                  SEG_CLASS: "Classified",
                  SEG_TYPE: "Reservoir",
                  SEG_DESCRIPTION: "Impounds San Jacinto River",
                  SIZE_: 10,
                  SIZE_UNIT: "Acres",
                  IR_YEAR: "2024",
                  IMP_AQUATIC_LIFE: "N",
                  IMP_CONTACT_REC: "N",
                  IMP_GENERAL: "N",
                  IMP_FISH_CONSUMPTION: "N",
                  IMP_PWS: "N",
                  IMP_OYSTER_WATERS: "N",
                },
              },
            ],
          },
          8: {
            layerId: 8,
            layerName: "Stream Segments",
            features: [],
          },
        },
      },
      countyBySegment,
    );

    expect(rows[0]?.countyName).toBe("Harris County");
  });

  it("loads the committed snapshot rows", async () => {
    const rows = await loadSurfaceWaterQualityFromSnapshot();

    expect(rows.length).toBeGreaterThan(1);
    expect(rows.some((row) => row.isImpaired)).toBe(true);
    expect(rows.some((row) => row.layerId === 7)).toBe(true);
    expect(rows.some((row) => row.layerId === 8)).toBe(true);
    expect(rows.some((row) => row.countyName)).toBe(true);
  });
});
