import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildDatasetUrl, fetchDatasetRows } from "@/lib/texas-open-data";

describe("grouped Texas Open Data queries", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("builds grouped statewide dataset URLs", () => {
    const url = buildDatasetUrl("7fq8-wig2", {
      select: "facility_county, count(*) as permit_count",
      group: "facility_county",
      order: "permit_count DESC",
      limit: 5,
    });

    expect(url).toBe(
      "https://data.texas.gov/resource/7fq8-wig2.json?%24select=facility_county%2C+count%28%2A%29+as+permit_count&%24group=facility_county&%24order=permit_count+DESC&%24limit=5",
    );
  });

  it("fetches grouped statewide rows through the generic adapter", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ facility_county: "HARRIS", permit_count: "680" }],
    });

    vi.stubGlobal("fetch", fetchMock);

    const rows = await fetchDatasetRows<{ facility_county: string; permit_count: string }>("7fq8-wig2", {
      select: "facility_county, count(*) as permit_count",
      group: "facility_county",
      limit: 1,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://data.texas.gov/resource/7fq8-wig2.json?%24select=facility_county%2C+count%28%2A%29+as+permit_count&%24group=facility_county&%24limit=1",
      { signal: undefined },
    );
    expect(rows).toEqual([{ facility_county: "HARRIS", permit_count: "680" }]);
  });
});
