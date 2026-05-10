import { describe, expect, it } from "vitest";

import { classifyDistrictType } from "@/lib/water/district-type";

describe("classifyDistrictType", () => {
  it.each([
    ["Municipal Utility District", "MUD"],
    ["municipal utility dist.", "MUD"],
    ["Special Utility District", "SUD"],
    ["Water Control & Improvement District", "WCID"],
    ["Water Control and Improvement District", "WCID"],
    ["Fresh Water Supply District", "FWSD"],
    ["Freshwater Supply District", "FWSD"],
    ["Water Supply Corporation", "WSC"],
    ["River Authority", "RA"],
    ["Groundwater Conservation District", "GCD"],
    ["Drainage District", "DD"],
    ["Investor-Owned Utility", "IOU"],
    ["Submeter Utility", "SUB"],
  ])("classifies %s as %s", (input, expected) => {
    expect(classifyDistrictType(input).code).toBe(expected);
  });

  it("falls back to OTHER for unknown types", () => {
    const info = classifyDistrictType("Some Unknown Authority Type");
    expect(info.code).toBe("OTHER");
    expect(info.label).toBe("Some Unknown Authority Type");
  });

  it("falls back to OTHER for null input", () => {
    expect(classifyDistrictType(null).code).toBe("OTHER");
    expect(classifyDistrictType(undefined).code).toBe("OTHER");
  });
});
