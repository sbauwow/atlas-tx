import { describe, expect, it } from "vitest";
import { ATLAS_COUNTY_SOURCES, createAtlasCountyDataService } from "@/lib/atlas-county-sources";

describe("Atlas county source registry", () => {
  it("registers broad default sources for future county collection", () => {
    expect(ATLAS_COUNTY_SOURCES.map((source) => source.sourceId)).toEqual([
      "permits",
      "water-districts",
      "cpi-investigations",
      "county-returns",
      "sales-tax-rates",
    ]);
  });

  it("creates a service backed by the default source registry", () => {
    const service = createAtlasCountyDataService();
    expect(service.listSources()).toHaveLength(5);
  });
});
