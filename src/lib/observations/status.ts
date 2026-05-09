import type {
  ClientReading,
  LlmReading,
  ObservationStatus,
  QaFlag,
  ReferenceChart,
} from "./types";

/**
 * Deterministic status decision. See docs/research/smartphone-colorimetry.md §5.5
 * — every reading must end in accepted / accepted-with-warning / review / rejected.
 *
 * Order matters: any disqualifying QA flag wins regardless of agreement.
 */

const FATAL_QA_FLAGS: ReadonlySet<QaFlag> = new Set([
  "blur",
  "low-light",
  "no-chart-detected",
]);

const WARN_QA_FLAGS: ReadonlySet<QaFlag> = new Set([
  "glare",
  "saturation-clip",
  "underfill",
]);

export interface StatusDecision {
  readonly status: ObservationStatus;
  readonly agreement: number | null;
  readonly mergedQaFlags: readonly QaFlag[];
}

export function decideStatus(args: {
  readonly chart: ReferenceChart;
  readonly clientReading: ClientReading;
  readonly llmReading: LlmReading | null;
  readonly serverQaFlags: readonly QaFlag[];
}): StatusDecision {
  const { chart, clientReading, llmReading, serverQaFlags } = args;

  const merged = mergeFlags(serverQaFlags, llmReading?.qaFlags ?? []);
  if (merged.some((f) => FATAL_QA_FLAGS.has(f))) {
    return { status: "rejected", agreement: null, mergedQaFlags: merged };
  }

  if (!llmReading) {
    // No LLM signal (key missing or call failed). Defer to human review.
    return { status: "review", agreement: null, mergedQaFlags: merged };
  }

  const agreement = computeAgreement(clientReading, llmReading);
  const hasWarn = merged.some((f) => WARN_QA_FLAGS.has(f));

  if (agreement >= 0.7 && !hasWarn) {
    return { status: "accepted", agreement, mergedQaFlags: merged };
  }
  if (agreement >= 0.7 && hasWarn) {
    return { status: "accepted_warn", agreement, mergedQaFlags: merged };
  }
  if (agreement >= 0.4) {
    return { status: "accepted_warn", agreement, mergedQaFlags: merged };
  }
  return { status: "review", agreement, mergedQaFlags: merged };

  // Lint trick — keep the chart in scope so future logic that references
  // analyte ordering is type-safe at the call site.
  void chart;
}

export function computeAgreement(
  client: ClientReading,
  llm: LlmReading,
): number {
  const llmByAnalyte = new Map(llm.perAnalyte.map((p) => [p.analyteId, p.bandIndex]));
  if (client.perAnalyte.length === 0) return 0;
  let matches = 0;
  let scored = 0;
  for (const c of client.perAnalyte) {
    const llmBand = llmByAnalyte.get(c.analyteId);
    if (llmBand === undefined) continue;
    scored++;
    if (llmBand === c.bandIndex) matches++;
  }
  return scored === 0 ? 0 : matches / scored;
}

function mergeFlags(
  a: readonly QaFlag[],
  b: readonly QaFlag[],
): readonly QaFlag[] {
  return Array.from(new Set([...a, ...b]));
}
