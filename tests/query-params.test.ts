import { describe, expect, it } from "vitest";

import {
  clampQueryText,
  getFirstQueryParam,
  parseEnumQueryParam,
  parsePositiveIntQueryParam,
  resolveAllowedQueryParam,
} from "@/lib/query-params";

describe("query params helpers", () => {
  it("extracts the first query value", () => {
    expect(getFirstQueryParam("alpha")).toBe("alpha");
    expect(getFirstQueryParam(["alpha", "beta"])).toBe("alpha");
    expect(getFirstQueryParam(undefined)).toBeUndefined();
  });

  it("parses enums with fallback", () => {
    expect(parseEnumQueryParam("oil", ["risk", "pressure", "oil"] as const, "risk")).toBe("oil");
    expect(parseEnumQueryParam("weird", ["risk", "pressure", "oil"] as const, "risk")).toBe("risk");
  });

  it("resolves only allowed normalized values", () => {
    const allowed = ["travis-county", "harris-county"];
    expect(resolveAllowedQueryParam("Travis County", allowed, (value) => value.toLowerCase().replace(/\s+/g, "-") )).toBe("travis-county");
    expect(resolveAllowedQueryParam("bexar-county", allowed)).toBeUndefined();
  });

  it("clamps text and positive ints", () => {
    expect(clampQueryText("  hello world  ", 5)).toBe("hello");
    expect(parsePositiveIntQueryParam("50", 10, { min: 1, max: 25 })).toBe(25);
    expect(parsePositiveIntQueryParam("nope", 10, { min: 1, max: 25 })).toBe(10);
  });
});
