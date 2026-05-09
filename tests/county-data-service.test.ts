import { describe, expect, it } from "vitest";
import { createCountyDataService, type CountyDataSource } from "@/lib/county-data-service";

describe("county data service", () => {
  it("collects heterogeneous county slices into one normalized county profile", async () => {
    const sources: CountyDataSource[] = [
      {
        sourceId: "permits",
        datasetId: "7fq8-wig2",
        category: "environment",
        name: "Permits",
        async collect({ county }) {
          expect(county.name).toBe("Travis County");
          return {
            records: [{ permittee_name: "Alpha Water" }, { permittee_name: "Beta Water" }],
            metrics: { permitCount: 2 },
          };
        },
      },
      {
        sourceId: "cpi",
        datasetId: "waxz-c9q5",
        category: "social",
        name: "CPI investigations",
        async collect() {
          return {
            records: [{ fiscal_year: 2025, completed_investigations: 41 }],
            metrics: { completedInvestigations: 41 },
            annotations: ["FY2025 only in this test fixture"],
          };
        },
      },
    ];

    const service = createCountyDataService({ sources });
    const profile = await service.collectCountyProfile("travis");

    expect(profile.county).toEqual({
      name: "Travis County",
      slug: "travis-county",
    });
    expect(profile.sliceCount).toBe(2);
    expect(profile.slices.map((slice) => slice.sourceId)).toEqual(["permits", "cpi"]);
    expect(profile.metrics).toEqual({
      permits: { permitCount: 2 },
      cpi: { completedInvestigations: 41 },
    });
    expect(profile.annotations).toContain("FY2025 only in this test fixture");
  });

  it("supports selecting a subset of sources", async () => {
    const sources: CountyDataSource[] = [
      {
        sourceId: "permits",
        category: "environment",
        name: "Permits",
        async collect() {
          return { records: [{ id: 1 }], metrics: { permitCount: 1 } };
        },
      },
      {
        sourceId: "water-districts",
        category: "infrastructure",
        name: "Water Districts",
        async collect() {
          return { records: [{ district: "LCRA" }], metrics: { districtCount: 1 } };
        },
      },
    ];

    const service = createCountyDataService({ sources });
    const profile = await service.collectCountyProfile("Travis County", { sourceIds: ["water-districts"] });

    expect(profile.sliceCount).toBe(1);
    expect(profile.slices[0]?.sourceId).toBe("water-districts");
    expect(profile.metrics).toEqual({
      "water-districts": { districtCount: 1 },
    });
  });

  it("captures source failures without dropping successful slices", async () => {
    const sources: CountyDataSource[] = [
      {
        sourceId: "working-source",
        category: "social",
        name: "Working Source",
        async collect() {
          return { records: [{ id: 1 }], metrics: { rowCount: 1 } };
        },
      },
      {
        sourceId: "broken-source",
        category: "fiscal",
        name: "Broken Source",
        async collect() {
          throw new Error("upstream timeout");
        },
      },
    ];

    const service = createCountyDataService({ sources });
    const profile = await service.collectCountyProfile("Travis");

    expect(profile.sliceCount).toBe(1);
    expect(profile.slices[0]?.sourceId).toBe("working-source");
    expect(profile.errors).toEqual([
      {
        sourceId: "broken-source",
        message: "upstream timeout",
      },
    ]);
  });
});
