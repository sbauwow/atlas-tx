import Link from "next/link";

import { getDefaultHydrologyDependencyService } from "@/lib/water/hydrology-dependencies";
import { buildNetworkCorrelationSummary } from "@/lib/water/network-analytics";

export const dynamic = "force-dynamic";

type MapPoint = { x: number; y: number };

function project(lat: number, lon: number, width: number, height: number): MapPoint {
  const x = ((lon + 106.8) / 13.9) * width;
  const y = ((36.6 - lat) / 10.6) * height;
  return { x, y };
}

function networkHref(countySlug: string, scatterScope: "all" | "top10") {
  return `/water/network?county=${countySlug}&scope=${scatterScope}#network-workspace`;
}

export default async function WaterNetworkPage({
  searchParams,
}: {
  searchParams?: Promise<{ scope?: string | string[]; county?: string | string[] }>;
} = {}) {
  const params = searchParams ? await searchParams : undefined;
  const requestedScope = Array.isArray(params?.scope) ? params.scope[0] : params?.scope;
  const requestedCounty = Array.isArray(params?.county) ? params.county[0] : params?.county;
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
  const selectedCounty = (requestedCounty ? nodeBySlug.get(requestedCounty) : null) ?? topDependency[0] ?? graph.nodes[0] ?? null;
  const selectedHref = selectedCounty ? networkHref(selectedCounty.countySlug, scatterScope) : null;
  const upstreamNeighbors = selectedCounty
    ? graph.edges.filter((edge) => edge.downstreamCountySlug === selectedCounty.countySlug)
    : [];
  const downstreamNeighbors = selectedCounty
    ? graph.edges.filter((edge) => edge.upstreamCountySlug === selectedCounty.countySlug)
    : [];

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
          <Link href="/api/water/sources/network" className="rounded-full border border-white/15 px-3 py-1.5 text-slate-200 hover:bg-white/5">
            Shared source network API
          </Link>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-white">County dependency flow map</h1>
        <p className="max-w-3xl text-slate-400">Flow method: {graph.flowDirectionMethod}</p>
      </header>

      <section id="network-workspace" className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-300/80">Linked brushing</div>
                <h2 className="mt-2 text-2xl font-semibold text-white">Map and scatter stay on the same county</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  Click any county node or scatter point to brush the full dependency workspace, then jump into the county water page or the county source page.
                </p>
              </div>
              {selectedCounty ? <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Currently brushing {selectedCounty.countyName}</div> : null}
            </div>

            <svg viewBox="0 0 1000 620" className="mt-5 w-full rounded-xl bg-slate-950/40" role="img" aria-label="Texas county dependency flow map">
              {graph.edges.map((edge, idx) => {
                const from = nodeBySlug.get(edge.upstreamCountySlug);
                const to = nodeBySlug.get(edge.downstreamCountySlug);
                if (!from?.lat || !from?.lon || !to?.lat || !to?.lon) return null;
                const p1 = project(from.lat, from.lon, 1000, 620);
                const p2 = project(to.lat, to.lon, 1000, 620);
                const touchesSelected = selectedCounty && (edge.upstreamCountySlug === selectedCounty.countySlug || edge.downstreamCountySlug === selectedCounty.countySlug);
                return (
                  <line
                    key={`${edge.upstreamCountySlug}-${edge.downstreamCountySlug}-${idx}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={touchesSelected ? "rgba(248,250,252,0.8)" : "rgba(34,211,238,0.5)"}
                    strokeWidth={touchesSelected ? 2.4 : 1.6}
                  />
                );
              })}

              {graph.nodes.map((node) => {
                if (!node.lat || !node.lon) return null;
                const p = project(node.lat, node.lon, 1000, 620);
                const radius = Math.max(3, Math.min(10, 3 + node.contagionScore));
                const isSelected = node.countySlug === selectedCounty?.countySlug;
                return (
                  <a key={node.countySlug} href={networkHref(node.countySlug, scatterScope)} aria-label={`Brush ${node.countyName}`}>
                    <g data-county-slug={node.countySlug} data-selected-county={isSelected ? node.countySlug : undefined}>
                      <circle cx={p.x} cy={p.y} r={radius} fill={isSelected ? "rgba(244,114,182,0.95)" : "rgba(56,189,248,0.8)"} stroke={isSelected ? "rgba(248,250,252,0.95)" : "rgba(15,23,42,0.95)"} strokeWidth={isSelected ? 2.2 : 1.2} />
                      <title>{`${node.countyName} | contagion ${node.contagionScore} | downstream ${node.downstreamDependencyScore} | upstream ${node.upstreamContributionScore}`}</title>
                    </g>
                  </a>
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
                <Link href={selectedCounty ? `/water/network?county=${selectedCounty.countySlug}&scope=all#network-workspace` : "/water/network?scope=all#network-workspace"} className={`rounded-full px-3 py-1 ${scatterScope === "all" ? "bg-white/10 text-white" : "text-slate-400"}`}>
                  All counties
                </Link>
                <Link href={selectedCounty ? `/water/network?county=${selectedCounty.countySlug}&scope=top10#network-workspace` : "/water/network?scope=top10#network-workspace"} className={`rounded-full px-3 py-1 ${scatterScope === "top10" ? "bg-white/10 text-white" : "text-slate-400"}`}>
                  Top 10 only
                </Link>
              </div>
            </div>

            <svg viewBox="0 0 960 420" className="mt-4 w-full rounded-xl bg-slate-950/50" role="img" aria-label="Dependency scatter plot">
              <text x="80" y="370" className="fill-slate-400 text-[11px]">x-axis: upstream contribution</text>
              <text x="8" y="60" className="fill-slate-400 text-[11px]" transform="rotate(-90 8,60)">y-axis: downstream dependency</text>
              <line x1="70" y1="350" x2="920" y2="350" stroke="rgba(148,163,184,0.45)" strokeWidth={1.5} />
              <line x1="70" y1="40" x2="70" y2="350" stroke="rgba(148,163,184,0.45)" strokeWidth={1.5} />

              {scatterNodes.map((node) => {
                const x = 70 + (node.upstreamContributionScore / maxUpstream) * 850;
                const y = 350 - (node.downstreamDependencyScore / maxDownstream) * 310;
                const r = Math.max(4, Math.min(18, 4 + node.contagionScore * 1.6));
                const isSelected = node.countySlug === selectedCounty?.countySlug;
                return (
                  <a key={`scatter-${node.countySlug}`} href={networkHref(node.countySlug, scatterScope)} aria-label={`Brush ${node.countyName} in scatter`}>
                    <g data-scatter-county={node.countySlug} data-selected-scatter={isSelected ? node.countySlug : undefined}>
                      <circle cx={x} cy={y} r={r} fill={isSelected ? "rgba(244,114,182,0.9)" : "rgba(34,211,238,0.75)"} stroke={isSelected ? "rgba(248,250,252,0.95)" : "rgba(2,6,23,0.85)"} strokeWidth={isSelected ? 2.2 : 1.5} />
                      <title>{`${node.countyName} | up ${node.upstreamContributionScore} | down ${node.downstreamDependencyScore} | contagion ${node.contagionScore}`}</title>
                    </g>
                  </a>
                );
              })}
            </svg>
          </section>
        </div>

        <aside className="space-y-4 rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Selected county</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">{selectedCounty?.countyName ?? "Brush a county"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {selectedCounty
                ? `${selectedCounty.countyName} currently sits at downstream dependency ${selectedCounty.downstreamDependencyScore} and upstream contribution ${selectedCounty.upstreamContributionScore}.`
                : "Choose a county from the map or scatter to brush the full workspace."}
            </p>
          </div>

          {selectedCounty ? (
            <>
              <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-sm font-semibold text-white">Selected county neighborhood</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Upstream counties</div>
                    <ul className="mt-1 space-y-1 text-sm text-slate-300">
                      {upstreamNeighbors.length ? upstreamNeighbors.map((edge, idx) => (
                        <li key={`u-${edge.upstreamCountySlug}-${idx}`}>{nodeBySlug.get(edge.upstreamCountySlug)?.countyName ?? edge.upstreamCountySlug} · {edge.evidence}</li>
                      )) : <li className="text-slate-500">None</li>}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Downstream counties</div>
                    <ul className="mt-1 space-y-1 text-sm text-slate-300">
                      {downstreamNeighbors.length ? downstreamNeighbors.map((edge, idx) => (
                        <li key={`d-${edge.downstreamCountySlug}-${idx}`}>{nodeBySlug.get(edge.downstreamCountySlug)?.countyName ?? edge.downstreamCountySlug} · {edge.evidence}</li>
                      )) : <li className="text-slate-500">None</li>}
                    </ul>
                  </div>
                </div>
              </section>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <MetricCard label="Downstream dependency" value={selectedCounty.downstreamDependencyScore} />
                <MetricCard label="Upstream contribution" value={selectedCounty.upstreamContributionScore} />
                <MetricCard label="Contagion score" value={selectedCounty.contagionScore} />
              </div>

              <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Open next</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/water/counties/${selectedCounty.countySlug}`} className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 transition-colors hover:border-cyan-300/40 hover:bg-cyan-400/15">
                    Open county water page
                  </Link>
                  <Link href={`/water/sources/${selectedCounty.countySlug}`} className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1.5 text-xs text-fuchsia-100 transition-colors hover:border-fuchsia-300/40 hover:bg-fuchsia-400/15">
                    Open county source page
                  </Link>
                </div>
              </section>
            </>
          ) : null}

          <section className="grid gap-4 rounded-2xl bg-slate-950/50 p-4 ring-1 ring-white/5 md:grid-cols-3 xl:grid-cols-1">
            <CorrelationStat label="Upstream ↔ Downstream" value={correlation.upstreamVsDownstream} />
            <CorrelationStat label="Downstream ↔ Contagion" value={correlation.downstreamVsContagion} />
            <CorrelationStat label="Upstream ↔ Contagion" value={correlation.upstreamVsContagion} />
          </section>

          <section className="rounded-2xl bg-slate-950/50 p-4 ring-1 ring-white/5">
            <h2 className="text-xl font-semibold text-white">Top downstream dependency counties</h2>
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
                  {topDependency.map((node) => {
                    const isSelected = node.countySlug === selectedCounty?.countySlug;
                    return (
                      <tr key={node.countySlug} className={`border-t border-white/5 text-slate-300 ${isSelected ? "bg-white/[0.04]" : ""}`}>
                        <td className="py-2 pr-4">
                          <Link href={networkHref(node.countySlug, scatterScope)} className="transition-colors hover:text-cyan-200">
                            {node.countyName}
                          </Link>
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">{node.downstreamDependencyScore}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{node.upstreamContributionScore}</td>
                        <td className="py-2 text-right tabular-nums">{node.contagionScore}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {selectedHref ? <div className="mt-3 text-xs text-slate-500">Brush permalink: {selectedHref}</div> : null}
          </section>
        </aside>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums text-white">{value}</div>
    </article>
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
