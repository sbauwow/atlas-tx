import { describe, expect, it } from "vitest";

import { __TEST_ONLY__ } from "@/lib/observations/vision";
import { GENERIC_9PAD_CHART } from "@/lib/observations/strips/reference-chart-9pad";

const { buildAnalyzerTool, buildSystemBlocks, parseToolInput, MODEL } = __TEST_ONLY__;

describe("vision tool schema", () => {
  it("constrains analyteId to chart-defined ids", () => {
    const tool = buildAnalyzerTool(GENERIC_9PAD_CHART);
    const enumIds = tool.input_schema.properties.perAnalyte.items.properties.analyteId.enum;
    expect(enumIds).toEqual(GENERIC_9PAD_CHART.analytes.map((a) => a.id));
  });

  it("emits a single cache_control text block in the system prompt", () => {
    const blocks = buildSystemBlocks(GENERIC_9PAD_CHART);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("text");
    expect(blocks[0].cache_control).toEqual({ type: "ephemeral" });
    expect(blocks[0].text).toContain("non-regulatory");
  });
});

describe("parseToolInput", () => {
  it("accepts a valid payload", () => {
    const result = parseToolInput(
      {
        perAnalyte: GENERIC_9PAD_CHART.analytes.map((a) => ({
          analyteId: a.id,
          bandIndex: 0,
          confidence: 0.9,
        })),
        qaFlags: ["glare"],
      },
      GENERIC_9PAD_CHART,
    );
    expect(result).not.toBeNull();
    expect(result!.perAnalyte).toHaveLength(GENERIC_9PAD_CHART.analytes.length);
    expect(result!.qaFlags).toEqual(["glare"]);
  });

  it("drops entries with unknown analyteId", () => {
    const result = parseToolInput(
      {
        perAnalyte: [
          { analyteId: "bogus", bandIndex: 0, confidence: 0.5 },
          { analyteId: "ph", bandIndex: 1, confidence: 0.5 },
        ],
        qaFlags: [],
      },
      GENERIC_9PAD_CHART,
    );
    expect(result!.perAnalyte).toHaveLength(1);
    expect(result!.perAnalyte[0].analyteId).toBe("ph");
  });

  it("drops out-of-range bandIndex", () => {
    const result = parseToolInput(
      {
        perAnalyte: [{ analyteId: "ph", bandIndex: 99, confidence: 0.5 }],
        qaFlags: [],
      },
      GENERIC_9PAD_CHART,
    );
    expect(result!.perAnalyte).toHaveLength(0);
  });

  it("clamps confidence to [0,1]", () => {
    const result = parseToolInput(
      {
        perAnalyte: [{ analyteId: "ph", bandIndex: 0, confidence: 1.7 }],
        qaFlags: [],
      },
      GENERIC_9PAD_CHART,
    );
    expect(result!.perAnalyte[0].confidence).toBe(1);
  });

  it("filters unknown qa flag strings", () => {
    const result = parseToolInput(
      { perAnalyte: [], qaFlags: ["glare", "made-up", "blur"] },
      GENERIC_9PAD_CHART,
    );
    expect(result!.qaFlags).toEqual(["glare", "blur"]);
  });

  it("returns null for non-object input", () => {
    expect(parseToolInput("hello", GENERIC_9PAD_CHART)).toBeNull();
    expect(parseToolInput(null, GENERIC_9PAD_CHART)).toBeNull();
  });
});

describe("model id", () => {
  it("uses the current Opus model", () => {
    expect(MODEL).toBe("claude-opus-4-7");
  });
});
