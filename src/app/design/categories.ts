/**
 * Categorical palette mappings. The 7-hue --cat-N tokens are reused across
 * categorical domains; each domain should also use labels/glyphs so meaning
 * never depends on color alone.
 */

import type { MvpDataset } from "@/lib/mvp-datasets";

export type CategoryToken = 1 | 2 | 3 | 4 | 5 | 6 | 7;

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

export const CATEGORY_BG_CLASS: Record<CategoryToken, string> = {
  1: "bg-cat-1/10",
  2: "bg-cat-2/10",
  3: "bg-cat-3/10",
  4: "bg-cat-4/10",
  5: "bg-cat-5/10",
  6: "bg-cat-6/10",
  7: "bg-cat-7/10",
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
  1: "border-cat-1/40",
  2: "border-cat-2/40",
  3: "border-cat-3/40",
  4: "border-cat-4/40",
  5: "border-cat-5/40",
  6: "border-cat-6/40",
  7: "border-cat-7/40",
};
