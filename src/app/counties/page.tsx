import Link from "next/link";

import { MicroBar } from "@/app/components/data-viz";
import { getDefaultAtlasCountyExplorerService } from "@/lib/atlas-county-explorer";

type MicroMetricSpec = {
  key: string;
  label: string;
  read: (metrics: Record<string, Record<string, number | string | null>>) => number;
};

const MICRO_METRICS: MicroMetricSpec[] = [
  { key: "permits", label: "Permits", read: (m) => Number(m.permits?.permitCount ?? 0) },
  { key: "water-districts", label: "Water districts", read: (m) => Number(m["water-districts"]?.districtCount ?? 0) },
  { key: "cpi", label: "CPI investigations", read: (m) => Number(m["cpi-investigations"]?.totalCompletedInvestigations ?? 0) },
  { key: "returns", label: "County returns ($)", read: (m) => Number(m["county-returns"]?.totalDue ?? 0) },
];

function computeMedian(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export default async function CountiesOverviewPage() {
  const service = getDefaultAtlasCountyExplorerService();
  const overview = await service.getCountyOverview();
  const topCounties = overview.counties.slice(0, 25);

  const metricStats = MICRO_METRICS.map((spec) => {
    const values = overview.counties.map((c) => spec.read(c.metrics));
    return { spec, max: Math.max(...values, 1), median: computeMedian(values.filter((v) => v > 0)) };
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16">
      <section className="space-y-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          County index
        </span>
        <div className="space-y-3">
          <h1 className="text-5xl font-semibold tracking-tight text-white">Texas counties, ranked.</h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-400">Every county Atlas covers, sorted by composite signal across the lanes already ingested. Click in for permits and water.</p>
          <div className="text-sm uppercase tracking-[0.18em] text-cyan-300">{overview.countyCount} counties</div>
        </div>
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-3">
        <StatTile value={String(overview.countyCount)} label="Ranked counties" />
        <StatTile value={String(overview.sourceIds.length)} label="Source lanes" />
        <StatTile value={new Date(overview.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} label="Generated" />
      </section>

      <section id="top-counties" className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">Top counties</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">Composite score across the active source lanes. Each row shows the county vs the state median (dashed tick) on four signals.</p>
          </div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Composite score · ┊ state median</div>
        </div>
        {topCounties.length ? (
          <div className="mt-5 space-y-3">
            {topCounties.map((county, index) => {
              const rank = county.ranks.composite ?? index + 1;
              const isPodium = index < 3;
              return (
                <article
                  key={county.county.slug}
                  className={`group rounded-xl border px-4 py-4 transition-colors ${
                    isPodium
                      ? "border-cyan-400/20 bg-cyan-400/[0.04] hover:border-cyan-300/40 hover:bg-cyan-400/[0.07]"
                      : "border-white/5 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={`/counties/${county.county.slug}`}
                      className="flex min-w-0 flex-1 items-center gap-4"
                    >
                      <div
                        className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${
                          isPodium
                            ? "bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-300/30"
                            : "bg-white/5 text-slate-300 ring-1 ring-white/10"
                        }`}
                        aria-label={`Rank ${rank}`}
                      >
                        #{rank}
                      </div>
                      <div className="min-w-0">
                        <div className="text-lg font-medium text-white transition-colors group-hover:text-cyan-200">
                          {county.county.name}
                          <span aria-hidden="true" className="ml-1.5 inline-block text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-300">→</span>
                        </div>
                        <div className="mt-0.5 text-xs uppercase tracking-[0.14em] text-slate-500">Composite {county.compositeScore}</div>
                      </div>
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Link
                        href={`/permits?county=${county.county.slug}`}
                        className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/10"
                      >
                        Permits
                      </Link>
                      <Link
                        href={`/water/counties/${county.county.slug}`}
                        className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/10"
                      >
                        Water
                      </Link>
                    </div>
                  </div>
                  <dl className="mt-3 grid gap-x-5 gap-y-1.5 text-[11px] text-slate-400 sm:grid-cols-4">
                    {metricStats.map(({ spec, max, median }) => {
                      const value = spec.read(county.metrics);
                      return (
                        <div key={spec.key} className="flex items-center gap-2">
                          <span className="w-32 shrink-0 truncate uppercase tracking-[0.1em] text-slate-500">{spec.label}</span>
                          <MicroBar
                            value={value}
                            median={median}
                            max={max}
                            severity={value >= median * 2 ? 3 : value >= median ? 2 : 1}
                            label={`${county.county.name} ${spec.label}: ${value}, state median ${median}`}
                          />
                          <span className="font-mono tabular-nums text-slate-300">{value.toLocaleString("en-US")}</span>
                        </div>
                      );
                    })}
                  </dl>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-sm text-slate-400">
            No ranked counties yet — composite ranking activates once the source-lane snapshots land.
          </div>
        )}
      </section>
    </main>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-slate-950/40 p-6">
      <div className="text-4xl font-semibold tabular-nums tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{label}</div>
    </div>
  );
}
