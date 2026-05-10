import "server-only";

import OpenAI from "openai";

import type {
  LlmReading,
  PerAnalyteLlmReading,
  QaFlag,
  ReferenceChart,
} from "./types";
import { OBSERVATION_SCHEMA_VERSION } from "./types";

/**
 * Server-side vision sanity-check. The client has already produced a candidate
 * reading by sampling pixels. This pass asks an OpenAI vision model to grade
 * the strip against its in-frame reference chart and emit per-analyte bands.
 * Disagreement with the client reading is the signal that the photo is
 * unreliable.
 *
 * Returns null when OPENAI_API_KEY is unset so dev / tests can run without
 * burning the budget. Callers must treat null as "no LLM signal" and mark the
 * observation `review` rather than auto-accepting.
 */

const MODEL = "gpt-4o-mini";
const MAX_COMPLETION_TOKENS = 1024;
const TOOL_NAME = "report_strip_reading";

export interface AnalyzeStripParams {
  readonly imageBase64: string;
  readonly mediaType: "image/jpeg" | "image/png" | "image/webp";
  readonly chart: ReferenceChart;
}

export async function analyzeStripImage(
  params: AnalyzeStripParams,
): Promise<LlmReading | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });

  const tool = buildAnalyzerTool(params.chart);
  const systemText = buildSystemPrompt(params.chart);

  const response = await client.chat.completions.create({
    model: MODEL,
    max_completion_tokens: MAX_COMPLETION_TOKENS,
    messages: [
      { role: "system", content: systemText },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this photo. The user has dipped a freshwater test strip and laid it next to its bottle's color reference chart in the same frame. Match each pad against the in-frame chart (NOT against absolute color memory) and call the analyzer tool with one band index per analyte.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${params.mediaType};base64,${params.imageBase64}`,
              detail: "low",
            },
          },
        ],
      },
    ],
    tools: [tool],
    tool_choice: { type: "function", function: { name: TOOL_NAME } },
  });

  const choice = response.choices[0];
  const toolCall = choice?.message?.tool_calls?.find(
    (c) => c.type === "function" && c.function.name === TOOL_NAME,
  );
  if (!toolCall || toolCall.type !== "function") return null;

  let input: unknown;
  try {
    input = JSON.parse(toolCall.function.arguments);
  } catch {
    return null;
  }

  const parsed = parseToolInput(input, params.chart);
  if (!parsed) return null;

  return {
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    chartId: params.chart.id,
    perAnalyte: parsed.perAnalyte,
    qaFlags: parsed.qaFlags,
    modelResponseId: response.id,
  };
}

function buildSystemPrompt(chart: ReferenceChart): string {
  const chartSpec = chart.analytes
    .map((a, i) => {
      const bands = a.bands
        .map((b, j) => `    ${j}: "${b.label}"${b.valueRange?.unit ? ` ${b.valueRange.unit}` : ""}`)
        .join("\n");
      return `Pad ${i} — ${a.name} (${a.id}):\n${bands}`;
    })
    .join("\n\n");

  return [
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
  ].join("\n");
}

function buildAnalyzerTool(chart: ReferenceChart) {
  return {
    type: "function" as const,
    function: {
      name: TOOL_NAME,
      description:
        "Report a per-analyte band index and confidence. Call this exactly once per image.",
      parameters: {
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
              enum: [
                "blur",
                "glare",
                "low-light",
                "saturation-clip",
                "no-chart-detected",
                "underfill",
              ],
            },
          },
        },
        required: ["perAnalyte", "qaFlags"],
        additionalProperties: false,
      },
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
  buildSystemPrompt,
  parseToolInput,
  MODEL,
};
