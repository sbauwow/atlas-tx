import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchGbraWaterQualityObservations,
  fetchGbraWaterQualitySite,
  fetchGbraWaterQualitySites,
  fetchGbraHydrologyLakeCountyCoverage,
  fetchGbraHydrologyLakes,
  fetchGbraHydrologyMajorRivers,
  fetchGbraHydrologySubwatersheds,
  fetchGbraHydrologyWatersheds,
  filterGbraWaterQualitySitesByCounty,
  filterGbraWaterQualitySitesByName,
  filterGbraHydrologyLakesByName,
  filterGbraHydrologyMajorRiversByName,
  filterGbraHydrologySubwatershedsByName,
  filterGbraHydrologyWatershedsByName,
  normalizeGbraWaterQualityObservations,
  normalizeGbraWaterQualitySites,
  normalizeGbraHydrologyLakes,
  normalizeGbraHydrologyMajorRivers,
  normalizeGbraHydrologySubwatersheds,
  normalizeGbraHydrologyWatersheds,
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

  it("normalizes GBRA watersheds and subwatersheds", () => {
    expect(normalizeGbraHydrologyWatersheds([
      { OBJECTID: 1, Name: "Plum Creek", HUC10: "1210020304", AreaSqKm: 1007.47, AreaAcres: 248952.24, Shape__Area: 1007080123.11, Shape__Length: 193640.41 },
    ])).toEqual([
      {
        sourceId: "gbra-hydrology-watersheds",
        objectId: 1,
        name: "Plum Creek",
        huc10: "1210020304",
        areaSqKm: 1007.47,
        areaAcres: 248952.24,
        shapeArea: 1007080123.11,
        shapeLength: 193640.41,
        raw: { OBJECTID: 1, Name: "Plum Creek", HUC10: "1210020304", AreaSqKm: 1007.47, AreaAcres: 248952.24, Shape__Area: 1007080123.11, Shape__Length: 193640.41 },
      },
    ]);

    expect(normalizeGbraHydrologySubwatersheds([
      { OBJECTID: 2, Name: "Seals Creek-San Marcos River", HUC12: "121002030502", AreaSqKm: 126.68, AreaAcres: 31303.41, Shape__Area: 126630164.44, Shape__Length: 83921.44 },
    ])).toEqual([
      {
        sourceId: "gbra-hydrology-subwatersheds",
        objectId: 2,
        name: "Seals Creek-San Marcos River",
        huc12: "121002030502",
        areaSqKm: 126.68,
        areaAcres: 31303.41,
        shapeArea: 126630164.44,
        shapeLength: 83921.44,
        raw: { OBJECTID: 2, Name: "Seals Creek-San Marcos River", HUC12: "121002030502", AreaSqKm: 126.68, AreaAcres: 31303.41, Shape__Area: 126630164.44, Shape__Length: 83921.44 },
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
    const watersheds = [
      { sourceId: "gbra-hydrology-watersheds", objectId: 1, name: "Plum Creek", huc10: "1210020304", areaSqKm: 1007, areaAcres: 1, shapeArea: 1, shapeLength: 1, raw: {} },
      { sourceId: "gbra-hydrology-watersheds", objectId: 2, name: "Comal River-Guadalupe River", huc10: "1210020201", areaSqKm: 1137, areaAcres: 1, shapeArea: 1, shapeLength: 1, raw: {} },
    ];
    const subwatersheds = [
      { sourceId: "gbra-hydrology-subwatersheds", objectId: 1, name: "Brushy Creek-San Marcos River", huc12: "121002030501", areaSqKm: 146, areaAcres: 1, shapeArea: 1, shapeLength: 1, raw: {} },
      { sourceId: "gbra-hydrology-subwatersheds", objectId: 2, name: "Seals Creek-San Marcos River", huc12: "121002030502", areaSqKm: 126, areaAcres: 1, shapeArea: 1, shapeLength: 1, raw: {} },
    ];

    expect(filterGbraHydrologyMajorRiversByName(rivers, "guadalupe river")).toHaveLength(1);
    expect(filterGbraHydrologyLakesByName(lakes, "canyon")).toHaveLength(1);
    expect(filterGbraHydrologyWatershedsByName(watersheds, "comal")).toHaveLength(1);
    expect(filterGbraHydrologySubwatershedsByName(subwatersheds, "seals")).toHaveLength(1);
  });

  it("fetches and normalizes GBRA major rivers, lakes, watersheds, and subwatersheds", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ features: [{ attributes: { OBJECTID: 2, GNIS_Name: "Guadalupe River", Miles: 422.67, Shape__Length: 680225.1 } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ features: [{ attributes: { OBJECTID: 7, NAME: "Canyon Lake", AREA: 8259.64809966, Shape__Area: 33425609.95, Shape__Length: 144671.55 } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ features: [{ attributes: { OBJECTID: 1, Name: "Plum Creek", HUC10: "1210020304", AreaSqKm: 1007.47, AreaAcres: 248952.24, Shape__Area: 1007080123.11, Shape__Length: 193640.41 } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ features: [{ attributes: { OBJECTID: 2, Name: "Seals Creek-San Marcos River", HUC12: "121002030502", AreaSqKm: 126.68, AreaAcres: 31303.41, Shape__Area: 126630164.44, Shape__Length: 83921.44 } }] }), { status: 200 }));

    const rivers = await fetchGbraHydrologyMajorRivers(new AbortController().signal);
    const lakes = await fetchGbraHydrologyLakes(new AbortController().signal);
    const watersheds = await fetchGbraHydrologyWatersheds(new AbortController().signal);
    const subwatersheds = await fetchGbraHydrologySubwatersheds(new AbortController().signal);

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(rivers[0].name).toBe("Guadalupe River");
    expect(lakes[0].name).toBe("Canyon Lake");
    expect(watersheds[0].huc10).toBe("1210020304");
    expect(subwatersheds[0].huc12).toBe("121002030502");
  });

  it("fetches GVHS lake county coverage via Census county overlay", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({
        features: [{
          attributes: { OBJECTID: 7, NAME: "Canyon Lake", AREA: 8259.64809966, Shape__Area: 33425609.95, Shape__Length: 144671.55 },
          geometry: { rings: [[[567187.46, 3310466.81], [567191.12, 3310465.61], [567187.46, 3310466.81]]] },
        }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        features: [{ attributes: { NAME: "Comal County", GEOID: "48091" } }],
      }), { status: 200 }));

    const coverage = await fetchGbraHydrologyLakeCountyCoverage(new AbortController().signal);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(coverage).toEqual([
      {
        sourceId: "gbra-hydrology-gvhs-lakes",
        lake: {
          sourceId: "gbra-hydrology-gvhs-lakes",
          objectId: 7,
          name: "Canyon Lake",
          areaAcres: 8259.64809966,
          shapeArea: 33425609.95,
          shapeLength: 144671.55,
          raw: { OBJECTID: 7, NAME: "Canyon Lake", AREA: 8259.64809966, Shape__Area: 33425609.95, Shape__Length: 144671.55 },
        },
        countyCount: 1,
        counties: [{ name: "Comal County", slug: "comal-county", fips: "48091" }],
      },
    ]);
  });

  it("normalizes GBRA water quality sites and observations", () => {
    expect(normalizeGbraWaterQualitySites([
      {
        countySlug: "hays",
        countyName: "Hays",
        sourcePageUrl: "https://www.gbra.org/environmental/water-quality/sites/hays/",
        stationId: "12672",
        description: "Upper San Marcos River upstream of IH 35",
        latitude: 29.875278,
        longitude: -97.931667,
        parameters: "C/Quarterly; F/Quarterly; BAC/Quarterly",
        monitoringType: "Fixed/GBRA",
        historicalXlsUrl: "https://waterservices.gbra.org/crp/23wqitbl-sm-ih35.xls",
        currentCsvUrl: "https://waterservices.gbra.org/crp/12672.csv",
      },
    ])).toEqual([
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
        raw: {
          countySlug: "hays",
          countyName: "Hays",
          sourcePageUrl: "https://www.gbra.org/environmental/water-quality/sites/hays/",
          stationId: "12672",
          description: "Upper San Marcos River upstream of IH 35",
          latitude: 29.875278,
          longitude: -97.931667,
          parameters: "C/Quarterly; F/Quarterly; BAC/Quarterly",
          monitoringType: "Fixed/GBRA",
          historicalXlsUrl: "https://waterservices.gbra.org/crp/23wqitbl-sm-ih35.xls",
          currentCsvUrl: "https://waterservices.gbra.org/crp/12672.csv",
        },
      },
    ]);

    expect(normalizeGbraWaterQualityObservations("12672", [
      {
        stationName: "San Marcos River at IH 35",
        collectedAt: "2026-05-04T14:40:00.000Z",
        parameter: "Dissolved Oxygen (Field)",
        reportedResult: "7.4",
        units: "mg/L",
        parameterCode: "00300",
      },
    ])).toEqual([
      {
        sourceId: "gbra-water-quality-observations",
        stationId: "12672",
        stationName: "San Marcos River at IH 35",
        collectedAt: "2026-05-04T14:40:00.000Z",
        parameter: "Dissolved Oxygen (Field)",
        reportedResult: "7.4",
        units: "mg/L",
        parameterCode: "00300",
        raw: {
          stationName: "San Marcos River at IH 35",
          collectedAt: "2026-05-04T14:40:00.000Z",
          parameter: "Dissolved Oxygen (Field)",
          reportedResult: "7.4",
          units: "mg/L",
          parameterCode: "00300",
        },
      },
    ]);
  });

  it("filters GBRA water quality sites by name and county", () => {
    const sites = [
      {
        sourceId: "gbra-water-quality-sites",
        stationId: "12672",
        countySlug: "hays",
        countyName: "Hays",
        sourcePageUrl: "https://www.gbra.org/environmental/water-quality/sites/hays/",
        description: "Upper San Marcos River upstream of IH 35",
        latitude: 29.875278,
        longitude: -97.931667,
        parameterFrequency: "C/Quarterly",
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
        parameterFrequency: "C/Monthly",
        monitoringType: "Fixed/GBRA",
        historicalXlsUrl: "https://waterservices.gbra.org/crp/17wqitbl-plum.xls",
        currentCsvUrl: "https://waterservices.gbra.org/crp/12640.csv",
        raw: {},
      },
    ];

    expect(filterGbraWaterQualitySitesByName(sites, "san marcos")).toHaveLength(1);
    expect(filterGbraWaterQualitySitesByCounty(sites, "hays")).toHaveLength(1);
  });

  it("fetches GBRA water quality sites, single site, and observations", async () => {
    const haysHtml = `
      <h5>Guadalupe River Basin Surface Water Quality Monitoring Program GBRA Monitoring Locations</h5>
      <table>
        <tr id="12672">
          <td class="siteId">12672</td>
          <td class="siteDesc">Upper San Marcos River upstream of IH 35</td>
          <td><a href="https://goo.gl/maps/example">29°52’31” / -97°55’54”</a></td>
          <td class="paramFreq">C/Quarterly; F/Quarterly; BAC/Quarterly</td>
          <td class="types">Fixed/GBRA</td>
          <td class="histData"><a href="https://waterservices.gbra.org/crp/23wqitbl-sm-ih35.xls">Excel</a></td>
          <td class="histData"><a href="https://waterservices.gbra.org/crp/12672.csv">Excel</a></td>
        </tr>
      </table>
      <h5>Guadalupe River Basin Surface Water Quality Monitoring Program TCEQ Monitoring Locations</h5>`;
    const caldwellHtml = `
      <h5>Guadalupe River Basin Surface Water Quality Monitoring Program GBRA Monitoring Locations</h5>
      <table>
        <tr id="12640">
          <td class="siteId">12640</td>
          <td class="siteDesc">Plum Creek at CR 135 SE of Luling</td>
          <td><a href="https://goo.gl/maps/example2">29°39’25” / -97°36’00”</a></td>
          <td class="paramFreq">C/Monthly; F/Monthly; BAC/Monthly; O/Annual</td>
          <td class="types">Fixed/GBRA</td>
          <td class="histData"><a href="https://waterservices.gbra.org/crp/17wqitbl-plum.xls">Excel</a></td>
          <td class="histData"><a href="https://waterservices.gbra.org/crp/12640.csv">Excel</a></td>
        </tr>
      </table>
      <h5>Guadalupe River Basin Surface Water Quality Monitoring Program TCEQ Monitoring Locations</h5>`;
    const observationCsv = "\uFEFF12672,San Marcos River at IH 35\n\nCollect Date,Collect Time,Parameter,Reported Result,Units,Parameter Code\n5/4/2026,14:40,Dissolved Oxygen (Field),7.4,mg/L, 00300\n";

    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(haysHtml, { status: 200 }))
      .mockResolvedValueOnce(new Response(caldwellHtml, { status: 200 }))
      .mockResolvedValueOnce(new Response(haysHtml, { status: 200 }))
      .mockResolvedValueOnce(new Response(caldwellHtml, { status: 200 }))
      .mockResolvedValueOnce(new Response(observationCsv, { status: 200 }));

    const sites = await fetchGbraWaterQualitySites(new AbortController().signal, ["hays", "caldwell"]);
    const site = await fetchGbraWaterQualitySite("12672", new AbortController().signal, ["hays", "caldwell"]);
    const observations = await fetchGbraWaterQualityObservations("12672", "https://waterservices.gbra.org/crp/12672.csv", new AbortController().signal);

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(sites).toHaveLength(2);
    expect(site?.countySlug).toBe("hays");
    expect(observations[0].parameterCode).toBe("00300");
    expect(observations[0].stationName).toBe("San Marcos River at IH 35");
  });
});
