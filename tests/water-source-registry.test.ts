import { describe, expect, it } from "vitest";
import { WATER_SOURCE_REGISTRY, getWaterSource, listWaterSources } from "@/lib/water/water-source-registry";

describe("water source registry", () => {
  it("lists the planned verified water sources", () => {
    expect(WATER_SOURCE_REGISTRY.map((source) => source.sourceId)).toEqual([
      "fema-nfhl",
      "usgs-stream-sites",
      "lcra-hydromet-stageflow",
      "lcra-hydromet-lakelevels",
      "lcra-arrp-outfalls",
      "lcra-arrp-land-permits",
      "nws-alerts",
      "tceq-sewer-overflows",
      "tceq-general-water-permits",
      "tceq-water-districts",
      "puct-water-iou",
      "puct-water-submeter",
      "twdb-flood-discovery",
      "twdb-gis-discovery",
      "tceq-gis-discovery",
      "national-levee-discovery",
    ]);
  });

  it("looks up a source by id and preserves verified endpoint metadata", () => {
    expect(getWaterSource("nws-alerts")).toMatchObject({
      kind: "nws-geojson",
      joinStrategy: "county-name",
      refreshCadence: "hourly",
    });
    expect(getWaterSource("missing-source")).toBeUndefined();
    expect(listWaterSources()).toHaveLength(16);
  });
});
