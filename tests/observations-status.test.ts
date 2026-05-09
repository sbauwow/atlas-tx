import { describe, expect, it } from "vitest";

import { computeAgreement, decideStatus } from "@/lib/observations/status";
import { GENERIC_9PAD_CHART } from "@/lib/observations/strips/reference-chart-9pad";
import type { ClientReading, LlmReading } from "@/lib/observations/types";

function client(bandByAnalyte: Record<string, number>): ClientReading {
  return {
    schemaVersion: 1,
    chartId: GENERIC_9PAD_CHART.id,
    perAnalyte: GENERIC_9PAD_CHART.analytes.map((a) => ({
      analyteId: a.id,
      bandIndex: bandByAnalyte[a.id] ?? 0,
      distance: 0,
      distanceToRunnerUp: 1,
      sampledLab: [50, 0, 0] as const,
      sampledRgb: [128, 128, 128] as const,
    })),
  };
}

function llm(bandByAnalyte: Record<string, number>, qaFlags: LlmReading["qaFlags"] = []): LlmReading {
  return {
    schemaVersion: 1,
    chartId: GENERIC_9PAD_CHART.id,
    perAnalyte: GENERIC_9PAD_CHART.analytes.map((a) => ({
      analyteId: a.id,
      bandIndex: bandByAnalyte[a.id] ?? 0,
      confidence: 0.9,
    })),
    qaFlags,
  };
}

describe("computeAgreement", () => {
  it("returns 1 when every band matches", () => {
    const c = client({});
    const l = llm({});
    expect(computeAgreement(c, l)).toBe(1);
  });

  it("returns the fraction of matching bands", () => {
    const c = client({ ph: 0, free_chlorine: 0 });
    const l = llm({ ph: 0, free_chlorine: 1 });
    // 8 of 9 match
    expect(computeAgreement(c, l)).toBeCloseTo(8 / 9);
  });
});

describe("decideStatus", () => {
  it("rejects when server QA reports blur, regardless of agreement", () => {
    const d = decideStatus({
      chart: GENERIC_9PAD_CHART,
      clientReading: client({}),
      llmReading: llm({}),
      serverQaFlags: ["blur"],
    });
    expect(d.status).toBe("rejected");
  });

  it("rejects when LLM reports no-chart-detected", () => {
    const d = decideStatus({
      chart: GENERIC_9PAD_CHART,
      clientReading: client({}),
      llmReading: llm({}, ["no-chart-detected"]),
      serverQaFlags: [],
    });
    expect(d.status).toBe("rejected");
  });

  it("falls back to review when there's no LLM signal", () => {
    const d = decideStatus({
      chart: GENERIC_9PAD_CHART,
      clientReading: client({}),
      llmReading: null,
      serverQaFlags: [],
    });
    expect(d.status).toBe("review");
    expect(d.agreement).toBeNull();
  });

  it("accepts on full agreement and clean QA", () => {
    const d = decideStatus({
      chart: GENERIC_9PAD_CHART,
      clientReading: client({}),
      llmReading: llm({}),
      serverQaFlags: [],
    });
    expect(d.status).toBe("accepted");
    expect(d.agreement).toBe(1);
  });

  it("downgrades to accepted_warn when warn-level QA flag present", () => {
    const d = decideStatus({
      chart: GENERIC_9PAD_CHART,
      clientReading: client({}),
      llmReading: llm({}, ["glare"]),
      serverQaFlags: [],
    });
    expect(d.status).toBe("accepted_warn");
  });

  it("routes mid-agreement to accepted_warn", () => {
    // Disagree on 4 of 9 → 5/9 ≈ 0.56 → between 0.4 and 0.7
    const d = decideStatus({
      chart: GENERIC_9PAD_CHART,
      clientReading: client({}),
      llmReading: llm({ ph: 1, free_chlorine: 1, total_chlorine: 1, total_hardness: 1 }),
      serverQaFlags: [],
    });
    expect(d.status).toBe("accepted_warn");
  });

  it("routes low-agreement to review", () => {
    // Disagree on 8 of 9 → 1/9 ≈ 0.11 → review
    const disagreed = Object.fromEntries(
      GENERIC_9PAD_CHART.analytes.slice(1).map((a) => [a.id, 1]),
    );
    const d = decideStatus({
      chart: GENERIC_9PAD_CHART,
      clientReading: client({}),
      llmReading: llm(disagreed),
      serverQaFlags: [],
    });
    expect(d.status).toBe("review");
  });
});
