import Link from "next/link";

import GlossaryTooltip, { GlossaryInlineList } from "@/app/components/glossary-tooltip";
import { CountyWorkspaceHeader } from "@/app/components/county-workspace-header";
import { getDefaultAtlasCountyExplorerService } from "@/lib/atlas-county-explorer";
import { getAdjacentCountyRefs } from "@/lib/water/county-lookup";

export default async function CountyIntelligencePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getDefaultAtlasCountyExplorerService();
  const breakdown = await service.getCountyBreakdown(slug);
  const county = breakdown.overview.county;
  const adjacent = getAdjacentCountyRefs(county.slug);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-16">
      <CountyWorkspaceHeader
        countyName={county.name}
        countySlug={county.slug}
        permitsHref={`/permits?county=${county.slug}`}
        waterHref={`/water/counties/${county.slug}`}
        previousCounty={adjacent.previous ? { ...adjacent.previous, href: `/counties/${adjacent.previous.slug}` } : null}
        nextCounty={adjacent.next ? { ...adjacent.next, href: `/counties/${adjacent.next.slug}` } : null}
      />

      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/water" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
            Back to water explorer
          </Link>
          <Link href={`/permits?county=${county.slug}`} className="rounded-full bg-white px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-slate-200">
            Open permit view
          </Link>
        </div>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">{county.name} county intelligence</h1>
          <p className="mt-2 max-w-3xl text-slate-400">Cross-source county ranking context from the Atlas county explorer service. Use this as triage context, not a final determination.</p>
        </div>
      </section>

      <GlossaryInlineList label="Common county terms" terms={["TWDB", "HUC", "PWS"]} />

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-3">
        <StatTile value={String(breakdown.overview.compositeScore)} label="Composite score" />
        <StatTile value={String(breakdown.overview.ranks.composite ?? "-")} label="Composite rank" />
        <StatTile value={String(breakdown.highlights.length)} label="Highlight lanes" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Highlights</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {breakdown.highlights.map((item) => (
              <div key={item.sourceId} className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div className="font-medium text-white">{item.label}</div>
                <div className="mt-1 text-slate-400">Rank {item.rank} · Value {item.value}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Hydrology context</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p className="text-slate-400">Built from <GlossaryTooltip term="TWDB" expand /> hydrology layers and <GlossaryTooltip term="HUC" expand /> geography.</p>
            {breakdown.hydrologyContext.matches.map((item) => (
              <div key={`${item.layerId}-${item.primaryCode ?? item.name ?? 'match'}`} className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div className="font-medium text-white">{item.name ?? item.layerName}</div>
                <div className="mt-1 text-slate-400">{item.layerName}</div>
              </div>
            ))}
            <div className="text-slate-500">{breakdown.hydrologyContext.caveat}</div>
          </div>
        </article>
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
