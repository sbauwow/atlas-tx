import type { ReferenceChart } from "../types";

/**
 * JED Pool Tools 5-way pool/spa strip.
 *
 * Status: prototype/community-observation only.
 * Bands are derived from the user's bottle-chart photos on 2026-05-09.
 * Free chlorine, total alkalinity, and pH labels are visible enough to map
 * directly; total hardness still uses common pool-strip ranges as placeholders
 * until a flatter chart capture is available. Keep this lane non-regulatory.
 */
export const JED_POOL_TOOLS_5WAY_CHART: ReferenceChart = {
  id: "jed-pool-tools-5way-v1",
  name: "JED Pool Tools 5-way pool/spa strip",
  version: 1,
  source:
    "User-provided bottle chart photo (2026-05-09). Prototype/community-observation only; not validated for regulatory or diagnostic interpretation.",
  analytes: [
    {
      id: "free_chlorine",
      name: "Free chlorine",
      unit: "mg/L",
      bands: [
        { label: "0.5", valueRange: { min: 0.25, max: 0.75, unit: "mg/L" }, lab: [96, -2, 6] },
        { label: "1", valueRange: { min: 0.75, max: 2, unit: "mg/L" }, lab: [86, 18, 4] },
        { label: "3", valueRange: { min: 2, max: 4, unit: "mg/L" }, lab: [74, 38, 2] },
        { label: "5", valueRange: { min: 4, max: 7, unit: "mg/L" }, lab: [58, 56, 8] },
        { label: "10", valueRange: { min: 7, unit: "mg/L" }, lab: [42, 64, 18] },
      ],
    },
    {
      id: "total_alkalinity",
      name: "Total alkalinity",
      unit: "mg/L CaCO₃",
      bands: [
        { label: "40", valueRange: { min: 0, max: 60, unit: "mg/L" }, lab: [88, -2, 56] },
        { label: "80", valueRange: { min: 60, max: 100, unit: "mg/L" }, lab: [78, -10, 36] },
        { label: "120", valueRange: { min: 100, max: 150, unit: "mg/L" }, lab: [70, -18, 18] },
        { label: "180", valueRange: { min: 150, max: 210, unit: "mg/L" }, lab: [60, -22, 0] },
        { label: "240", valueRange: { min: 210, unit: "mg/L" }, lab: [50, -22, -16] },
      ],
    },
    {
      id: "ph",
      name: "pH",
      unit: "pH",
      bands: [
        { label: "6.2", valueRange: { min: 6.0, max: 6.5, unit: "pH" }, lab: [88, 8, 78] },
        { label: "6.8", valueRange: { min: 6.5, max: 7.0, unit: "pH" }, lab: [82, -8, 60] },
        { label: "7.2", valueRange: { min: 7.0, max: 7.5, unit: "pH" }, lab: [72, -32, 12] },
        { label: "7.8", valueRange: { min: 7.5, max: 8.1, unit: "pH" }, lab: [62, -28, -14] },
        { label: "8.4", valueRange: { min: 8.1, max: 8.7, unit: "pH" }, lab: [55, -10, -38] },
        { label: "9.0", valueRange: { min: 8.7, unit: "pH" }, lab: [50, 20, -12] },
      ],
    },
    {
      id: "total_hardness",
      name: "Total hardness",
      unit: "mg/L CaCO₃",
      bands: [
        { label: "100", valueRange: { min: 0, max: 150, unit: "mg/L" }, lab: [62, -8, -28] },
        { label: "250", valueRange: { min: 150, max: 300, unit: "mg/L" }, lab: [60, 18, -8] },
        { label: "500", valueRange: { min: 300, max: 550, unit: "mg/L" }, lab: [48, 52, 14] },
        { label: "1000", valueRange: { min: 550, unit: "mg/L" }, lab: [40, 58, 24] },
      ],
    },
  ],
};
