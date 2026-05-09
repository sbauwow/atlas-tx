import { describe, expect, it } from "vitest";

import { loadAcsCountyPopulationFromSnapshot, normalizeAcsCountyPopulation } from "@/lib/datasets/acs";

describe("normalizeAcsCountyPopulation", () => {
  it("normalizes ACS county rows into county -> population mapping", () => {
    const result = normalizeAcsCountyPopulation([
      {
        NAME: "Brazoria County, Texas",
        B01003_001E: "380000",
      },
      {
        NAME: "Comal County, Texas",
        B01003_001E: "180000",
      },
      {
        NAME: "Puerto Rico Municipio, Puerto Rico",
        B01003_001E: "999",
      },
    ]);

    expect(result).toEqual({
      "Brazoria County": 380000,
      "Comal County": 180000,
    });
  });
});

describe("loadAcsCountyPopulationFromSnapshot", () => {
  it("reads the committed ACS county snapshot and returns a normalized map", async () => {
    const result = await loadAcsCountyPopulationFromSnapshot();

    expect(result["Brazoria County"]).toBe(380000);
    expect(result["Comal County"]).toBe(180000);
    expect(result["Travis County"]).toBe(1300000);
  });
});
