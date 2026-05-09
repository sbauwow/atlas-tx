import Link from "next/link";
import { MVP_DATASETS } from "@/lib/mvp-datasets";
import { countySlug } from "@/lib/counties";
import { getDefaultAtlasCountyExplorerService } from "@/lib/atlas-county-explorer";

const categoryLabels = {
  environment: "Environment",
  infrastructure: "Infrastructure",
  social: "Social strain",
  fiscal: "Fiscal context",
  debt: "Debt",
} as const;

const TEXAS_BOUNDS = {
  minLat: 25.7,
  maxLat: 36.6,
  minLon: -106.7,
  maxLon: -93.4,
};

export const dynamic = "force-dynamic";

function formatNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: numeric >= 100 ? 0 : 2 }).format(numeric);
}

function formatMetricKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (value) => value.toUpperCase());
}

function projectCountyPoint(lat: number, lon: number) {
  const x = ((lon - TEXAS_BOUNDS.minLon) / (TEXAS_BOUNDS.maxLon - TEXAS_BOUNDS.minLon)) * 100;
  const y = (1 - (lat - TEXAS_BOUNDS.minLat) / (TEXAS_BOUNDS.maxLat - TEXAS_BOUNDS.minLat)) * 100;
  return { x, y };
}

function pointColor(score: number) {
  if (score >= 75) return "#22d3ee";
  if (score >= 50) return "#38bdf8";
  if (score >= 25) return "#0ea5e9";
  return "#334155";
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ county?: string | string[] }>;
}) {
  const service = getDefaultAtlasCountyExplorerService();
  const overview = await service.getCountyOverview();
  const params = searchParams ? await searchParams : undefined;
  const requestedCounty = Array.isArray(params?.county) ? params?.county[0] : params?.county;
  const selectedSlug = requestedCounty && overview.counties.some((county) => county.county.slug === countySlug(requestedCounty))
    ? countySlug(requestedCounty)
    : overview.counties.find((county) => county.county.slug === "travis-county")?.county.slug ?? overview.counties[0]?.county.slug;
  const breakdown = selectedSlug ? await service.getCountyBreakdown(selectedSlug) : null;
  const topCounties = overview.counties.slice(0, 12);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-6 py-12">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.9fr]">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
            Atlas Texas · county explorer
          </div>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white">
              Map Texas county signals across environment, infrastructure, social strain, and fiscal context.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-300">
              The first explorer pass merges statewide county rollups from five public datasets, then drills into one county at a time with source-level breakdowns.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/api/counties/overview" className="rounded-full bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300">
              County overview API
            </Link>
            <Link href={`/api/counties/${selectedSlug ?? "travis-county"}`} className="rounded-full border border-slate-700 px-5 py-3 font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900">
              Selected county API
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/30">
          <h2 className="text-lg font-semibold text-white">Current explorer coverage</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-3xl font-semibold text-white">{overview.countyCount}</div>
              <div className="mt-1 text-sm text-slate-400">Texas counties mapped</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-3xl font-semibold text-white">{overview.sourceIds.length}</div>
              <div className="mt-1 text-sm text-slate-400">Statewide data lenses live</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:col-span-2">
              <div className="text-sm text-slate-400">Top composite counties right now</div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-200">
                {topCounties.map((county) => (
                  <a key={county.county.slug} href={`/?county=${county.county.slug}`} className="rounded-full border border-slate-700 px-3 py-1 hover:border-cyan-400 hover:text-cyan-200">
                    {county.county.name.replace(" County", "")}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Texas county dot map</h2>
              <p className="mt-2 text-sm text-slate-400">
                First pass = centroid dots colored by composite percentile score. Click any county to switch the breakdown.
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>Cyan = higher composite rank</div>
              <div>Slate = lower composite rank</div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
            <svg viewBox="0 0 100 100" className="h-[38rem] w-full">
              <rect x="0" y="0" width="100" height="100" rx="3" fill="#020617" />
              {overview.counties
                .filter((county) => county.centroid)
                .map((county) => {
                  const point = projectCountyPoint(county.centroid!.lat, county.centroid!.lon);
                  const selected = county.county.slug === breakdown?.overview.county.slug;
                  return (
                    <a key={county.county.slug} href={`/?county=${county.county.slug}`}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={selected ? 1.3 : 0.9}
                        fill={selected ? "#f8fafc" : pointColor(county.compositeScore)}
                        stroke={selected ? "#22d3ee" : "none"}
                        strokeWidth={selected ? 0.35 : 0}
                      >
                        <title>{`${county.county.name}: composite ${formatNumber(county.compositeScore)}`}</title>
                      </circle>
                    </a>
                  );
                })}
            </svg>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-2xl font-semibold text-white">{breakdown?.overview.county.name ?? "County breakdown"}</h2>
          <p className="mt-2 text-sm text-slate-400">
            Source-level ranking plus detailed slice metrics for the selected county.
          </p>

          {breakdown ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-sm text-slate-400">Composite score</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{formatNumber(breakdown.overview.compositeScore)}</div>
                  <div className="mt-1 text-sm text-slate-500">State rank #{breakdown.overview.ranks.composite}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-sm text-slate-400">Detailed source slices</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{breakdown.profile.sliceCount}</div>
                  <div className="mt-1 text-sm text-slate-500">Successful county collectors</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Top county highlights</h3>
                <div className="mt-4 space-y-3">
                  {breakdown.highlights.map((highlight) => (
                    <div key={highlight.sourceId} className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 px-4 py-3">
                      <div>
                        <div className="font-medium text-white">{highlight.label}</div>
                        <div className="text-sm text-slate-400">State rank #{highlight.rank}</div>
                      </div>
                      <div className="text-right text-white">{formatNumber(highlight.value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {breakdown.profile.slices.map((slice) => (
                  <article key={slice.sourceId} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">{slice.category}</div>
                        <h3 className="mt-1 text-lg font-semibold text-white">{slice.name}</h3>
                      </div>
                      <div className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">rank #{breakdown.overview.ranks[slice.sourceId] ?? "—"}</div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {Object.entries(slice.metrics).map(([key, value]) => (
                        <div key={key} className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                          <div className="text-xs uppercase tracking-[0.12em] text-slate-500">{formatMetricKey(key)}</div>
                          <div className="mt-1 text-base font-medium text-white">{formatNumber(value as number | string | null | undefined)}</div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">County-by-county statewide ranking</h2>
            <p className="mt-2 text-sm text-slate-400">
              All counties currently ranked on the merged statewide view. Click any county to update the breakdown panel.
            </p>
          </div>
          <div className="text-sm text-slate-500">Sorted by composite score</div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="px-3 py-3 font-medium">Rank</th>
                <th className="px-3 py-3 font-medium">County</th>
                <th className="px-3 py-3 font-medium">Composite</th>
                <th className="px-3 py-3 font-medium">Permits</th>
                <th className="px-3 py-3 font-medium">Water districts</th>
                <th className="px-3 py-3 font-medium">CPI investigations</th>
                <th className="px-3 py-3 font-medium">County returns</th>
                <th className="px-3 py-3 font-medium">Sales tax rows</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {overview.counties.map((county) => {
                const isSelected = county.county.slug === breakdown?.overview.county.slug;
                return (
                  <tr key={county.county.slug} className={isSelected ? "bg-cyan-950/30" : "bg-transparent"}>
                    <td className="px-3 py-3 text-slate-300">#{county.ranks.composite}</td>
                    <td className="px-3 py-3 font-medium text-white">
                      <a href={`/?county=${county.county.slug}`} className="hover:text-cyan-200">
                        {county.county.name}
                      </a>
                    </td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.compositeScore)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.permits?.permitCount as number | undefined)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics["water-districts"]?.districtCount as number | undefined)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics["cpi-investigations"]?.totalCompletedInvestigations as number | undefined)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics["county-returns"]?.totalDue as number | undefined)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics["sales-tax-rates"]?.rowCount as number | undefined)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Locked MVP dataset shortlist</h2>
          <p className="text-sm text-slate-400">
            These are the first datasets Atlas Texas will normalize, compare, and cite.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {MVP_DATASETS.map((dataset) => (
            <article key={dataset.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">{categoryLabels[dataset.category]}</div>
                  <h3 className="mt-2 text-lg font-semibold text-white">{dataset.name}</h3>
                </div>
                <div className="rounded-full border border-slate-700 px-3 py-1 font-mono text-xs text-slate-300">{dataset.id}</div>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{dataset.summary}</p>
              <div className="mt-4 text-xs text-slate-400">Publisher: {dataset.publisher}</div>
              <div className="mt-4 text-sm text-slate-200">Use case: {dataset.useCase}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {dataset.keyFields.slice(0, 4).map((field) => (
                  <span key={field} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {field}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
