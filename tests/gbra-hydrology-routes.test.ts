import { describe, expect, it, vi } from "vitest";

const fetchGbraHydrologyMajorRivers = vi.fn();
const fetchGbraHydrologyLakes = vi.fn();
const fetchGbraHydrologyLakeCountyCoverage = vi.fn();
const fetchGbraHydrologyWatersheds = vi.fn();
const fetchGbraHydrologySubwatersheds = vi.fn();
const fetchGbraWaterQualitySites = vi.fn();
const fetchGbraWaterQualitySite = vi.fn();
const fetchGbraWaterQualityObservations = vi.fn();
const buildWaterFreshness = vi.fn((sourceIds: string[]) => ({
  generatedAt: "2026-05-09T00:00:00.000Z",
  sources: Object.fromEntries(sourceIds.map((sourceId) => [sourceId, { cached: true, cachedAt: "2026-05-09T00:00:00.000Z", expiresAt: "2026-05-10T00:00:00.000Z", ttlMs: 86400000 }])),
}));

vi.mock("@/lib/water/gbra-hydrology", () => ({
  fetchGbraHydrologyMajorRivers,
  fetchGbraHydrologyLakes,
  fetchGbraHydrologyLakeCountyCoverage,
  fetchGbraHydrologyWatersheds,
  fetchGbraHydrologySubwatersheds,
  fetchGbraWaterQualitySites,
  fetchGbraWaterQualitySite,
  fetchGbraWaterQualityObservations,
  filterGbraHydrologyMajorRiversByName: vi.fn((rows, name: string) => rows.filter((row: { name: string }) => row.name.toLowerCase().includes(name.toLowerCase()))),
  filterGbraHydrologyLakesByName: vi.fn((rows, name: string) => rows.filter((row: { name: string }) => row.name.toLowerCase().includes(name.toLowerCase()))),
  filterGbraHydrologyLakeCountyCoverageByName: vi.fn((rows, name: string) => rows.filter((row: { lake: { name: string } }) => row.lake.name.toLowerCase().includes(name.toLowerCase()))),
  filterGbraHydrologyWatershedsByName: vi.fn((rows, name: string) => rows.filter((row: { name: string }) => row.name.toLowerCase().includes(name.toLowerCase()))),
  filterGbraHydrologySubwatershedsByName: vi.fn((rows, name: string) => rows.filter((row: { name: string }) => row.name.toLowerCase().includes(name.toLowerCase()))),
  filterGbraWaterQualitySitesByName: vi.fn((rows, name: string) => rows.filter((row: { description: string }) => row.description.toLowerCase().includes(name.toLowerCase()))),
  filterGbraWaterQualitySitesByCounty: vi.fn((rows, county: string) => rows.filter((row: { countySlug: string }) => row.countySlug.toLowerCase().includes(county.toLowerCase()))),
}));

vi.mock("@/lib/water/freshness", () => ({ buildWaterFreshness }));

