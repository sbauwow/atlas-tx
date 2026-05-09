import { describe, expect, it } from "vitest";

import {
  CITY_OPEN_DATA_PORTALS,
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
