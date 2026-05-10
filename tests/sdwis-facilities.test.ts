import { promises as fs } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  FACILITY_TYPE_LABELS,
  normalizeSdwisFacilities,
  normalizeSdwisFacility,
  type SdwisFacilityRaw,
} from "@/lib/datasets/sdwis-facilities";

async function loadFixture(): Promise<SdwisFacilityRaw[]> {
  const fixturePath = path.resolve(
    process.cwd(),
    "tests/fixtures/sdwis-facilities-sample.json",
  );
  const buf = await fs.readFile(fixturePath, "utf8");
  return JSON.parse(buf) as SdwisFacilityRaw[];
}

describe("normalizeSdwisFacility", () => {
  it("normalizes an active storage facility", async () => {
    const fixture = await loadFixture();
    const row = normalizeSdwisFacility(fixture[0]);
    expect(row).toEqual({
      pwsid: "TX2270001",
      facilityId: "120367",
      facilityName: "MORGAN CREEK PS(BASE 8)- 0.2 MG GST",
      stateFacilityId: "ST5348",
      facilityTypeCode: "ST",
      isActive: true,
    });
  });

  it("preserves the inactive flag for deactivated facilities", async () => {
    const fixture = await loadFixture();
    const inactive = fixture.find((row) => row.facility_activity_code === "I")!;
    const row = normalizeSdwisFacility(inactive);
    expect(row).not.toBeNull();
    expect(row?.isActive).toBe(false);
  });

  it("drops rows missing a pwsid", async () => {
    const fixture = await loadFixture();
    const orphan = fixture.find((row) => !row.pwsid)!;
    expect(normalizeSdwisFacility(orphan)).toBeNull();
  });

  it("falls back to OT for unknown facility_type_code", () => {
    const row = normalizeSdwisFacility({
      pwsid: "TX9999999",
      facility_id: "ABC",
      facility_type_code: "ZZ",
      facility_activity_code: "A",
    });
    expect(row?.facilityTypeCode).toBe("OT");
  });
});

describe("normalizeSdwisFacilities", () => {
  it("returns the storage and well rows but skips the orphaned record", async () => {
    const fixture = await loadFixture();
    const rows = normalizeSdwisFacilities(fixture);
    expect(rows).toHaveLength(5);
    const codes = rows.map((row) => row.facilityTypeCode);
    expect(codes.filter((code) => code === "ST")).toHaveLength(4);
    expect(codes.filter((code) => code === "WL")).toHaveLength(1);
  });
});

describe("FACILITY_TYPE_LABELS", () => {
  it("covers every code returned by the normalizer", () => {
    for (const code of ["ST", "WL", "IN", "TP", "DS", "PC", "OT"] as const) {
      expect(FACILITY_TYPE_LABELS[code]).toBeTruthy();
    }
  });
});
