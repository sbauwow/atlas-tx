import { describe, expect, it } from "vitest";

import {
  computeAgreementFromBands,
  evaluateArbitrationArm,
  evaluateArbitrationBenchmark,
  predictArmState,
  runClaimSupportArbitrationScaffold,
  scaffoldExampleRows,
  summarizeArbitrationDataset,
} from "../experiments/claim_support_arbitration";

describe("claim_support_arbitration", () => {
  it("exports the scaffold runner", () => {
    expect(typeof runClaimSupportArbitrationScaffold).toBe("function");
  });

  it("summarizes the built-in example dataset", () => {
    const summary = summarizeArbitrationDataset(scaffoldExampleRows());
    expect(summary.totalRows).toBeGreaterThan(0);
    expect(summary.imageQualityCounts.valid).toBeGreaterThan(0);
    expect(summary.imageQualityCounts.invalid).toBeGreaterThan(0);
  });

  it("computes analyte agreement across overlapping non-null bands", () => {
    const agreement = computeAgreementFromBands(
      { free_chlorine: 2, ph: 3, total_hardness: null },
      { free_chlorine: 2, ph: 1, total_hardness: null },
    );
    expect(agreement).toBeCloseTo(0.5, 5);
  });

  it("routes fatal QA cases to rejected in the full workflow arm", () => {
    const bad = scaffoldExampleRows().find((row) => row.id === "example-bad-001");
    expect(bad).toBeTruthy();
    expect(predictArmState(bad!, "A3_full_workflow")).toBe("rejected");
  });

  it("evaluates all benchmark arms", () => {
    const rows = scaffoldExampleRows();
    const results = evaluateArbitrationBenchmark(rows);
    expect(results).toHaveLength(4);
    const full = evaluateArbitrationArm(rows, "A3_full_workflow");
    expect(full.metrics.invalidCaptureRecall).not.toBeNull();
  });
});
