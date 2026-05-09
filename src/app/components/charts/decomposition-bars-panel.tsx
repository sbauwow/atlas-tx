import { ChartEmptyState, ChartShell } from "./chart-shell";
import { formatCompactNumber, formatSignedNumber, joinClassNames, type FooterMeta } from "./chart-helpers";

export type DecompositionBar = {
  id: string;
  label: string;
  value: number | null;
  secondaryValue?: number | null;
  change?: number | null;
  note?: string;
  tone?: "accent" | "warning" | "neutral";
};

export type DecompositionBarsPanelProps = FooterMeta & {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  bars: DecompositionBar[];
  formatValue?: (value: number) => string;
  emptyMessage?: string;
};

const TONE_CLASSES: Record<NonNullable<DecompositionBar["tone"]>, string> = {
  accent: "bg-cyan-400/85",
  warning: "bg-fuchsia-400/85",
  neutral: "bg-slate-400/75",
};

export function DecompositionBarsPanel({
  title,
  subtitle,
  eyebrow,
  bars,
  formatValue = formatCompactNumber,
  emptyMessage = "No decomposition data available yet.",
  sourceLabel,
  freshnessLabel,
  caveat,
  footer,
}: DecompositionBarsPanelProps) {
  const validBars = bars.filter((bar): bar is DecompositionBar & { value: number } => typeof bar.value === "number" && Number.isFinite(bar.value));

  if (!validBars.length) {
    return (
      <ChartShell title={title} subtitle={subtitle} eyebrow={eyebrow} sourceLabel={sourceLabel} freshnessLabel={freshnessLabel} caveat={caveat} footer={footer}>
        <ChartEmptyState title="Breakdown unavailable" message={emptyMessage} />
      </ChartShell>
    );
  }

  const maxValue = Math.max(...validBars.map((bar) => Math.abs(bar.value)), 1);

  return (
    <ChartShell title={title} subtitle={subtitle} eyebrow={eyebrow} sourceLabel={sourceLabel} freshnessLabel={freshnessLabel} caveat={caveat} footer={footer}>
      <div className="space-y-4">
        {validBars.map((bar) => {
          const width = `${Math.max((Math.abs(bar.value) / maxValue) * 100, 6)}%`;
          const tone = TONE_CLASSES[bar.tone ?? "accent"];

          return (
            <div key={bar.id} className="space-y-2 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{bar.label}</div>
                  {bar.note ? <div className="mt-1 text-xs leading-5 text-slate-500">{bar.note}</div> : null}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-100">{formatValue(bar.value)}</div>
                  <div className="mt-1 flex items-center justify-end gap-2 text-xs text-slate-400">
                    {typeof bar.secondaryValue === "number" ? <span>Baseline {formatValue(bar.secondaryValue)}</span> : null}
                    {typeof bar.change === "number" ? <span className={joinClassNames("rounded-full px-2 py-0.5", bar.change > 0 ? "bg-fuchsia-400/10 text-fuchsia-200" : bar.change < 0 ? "bg-emerald-400/10 text-emerald-200" : "bg-white/5 text-slate-300")}>{formatSignedNumber(bar.change)}</span> : null}
                  </div>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-900/90">
                <div className={joinClassNames("h-full rounded-full shadow-[0_0_18px_rgba(56,189,248,0.25)]", tone)} style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
    </ChartShell>
  );
}
