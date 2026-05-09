import { describe, expect, it } from "vitest";

import {
  CITY_OPEN_DATA_PORTALS,
  buildCuratedCityOpenDataSnapshot,
  executeCityOpenDataRefresh,
  normalizeCkanDataset,
  normalizeSocrataDataset,
} from "@/lib/datasets/city-open-data";

describe("city open data catalogs", () => {
  it("normalizes Socrata search results from Austin and Dallas", () => {
    const row = normalizeSocrataDataset(CITY_OPEN_DATA_PORTALS.austin, {
      view: {
        id: "abcd-1234",
        name: "Building Permits",
        description: "Permit activity by issued date.",
        assetType: "dataset",
        category: "Development",
        createdAt: 1700000000,
        lastModified: 1710000000,
        tags: ["permits", "building"],
        owner: { displayName: "City of Austin" },
      },
    });

    expect(row).toMatchObject({
      sourceId: "austin",
      sourceType: "socrata",
      datasetId: "abcd-1234",
      name: "Building Permits",
      category: "Development",
      tagCount: 2,
      pageUrl: "https://data.austintexas.gov/d/abcd-1234",
      apiUrl: "https://data.austintexas.gov/resource/abcd-1234.json",
    });
    expect(row.updatedAt).toBe("2024-03-09T16:00:00.000Z");
  });

  it("normalizes CKAN package results from Houston and San Antonio", () => {
    const row = normalizeCkanDataset(CITY_OPEN_DATA_PORTALS.houston, {
      id: "payroll",
      name: "payroll",
      title: "Payroll",
      notes: "Employee compensation records",
      metadata_modified: "2026-05-07T10:00:00.000000",
      organization: { title: "Finance Department" },
      tags: [{ display_name: "finance" }, { display_name: "payroll" }],
      resources: [
        { format: "CSV", url: "https://data.houstontx.gov/dataset/payroll/resource/1/download/payroll.csv" },
        { format: "XLSX", url: "https://data.houstontx.gov/dataset/payroll/resource/2/download/payroll.xlsx" },
      ],
      groups: [{ display_name: "Finance" }],
    });

    expect(row).toMatchObject({
      sourceId: "houston",
      sourceType: "ckan",
      datasetId: "payroll",
      slug: "payroll",
      name: "Payroll",
      category: "Finance",
      tagCount: 2,
      resourceCount: 2,
      pageUrl: "https://data.houstontx.gov/dataset/payroll",
      formats: ["CSV", "XLSX"],
    });
    expect(row.updatedAt).toBe("2026-05-07T15:00:00.000Z");
  });

  it("builds a curated water permits and infrastructure snapshot", () => {
    const snapshot = buildCuratedCityOpenDataSnapshot({
      generatedAt: "2026-05-09T13:40:00.000Z",
      summary: { sourceCount: 4, totalDatasetCount: 4, totalRowCount: 4 },
      sources: {
        austin: {
          portalId: "austin",
          portalName: "City of Austin Open Data",
          portalUrl: "https://data.austintexas.gov/",
          sourceType: "socrata",
          datasetCount: 1,
          rowCount: 1,
          rows: [
            {
              sourceId: "austin",
              sourceName: "City of Austin Open Data",
              sourceType: "socrata",
              datasetId: "austin-water-main-breaks",
              slug: "austin-water-main-breaks",
              name: "Water Main Breaks",
              description: "Austin Water repair and outage events",
              category: "Utilities and City Services",
              organization: "Austin Water",
              assetType: "dataset",
              createdAt: null,
              updatedAt: null,
              tagCount: 2,
              resourceCount: 1,
              formats: ["JSON"],
              pageUrl: "https://data.austintexas.gov/d/austin-water-main-breaks",
              apiUrl: "https://data.austintexas.gov/resource/austin-water-main-breaks.json",
            },
          ],
        },
        dallas: {
          portalId: "dallas",
          portalName: "City of Dallas OpenData",
          portalUrl: "https://www.dallasopendata.com/",
          sourceType: "socrata",
          datasetCount: 1,
          rowCount: 1,
          rows: [
            {
              sourceId: "dallas",
              sourceName: "City of Dallas OpenData",
              sourceType: "socrata",
              datasetId: "dallas-building-permits",
              slug: "dallas-building-permits",
              name: "Building Permits",
              description: "Building permits and inspection activity",
              category: "Development",
              organization: "Sustainable Development and Construction",
              assetType: "dataset",
              createdAt: null,
              updatedAt: null,
              tagCount: 1,
              resourceCount: 1,
              formats: ["JSON"],
              pageUrl: "https://www.dallasopendata.com/d/dallas-building-permits",
              apiUrl: "https://www.dallasopendata.com/resource/dallas-building-permits.json",
            },
          ],
        },
        houston: {
          portalId: "houston",
          portalName: "City of Houston Open Data",
          portalUrl: "https://data.houstontx.gov/",
          sourceType: "ckan",
          datasetCount: 1,
          rowCount: 1,
          rows: [
            {
              sourceId: "houston",
              sourceName: "City of Houston Open Data",
              sourceType: "ckan",
              datasetId: "residential-building-permits",
              slug: "residential-building-permits",
              name: "Residential Building Permits",
              description: "Monthly residential building permits",
              category: "Housing, Buildings and Construction",
              organization: "Houston Permitting Center",
              assetType: "dataset",
              createdAt: null,
              updatedAt: null,
              tagCount: 1,
              resourceCount: 1,
              formats: ["CSV"],
              pageUrl: "https://data.houstontx.gov/dataset/residential-building-permits",
              apiUrl: null,
            },
          ],
        },
        "san-antonio": {
          portalId: "san-antonio",
          portalName: "Open Data SA",
          portalUrl: "https://data.sanantonio.gov/",
          sourceType: "ckan",
          datasetCount: 1,
          rowCount: 1,
          rows: [
            {
              sourceId: "san-antonio",
              sourceName: "Open Data SA",
              sourceType: "ckan",
              datasetId: "median-income",
              slug: "median-income",
              name: "Median Income",
              description: "Income trend table",
              category: "Business and Economy",
              organization: "Economic Development",
              assetType: "dataset",
              createdAt: null,
              updatedAt: null,
              tagCount: 1,
              resourceCount: 1,
              formats: ["CSV"],
              pageUrl: "https://data.sanantonio.gov/dataset/median-income",
              apiUrl: null,
            },
          ],
        },
      },
    });

    expect(snapshot.summary.totalMatchedRowCount).toBe(3);
    expect(snapshot.summary.matchedByTheme.water).toBe(1);
    expect(snapshot.summary.matchedByTheme.permits).toBe(2);
    expect(snapshot.sources.austin.rows[0]).toMatchObject({
      datasetId: "austin-water-main-breaks",
      matchedThemes: ["water", "infrastructure"],
    });
    expect(snapshot.sources.austin.rows[0]?.matchReasons).toEqual(expect.arrayContaining(["description:water", "name:water"]));
    expect(snapshot.sources["san-antonio"].rows).toEqual([]);
  });

  it("refreshes all four city portals into one snapshot", async () => {
    const snapshot = await executeCityOpenDataRefresh({
      generatedAt: "2026-05-09T13:30:00.000Z",
      fetchSocrataPortal: async (portal) => ({
        count: portal.id === "austin" ? 2 : 1,
        results: [
          {
            view: {
              id: `${portal.id}-1`,
              name: `${portal.name} Dataset`,
              description: "Catalog row",
              assetType: "dataset",
              category: "General",
              lastModified: 1710000000,
              tags: [portal.id],
              owner: { displayName: portal.name },
            },
          },
        ],
      }),
      fetchCkanPortal: async (portal) => ({
        help: "",
        success: true,
        result: {
          count: 3,
          results: [
            {
              id: `${portal.id}-pkg-1`,
              name: `${portal.id}-pkg-1`,
              title: `${portal.name} Package`,
              notes: "Catalog row",
              metadata_modified: "2026-05-07T10:00:00.000000",
              organization: { title: portal.name },
              tags: [{ display_name: portal.id }],
              resources: [{ format: "CSV", url: `https://${portal.host}/dataset/${portal.id}-pkg-1/resource/1/download/data.csv` }],
              groups: [{ display_name: "General" }],
            },
          ],
        },
      }),
    });

    expect(snapshot.generatedAt).toBe("2026-05-09T13:30:00.000Z");
    expect(snapshot.summary.totalDatasetCount).toBe(9);
    expect(snapshot.summary.totalRowCount).toBe(4);
    expect(snapshot.sources.austin.datasetCount).toBe(2);
    expect(snapshot.sources.dallas.rows[0]?.sourceType).toBe("socrata");
    expect(snapshot.sources.houston.rows[0]?.sourceType).toBe("ckan");
    expect(snapshot.sources["san-antonio"].rows[0]?.sourceId).toBe("san-antonio");
  });
});
