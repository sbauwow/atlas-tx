import { describe, expect, it } from "vitest";
import pkg from "../package.json";

describe("package scripts", () => {
  it("exposes a refresh:cid script for running the executable CID refresh scaffold", () => {
    expect(pkg.scripts["refresh:cid"]).toBe("tsx scripts/refresh-cid.ts");
  });
});
