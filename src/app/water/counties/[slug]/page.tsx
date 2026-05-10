import Link from "next/link";

import { CountyContextBlock } from "@/app/components/county-context-block";
import { CountyWorkspaceHeader } from "@/app/components/county-workspace-header";
import { loadCountyContext } from "@/lib/county-context";
import { getAdjacentCountyRefs } from "@/lib/water/county-lookup";
import { getDefaultAtlasWaterSummaryService } from "@/lib/water/water-summary-service";

function statValue(value: number | undefined) {
  return typeof value === "number" ? String(value) : "0";
}

export default async function WaterCountyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getDefaultAtlasWaterSummaryService();
  const [breakdown, context] = await Promise.all([
    service.getCountyWaterBreakdown(slug),
    loadCountyContext(slug),
  ]);
  const county = breakdown.county;
  const adjacent = getAdjacentCountyRefs(county.county.slug);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-16">
      <CountyWorkspaceHeader
        countyName={county.county.name}
        countySlug={county.county.slug}
        permitsHref={`/permits?county=${county.county.slug}`}
        waterHref={`/water/counties/${county.county.slug}`}
        previousCounty={adjacent.previous ? { ...adjacent.previous, href: `/water/counties/${adjacent.previous.slug}` } : null}
        nextCounty={adjacent.next ? { ...adjacent.next, href: `/water/counties/${adjacent.next.slug}` } : null}
      />

      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/water" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
            Back to water map
          </Link>
          <Link href={`/permits?county=${county.county.slug}`} className="rounded-full bg-white px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-slate-200">
            Open permit view
          </Link>
          <Link href={`/water/sources/${county.county.slug}`} className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 font-medium text-cyan-200 transition-colors hover:bg-cyan-500/15">
            Water source timeline
          </Link>
        </div>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">{county.county.name} water profile</h1>
          <p className="mt-2 max-w-3xl text-slate-400">County-level water context pulled from the Atlas Texas summary service. Use this as operating context, not a regulatory determination.</p>
        </div>
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-4">
        <StatTile value={statValue(county.metrics.activeWaterAlertCount)} label="Active alerts" />
        <StatTile value={statValue(county.metrics.streamGaugeCount)} label="Stream gauges" />
        <StatTile value={statValue(county.metrics.sewerOverflowCount30d)} label="Sewer overflows (30d)" />
        <StatTile value={statValue(county.metrics.generalPermitCount)} label="General permits" />
      </section>

      <CountyContextBlock
        context={context}
        countyName={county.county.name}
        alertsCount={county.metrics.activeWaterAlertCount ?? 0}
        gaugeCount={county.metrics.streamGaugeCount ?? 0}
        sewerOverflowCount={county.metrics.sewerOverflowCount30d ?? 0}
      />

      {county.mismatch ? (
        <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Mismatch signals</h2>
          <div className="mt-4 text-sm text-slate-300">Score: {county.mismatch.score}</div>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            {county.mismatch.flags.map((flag) => (
              <li key={flag}>• {flag}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Active alerts</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {breakdown.layers.alerts.length ? breakdown.layers.alerts.map((alert) => (
              <div key={alert.alertId} className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                {alert.event}
              </div>
            )) : <div className="text-slate-500">No active alerts.</div>}
          </div>
        </article>

        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Stream gauges</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {breakdown.layers.gauges.length ? breakdown.layers.gauges.map((gauge) => (
              <div key={gauge.siteNumber} className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                {gauge.stationName}
              </div>
            )) : <div className="text-slate-500">No gauges loaded.</div>}
          </div>
        </article>
      </section>

      <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <h2 className="text-2xl font-semibold text-white">Notes</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-400">
          {[...county.annotations, ...breakdown.notes].map((note) => (
            <li key={note}>• {note}</li>
          ))}
        </ul>
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
