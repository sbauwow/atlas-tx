import Link from "next/link";
import { getDefaultAtlasWaterSummaryService } from "@/lib/water/water-summary-service";
import { countySlug } from "@/lib/counties";

export const dynamic = "force-dynamic";

function formatNumber(value: number | undefined) {
  if (value === undefined) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export default async function WaterPage({
  searchParams,
}: {
  searchParams?: Promise<{ county?: string | string[] }>;
}) {
  const service = getDefaultAtlasWaterSummaryService();
  const overview = await service.getWaterOverview();
  const params = searchParams ? await searchParams : undefined;
  const requestedCounty = Array.isArray(params?.county) ? params?.county[0] : params?.county;
  const selectedSlug = requestedCounty && overview.counties.some((county) => county.county.slug === countySlug(requestedCounty))
    ? countySlug(requestedCounty)
    : overview.counties[0]?.county.slug;
  const breakdown = selectedSlug ? await service.getCountyWaterBreakdown(selectedSlug) : null;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-12">
      <section className="space-y-4">
        <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
          Texas water explorer
        </div>
        <h1 className="text-5xl font-semibold tracking-tight text-white">Water stress, flood operations, and county hydrology.</h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-300">
          First-pass water lane for Atlas Texas: active flood alerts, stream gauge coverage, sewer overflow pressure, permit counts, and governance structure by county.
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/api/water/overview" className="rounded-full bg-cyan-400 px-5 py-3 font-medium text-slate-950">Overview API</Link>
          <Link href="/api/water/alerts" className="rounded-full border border-slate-700 px-5 py-3 font-medium text-slate-100">Alerts API</Link>
          <Link href="/api/water/gauges" className="rounded-full border border-slate-700 px-5 py-3 font-medium text-slate-100">Gauges API</Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-2xl font-semibold text-white">County water table</h2>
          <p className="mt-2 text-sm text-slate-400">Select a county to inspect alerts, gauges, sewer overflow activity, permit counts, and governance density.</p>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="px-3 py-3 font-medium">County</th>
                  <th className="px-3 py-3 font-medium">Alerts</th>
                  <th className="px-3 py-3 font-medium">Gauges</th>
                  <th className="px-3 py-3 font-medium">Sewer overflows</th>
                  <th className="px-3 py-3 font-medium">General permits</th>
                  <th className="px-3 py-3 font-medium">Water districts</th>
                  <th className="px-3 py-3 font-medium">Water utilities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {overview.counties.map((county) => (
                  <tr key={county.county.slug}>
                    <td className="px-3 py-3 font-medium text-white">
                      <Link href={`/water?county=${county.county.slug}`} className="hover:text-cyan-200">{county.county.name}</Link>
                    </td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.activeWaterAlertCount)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.streamGaugeCount)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.sewerOverflowCount30d)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.generalPermitCount)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.waterDistrictCount)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.waterUtilityCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-2xl font-semibold text-white">{breakdown?.county.county.name ?? "County detail"}</h2>
          <p className="mt-2 text-sm text-slate-400">Selected county detail for the current water slice.</p>
          {breakdown ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-sm text-slate-400">Active alerts</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{formatNumber(breakdown.county.metrics.activeWaterAlertCount)}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-sm text-slate-400">Stream gauges</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{formatNumber(breakdown.county.metrics.streamGaugeCount)}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-sm text-slate-400">Sewer overflows (30d)</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{formatNumber(breakdown.county.metrics.sewerOverflowCount30d)}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-sm text-slate-400">General permits</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{formatNumber(breakdown.county.metrics.generalPermitCount)}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-sm text-slate-400">Water districts</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{formatNumber(breakdown.county.metrics.waterDistrictCount)}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-sm text-slate-400">Water utilities</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{formatNumber(breakdown.county.metrics.waterUtilityCount)}</div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                Governance entities: {breakdown.layers.governance.length} · Alerts: {breakdown.layers.alerts.length} · Gauges: {breakdown.layers.gauges.length} · Sewer overflows: {breakdown.layers.sewerOverflows.length} · Permits: {breakdown.layers.permits.length}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
