import { describe, expect, it } from "vitest";
import { datasetResourceUrl, getDatasetById, getTabularDatasetIds } from "@/lib/texas-open-data";

describe("texas open data adapters", () => {
  it("looks up MVP datasets by id", () => {
    expect(getDatasetById("7fq8-wig2")?.name).toContain("Water Quality");
    expect(getDatasetById("missing-id")).toBeUndefined();
  });

  it("returns only tabular datasets for resource-api access", () => {
    expect(getTabularDatasetIds()).toContain("7fq8-wig2");
    expect(getTabularDatasetIds()).toContain("u3nh-2phm");
    expect(getTabularDatasetIds()).not.toContain("xdwx-843n");
  });

  it("builds Socrata resource URLs only for tabular datasets", () => {
    expect(datasetResourceUrl("7fq8-wig2")).toBe("https://data.texas.gov/resource/7fq8-wig2.json");
    expect(datasetResourceUrl("xdwx-843n")).toBeUndefined();
  });

  it("registers TWDB hydrology datasets as external atlas-tx sources", () => {
    expect(getDatasetById("twdb-major-aquifers")?.name).toBe("TWDB Major Aquifers");
    expect(getDatasetById("twdb-river-basins")?.accessType).toBe("external");
    expect(getDatasetById("twdb-huc8")?.publisher).toBe("Texas Water Development Board");
  });

  it("registers the TCEQ impaired surface water segments source for burden-indicator overlays", () => {
    expect(getDatasetById("tceq-swq-segments")?.publisher).toBe("Texas Commission on Environmental Quality");
    expect(getDatasetById("tceq-swq-segments")?.accessType).toBe("external");
    expect(getDatasetById("tceq-swq-segments")?.useCase).toContain("burden-indicator");
  });
});
