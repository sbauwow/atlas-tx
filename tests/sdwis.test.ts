import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeSdwis, type SdwisRaw } from "@/lib/datasets/sdwis";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(here, "fixtures", "sdwis-sample.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as SdwisRaw;

describe("normalizeSdwis", () => {
  const rows = normalizeSdwis(fixture);
  const byPwsid = Object.fromEntries(rows.map((r) => [r.violationId, r]));

  it("returns one row per raw violation, joined by pwsid", () => {
    expect(rows).toHaveLength(fixture.violations.length);
    for (const r of rows) {
      expect(typeof r.pwsid).toBe("string");
      expect(r.pwsid.length).toBeGreaterThan(0);
    }
  });

  it("normalizes county names through normalizeCountyName", () => {
    // lowercase 'anderson' -> 'Anderson County'
    expect(byPwsid["366"].county).toBe("Anderson County");
    // already-suffixed 'Travis County' stays canonical
    expect(byPwsid["9001"].county).toBe("Travis County");
    // 'St. James' -> 'Saint James County'
    expect(byPwsid["9002"].county).toBe("Saint James County");
    // No GEOGRAPHIC_AREA row -> null county
    expect(byPwsid["9003"].county).toBeNull();
  });

  it("coerces compl_per_begin_date to ISO YYYY-MM-DD", () => {
    expect(byPwsid["366"].complPerBeginDate).toBe("2023-06-01");
    expect(byPwsid["9001"].complPerBeginDate).toBe("2024-04-01");
    // Whitespace + timestamp suffix should still parse cleanly
    expect(byPwsid["9002"].complPerBeginDate).toBe("2022-08-15");
    expect(byPwsid["9003"].complPerBeginDate).toBeNull();
  });

  it("keeps PWSID as a string and never numericizes it", () => {
    for (const r of rows) {
      expect(typeof r.pwsid).toBe("string");
    }
    // Leading TX prefix preserved
    expect(byPwsid["366"].pwsid).toBe("TX0010001");
    expect(byPwsid["9001"].pwsid).toBe("TX2270001");
  });

  it("coerces is_health_based to boolean", () => {
    expect(byPwsid["366"].isHealthBased).toBe(true); // "Y"
    expect(byPwsid["9001"].isHealthBased).toBe(false); // "N"
    expect(byPwsid["9002"].isHealthBased).toBe(true); // lowercase "y"
    expect(byPwsid["9003"].isHealthBased).toBe(false); // null
  });

  it("attaches pws_name from the WATER_SYSTEM join", () => {
    expect(byPwsid["366"].pwsName).toBe("CITY OF PALESTINE");
    expect(byPwsid["9001"].pwsName).toBe("CITY OF AUSTIN");
    // No matching WATER_SYSTEM row -> null
    expect(byPwsid["9003"].pwsName).toBeNull();
  });

  it("falls back to WATER_SYSTEM.population_served when violation row is blank", () => {
    // violation has population_served_count = "  " (blank string) -> falls
    // back to WATER_SYSTEM 320
    expect(byPwsid["9002"].populationServed).toBe(320);
    // violation row null + no WATER_SYSTEM match -> null
    expect(byPwsid["9003"].pwsName).toBeNull();
  });

  it("preserves violation metadata fields verbatim", () => {
    const r = byPwsid["366"];
    expect(r.violationCode).toBe("43");
    expect(r.violationCategory).toBe("TT");
    expect(r.contaminantCode).toBe("0300");
    expect(r.complianceStatusCode).toBe("R");
    expect(r.publicNotificationTier).toBe(1);
    expect(r.ruleCode).toBe("122");
    expect(r.ruleGroupCode).toBe("100");
    expect(r.pwsTypeCode).toBe("CWS");
  });
});
