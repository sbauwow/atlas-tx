import type { ReferenceChart } from "../types";

/**
 * Generic 9-pad freshwater test-strip reference chart.
 *
 * Status: PROTOTYPE.
 * Lab values below are plausible visual approximations sufficient to exercise
 * the matching pipeline. They are NOT calibrated against a vendor datasheet.
 * Per docs/research/smartphone-colorimetry.md §13, before any public claims
 * the bands must be re-sourced from a citable kit datasheet (e.g. AKVO
 * Caddisfly chart, an aquarium-strip vendor PDF, or a peer-reviewed table)
 * and stored alongside that citation in `source`.
 *
 * Order of analytes mirrors the order most pads ship in (top-of-strip first).
 */
export const GENERIC_9PAD_CHART: ReferenceChart = {
  id: "generic-9pad-v0",
  name: "Generic 9-pad freshwater strip (uncalibrated prototype)",
  version: 0,
  source:
    "PROTOTYPE — uncalibrated visual approximations. Replace with cited datasheet before any public claim.",
  analytes: [
    {
      id: "ph",
      name: "pH",
      bands: [
        { label: "6.2", valueRange: { min: 6.0, max: 6.4, unit: "pH" }, lab: [82, -8, 60] },
        { label: "6.8", valueRange: { min: 6.5, max: 7.0, unit: "pH" }, lab: [78, -22, 38] },
        { label: "7.2", valueRange: { min: 7.1, max: 7.4, unit: "pH" }, lab: [72, -32, 12] },
        { label: "7.8", valueRange: { min: 7.5, max: 8.0, unit: "pH" }, lab: [62, -28, -14] },
        { label: "8.4", valueRange: { min: 8.1, max: 8.6, unit: "pH" }, lab: [55, -10, -38] },
      ],
    },
    {
      id: "free_chlorine",
      name: "Free chlorine",
      unit: "mg/L",
      bands: [
        { label: "0", valueRange: { min: 0, max: 0.1, unit: "mg/L" }, lab: [96, -2, 6] },
        { label: "0.5", valueRange: { min: 0.2, max: 0.7, unit: "mg/L" }, lab: [86, 18, 4] },
        { label: "1", valueRange: { min: 0.8, max: 1.5, unit: "mg/L" }, lab: [74, 38, 2] },
        { label: "3", valueRange: { min: 2, max: 4, unit: "mg/L" }, lab: [58, 56, 8] },
        { label: "5", valueRange: { min: 4.5, max: 6, unit: "mg/L" }, lab: [42, 64, 18] },
      ],
    },
    {
      id: "total_chlorine",
      name: "Total chlorine",
      unit: "mg/L",
      bands: [
        { label: "0", valueRange: { min: 0, max: 0.1, unit: "mg/L" }, lab: [96, -2, 4] },
        { label: "0.5", valueRange: { min: 0.2, max: 0.7, unit: "mg/L" }, lab: [84, 22, -8] },
        { label: "1", valueRange: { min: 0.8, max: 1.5, unit: "mg/L" }, lab: [70, 42, -10] },
        { label: "3", valueRange: { min: 2, max: 4, unit: "mg/L" }, lab: [54, 58, -2] },
        { label: "5", valueRange: { min: 4.5, max: 6, unit: "mg/L" }, lab: [38, 64, 12] },
      ],
    },
    {
      id: "total_hardness",
      name: "Total hardness",
      unit: "mg/L CaCO₃",
      bands: [
        { label: "0", valueRange: { min: 0, max: 20, unit: "mg/L" }, lab: [62, -8, -28] },
        { label: "25", valueRange: { min: 20, max: 50, unit: "mg/L" }, lab: [62, -2, -16] },
        { label: "50", valueRange: { min: 50, max: 120, unit: "mg/L" }, lab: [60, 18, -8] },
        { label: "120", valueRange: { min: 120, max: 250, unit: "mg/L" }, lab: [55, 38, 4] },
        { label: "250", valueRange: { min: 250, max: 425, unit: "mg/L" }, lab: [48, 52, 14] },
        { label: "425+", valueRange: { min: 425, unit: "mg/L" }, lab: [40, 58, 24] },
      ],
    },
    {
      id: "total_alkalinity",
      name: "Total alkalinity",
      unit: "mg/L CaCO₃",
      bands: [
        { label: "0", valueRange: { min: 0, max: 20, unit: "mg/L" }, lab: [88, -2, 56] },
        { label: "40", valueRange: { min: 20, max: 60, unit: "mg/L" }, lab: [78, -10, 36] },
        { label: "80", valueRange: { min: 60, max: 100, unit: "mg/L" }, lab: [70, -18, 18] },
        { label: "120", valueRange: { min: 100, max: 150, unit: "mg/L" }, lab: [60, -22, 0] },
        { label: "180", valueRange: { min: 150, max: 220, unit: "mg/L" }, lab: [50, -22, -16] },
        { label: "240+", valueRange: { min: 220, unit: "mg/L" }, lab: [42, -16, -28] },
      ],
    },
    {
      id: "nitrate",
      name: "Nitrate (NO₃)",
      unit: "mg/L",
      bands: [
        { label: "0", valueRange: { min: 0, max: 5, unit: "mg/L" }, lab: [94, -4, 8] },
        { label: "10", valueRange: { min: 5, max: 15, unit: "mg/L" }, lab: [82, 14, 6] },
        { label: "20", valueRange: { min: 15, max: 35, unit: "mg/L" }, lab: [72, 30, 4] },
        { label: "50", valueRange: { min: 35, max: 75, unit: "mg/L" }, lab: [60, 46, 8] },
        { label: "100", valueRange: { min: 75, max: 150, unit: "mg/L" }, lab: [50, 56, 18] },
        { label: "200+", valueRange: { min: 150, unit: "mg/L" }, lab: [40, 60, 28] },
      ],
    },
    {
      id: "nitrite",
      name: "Nitrite (NO₂)",
      unit: "mg/L",
      bands: [
        { label: "0", valueRange: { min: 0, max: 0.05, unit: "mg/L" }, lab: [96, -2, 4] },
        { label: "0.15", valueRange: { min: 0.05, max: 0.2, unit: "mg/L" }, lab: [86, 14, -2] },
        { label: "0.3", valueRange: { min: 0.2, max: 0.5, unit: "mg/L" }, lab: [74, 30, 2] },
        { label: "1", valueRange: { min: 0.5, max: 2, unit: "mg/L" }, lab: [60, 48, 6] },
        { label: "3+", valueRange: { min: 2, unit: "mg/L" }, lab: [46, 60, 16] },
      ],
    },
    {
      id: "iron",
      name: "Iron",
      unit: "mg/L",
      bands: [
        { label: "0", valueRange: { min: 0, max: 0.05, unit: "mg/L" }, lab: [96, -2, 6] },
        { label: "0.15", valueRange: { min: 0.05, max: 0.2, unit: "mg/L" }, lab: [82, 6, 22] },
        { label: "0.3", valueRange: { min: 0.2, max: 0.5, unit: "mg/L" }, lab: [70, 14, 38] },
        { label: "1", valueRange: { min: 0.5, max: 2, unit: "mg/L" }, lab: [56, 26, 50] },
        { label: "3+", valueRange: { min: 2, unit: "mg/L" }, lab: [42, 36, 56] },
      ],
    },
    {
      id: "copper",
      name: "Copper",
      unit: "mg/L",
      bands: [
        { label: "0", valueRange: { min: 0, max: 0.1, unit: "mg/L" }, lab: [96, -2, 4] },
        { label: "0.5", valueRange: { min: 0.1, max: 0.7, unit: "mg/L" }, lab: [80, 6, -16] },
        { label: "1", valueRange: { min: 0.7, max: 1.2, unit: "mg/L" }, lab: [66, 14, -28] },
        { label: "1.5", valueRange: { min: 1.2, max: 1.8, unit: "mg/L" }, lab: [54, 22, -38] },
        { label: "2+", valueRange: { min: 1.8, unit: "mg/L" }, lab: [44, 28, -46] },
      ],
    },
  ],
};
