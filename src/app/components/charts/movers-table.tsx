import { ChartEmptyState, ChartShell } from "./chart-shell";
import { formatCompactNumber, formatSignedNumber, joinClassNames, type FooterMeta } from "./chart-helpers";

export type MoversTableRow = {
  id: string;
  label: string;
  href?: string;
  currentValue: number | null;
  previousValue?: number | null;
  delta?: number | null;
  rank?: number | null;
  movementLabel?: string;
  note?: string;
};

export type MoversTableProps = FooterMeta & {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  rows: MoversTableRow[];
  formatValue?: (value: number) => string;
  emptyMessage?: string;
  currentColumnLabel?: string;
  previousColumnLabel?: string;
};

export function MoversTable({
  title,
  subtitle,
  eyebrow,
  rows,
  formatValue = formatCompactNumber,
  emptyMessage = "No movers available yet.",
  currentColumnLabel = "Current",
  previousColumnLabel = "Previous",
  sourceLabel,
  freshnessLabel,
  caveat,
  footer,
}: MoversTableProps) {
  if (!rows.length) {
    return (
      <ChartShell title={title} subtitle={subtitle} eyebrow={eyebrow} sourceLabel={sourceLabel} freshnessLabel={freshnessLabel} caveat={caveat} footer={footer}>
        <ChartEmptyState title="Movers unavailable" message={emptyMessage} />
      </ChartShell>
    );
  }

  return (
    <ChartShell title={title} subtitle={subtitle} eyebrow={eyebrow} sourceLabel={sourceLabel} freshnessLabel={freshnessLabel} caveat={caveat} footer={footer}>
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
        <table className="min-w-full divide-y divide-white/5 text-left text-sm text-slate-300">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Rank</th>
              <th className="px-4 py-3 font-medium">{currentColumnLabel}</th>
              <th className="px-4 py-3 font-medium">{previousColumnLabel}</th>
              <th className="px-4 py-3 font-medium">Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => {
              const label = row.href ? <a href={row.href} className="text-white underline decoration-white/10 underline-offset-4 transition-colors hover:text-cyan-200">{row.label}</a> : row.label;
              const delta = typeof row.delta === "number"
                ? row.delta
                : typeof row.currentValue === "number" && typeof row.previousValue === "number"
                  ? row.currentValue - row.previousValue
                  : null;

              return (
                <tr key={row.id}>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-white">{label}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      {row.movementLabel ? <span>{row.movementLabel}</span> : null}
                      {row.note ? <span>{row.note}</span> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-slate-400">{row.rank ?? "—"}</td>
                  <td className="px-4 py-3 align-top text-slate-100">{typeof row.currentValue === "number" ? formatValue(row.currentValue) : "—"}</td>
                  <td className="px-4 py-3 align-top text-slate-400">{typeof row.previousValue === "number" ? formatValue(row.previousValue) : "—"}</td>
                  <td className="px-4 py-3 align-top">
                    <span className={joinClassNames("rounded-full px-2 py-1 text-xs", delta === null ? "bg-white/5 text-slate-400" : delta > 0 ? "bg-fuchsia-400/10 text-fuchsia-200" : delta < 0 ? "bg-emerald-400/10 text-emerald-200" : "bg-white/5 text-slate-300")}>
                      {delta === null ? "—" : formatSignedNumber(delta)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ChartShell>
  );
}
