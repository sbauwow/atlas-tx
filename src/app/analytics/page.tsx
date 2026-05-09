import Link from "next/link";

import { DecompositionBarsPanel, MoversTable, ScatterplotPanel } from "@/app/components/charts";

import { formatNumber, formatTimestamp, loadStatewideAnalyticsViewModel } from "./analytics-data";

function StatTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-300/80">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{detail}</div>
    </div>
  );
}

function LaneCard({ title, badge, href, primary, secondary }: { title: string; badge: string; href: string; primary: string; secondary: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 transition-colors hover:border-cyan-300/40 hover:bg-slate-950">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{title}</div>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100">{badge}</span>
      </div>
      <div className="mt-3 text-sm text-slate-200">{primary}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{secondary}</div>
    </Link>
  );
}

export default async function AnalyticsPage() {
  const analytics = await loadStatewideAnalyticsViewModel();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-16">
      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/counties" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
            County workspace
          </Link>
          <Link href="/water" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
            Water explorer
          </Link>
        </div>
        <div className="space-y-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-cyan-300/80">Wave 2 · Stream F</div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Texas statewide analytics terminal</h1>
          <p className="max-w-4xl text-base leading-7 text-slate-400">
            Screen county movers, compare pressure versus risk, and jump straight into county intelligence pages using only committed Wave 1 analytics artifacts.
            This surface does not invent trend history when caches are sparse.
          </p>
          <div className="text-sm text-slate-500">Latest statewide analytics refresh: {formatTimestamp(analytics.generatedAt)}</div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <StatTile label="Mover rows" value={String(analytics.moversCount)} detail={analytics.moversComparisonSummary} />
        <StatTile label="Scatter counties" value={String(analytics.scatterCount)} detail="Counties currently represented in the pressure versus risk cache." />
        <StatTile label="Fresh sources" value={String(analytics.freshSourceCount)} detail="Committed source snapshots marked fresh in source-freshness.json." />
        <StatTile label="Artifacts" value={analytics.generatedAt ? "Online" : "Partial"} detail="Page degrades to empty-state panels if any artifact is missing." />
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-fuchsia-300/80">Screening lanes</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Counties to open next</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              A ranked lane for quick triage: movement flags when available, otherwise the highest current-risk counties from county-movers.
            </p>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Source: county-movers.json</div>
        </div>
        {analytics.screeningLanes.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {analytics.screeningLanes.map((lane) => (
              <LaneCard key={`${lane.badge}-${lane.href}`} {...lane} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-sm leading-6 text-slate-400">
            Wave 1 did not produce enough mover rows for screening lanes yet. The table and scatter panels below will activate automatically when caches land.
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <MoversTable
          title="County movers"
          eyebrow="Ranked movers lane"
          subtitle="Current county risk rank, prior snapshot value, and delta from the committed comparison window. Every row links to the county intelligence page."
          rows={analytics.moversRows}
          currentColumnLabel="Risk now"
          previousColumnLabel="Risk prior"
          sourceLabel="Wave 1 county-movers artifact"
          freshnessLabel={formatTimestamp(analytics.moversGeneratedAt)}
          caveat={analytics.moversNotes[0] ?? "No mover methodology note was available in the cache."}
          footer={
            analytics.moversNotes.length > 1 ? (
              <ul className="space-y-1 text-[11px] leading-5 text-slate-500">
                {analytics.moversNotes.slice(1, 3).map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            ) : null
          }
        />

        <DecompositionBarsPanel
          title="Pressure outliers"
          eyebrow="Comparative lane"
          subtitle="Counties with the strongest current pressure scores in the statewide scatter artifact. Baseline values show the paired county risk score."
          bars={analytics.pressureBars}
          formatValue={(value) => formatNumber(value)}
          emptyMessage="Pressure outlier bars will appear when pressure-risk-scatter.json contains points."
          sourceLabel="Wave 1 pressure-risk scatter artifact"
          freshnessLabel={formatTimestamp(analytics.scatterGeneratedAt)}
          caveat={analytics.scatterNotes[0] ?? "Pressure bars depend on the latest scatter snapshot only."}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <ScatterplotPanel
          title="Pressure vs risk statewide scatter"
          eyebrow="Scatter analysis"
          subtitle="Each point is a Texas county from pressure-risk-scatter.json. Bubble size scales with violations and systems, and every point links into its county page."
          points={analytics.scatterPoints}
          xLabel="Pressure score"
          yLabel="County risk score"
          formatX={(value) => formatNumber(value)}
          formatY={(value) => formatNumber(value)}
          emptyMessage="The statewide scatter will appear once pressure-risk-scatter.json is committed."
          sourceLabel="Wave 1 pressure-risk-scatter artifact"
          freshnessLabel={formatTimestamp(analytics.scatterGeneratedAt)}
          caveat={analytics.scatterNotes[0] ?? "No scatter methodology note was available in the cache."}
          footer={
            analytics.scatterNotes.length > 1 ? (
              <ul className="space-y-1 text-[11px] leading-5 text-slate-500">
                {analytics.scatterNotes.slice(1, 3).map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            ) : null
          }
        />

        <DecompositionBarsPanel
          title="Quadrant monitor"
          eyebrow="Median split"
          subtitle="How the current scatter snapshot distributes counties across the statewide pressure and risk quadrants."
          bars={analytics.quadrantBars.map((item) => ({
            id: item.id,
            label: item.label,
            value: item.count,
            note: item.note,
            tone: item.tone,
          }))}
          formatValue={(value) => `${value} ${value === 1 ? "county" : "counties"}`}
          emptyMessage="Quadrant counts need at least one scatter point."
          sourceLabel="Wave 1 pressure-risk-scatter artifact"
          freshnessLabel={formatTimestamp(analytics.scatterGeneratedAt)}
          caveat="Quadrants are assigned by the scatter artifact itself; this page does not recompute median splits."
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/90 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-amber-300/80">Provenance + freshness</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Committed source inventory</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Freshness comes from public/cache/analytics/source-freshness.json so the statewide screen stays explicit about what was cached, when, and with which caveats.
            </p>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Generated {formatTimestamp(analytics.generatedAt)}</div>
        </div>

        {analytics.sourceSummary.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {analytics.sourceSummary.map((source) => (
              <article key={source.sourceId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{source.label}</h3>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{source.sourceId}</div>
                  </div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">{source.freshness}</span>
                </div>
                <dl className="mt-4 space-y-2 text-sm text-slate-300">
                  <div>
                    <dt className="text-slate-500">Artifact</dt>
                    <dd>{source.artifactPath}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Snapshot time</dt>
                    <dd>{formatTimestamp(source.generatedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Coverage</dt>
                    <dd>{source.rowCountLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Origin</dt>
                    <dd className="break-all text-slate-400">{source.source}</dd>
                  </div>
                </dl>
                {source.notes.length ? (
                  <ul className="mt-4 space-y-1 text-sm leading-6 text-slate-400">
                    {source.notes.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-sm leading-6 text-slate-400">
            No source-freshness artifact was available. Movers and scatter panels can still render if their dedicated artifacts exist, but provenance cards stay blank until source-freshness.json is committed.
          </div>
        )}
      </section>
    </main>
  );
}
