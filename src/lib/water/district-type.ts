/**
 * Texas water-governance entity type taxonomy.
 *
 * `entityType` on a `WaterGovernanceEntity` is the raw `district_type` string
 * from TCEQ Water Districts (e.g. "Municipal Utility District") or one of
 * `"Investor-Owned Utility"` / `"Submeter Utility"` from PUCT data. Free-text
 * strings are noisy in the UI, so this module canonicalizes them into a small
 * abbreviation set (MUD, SUD, WCID, FWSD, WSC, RWPG, RA, IOU, SUB, OTHER) and a
 * one-line description.
 */

export type DistrictTypeCode =
  | "MUD"
  | "SUD"
  | "WCID"
  | "FWSD"
  | "WSC"
  | "RA"
  | "GCD"
  | "DD"
  | "IOU"
  | "SUB"
  | "OTHER";

export type DistrictTypeInfo = {
  code: DistrictTypeCode;
  label: string;
  description: string;
};

const RULES: Array<{ pattern: RegExp; info: DistrictTypeInfo }> = [
  {
    pattern: /municipal\s+util/i,
    info: {
      code: "MUD",
      label: "Municipal Utility District",
      description: "Common suburban Texas water/sewer district; can issue debt and tax.",
    },
  },
  {
    pattern: /special\s+util/i,
    info: {
      code: "SUD",
      label: "Special Utility District",
      description: "Member-controlled rural water supply district under TCEQ.",
    },
  },
  {
    pattern: /water\s+control(?:\s+&|\s+and)?\s+improvement/i,
    info: {
      code: "WCID",
      label: "Water Control & Improvement District",
      description: "Older Texas district class; can do water, sewer, drainage, irrigation.",
    },
  },
  {
    pattern: /fresh(?:\s|-)?water\s+supply/i,
    info: {
      code: "FWSD",
      label: "Fresh Water Supply District",
      description: "Smaller potable-water district, typically rural.",
    },
  },
  {
    pattern: /water\s+supply\s+corporation|^wsc$/i,
    info: {
      code: "WSC",
      label: "Water Supply Corporation",
      description: "Non-profit member-owned rural water supply corporation.",
    },
  },
  {
    pattern: /river\s+auth/i,
    info: {
      code: "RA",
      label: "River Authority",
      description: "Regional water authority covering one or more river basins.",
    },
  },
  {
    pattern: /groundwater\s+conservation/i,
    info: {
      code: "GCD",
      label: "Groundwater Conservation District",
      description: "Manages aquifer pumping permits and groundwater rules.",
    },
  },
  {
    pattern: /drainage\s+district/i,
    info: {
      code: "DD",
      label: "Drainage District",
      description: "Stormwater + drainage governance; typically not a PWS.",
    },
  },
  {
    pattern: /investor[-\s]?owned/i,
    info: {
      code: "IOU",
      label: "Investor-Owned Utility",
      description: "PUCT-regulated for-profit water/sewer utility.",
    },
  },
  {
    pattern: /submeter/i,
    info: {
      code: "SUB",
      label: "Submeter Utility",
      description: "PUCT-registered submetered utility (apartments, manufactured homes).",
    },
  },
];

const FALLBACK: DistrictTypeInfo = {
  code: "OTHER",
  label: "Water governance entity",
  description: "Texas water-governance record without a recognized type pattern.",
};

export function classifyDistrictType(rawType: string | null | undefined): DistrictTypeInfo {
  if (!rawType) return FALLBACK;
  for (const rule of RULES) {
    if (rule.pattern.test(rawType)) return rule.info;
  }
  return { ...FALLBACK, label: rawType };
}
