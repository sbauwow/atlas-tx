import Link from "next/link";
import { getDefaultHydrologyDependencyService } from "@/lib/water/hydrology-dependencies";
import { buildNetworkCorrelationSummary } from "@/lib/water/network-analytics";

export const dynamic = "force-dynamic";

type MapPoint = { x: number; y: number };

function project(lat: number, lon: number, width: number, height: number): MapPoint {
  const x = ((lon + 106.8) / (13.9)) * width;
  const y = ((36.6 - lat) / (10.6)) * height;
  return { x, y };
}

export default async function WaterNetworkPage({
  searchParams,
}: {
  searchParams?: Promise<{ scope?: string | string[] }>;
} = {}) {
  const params = searchParams ? await searchParams : undefined;
  const requestedScope = Array.isArray(params?.scope) ? params.scope[0] : params?.scope;
  const scatterScope: "all" | "top10" = requestedScope === "top10" ? "top10" : "all";

  const graph = await getDefaultHydrologyDependencyService().buildGraph();
  const topDependency = [...graph.nodes]
    .sort((a, b) => b.downstreamDependencyScore - a.downstreamDependencyScore || b.contagionScore - a.contagionScore)
    .slice(0, 10);

  const correlation = buildNetworkCorrelationSummary(graph.nodes);
  const nodeBySlug = new Map(graph.nodes.map((n) => [n.countySlug, n]));
  const scatterNodes = (scatterScope === "top10" ? topDependency : graph.nodes).filter(
    (node) => node.upstreamContributionScore > 0 || node.downstreamDependencyScore > 0,
  );
  const maxUpstream = Math.max(1, ...scatterNodes.map((n) => n.upstreamContributionScore));
  const maxDownstream = Math.max(1, ...scatterNodes.map((n) => n.downstreamDependencyScore));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/water" className="rounded-full border border-white/15 px-3 py-1.5 text-slate-200 hover:bg-white/5">
            Back to water explorer
          </Link>
          <Link href="/api/water/sources/network/hydrology" className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-cyan-200">
            Hydrology dependency API
          </Link>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-white">County dependency flow map</h1>
        <p className="max-w-3xl text-slate-400">Flow method: {graph.flowDirectionMethod}</p>
      </header>

      <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <svg viewBox="0 0 1000 620" className="w-full rounded-xl bg-slate-950/40" role="img" aria-label="Texas county dependency flow map">
          {graph.edges.map((edge, idx) => {
            const from = nodeBySlug.get(edge.upstreamCountySlug);
            const to = nodeBySlug.get(edge.downstreamCountySlug);
            if (!from?.lat || !from?.lon || !to?.lat || !to?.lon) return null;
            const p1 = project(from.lat, from.lon, 1000, 620);
            const p2 = project(to.lat, to.lon, 1000, 620);
            return <line key={`${edge.upstreamCountySlug}-${edge.downstreamCountySlug}-${idx}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(34,211,238,0.5)" strokeWidth={1.6} />;
          })}

          {graph.nodes.map((node) => {
            if (!node.lat || !node.lon) return null;
            const p = project(node.lat, node.lon, 1000, 620);
            const radius = Math.max(3, Math.min(10, 3 + node.contagionScore));
            return (
              <g key={node.countySlug} data-county-slug={node.countySlug}>
                <circle cx={p.x} cy={p.y} r={radius} fill="rgba(56,189,248,0.8)" />
                <title>{`${node.countyName} | contagion ${node.contagionScore}`}</title>
              </g>
            );
          })}
        </svg>
      </section>

      <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">Dependency scatter</h2>
            <p className="mt-1 text-sm text-slate-400">x-axis: upstream contribution · y-axis: downstream dependency · bubble size: contagion score.</p>
          </div>
          <div className="inline-flex rounded-full bg-white/[0.04] p-1 ring-1 ring-white/10 text-xs">
            <Link href="/water/network?scope=all" className={`rounded-full px-3 py-1 ${scatterScope === "all" ? "bg-white/10 text-white" : "text-slate-400"}`}>
              All counties
            </Link>
            <Link href="/water/network?scope=top10" className={`rounded-full px-3 py-1 ${scatterScope === "top10" ? "bg-white/10 text-white" : "text-slate-400"}`}>
              Top 10 only
            </Link>
          </div>
        </div>

        <svg viewBox="0 0 960 420" className="mt-4 w-full rounded-xl bg-slate-950/50" role="img" aria-label="Dependency scatter plot">
          <line x1="70" y1="350" x2="920" y2="350" stroke="rgba(148,163,184,0.45)" strokeWidth={1.5} />
          <line x1="70" y1="40" x2="70" y2="350" stroke="rgba(148,163,184,0.45)" strokeWidth={1.5} />

          {scatterNodes.map((node) => {
            const x = 70 + (node.upstreamContributionScore / maxUpstream) * 850;
            const y = 350 - (node.downstreamDependencyScore / maxDownstream) * 310;
            const r = Math.max(4, Math.min(18, 4 + node.contagionScore * 1.6));
            return (
              <g key={`scatter-${node.countySlug}`} data-scatter-county={node.countySlug}>
                <circle cx={x} cy={y} r={r} fill="rgba(34,211,238,0.75)" />
                <title>{`${node.countyName} | up ${node.upstreamContributionScore} | down ${node.downstreamDependencyScore} | contagion ${node.contagionScore}`}</title>
              </g>
            );
          })}
        </svg>
      </section>

      <section className="grid gap-4 rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5 md:grid-cols-3">
        <CorrelationStat label="Upstream ↔ Downstream" value={correlation.upstreamVsDownstream} />
        <CorrelationStat label="Downstream ↔ Contagion" value={correlation.downstreamVsContagion} />
        <CorrelationStat label="Upstream ↔ Contagion" value={correlation.upstreamVsContagion} />
      </section>

      <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <h2 className="text-2xl font-semibold text-white">Top downstream dependency counties</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                <th className="py-2 pr-4">County</th>
                <th className="py-2 pr-4 text-right">Downstream dependency</th>
                <th className="py-2 pr-4 text-right">Upstream contribution</th>
                <th className="py-2 text-right">Contagion</th>
              </tr>
            </thead>
            <tbody>
              {topDependency.map((node) => (
                <tr key={node.countySlug} className="border-t border-white/5 text-slate-300">
                  <td className="py-2 pr-4">{node.countyName}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{node.downstreamDependencyScore}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{node.upstreamContributionScore}</td>
                  <td className="py-2 text-right tabular-nums">{node.contagionScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function CorrelationStat({ label, value }: { label: string; value: number }) {
  const color = value >= 0.5 ? "text-emerald-300" : value <= -0.5 ? "text-rose-300" : "text-amber-200";
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-semibold tabular-nums ${color}`}>{value.toFixed(2)}</div>
    </article>
  );
}
