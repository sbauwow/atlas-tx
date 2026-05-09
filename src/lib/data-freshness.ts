export type PipelineHealthOverallStatus = "ok" | "degraded" | "failed";
export type PipelineHealthStepStatus = "ok" | "failed" | "skipped";
export type FreshnessStatus = "fresh" | "warn" | "stale";
export type FreshnessReason =
  | "within-threshold"
  | "warn-threshold-exceeded"
  | "stale-threshold-exceeded"
  | "pipeline-failed"
  | "pipeline-skipped"
  | "missing-step"
  | "missing-updated-at"
  | "invalid-updated-at"
  | "invalid-now";

export type PipelineHealthStepRecord = {
  stepId: string;
  status: PipelineHealthStepStatus;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  outputPath: string | null;
  notes: string[];
};

export type PipelineHealthReportRecord = {
  generatedAt: string;
  overallStatus: PipelineHealthOverallStatus;
  steps: PipelineHealthStepRecord[];
};

export type FreshnessThresholds = {
  warnAfterMs: number;
  staleAfterMs: number;
};

export type AnalyticsFreshnessSourceDefinition = {
  sourceId: string;
  label: string;
  stepId: string;
  category?: string;
  owner?: string;
  provenance?: string;
  outputKind?: "snapshot" | "derived" | "cache" | "manual";
  thresholds: FreshnessThresholds;
};

export type FreshnessClassification = {
  status: FreshnessStatus;
  reason: FreshnessReason;
  ageMs: number | null;
  updatedAt: string | null;
  isStale: boolean;
};

export type AnalyticsFreshnessRecord = {
  sourceId: string;
  label: string;
  stepId: string;
  category: string | null;
  owner: string | null;
  provenance: string | null;
  outputKind: AnalyticsFreshnessSourceDefinition["outputKind"];
  pipelineStatus: PipelineHealthStepStatus | "missing";
  pipelineOverallStatus: PipelineHealthOverallStatus;
  pipelineGeneratedAt: string;
  updatedAt: string | null;
  ageMs: number | null;
  freshnessStatus: FreshnessStatus;
  freshnessReason: FreshnessReason;
  isStale: boolean;
  warnAfterMs: number;
  staleAfterMs: number;
  outputPath: string | null;
  durationMs: number | null;
  notes: string[];
};

export type AnalyticsFreshnessLane = {
  generatedAt: string;
  overallStatus: PipelineHealthOverallStatus;
  records: AnalyticsFreshnessRecord[];
  counts: Record<FreshnessStatus, number>;
  staleSourceIds: string[];
};

function parseTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function classifyFreshness(input: {
  now: string;
  updatedAt: string | null;
  thresholds: FreshnessThresholds;
  pipelineStatus?: PipelineHealthStepStatus | "missing";
}): FreshnessClassification {
  const { now, updatedAt, thresholds, pipelineStatus = "ok" } = input;

  const nowMs = parseTimestamp(now);
  if (nowMs === null) {
    return {
      status: "stale",
      reason: "invalid-now",
      ageMs: null,
      updatedAt,
      isStale: true,
    };
  }

  if (pipelineStatus === "missing") {
    return {
      status: "stale",
      reason: "missing-step",
      ageMs: null,
      updatedAt,
      isStale: true,
    };
  }

  if (pipelineStatus === "failed") {
    return {
      status: "stale",
      reason: "pipeline-failed",
      ageMs: null,
      updatedAt,
      isStale: true,
    };
  }

  const updatedAtMs = parseTimestamp(updatedAt);
  if (!updatedAt) {
    return {
      status: "stale",
      reason: "missing-updated-at",
      ageMs: null,
      updatedAt,
      isStale: true,
    };
  }

  if (updatedAtMs === null) {
    return {
      status: "stale",
      reason: "invalid-updated-at",
      ageMs: null,
      updatedAt,
      isStale: true,
    };
  }

  const ageMs = Math.max(0, nowMs - updatedAtMs);

  if (pipelineStatus === "skipped") {
    return {
      status: ageMs >= thresholds.staleAfterMs ? "stale" : "warn",
      reason: "pipeline-skipped",
      ageMs,
      updatedAt,
      isStale: ageMs >= thresholds.staleAfterMs,
    };
  }

  if (ageMs >= thresholds.staleAfterMs) {
    return {
      status: "stale",
      reason: "stale-threshold-exceeded",
      ageMs,
      updatedAt,
      isStale: true,
    };
  }

  if (ageMs >= thresholds.warnAfterMs) {
    return {
      status: "warn",
      reason: "warn-threshold-exceeded",
      ageMs,
      updatedAt,
      isStale: false,
    };
  }

  return {
    status: "fresh",
    reason: "within-threshold",
    ageMs,
    updatedAt,
    isStale: false,
  };
}

export function findPipelineHealthStep(report: PipelineHealthReportRecord, stepId: string) {
  return report.steps.find((step) => step.stepId === stepId) ?? null;
}

export function buildAnalyticsFreshnessRecord(
  report: PipelineHealthReportRecord,
  definition: AnalyticsFreshnessSourceDefinition,
  options?: { now?: string },
): AnalyticsFreshnessRecord {
  const step = findPipelineHealthStep(report, definition.stepId);
  const now = options?.now ?? report.generatedAt;
  const pipelineStatus = step?.status ?? "missing";
  const updatedAt = step && step.status !== "failed" ? step.endedAt : null;
  const classification = classifyFreshness({
    now,
    updatedAt,
    thresholds: definition.thresholds,
    pipelineStatus,
  });

  return {
    sourceId: definition.sourceId,
    label: definition.label,
    stepId: definition.stepId,
    category: definition.category ?? null,
    owner: definition.owner ?? null,
    provenance: definition.provenance ?? null,
    outputKind: definition.outputKind,
    pipelineStatus,
    pipelineOverallStatus: report.overallStatus,
    pipelineGeneratedAt: report.generatedAt,
    updatedAt: classification.updatedAt,
    ageMs: classification.ageMs,
    freshnessStatus: classification.status,
    freshnessReason: classification.reason,
    isStale: classification.isStale,
    warnAfterMs: definition.thresholds.warnAfterMs,
    staleAfterMs: definition.thresholds.staleAfterMs,
    outputPath: step?.outputPath ?? null,
    durationMs: step?.durationMs ?? null,
    notes: step?.notes ?? [],
  };
}

export function buildAnalyticsFreshnessLane(
  report: PipelineHealthReportRecord,
  definitions: AnalyticsFreshnessSourceDefinition[],
  options?: { now?: string },
): AnalyticsFreshnessLane {
  const records = definitions.map((definition) => buildAnalyticsFreshnessRecord(report, definition, options));

  return {
    generatedAt: report.generatedAt,
    overallStatus: report.overallStatus,
    records,
    counts: {
      fresh: records.filter((record) => record.freshnessStatus === "fresh").length,
      warn: records.filter((record) => record.freshnessStatus === "warn").length,
      stale: records.filter((record) => record.freshnessStatus === "stale").length,
    },
    staleSourceIds: records.filter((record) => record.isStale).map((record) => record.sourceId),
  };
}