describe("GBRA hydrology routes", () => {
  it("returns major rivers with optional name filter and freshness", async () => {
    fetchGbraHydrologyMajorRivers.mockResolvedValue([
      { sourceId: "gbra-hydrology-major-rivers", objectId: 2, name: "Guadalupe River", miles: 422.67, shapeLength: 680225.1, raw: {} },
      { sourceId: "gbra-hydrology-major-rivers", objectId: 5, name: "San Marcos River", miles: 85.72, shapeLength: 137967.0, raw: {} },
    ]);

    const { GET } = await import("@/app/api/water/gbra/hydrology/major-rivers/route");
    const response = await GET(new Request("http://localhost/api/water/gbra/hydrology/major-rivers?name=guadalupe"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.rivers).toHaveLength(1);
    expect(payload.rivers[0].name).toBe("Guadalupe River");
    expect(payload.freshness.sources["gbra-hydrology-major-rivers"].cached).toBe(true);
  });

  it("returns GVHS lakes with optional name filter and freshness", async () => {
    fetchGbraHydrologyLakes.mockResolvedValue([
      { sourceId: "gbra-hydrology-gvhs-lakes", objectId: 1, name: "Lake Dunlap", areaAcres: 358.7, shapeArea: 1451752.6, shapeLength: 24737.9, raw: {} },
      { sourceId: "gbra-hydrology-gvhs-lakes", objectId: 7, name: "Canyon Lake", areaAcres: 8259.6, shapeArea: 33425609.9, shapeLength: 144671.5, raw: {} },
    ]);

    const { GET } = await import("@/app/api/water/gbra/hydrology/gvhs-lakes/route");
    const response = await GET(new Request("http://localhost/api/water/gbra/hydrology/gvhs-lakes?name=canyon"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.lakes).toHaveLength(1);
    expect(payload.lakes[0].name).toBe("Canyon Lake");
    expect(payload.freshness.sources["gbra-hydrology-gvhs-lakes"].ttlMs).toBe(86400000);
  });

  it("returns GVHS lake county coverage with optional name filter and freshness", async () => {
    fetchGbraHydrologyLakeCountyCoverage.mockResolvedValue([
      {
        sourceId: "gbra-hydrology-gvhs-lakes",
        lake: { sourceId: "gbra-hydrology-gvhs-lakes", objectId: 7, name: "Canyon Lake", areaAcres: 8259.6, shapeArea: 33425609.9, shapeLength: 144671.5, raw: {} },
        countyCount: 1,
        counties: [{ name: "Comal County", slug: "comal-county", fips: "48091" }],
      },
      {
        sourceId: "gbra-hydrology-gvhs-lakes",
        lake: { sourceId: "gbra-hydrology-gvhs-lakes", objectId: 1, name: "Lake Dunlap", areaAcres: 358.7, shapeArea: 1451752.6, shapeLength: 24737.9, raw: {} },
        countyCount: 1,
        counties: [{ name: "Guadalupe County", slug: "guadalupe-county", fips: "48187" }],
      },
    ]);

    const { GET } = await import("@/app/api/water/gbra/hydrology/gvhs-lakes/counties/route");
    const response = await GET(new Request("http://localhost/api/water/gbra/hydrology/gvhs-lakes/counties?name=canyon"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.coverage).toHaveLength(1);
    expect(payload.coverage[0].lake.name).toBe("Canyon Lake");
    expect(payload.coverage[0].counties[0].name).toBe("Comal County");
    expect(payload.freshness.sources["gbra-hydrology-gvhs-lakes"].cached).toBe(true);
  });

  it("returns watersheds with optional name filter and freshness", async () => {
    fetchGbraHydrologyWatersheds.mockResolvedValue([
      { sourceId: "gbra-hydrology-watersheds", objectId: 1, name: "Plum Creek", huc10: "1210020304", areaSqKm: 1007.47, areaAcres: 248952.24, shapeArea: 1007080123.11, shapeLength: 193640.41, raw: {} },
      { sourceId: "gbra-hydrology-watersheds", objectId: 2, name: "Comal River-Guadalupe River", huc10: "1210020201", areaSqKm: 1137.69, areaAcres: 281131.54, shapeArea: 1136998990.61, shapeLength: 232129.08, raw: {} },
    ]);

    const { GET } = await import("@/app/api/water/gbra/hydrology/watersheds/route");
    const response = await GET(new Request("http://localhost/api/water/gbra/hydrology/watersheds?name=comal"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.watersheds).toHaveLength(1);
    expect(payload.watersheds[0].huc10).toBe("1210020201");
    expect(payload.freshness.sources["gbra-hydrology-watersheds"].cached).toBe(true);
  });

  it("returns subwatersheds with optional name filter and freshness", async () => {
    fetchGbraHydrologySubwatersheds.mockResolvedValue([
      { sourceId: "gbra-hydrology-subwatersheds", objectId: 1, name: "Brushy Creek-San Marcos River", huc12: "121002030501", areaSqKm: 146.59, areaAcres: 36224.97, shapeArea: 146531769.07, shapeLength: 72310.06, raw: {} },
      { sourceId: "gbra-hydrology-subwatersheds", objectId: 2, name: "Seals Creek-San Marcos River", huc12: "121002030502", areaSqKm: 126.68, areaAcres: 31303.41, shapeArea: 126630164.44, shapeLength: 83921.44, raw: {} },
    ]);

    const { GET } = await import("@/app/api/water/gbra/hydrology/subwatersheds/route");
    const response = await GET(new Request("http://localhost/api/water/gbra/hydrology/subwatersheds?name=seals"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.subwatersheds).toHaveLength(1);
    expect(payload.subwatersheds[0].huc12).toBe("121002030502");
    expect(payload.freshness.sources["gbra-hydrology-subwatersheds"].ttlMs).toBe(86400000);
  });

  it("returns GBRA water quality sites with optional county and name filters", async () => {
    fetchGbraWaterQualitySites.mockResolvedValue([
      {
        sourceId: "gbra-water-quality-sites",
        stationId: "12672",
        countySlug: "hays",
        countyName: "Hays",
        sourcePageUrl: "https://www.gbra.org/environmental/water-quality/sites/hays/",
        description: "Upper San Marcos River upstream of IH 35",
        latitude: 29.875278,
        longitude: -97.931667,
        parameterFrequency: "C/Quarterly; F/Quarterly; BAC/Quarterly",
        monitoringType: "Fixed/GBRA",
        historicalXlsUrl: "https://waterservices.gbra.org/crp/23wqitbl-sm-ih35.xls",
        currentCsvUrl: "https://waterservices.gbra.org/crp/12672.csv",
        raw: {},
      },
      {
        sourceId: "gbra-water-quality-sites",
        stationId: "12640",
        countySlug: "caldwell",
        countyName: "Caldwell",
        sourcePageUrl: "https://www.gbra.org/environmental/water-quality/sites/caldwell/",
        description: "Plum Creek at CR 135 SE of Luling",
        latitude: 29.656944,
        longitude: -97.6,
        parameterFrequency: "C/Monthly; F/Monthly; BAC/Monthly; O/Annual",
        monitoringType: "Fixed/GBRA",
        historicalXlsUrl: "https://waterservices.gbra.org/crp/17wqitbl-plum.xls",
        currentCsvUrl: "https://waterservices.gbra.org/crp/12640.csv",
        raw: {},
      },
    ]);

    const { GET } = await import("@/app/api/water/gbra/quality/sites/route");
    const response = await GET(new Request("http://localhost/api/water/gbra/quality/sites?county=hays&name=san%20marcos"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.siteCount).toBe(1);
    expect(payload.sites[0].stationId).toBe("12672");
    expect(payload.freshness.sources["gbra-water-quality-sites"].cached).toBe(true);
  });

  it("returns GBRA water quality site detail or 404", async () => {
    fetchGbraWaterQualitySite.mockResolvedValueOnce({
      sourceId: "gbra-water-quality-sites",
      stationId: "12672",
      countySlug: "hays",
      countyName: "Hays",
      sourcePageUrl: "https://www.gbra.org/environmental/water-quality/sites/hays/",
      description: "Upper San Marcos River upstream of IH 35",
      latitude: 29.875278,
      longitude: -97.931667,
      parameterFrequency: "C/Quarterly; F/Quarterly; BAC/Quarterly",
      monitoringType: "Fixed/GBRA",
      historicalXlsUrl: "https://waterservices.gbra.org/crp/23wqitbl-sm-ih35.xls",
      currentCsvUrl: "https://waterservices.gbra.org/crp/12672.csv",
      raw: {},
    }).mockResolvedValueOnce(null);

    const detailModule = await import("@/app/api/water/gbra/quality/sites/[stationId]/route");
    const okResponse = await detailModule.GET(new Request("http://localhost/api/water/gbra/quality/sites/12672"), { params: Promise.resolve({ stationId: "12672" }) });
    const okPayload = await okResponse.json();
    expect(okResponse.status).toBe(200);
    expect(okPayload.site.stationId).toBe("12672");

    const notFoundResponse = await detailModule.GET(new Request("http://localhost/api/water/gbra/quality/sites/99999"), { params: Promise.resolve({ stationId: "99999" }) });
    expect(notFoundResponse.status).toBe(404);
  });

  it("returns GBRA water quality observations or 404 when no current csv exists", async () => {
    fetchGbraWaterQualitySite.mockResolvedValueOnce({
      sourceId: "gbra-water-quality-sites",
      stationId: "12672",
      countySlug: "hays",
      countyName: "Hays",
      sourcePageUrl: "https://www.gbra.org/environmental/water-quality/sites/hays/",
      description: "Upper San Marcos River upstream of IH 35",
      latitude: 29.875278,
      longitude: -97.931667,
      parameterFrequency: "C/Quarterly; F/Quarterly; BAC/Quarterly",
      monitoringType: "Fixed/GBRA",
      historicalXlsUrl: "https://waterservices.gbra.org/crp/23wqitbl-sm-ih35.xls",
      currentCsvUrl: "https://waterservices.gbra.org/crp/12672.csv",
      raw: {},
    }).mockResolvedValueOnce({
      sourceId: "gbra-water-quality-sites",
      stationId: "12671",
      countySlug: "hays",
      countyName: "Hays",
      sourcePageUrl: "https://www.gbra.org/environmental/water-quality/sites/hays/",
      description: "San Marcos River downstream of IH 35",
      latitude: 29.87,
      longitude: -97.93,
      parameterFrequency: "C/Quarterly",
      monitoringType: "Fixed/GBRA",
      historicalXlsUrl: null,
      currentCsvUrl: null,
      raw: {},
    });
    fetchGbraWaterQualityObservations.mockResolvedValue([
      {
        sourceId: "gbra-water-quality-observations",
        stationId: "12672",
        stationName: "San Marcos River at IH 35",
        collectedAt: "2026-05-04T14:40:00.000Z",
        parameter: "Dissolved Oxygen (Field)",
        reportedResult: "7.4",
        units: "mg/L",
        parameterCode: "00300",
        raw: {},
      },
    ]);

    const observationsModule = await import("@/app/api/water/gbra/quality/sites/[stationId]/observations/route");
    const okResponse = await observationsModule.GET(new Request("http://localhost/api/water/gbra/quality/sites/12672/observations"), { params: Promise.resolve({ stationId: "12672" }) });
    const okPayload = await okResponse.json();
    expect(okResponse.status).toBe(200);
    expect(okPayload.observationCount).toBe(1);
    expect(okPayload.observations[0].parameterCode).toBe("00300");

    const notFoundResponse = await observationsModule.GET(new Request("http://localhost/api/water/gbra/quality/sites/12671/observations"), { params: Promise.resolve({ stationId: "12671" }) });
    expect(notFoundResponse.status).toBe(404);
  });
});
