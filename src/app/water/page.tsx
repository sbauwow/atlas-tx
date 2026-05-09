import Link from "next/link";
import { countySlug } from "@/lib/counties";
import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";
import { getDefaultAtlasWaterSummaryService } from "@/lib/water/water-summary-service";

export const dynamic = "force-dynamic";

const MAP_WIDTH = 900;
const MAP_HEIGHT = 520;
const LAT_MIN = 25;
const LAT_MAX = 37;
const LON_MIN = -107;
const LON_MAX = -93;

function formatNumber(value: number | undefined) {
  if (value === undefined) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function projectPoint(latitude: number, longitude: number) {
  const x = ((longitude - LON_MIN) / (LON_MAX - LON_MIN)) * MAP_WIDTH;
  const y = MAP_HEIGHT - ((latitude - LAT_MIN) / (LAT_MAX - LAT_MIN)) * MAP_HEIGHT;
  return {
    x: clamp(x, 18, MAP_WIDTH - 18),
    y: clamp(y, 18, MAP_HEIGHT - 18),
  };
}

function countyRiskScore(county: {
  metrics: {
    floodplainFeatureCount?: number;
    activeWaterAlertCount?: number;
    sewerOverflowCount30d?: number;
    streamGaugeCount?: number;
  };
}) {
  return (
    (county.metrics.floodplainFeatureCount ?? 0) * 3 +
    (county.metrics.activeWaterAlertCount ?? 0) * 4 +
    (county.metrics.sewerOverflowCount30d ?? 0) * 2 +
    (county.metrics.streamGaugeCount ?? 0)
  );
}

function countyFill(score: number, isSelected: boolean) {
  if (isSelected) return "#22d3ee";
  if (score >= 8) return "#f97316";
  if (score >= 4) return "#eab308";
  if (score >= 1) return "#38bdf8";
  return "#475569";
}

function formatFreshnessLabel(expiresAt: string | null) {
  return expiresAt ? `Cached until ${expiresAt}` : "Cache pending";
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

  const countyMapPoints = overview.counties
    .map((county) => {
      const centroid = TEXAS_COUNTY_CENTROIDS[county.county.slug];
      if (!centroid) return null;
      const point = projectPoint(centroid.lat, centroid.lon);
      return {
        ...county,
        point,
        riskScore: countyRiskScore(county),
      };
    })
    .filter((county): county is NonNullable<typeof county> => Boolean(county));

  const gaugeMapPoints = (breakdown?.layers.gauges ?? [])
    .filter((gauge) => Number.isFinite(gauge.latitude) && Number.isFinite(gauge.longitude))
    .map((gauge) => ({
      ...gauge,
      point: projectPoint(gauge.latitude, gauge.longitude),
    }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-12">
      <section className="space-y-4">
        <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
          Texas water explorer
        </div>
        <h1 className="text-5xl font-semibold tracking-tight text-white">Water stress, flood operations, and county hydrology.</h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-300">
          First-pass water lane for Atlas Texas: active flood alerts, stream gauge coverage, sewer overflow pressure, permit counts, governance structure, and FEMA NFHL coverage by county.
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/api/water/overview" className="rounded-full bg-cyan-400 px-5 py-3 font-medium text-slate-950">Overview API</Link>
          <Link href="/api/water/alerts" className="rounded-full border border-slate-700 px-5 py-3 font-medium text-slate-100">Alerts API</Link>
          <Link href="/api/water/gauges" className="rounded-full border border-slate-700 px-5 py-3 font-medium text-slate-100">Gauges API</Link>
          <Link href="/api/water/fema/nfhl/counties" className="rounded-full border border-slate-700 px-5 py-3 font-medium text-slate-100">FEMA counties API</Link>
          <Link href="/api/water/lcra/hydromet/stage-flow" className="rounded-full border border-slate-700 px-5 py-3 font-medium text-slate-100">LCRA Hydromet stage-flow API</Link>
          <Link href="/api/water/lcra/arrp/outfalls" className="rounded-full border border-slate-700 px-5 py-3 font-medium text-slate-100">LCRA ARRP outfalls API</Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Source freshness</h2>
            <p className="mt-2 text-sm text-slate-400">Current cache windows for live water feeds used by this view.</p>
          </div>
          <Link href="/api/water/fema/nfhl/levees-by-county" className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100">Levees by county API</Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(overview.freshness.sources).map(([sourceId, freshness]) => (
            <div key={sourceId} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
              <div className="font-medium text-white">{sourceId}</div>
              <div className="mt-2 text-slate-400">{formatFreshnessLabel(freshness.expiresAt)}</div>
              <div className="mt-1 text-xs text-slate-500">TTL {formatNumber(freshness.ttlMs ? Math.round(freshness.ttlMs / 60000) : undefined)} min</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">County risk map</h2>
              <p className="mt-2 text-sm text-slate-400">
                County centroid map using NFHL footprint intensity, active alerts, sewer overflow pressure, and gauge coverage.
              </p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>NFHL footprint</div>
              <div>Selected county gauges</div>
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
            <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="h-[420px] w-full" role="img" aria-label="Texas county water risk map">
              <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="#020617" />
              {countyMapPoints.map((county) => (
                <circle
                  key={county.county.slug}
                  cx={county.point.x}
                  cy={county.point.y}
                  r={county.county.slug === selectedSlug ? 12 : 8}
                  fill={countyFill(county.riskScore, county.county.slug === selectedSlug)}
                  stroke={county.metrics.floodplainFeatureCount ? "#f8fafc" : "#0f172a"}
                  strokeWidth={county.metrics.floodplainFeatureCount ? 2 : 1}
                  data-county-slug={county.county.slug}
                >
                  <title>{`${county.county.name}: NFHL ${county.metrics.floodplainFeatureCount ?? 0}, alerts ${county.metrics.activeWaterAlertCount ?? 0}, gauges ${county.metrics.streamGaugeCount ?? 0}`}</title>
                </circle>
              ))}
              {gaugeMapPoints.map((gauge) => (
                <g key={gauge.siteNumber} data-gauge-site={gauge.siteNumber}>
                  <circle cx={gauge.point.x} cy={gauge.point.y} r={5} fill="#f8fafc" stroke="#0f172a" strokeWidth={2} />
                  <circle cx={gauge.point.x} cy={gauge.point.y} r={12} fill="none" stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="4 4" />
                  <title>{gauge.stationName}</title>
                </g>
              ))}
            </svg>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-slate-400">Counties with NFHL footprint</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {formatNumber(overview.counties.filter((county) => (county.metrics.floodplainFeatureCount ?? 0) > 0).length)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-slate-400">Selected county gauges</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatNumber(gaugeMapPoints.length)}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-slate-400">Selected NFHL footprint</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatNumber(breakdown?.county.metrics.floodplainFeatureCount)}</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-2xl font-semibold text-white">{breakdown?.county.county.name ?? "County detail"}</h2>
          <p className="mt-2 text-sm text-slate-400">Selected county detail for the current water slice.</p>
          {breakdown ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-sm text-slate-400">NFHL footprint</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{formatNumber(breakdown.county.metrics.floodplainFeatureCount)}</div>
                </div>
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
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-sm text-slate-400">LCRA ARRP outfalls</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{formatNumber(breakdown.county.metrics.lcraArrpOutfallCount)}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-sm text-slate-400">LCRA ARRP land permits</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{formatNumber(breakdown.county.metrics.lcraArrpLandPermitCount)}</div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                Governance entities: {breakdown.layers.governance.length} · Alerts: {breakdown.layers.alerts.length} · Gauges: {breakdown.layers.gauges.length} · Sewer overflows: {breakdown.layers.sewerOverflows.length} · Permits: {breakdown.layers.permits.length} · LCRA outfalls: {breakdown.layers.lcraArrpOutfalls.length} · LCRA land permits: {breakdown.layers.lcraArrpLandPermits.length}
              </div>
              {breakdown.notes.length ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                  {breakdown.notes.join(" · ")}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-2xl font-semibold text-white">County water table</h2>
          <p className="mt-2 text-sm text-slate-400">Select a county to inspect alerts, gauges, sewer overflow activity, permit counts, governance density, and NFHL floodplain coverage.</p>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="px-3 py-3 font-medium">County</th>
                  <th className="px-3 py-3 font-medium">NFHL footprint</th>
                  <th className="px-3 py-3 font-medium">Alerts</th>
                  <th className="px-3 py-3 font-medium">Gauges</th>
                  <th className="px-3 py-3 font-medium">Sewer overflows</th>
                  <th className="px-3 py-3 font-medium">General permits</th>
                  <th className="px-3 py-3 font-medium">Water districts</th>
                  <th className="px-3 py-3 font-medium">Water utilities</th>
                  <th className="px-3 py-3 font-medium">LCRA outfalls</th>
                  <th className="px-3 py-3 font-medium">LCRA land permits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {overview.counties.map((county) => (
                  <tr key={county.county.slug}>
                    <td className="px-3 py-3 font-medium text-white">
                      <Link href={`/water?county=${county.county.slug}`} className="hover:text-cyan-200">{county.county.name}</Link>
                    </td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.floodplainFeatureCount)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.activeWaterAlertCount)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.streamGaugeCount)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.sewerOverflowCount30d)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.generalPermitCount)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.waterDistrictCount)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.waterUtilityCount)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.lcraArrpOutfallCount)}</td>
                    <td className="px-3 py-3 text-slate-300">{formatNumber(county.metrics.lcraArrpLandPermitCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
