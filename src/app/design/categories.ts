/**
 * Categorical palette mappings. The 7-hue --cat-N tokens are reused across
 * three categorical domains; each domain has its own glyph set so meaning
 * never depends on color alone.
 */

import type { MvpDataset } from "@/lib/mvp-datasets";

export type CategoryToken = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/* ---------- Dataset categories ---------- */

export const DATASET_CATEGORY_TOKEN: Record<MvpDataset["category"], CategoryToken> = {
  environment: 2,
  infrastructure: 1,
  social: 5,
  fiscal: 4,
  debt: 7,
  demographic: 6,
  compliance: 3,
};

export const DATASET_CATEGORY_GLYPH: Record<MvpDataset["category"], string> = {
  environment: "❋",
  infrastructure: "⌬",
  social: "✦",
  fiscal: "$",
  debt: "⊟",
  demographic: "◬",
  compliance: "✓",
};

export const DATASET_CATEGORY_LABEL: Record<MvpDataset["category"], string> = {
  environment: "Environment",
  infrastructure: "Infrastructure",
  social: "Social strain",
  fiscal: "Fiscal context",
  debt: "Debt",
  demographic: "Demographic",
  compliance: "Compliance",
};

/* ---------- FEMA flood zones ---------- */

export type FemaZoneKey = "AE" | "X" | "D" | "OTHER";

export function classifyFemaZone(zone: string | null | undefined): FemaZoneKey {
  const value = (zone ?? "").trim().toUpperCase();
  if (!value) return "OTHER";
  if (value === "AE" || value.startsWith("A")) return "AE";
  if (value === "X" || value.startsWith("X")) return "X";
  if (value === "D") return "D";
  return "OTHER";
}

export const FEMA_ZONE_TOKEN: Record<FemaZoneKey, CategoryToken> = {
  AE: 5,
  X: 1,
  D: 3,
  OTHER: 7,
};

export const FEMA_ZONE_LABEL: Record<FemaZoneKey, string> = {
  AE: "AE — 100-yr floodway",
  X: "X — 500-yr / minimal",
  D: "D — unstudied",
  OTHER: "Other",
};

/* ---------- Surface-water impairment use flags ---------- */

export type ImpairmentUseKey =
  | "aquaticLife"
  | "contactRecreation"
  | "generalUse"
  | "fishConsumption"
  | "publicWaterSupply"
  | "oysterWaters";

export const IMPAIRMENT_USE_TOKEN: Record<ImpairmentUseKey, CategoryToken> = {
  aquaticLife: 2,
  contactRecreation: 1,
  generalUse: 3,
  fishConsumption: 5,
  publicWaterSupply: 4,
  oysterWaters: 6,
};

export const IMPAIRMENT_USE_LABEL: Record<ImpairmentUseKey, string> = {
  aquaticLife: "Aquatic life",
  contactRecreation: "Contact recreation",
  generalUse: "General use",
  fishConsumption: "Fish consumption",
  publicWaterSupply: "Public water supply",
  oysterWaters: "Oyster waters",
};

/* ---------- Token class fragments ---------- */

export const CATEGORY_BG_CLASS: Record<CategoryToken, string> = {
  1: "bg-cat-1",
  2: "bg-cat-2",
  3: "bg-cat-3",
  4: "bg-cat-4",
  5: "bg-cat-5",
  6: "bg-cat-6",
  7: "bg-cat-7",
};

export const CATEGORY_TEXT_CLASS: Record<CategoryToken, string> = {
  1: "text-cat-1",
  2: "text-cat-2",
  3: "text-cat-3",
  4: "text-cat-4",
  5: "text-cat-5",
  6: "text-cat-6",
  7: "text-cat-7",
};

export const CATEGORY_BORDER_CLASS: Record<CategoryToken, string> = {
  1: "border-cat-1",
  2: "border-cat-2",
  3: "border-cat-3",
  4: "border-cat-4",
  5: "border-cat-5",
  6: "border-cat-6",
  7: "border-cat-7",
};
