/**
 * Client-safe types + ID list for the interactive /maps choropleth views.
 * No server-only imports here — `interactive-map.tsx` is a client component
 * and its bundle cannot transitively pull in `node:fs` / Prisma.
 *
 * Server-side loaders live in `./county-views.ts`, which re-exports from
 * this file so the API route gets one canonical type source.
 */

export const COUNTY_VIEW_IDS = ["ej", "operators", "swq", "citizen"] as const;
export type CountyViewId = (typeof COUNTY_VIEW_IDS)[number];

export type CountyViewBucket = {
  label: string;
  fill: string;
  min?: number;
  max?: number;
};

export type CountyViewRow = {
  slug: string;
  name: string;
  value: number;
  context?: string;
};

export type CountyViewPayload = {
  view: CountyViewId;
  title: string;
  description: string;
  valueLabel: string;
  format: "integer" | "decimal" | "percent";
  buckets: CountyViewBucket[];
  generatedAt: string;
  rows: CountyViewRow[];
};

export const NO_DATA_FILL = "rgba(15,23,42,0.55)";

export const VIEW_META: Record<CountyViewId, Pick<CountyViewPayload, "title" | "description" | "valueLabel" | "format" | "buckets">> = {
  ej: {
    title: "Drinking-water risk",
    description: "Cached SDWIS health-based violations per county since 2023-04-01.",
    valueLabel: "violations",
    format: "integer",
    buckets: [
      { label: "0", fill: NO_DATA_FILL, min: 0, max: 0 },
      { label: "1–9", fill: "rgba(56,189,248,0.55)", min: 1, max: 9 },
      { label: "10–29", fill: "rgba(34,211,238,0.7)", min: 10, max: 29 },
      { label: "30–99", fill: "rgba(249,168,212,0.78)", min: 30, max: 99 },
      { label: "100+", fill: "rgba(244,63,94,0.85)", min: 100 },
    ],
  },
  operators: {
    title: "Operator pressure",
    description: "Pending TCEQ water-quality individual permits per county.",
    valueLabel: "permits",
    format: "integer",
    buckets: [
      { label: "0", fill: NO_DATA_FILL, min: 0, max: 0 },
      { label: "1", fill: "rgba(56,189,248,0.55)", min: 1, max: 1 },
      { label: "2–3", fill: "rgba(34,211,238,0.7)", min: 2, max: 3 },
      { label: "4–7", fill: "rgba(249,168,212,0.78)", min: 4, max: 7 },
      { label: "8+", fill: "rgba(244,63,94,0.85)", min: 8 },
    ],
  },
  swq: {
    title: "Surface-water impairment",
    description: "TCEQ-classified impaired surface-water segments per county.",
    valueLabel: "impaired segments",
    format: "integer",
    buckets: [
      { label: "0", fill: NO_DATA_FILL, min: 0, max: 0 },
      { label: "1", fill: "rgba(56,189,248,0.55)", min: 1, max: 1 },
      { label: "2–3", fill: "rgba(34,211,238,0.7)", min: 2, max: 3 },
      { label: "4–7", fill: "rgba(249,168,212,0.78)", min: 4, max: 7 },
      { label: "8+", fill: "rgba(244,63,94,0.85)", min: 8 },
    ],
  },
  citizen: {
    title: "Citizen activity",
    description: "Recent strip-test observations submitted via the citizen API.",
    valueLabel: "observations",
    format: "integer",
    buckets: [
      { label: "0", fill: NO_DATA_FILL, min: 0, max: 0 },
      { label: "1", fill: "rgba(56,189,248,0.55)", min: 1, max: 1 },
      { label: "2–4", fill: "rgba(34,211,238,0.7)", min: 2, max: 4 },
      { label: "5–9", fill: "rgba(125,211,252,0.78)", min: 5, max: 9 },
      { label: "10+", fill: "rgba(186,230,253,0.9)", min: 10 },
    ],
  },
};

export function isCountyViewId(value: unknown): value is CountyViewId {
  return typeof value === "string" && (COUNTY_VIEW_IDS as readonly string[]).includes(value);
}

export function bucketFillFor(view: CountyViewId, value: number): string {
  for (const b of VIEW_META[view].buckets) {
    const minOk = b.min === undefined || value >= b.min;
    const maxOk = b.max === undefined || value <= b.max;
    if (minOk && maxOk) return b.fill;
  }
  return NO_DATA_FILL;
}
