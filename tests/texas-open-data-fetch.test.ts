import { describe, expect, it } from "vitest";
import { buildCountyDatasetUrl } from "@/lib/texas-open-data";

describe("county dataset url builder", () => {
  it("builds county-filtered URLs for datasets with known county fields", () => {
    expect(buildCountyDatasetUrl("7fq8-wig2", "travis")).toContain("facility_county=TRAVIS");
    expect(buildCountyDatasetUrl("hr84-s96f", "Williamson County")).toContain("county=WILLIAMSON");
    expect(buildCountyDatasetUrl("waxz-c9q5", "DeWitt")).toContain("county=DEWITT");
  });

  it("returns undefined for datasets without county-query support", () => {
    expect(buildCountyDatasetUrl("u3nh-2phm", "Travis")).toBeUndefined();
    expect(buildCountyDatasetUrl("xdwx-843n", "Travis")).toBeUndefined();
  });
});
