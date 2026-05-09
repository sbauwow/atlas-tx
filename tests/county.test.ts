import { describe, expect, it } from "vitest";
import { countySlug, normalizeCountyName, sameCounty } from "@/lib/counties";

describe("county normalization", () => {
  it("normalizes county names from mixed case and optional suffixes", () => {
    expect(normalizeCountyName("travis county")).toBe("Travis County");
    expect(normalizeCountyName("HARRIS")).toBe("Harris County");
  });

  it("normalizes saint/st variants consistently", () => {
    expect(normalizeCountyName("st. john the baptist county")).toBe("Saint John The Baptist County");
    expect(normalizeCountyName("saint john the baptist")).toBe("Saint John The Baptist County");
  });

  it("builds stable county slugs", () => {
    expect(countySlug("DeWitt County")).toBe("dewitt-county");
    expect(countySlug("La Salle")).toBe("la-salle-county");
  });

  it("compares county aliases as the same county", () => {
    expect(sameCounty("Travis", "travis county")).toBe(true);
    expect(sameCounty("St. John the Baptist", "saint john the baptist county")).toBe(true);
    expect(sameCounty("Travis", "Williamson")).toBe(false);
  });
});
