import { describe, expect, it, vi } from "vitest";
import { createSocrataCountySource } from "@/lib/texas-open-data";

describe("Socrata county source", () => {
  it("fetches rows and derives metrics through a source definition", async () => {
    const fetcher = vi.fn().mockResolvedValue([
      { permittee_name: "Alpha", authorization_status: "Active" },
      { permittee_name: "Beta", authorization_status: "Pending" },
      { permittee_name: "Gamma", authorization_status: "Active" },
    ]);

    const source = createSocrataCountySource({
      datasetId: "7fq8-wig2",
      sourceId: "permits",
      category: "environment",
      name: "Permits",
      fetchRows: fetcher,
      summarize(records) {
        const activeCount = records.filter((record) => record.authorization_status === "Active").length;
        return {
          metrics: {
            permitCount: records.length,
            activeCount,
          },
          annotations: [`${activeCount} active permits`],
        };
      },
    });

    const result = await source.collect({ county: { name: "Travis County", slug: "travis-county" } });

    expect(fetcher).toHaveBeenCalledWith("7fq8-wig2", "Travis County", undefined);
    expect(result.records).toHaveLength(3);
    expect(result.metrics).toEqual({ permitCount: 3, activeCount: 2 });
    expect(result.annotations).toEqual(["2 active permits"]);
  });
});
