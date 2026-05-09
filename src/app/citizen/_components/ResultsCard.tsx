"use client";

import { GENERIC_9PAD_CHART } from "@/lib/observations/strips/reference-chart-9pad";
import type {
  ClientReading,
  LlmReading,
  ObservationStatus,
  PerAnalyteClientReading,
  PerAnalyteLlmReading,
  QaFlag,
} from "@/lib/observations/types";

export interface ObservationView {
  readonly id: string;
  readonly createdAt: string;
  readonly status: ObservationStatus;
  readonly agreement: number | null;
  readonly clientReading: ClientReading;
  readonly llmReading: LlmReading | null;
  readonly llmModel: string | null;
  readonly qaFlags: readonly QaFlag[];
  readonly stripBrand: string | null;
  readonly countySlug: string | null;
}

const STATUS_COPY: Record<ObservationStatus, { tone: string; label: string; explain: string }> = {
  pending: {
    tone: "border-slate-700 bg-slate-900/60 text-slate-200",
    label: "Pending",
    explain: "Server has not finished analyzing this submission.",
  },
  accepted: {
    tone: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
    label: "Accepted",
    explain: "Client and server vision agreed on most pads. Still non-regulatory.",
  },
  accepted_warn: {
    tone: "border-amber-400/40 bg-amber-400/10 text-amber-200",
    label: "Accepted with warnings",
    explain: "Partial agreement or minor capture issues. Treat the bands as approximate.",
  },
  review: {
    tone: "border-amber-400/50 bg-amber-400/15 text-amber-100",
    label: "Needs review",
    explain: "Client and server disagreed. Consider a fresh photo with better lighting.",
  },
  rejected: {
    tone: "border-rose-400/40 bg-rose-400/10 text-rose-200",
    label: "Rejected — recapture",
    explain: "Image failed quality checks (blur / low light / no chart visible).",
  },
};

export function ResultsCard({
  observation,
  onReset,
}: {
  observation: ObservationView;
  onReset?: () => void;
}) {
  const status = STATUS_COPY[observation.status];
  const llmByAnalyte = new Map<string, PerAnalyteLlmReading>(
    (observation.llmReading?.perAnalyte ?? []).map((p) => [p.analyteId, p]),
  );
  const chart = GENERIC_9PAD_CHART;

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-5 ${status.tone}`}>
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide opacity-70">Status</div>
            <div className="text-xl font-semibold">{status.label}</div>
          </div>
          {observation.agreement !== null && (
            <div className="text-right text-xs">
              <div className="opacity-70">Agreement</div>
              <div className="text-lg font-semibold">{Math.round(observation.agreement * 100)}%</div>
            </div>
          )}
        </div>
        <p className="mt-3 text-sm">{status.explain}</p>
        {observation.qaFlags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {observation.qaFlags.map((f) => (
              <span key={f} className="rounded-full border border-current px-2 py-0.5 text-xs">
                {f}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-base font-semibold text-white">Per-analyte bands</h3>
          <span className="text-xs text-slate-500">non-regulatory · bands only</span>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="pb-2 text-left">Analyte</th>
              <th className="pb-2 text-left">Pixel sample</th>
              <th className="pb-2 text-left">Vision check</th>
              <th className="pb-2 text-left">Match</th>
            </tr>
          </thead>
          <tbody>
            {chart.analytes.map((analyte) => {
              const c = observation.clientReading.perAnalyte.find(
                (p) => p.analyteId === analyte.id,
              );
              const l = llmByAnalyte.get(analyte.id);
              const match = c && l ? c.bandIndex === l.bandIndex : null;
              return (
                <tr key={analyte.id} className="border-t border-slate-800">
                  <td className="py-2 pr-3 text-slate-200">{analyte.name}</td>
                  <td className="py-2 pr-3 text-slate-300">
                    {c ? (
                      <BandCell
                        label={analyte.bands[c.bandIndex]?.label ?? "?"}
                        rgb={c.sampledRgb as [number, number, number]}
                      />
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-slate-300">
                    {l ? (
                      <span>
                        {analyte.bands[l.bandIndex]?.label ?? "?"}{" "}
                        <span className="text-xs text-slate-500">
                          ({Math.round(l.confidence * 100)}%)
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-600">no LLM</span>
                    )}
                  </td>
                  <td className="py-2 text-sm">{matchTone(match)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-xs text-slate-400 leading-relaxed">
        <p>
          <strong className="text-slate-200">Disclaimer.</strong> Atlas TX citizen submissions are
          a non-regulatory community-observation layer. Bands are approximate and depend on lighting,
          strip brand, incubation timing, and the user&apos;s in-frame reference chart. They are not a
          diagnosis, not a compliance reading, and not a substitute for a certified lab test. See
          {" "}
          <code className="rounded bg-slate-800 px-1 py-0.5 text-[10px]">
            docs/research/smartphone-colorimetry.md
          </code>
          {" "}for the project&apos;s positioning on this layer.
        </p>
      </div>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-slate-700 px-5 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
        >
          Submit another
        </button>
      )}
    </div>
  );
}

function BandCell({ label, rgb }: { label: string; rgb: [number, number, number] }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="size-4 rounded-sm border border-slate-700"
        style={{ backgroundColor: `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})` }}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}

function matchTone(match: boolean | null) {
  if (match === null) return <span className="text-slate-600">—</span>;
  return match ? (
    <span className="text-emerald-300">●&nbsp;agree</span>
  ) : (
    <span className="text-amber-300">●&nbsp;differ</span>
  );
}

// Avoid an unused-import warning when the consumer hasn't pulled the type.
export type { PerAnalyteClientReading };
