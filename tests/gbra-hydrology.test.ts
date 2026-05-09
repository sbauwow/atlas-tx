import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchGbraHydrologyLakes,
  fetchGbraHydrologyMajorRivers,
  filterGbraHydrologyLakesByName,
  filterGbraHydrologyMajorRiversByName,
  normalizeGbraHydrologyLakes,
  normalizeGbraHydrologyMajorRivers,
} from "@/lib/water/gbra-hydrology";

describe("GBRA hydrology", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes GBRA major rivers and lakes", () => {
    expect(normalizeGbraHydrologyMajorRivers([
      { OBJECTID: 2, GNIS_Name: "Guadalupe River", Miles: 422.67, Shape__Length: 680225.1 },
    ])).toEqual([
      {
        sourceId: "gbra-hydrology-major-rivers",
        objectId: 2,
        name: "Guadalupe River",
        miles: 422.67,
        shapeLength: 680225.1,
        raw: { OBJECTID: 2, GNIS_Name: "Guadalupe River", Miles: 422.67, Shape__Length: 680225.1 },
      },
    ]);

    expect(normalizeGbraHydrologyLakes([
      { OBJECTID: 7, NAME: "Canyon Lake", AREA: 8259.64809966, Shape__Area: 33425609.95, Shape__Length: 144671.55 },
    ])).toEqual([
      {
        sourceId: "gbra-hydrology-gvhs-lakes",
        objectId: 7,
        name: "Canyon Lake",
        areaAcres: 8259.64809966,
        shapeArea: 33425609.95,
        shapeLength: 144671.55,
        raw: { OBJECTID: 7, NAME: "Canyon Lake", AREA: 8259.64809966, Shape__Area: 33425609.95, Shape__Length: 144671.55 },
      },
    ]);
  });

  it("filters GBRA hydrology features by name", () => {
    const rivers = [
      { sourceId: "gbra-hydrology-major-rivers", objectId: 1, name: "Blanco River", miles: 91.4, shapeLength: 1, raw: {} },
      { sourceId: "gbra-hydrology-major-rivers", objectId: 2, name: "Guadalupe River", miles: 422.6, shapeLength: 2, raw: {} },
    ];
    const lakes = [
      { sourceId: "gbra-hydrology-gvhs-lakes", objectId: 1, name: "Lake Dunlap", areaAcres: 358.7, shapeArea: 10, shapeLength: 20, raw: {} },
      { sourceId: "gbra-hydrology-gvhs-lakes", objectId: 7, name: "Canyon Lake", areaAcres: 8259.6, shapeArea: 30, shapeLength: 40, raw: {} },
    ];

    expect(filterGbraHydrologyMajorRiversByName(rivers, "guadalupe river")).toHaveLength(1);
    expect(filterGbraHydrologyLakesByName(lakes, "canyon")).toHaveLength(1);
  });

  it("fetches and normalizes GBRA major rivers and lakes", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ features: [{ attributes: { OBJECTID: 2, GNIS_Name: "Guadalupe River", Miles: 422.67, Shape__Length: 680225.1 } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ features: [{ attributes: { OBJECTID: 7, NAME: "Canyon Lake", AREA: 8259.64809966, Shape__Area: 33425609.95, Shape__Length: 144671.55 } }] }), { status: 200 }));

    const rivers = await fetchGbraHydrologyMajorRivers(new AbortController().signal);
    const lakes = await fetchGbraHydrologyLakes(new AbortController().signal);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(rivers[0].name).toBe("Guadalupe River");
    expect(lakes[0].name).toBe("Canyon Lake");
  });
});
