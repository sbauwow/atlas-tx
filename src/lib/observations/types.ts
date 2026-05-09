/**
 * Shared types for the citizen water-observation prototype.
 *
 * Strictly non-regulatory. See docs/research/smartphone-colorimetry.md and
 * docs/contracts/dataset-registry.md for the integration contract.
 */

export const OBSERVATION_SCHEMA_VERSION = 1;

export type ObservationKind = "strip" | "tds" | "tap-photo" | "plumbing-form";

export type ObservationStatus =
  | "pending"
  | "accepted"
  | "accepted_warn"
  | "review"
  | "rejected";

export type QaFlag =
  | "blur"
  | "glare"
  | "low-light"
  | "saturation-clip"
  | "no-chart-detected"
  | "underfill";

export type LabColor = readonly [L: number, a: number, b: number];
export type RgbColor = readonly [r: number, g: number, b: number];

export interface AnalyteBand {
  /** Human-readable label. e.g. "0", "25", "50–120", "<0.15". */
  readonly label: string;
  /** Optional numeric range. */
  readonly valueRange?: { readonly min?: number; readonly max?: number; readonly unit: string };
  /** CIE Lab reference color for this band, normalized D65/2°. */
  readonly lab: LabColor;
}

export interface AnalyteDefinition {
  /** Stable id (snake-case). */
  readonly id: string;
  /** Display label. */
  readonly name: string;
  /** Concentration unit (mg/L, etc.) — informational. */
  readonly unit?: string;
  /** Bands listed low → high (for monotonic display). */
  readonly bands: readonly AnalyteBand[];
}

export interface ReferenceChart {
  readonly id: string;
  readonly name: string;
  readonly version: number;
  /** Citation / source for the bands. Required by the colorimetry memo §13 before any public claims. */
  readonly source: string;
  readonly analytes: readonly AnalyteDefinition[];
}

export interface PerAnalyteClientReading {
  readonly analyteId: string;
  /** Index into the analyte's bands. */
  readonly bandIndex: number;
  /** ΔE distance to the assigned band's reference color. */
  readonly distance: number;
  /** ΔE distance to the next-best band — used for confidence. */
  readonly distanceToRunnerUp: number;
  /** Lab triplet sampled from the strip pad after blank/reference normalization. */
  readonly sampledLab: LabColor;
  /** Raw RGB pre-normalization, for debugging only. */
  readonly sampledRgb: RgbColor;
}

export interface ClientReading {
  readonly schemaVersion: number;
  readonly chartId: string;
  readonly perAnalyte: readonly PerAnalyteClientReading[];
}

export interface PerAnalyteLlmReading {
  readonly analyteId: string;
  readonly bandIndex: number;
  /** Model self-reported confidence 0..1. */
  readonly confidence: number;
  readonly note?: string;
}

export interface LlmReading {
  readonly schemaVersion: number;
  readonly chartId: string;
  readonly perAnalyte: readonly PerAnalyteLlmReading[];
  readonly qaFlags: readonly QaFlag[];
  readonly modelResponseId?: string;
}

export interface ObservationRow {
  readonly id: string;
  readonly createdAt: Date;
  readonly kind: ObservationKind;
  readonly countySlug: string | null;
  readonly imagePath: string | null;
  readonly imageHash: string | null;
  readonly stripBrand: string | null;
  readonly clientReading: ClientReading;
  readonly llmReading: LlmReading | null;
  readonly llmModel: string | null;
  readonly agreement: number | null;
  readonly qaFlags: readonly QaFlag[];
  readonly status: ObservationStatus;
}
