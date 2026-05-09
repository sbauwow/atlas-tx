import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import type {
  LlmReading,
  PerAnalyteLlmReading,
  QaFlag,
  ReferenceChart,
} from "./types";
import { OBSERVATION_SCHEMA_VERSION } from "./types";

/**
 * Server-side vision sanity-check. The client has already produced a candidate
 * reading by sampling pixels. This pass asks Claude to grade the strip against
 * its in-frame reference chart and emit per-analyte bands. Disagreement with
 * the client reading is the signal that the photo is unreliable.
 *
 * Cost: ~$0.01–0.05 per image at claude-opus-4-7. Acceptable for prototype;
 * rate-limit before any public exposure (out of scope for v1, see plan §Risks).
 *
 * Returns null when ANTHROPIC_API_KEY is unset so dev / tests can run without
 * burning the budget. Callers must treat null as "no LLM signal" and mark the
 * observation `review` rather than auto-accepting.
 */

const MODEL = "claude-opus-4-7";
const MAX_TOKENS = 1024;

export interface AnalyzeStripParams {
  readonly imageBase64: string;
  readonly mediaType: "image/jpeg" | "image/png" | "image/webp";
  readonly chart: ReferenceChart;
}

export async function analyzeStripImage(
  params: AnalyzeStripParams,
): Promise<LlmReading | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });

  const tool = buildAnalyzerTool(params.chart);
  const systemBlocks = buildSystemBlocks(params.chart);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemBlocks,
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: params.mediaType,
              data: params.imageBase64,
            },
          },
          {
            type: "text",
            text: "Analyze this photo. The user has dipped a 9-pad freshwater test strip and laid it next to its bottle's color reference chart in the same frame. Match each pad against the in-frame chart (NOT against absolute color memory) and call the analyzer tool with one band index per analyte.",
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Extract<(typeof response.content)[number], { type: "tool_use" }> =>
      block.type === "tool_use" && block.name === tool.name,
  );
  if (!toolUse) return null;

  const parsed = parseToolInput(toolUse.input, params.chart);
  if (!parsed) return null;

  return {
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    chartId: params.chart.id,
    perAnalyte: parsed.perAnalyte,
    qaFlags: parsed.qaFlags,
    modelResponseId: response.id,
  };
}

function buildSystemBlocks(chart: ReferenceChart) {
  const chartSpec = chart.analytes
    .map((a, i) => {
      const bands = a.bands
        .map((b, j) => `    ${j}: "${b.label}"${b.valueRange?.unit ? ` ${b.valueRange.unit}` : ""}`)
        .join("\n");
      return `Pad ${i} — ${a.name} (${a.id}):\n${bands}`;
    })
    .join("\n\n");

  return [
    {
      type: "text" as const,
      text: [
        "You are a careful, conservative water-strip color reader. You compare each pad against the user's in-frame reference chart, not from memory.",
        "",
        "Output rules:",
        "- Always emit exactly one band index per analyte, even if uncertain — set a low confidence (≤0.3) when you can't tell.",
        "- If the chart isn't visible in the photo, still emit best-guess band indices and add the qa flag \"no-chart-detected\".",
        "- Add qa flags for any of: blur, glare, low-light, saturation-clip, no-chart-detected, underfill.",
        "- Do not invent analytes that aren't in the schema.",
        "- Treat outputs as non-regulatory bands, not numeric measurements.",
        "",
        "Reference chart spec (band indices the user expects):",
        "",
        chartSpec,
      ].join("\n"),
      cache_control: { type: "ephemeral" as const },
    },
  ];
}

function buildAnalyzerTool(chart: ReferenceChart) {
  return {
    name: "report_strip_reading",
    description:
      "Report a per-analyte band index and confidence. Call this exactly once per image.",
    input_schema: {
      type: "object" as const,
      properties: {
        perAnalyte: {
          type: "array",
          items: {
            type: "object",
            properties: {
              analyteId: {
                type: "string",
                enum: chart.analytes.map((a) => a.id),
              },
              bandIndex: { type: "integer", minimum: 0 },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              note: { type: "string" },
            },
            required: ["analyteId", "bandIndex", "confidence"],
            additionalProperties: false,
          },
        },
        qaFlags: {
          type: "array",
          items: {
            type: "string",
            enum: ["blur", "glare", "low-light", "saturation-clip", "no-chart-detected", "underfill"],
          },
        },
      },
      required: ["perAnalyte", "qaFlags"],
      additionalProperties: false,
    },
  };
}

interface ParsedToolInput {
  readonly perAnalyte: readonly PerAnalyteLlmReading[];
  readonly qaFlags: readonly QaFlag[];
}

function parseToolInput(input: unknown, chart: ReferenceChart): ParsedToolInput | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;

  const rawArr = obj.perAnalyte;
  const rawFlags = obj.qaFlags;
  if (!Array.isArray(rawArr) || !Array.isArray(rawFlags)) return null;

  const allowedAnalytes = new Set(chart.analytes.map((a) => a.id));
  const bandCount = new Map(chart.analytes.map((a) => [a.id, a.bands.length]));

  const perAnalyte: PerAnalyteLlmReading[] = [];
  for (const raw of rawArr) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const analyteId = typeof r.analyteId === "string" ? r.analyteId : null;
    const bandIndex = typeof r.bandIndex === "number" ? Math.floor(r.bandIndex) : null;
    const confidence = typeof r.confidence === "number" ? r.confidence : null;
    if (!analyteId || bandIndex === null || confidence === null) continue;
    if (!allowedAnalytes.has(analyteId)) continue;
    const max = bandCount.get(analyteId) ?? 0;
    if (bandIndex < 0 || bandIndex >= max) continue;
    perAnalyte.push({
      analyteId,
      bandIndex,
      confidence: clamp01(confidence),
      note: typeof r.note === "string" ? r.note : undefined,
    });
  }

  const validFlags: ReadonlySet<QaFlag> = new Set([
    "blur",
    "glare",
    "low-light",
    "saturation-clip",
    "no-chart-detected",
    "underfill",
  ]);
  const qaFlags = (rawFlags as unknown[]).filter(
    (f): f is QaFlag => typeof f === "string" && validFlags.has(f as QaFlag),
  );

  return { perAnalyte, qaFlags };
}

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export const __TEST_ONLY__ = {
  buildAnalyzerTool,
  buildSystemBlocks,
  parseToolInput,
  MODEL,
};
