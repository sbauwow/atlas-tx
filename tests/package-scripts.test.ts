import { describe, expect, it } from "vitest";
import pkg from "../package.json";

describe("package scripts", () => {
  it("exposes a refresh:cid script for running the executable CID refresh scaffold", () => {
    expect(pkg.scripts["refresh:cid"]).toBe("tsx scripts/refresh-cid.ts");
  });

  it("exposes a refresh:twdb-hydrology script for refreshing TWDB hydrology cache", () => {
    expect(pkg.scripts["refresh:twdb-hydrology"]).toBe("tsx scripts/refresh-twdb-hydrology.ts");
  });

  it("exposes a refresh:surface-water-quality script for refreshing TCEQ surface-water-quality cache", () => {
    expect(pkg.scripts["refresh:surface-water-quality"]).toBe("tsx scripts/refresh-surface-water-quality.ts");
  });

  it("exposes a refresh:city-open-data script for refreshing Texas city open-data catalogs", () => {
    expect(pkg.scripts["refresh:city-open-data"]).toBe("tsx scripts/refresh-city-open-data.ts");
  });
});
