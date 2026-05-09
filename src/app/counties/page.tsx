import Link from "next/link";

import { getDefaultAtlasCountyExplorerService } from "@/lib/atlas-county-explorer";

export default async function CountiesOverviewPage() {
  const service = getDefaultAtlasCountyExplorerService();
  const overview = await service.getCountyOverview();
  const topCounties = overview.counties.slice(0, 25);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16">
      <section className="space-y-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          County workspace overview
        </span>
        <div className="space-y-3">
          <h1 className="text-5xl font-semibold tracking-tight text-white">County workspace overview</h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-400">Statewide ranked entry into county intelligence, permit workflow, and water workflow.</p>
          <div className="text-sm uppercase tracking-[0.18em] text-cyan-300">{overview.countyCount} ranked counties</div>
        </div>
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-3">
        <StatTile value={String(overview.countyCount)} label="Ranked counties" />
        <StatTile value={String(overview.sourceIds.length)} label="Source lanes" />
        <StatTile value={new Date(overview.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} label="Generated" />
      </section>

      <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Top counties</h2>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Composite score</div>
        </div>
        <div className="mt-5 space-y-3">
          {topCounties.map((county) => (
            <div key={county.county.slug} className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-medium text-white">{county.county.name}</div>
                  <div className="mt-1 text-sm text-slate-400">Rank #{county.ranks.composite ?? "-"} · Composite score {county.compositeScore}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Link href={`/counties/${county.county.slug}`} className="rounded-full bg-white px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-slate-200">
                    County intelligence
                  </Link>
                  <Link href={`/permits?county=${county.county.slug}`} className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
                    Permits
                  </Link>
                  <Link href={`/water/counties/${county.county.slug}`} className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
                    Water
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
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
