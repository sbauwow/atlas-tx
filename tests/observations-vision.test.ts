import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { __TEST_ONLY__, getActiveInferenceModelLabel } from "@/lib/observations/vision";
import { GENERIC_9PAD_CHART } from "@/lib/observations/strips/reference-chart-9pad";

const {
  buildAnalyzerTool,
  buildSystemPrompt,
  buildJsonShapePrompt,
  parseToolInput,
  pickProvider,
  DEFAULT_FEATHERLESS_MODEL,
  DEFAULT_OPENAI_MODEL,
  FEATHERLESS_BASE_URL,
} = __TEST_ONLY__;

describe("vision tool schema", () => {
  it("constrains analyteId to chart-defined ids", () => {
    const tool = buildAnalyzerTool(GENERIC_9PAD_CHART);
    const enumIds = tool.function.parameters.properties.perAnalyte.items.properties.analyteId.enum;
    expect(enumIds).toEqual(GENERIC_9PAD_CHART.analytes.map((a) => a.id));
  });

  it("emits a function-shaped tool for OpenAI tool_choice", () => {
    const tool = buildAnalyzerTool(GENERIC_9PAD_CHART);
    expect(tool.type).toBe("function");
    expect(tool.function.name).toBe("report_strip_reading");
    expect(tool.function.parameters.required).toEqual(["perAnalyte", "qaFlags"]);
  });

  it("system prompt carries the non-regulatory framing", () => {
    const prompt = buildSystemPrompt(GENERIC_9PAD_CHART);
    expect(prompt).toContain("non-regulatory");
    expect(prompt).toContain("Reference chart spec");
  });

  it("JSON shape prompt enumerates allowed analyte ids", () => {
    const prompt = buildJsonShapePrompt(GENERIC_9PAD_CHART);
    for (const a of GENERIC_9PAD_CHART.analytes) {
      expect(prompt).toContain(`"${a.id}"`);
    }
    expect(prompt).toContain("\"qaFlags\"");
    expect(prompt).toContain("strict JSON");
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

describe("provider selection", () => {
  const original = {
    featherless: process.env.FEATHERLESS_API_KEY,
    featherlessModel: process.env.FEATHERLESS_MODEL,
    openai: process.env.OPENAI_API_KEY,
  };

  beforeEach(() => {
    delete process.env.FEATHERLESS_API_KEY;
    delete process.env.FEATHERLESS_MODEL;
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (original.featherless) process.env.FEATHERLESS_API_KEY = original.featherless;
    else delete process.env.FEATHERLESS_API_KEY;
    if (original.featherlessModel) process.env.FEATHERLESS_MODEL = original.featherlessModel;
    else delete process.env.FEATHERLESS_MODEL;
    if (original.openai) process.env.OPENAI_API_KEY = original.openai;
    else delete process.env.OPENAI_API_KEY;
  });

  it("returns null when neither key is set", () => {
    expect(pickProvider()).toBeNull();
    expect(getActiveInferenceModelLabel()).toBeNull();
  });

  it("prefers Featherless when its key is set", () => {
    process.env.FEATHERLESS_API_KEY = "fl_test";
    process.env.OPENAI_API_KEY = "sk_test";
    const provider = pickProvider();
    expect(provider?.kind).toBe("featherless");
    expect(provider?.model).toBe(DEFAULT_FEATHERLESS_MODEL);
    expect(provider?.modelLabel).toBe(`featherless:${DEFAULT_FEATHERLESS_MODEL}`);
    expect(getActiveInferenceModelLabel()).toBe(`featherless:${DEFAULT_FEATHERLESS_MODEL}`);
  });

  it("honors FEATHERLESS_MODEL override", () => {
    process.env.FEATHERLESS_API_KEY = "fl_test";
    process.env.FEATHERLESS_MODEL = "Qwen/Qwen2.5-VL-72B-Instruct";
    const provider = pickProvider();
    expect(provider?.model).toBe("Qwen/Qwen2.5-VL-72B-Instruct");
    expect(provider?.modelLabel).toBe("featherless:Qwen/Qwen2.5-VL-72B-Instruct");
  });

  it("falls back to OpenAI when only its key is set", () => {
    process.env.OPENAI_API_KEY = "sk_test";
    const provider = pickProvider();
    expect(provider?.kind).toBe("openai");
    expect(provider?.model).toBe(DEFAULT_OPENAI_MODEL);
    expect(provider?.modelLabel).toBe(`openai:${DEFAULT_OPENAI_MODEL}`);
  });

  it("points the Featherless client at the documented base URL", () => {
    expect(FEATHERLESS_BASE_URL).toBe("https://api.featherless.ai/v1");
  });
});
