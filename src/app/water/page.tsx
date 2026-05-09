import Link from "next/link";
import { countySlug } from "@/lib/counties";
import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";
import { getDefaultAtlasWaterSummaryService } from "@/lib/water/water-summary-service";
import {
  ACCENT_HEX,
  freshnessFromCacheMeta,
  FRESHNESS_TEXT_CLASS,
  SEVERITY_HEX,
  SEVERITY_LABEL,
  SEVERITY_TEXT_CLASS,
  severityFromMismatch,
  severityFromRiskScore,
  type SeverityLevel,
} from "@/app/design/states";
import { FRESHNESS_GLYPH, SEVERITY_GLYPH } from "@/app/design/glyphs";

export const dynamic = "force-dynamic";

const MAP_WIDTH = 900;
const MAP_HEIGHT = 520;
const LAT_MIN = 25;
const LAT_MAX = 37;
const LON_MIN = -107;
const LON_MAX = -93;

const SEV_DOT_CLASS: Record<SeverityLevel, string> = {
  0: "bg-sev-0",
  1: "bg-sev-1",
  2: "bg-sev-2",
  3: "bg-sev-3",
  4: "bg-sev-4",
};

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

function countySeverity(
  score: number,
  mismatchScore: number | undefined,
  mode: "risk" | "mismatch",
): SeverityLevel {
  if (mode === "mismatch") return severityFromMismatch(mismatchScore);
  const riskLevel = severityFromRiskScore(score);
  const mismatchLevel = severityFromMismatch(mismatchScore);
  return (mismatchLevel > riskLevel ? mismatchLevel : riskLevel) as SeverityLevel;
}

function formatFreshnessLabel(expiresAt: string | null) {
  return expiresAt ? `Cached until ${expiresAt}` : "Cache pending";
}

export default async function WaterPage({
  searchParams,
}: {
  searchParams?: Promise<{ county?: string | string[]; mode?: string | string[] }>;
}) {
  const service = getDefaultAtlasWaterSummaryService();
  const overview = await service.getWaterOverview();
  const params = searchParams ? await searchParams : undefined;
  const requestedCounty = Array.isArray(params?.county) ? params?.county[0] : params?.county;
  const requestedMode = Array.isArray(params?.mode) ? params?.mode[0] : params?.mode;
  const mapMode: "risk" | "mismatch" = requestedMode === "mismatch" ? "mismatch" : "risk";
  const selectedSlug = requestedCounty && overview.counties.some((county) => county.county.slug === countySlug(requestedCounty))
    ? countySlug(requestedCounty)
    : overview.counties[0]?.county.slug;
  const breakdown = selectedSlug ? await service.getCountyWaterBreakdown(selectedSlug) : null;

  const countyMapPoints = overview.counties
    .map((county) => {
      const centroid = TEXAS_COUNTY_CENTROIDS[county.county.slug];
      if (!centroid) return null;
      const point = projectPoint(centroid.lat, centroid.lon);
      return { ...county, point, riskScore: countyRiskScore(county) };
    })
    .filter((county): county is NonNullable<typeof county> => Boolean(county));

  const gaugeMapPoints = (breakdown?.layers.gauges ?? [])
    .filter((gauge) => Number.isFinite(gauge.latitude) && Number.isFinite(gauge.longitude))
    .map((gauge) => ({ ...gauge, point: projectPoint(gauge.latitude, gauge.longitude) }));

  const topMismatchCounties = [...overview.counties]
    .filter((county) => (county.mismatch?.score ?? 0) > 0)
    .sort((left, right) => (right.mismatch?.score ?? 0) - (left.mismatch?.score ?? 0))
    .slice(0, 3);

  const countiesWithFloodplain = overview.counties.filter((county) => (county.metrics.floodplainFeatureCount ?? 0) > 0).length;
  const selectedMismatchLevel = severityFromMismatch(breakdown?.county.mismatch?.score);

  return (
    <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(34,211,238,0.08),transparent_70%)]"
      />

      <section className="space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          Texas water explorer
        </span>
        <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
          Water stress, flood operations, and county hydrology.
        </h1>
        <p className="max-w-3xl text-pretty text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          First-pass water lane for Atlas Texas: active flood alerts, stream gauge coverage, sewer overflow pressure, permit counts, governance structure, and FEMA NFHL coverage by county.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <ApiPill href="/api/water/overview" label="Overview API" />
          <ApiPill href="/api/water/alerts" label="Alerts API" />
          <ApiPill href="/api/water/gauges" label="Gauges API" />
          <RoutePill href="/permits" label="Pending permits" />
          <ApiPill href="/api/water/fema/nfhl/counties" label="FEMA counties API" />
          <ApiPill href="/api/water/lcra/hydromet/stage-flow" label="LCRA Hydromet stage-flow API" />
          <ApiPill href="/api/water/lcra/arrp/outfalls" label="LCRA ARRP outfalls API" />
          <ApiPill href="/api/water/gbra/hydrology/gvhs-lakes" label="GBRA GVHS lakes API" />
          <ApiPill href="/api/water/gbra/hydrology/watersheds" label="GBRA watersheds API" />
          <ApiPill href="/api/water/gbra/quality/sites" label="GBRA quality sites API" />
        </div>
      </section>

      <section className="rounded-2xl bg-white/[0.02] p-5 ring-1 ring-white/5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">Source freshness</h2>
            <p className="mt-1 text-sm text-slate-400">Current cache windows for live water feeds used by this view.</p>
          </div>
          <ApiPill href="/api/water/fema/nfhl/levees-by-county" label="Levees by county API" />
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(overview.freshness.sources).map(([sourceId, freshness]) => {
            const state = freshnessFromCacheMeta(freshness);
            return (
              <div key={sourceId} className="flex items-start justify-between gap-3 rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/5">
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs text-slate-200">{sourceId}</div>
                  <div className="mt-1 truncate text-xs text-slate-500">{formatFreshnessLabel(freshness.expiresAt)}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span aria-hidden="true" className={`text-sm leading-none ${FRESHNESS_TEXT_CLASS[state]}`} title={state}>
                    {FRESHNESS_GLYPH[state]}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500 tabular-nums">
                    TTL {formatNumber(freshness.ttlMs ? Math.round(freshness.ttlMs / 60000) : undefined)}m
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl bg-white/[0.02] p-5 ring-1 ring-white/5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">County risk map</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                {mapMode === "mismatch"
                  ? "Mismatch mode · Counties are colored by contradiction severity rather than operational load."
                  : "Operational risk mode · County centroid map using NFHL footprint intensity, active alerts, sewer overflow pressure, and gauge coverage."}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Map mode</span>
            <div className="inline-flex rounded-full bg-white/[0.04] p-1 ring-1 ring-white/5" role="group" aria-label="Map mode">
              <ModeToggle href={`/water?county=${selectedSlug ?? ""}&mode=risk`} active={mapMode === "risk"} label="Operational risk" />
              <ModeToggle href={`/water?county=${selectedSlug ?? ""}&mode=mismatch`} active={mapMode === "mismatch"} label="Mismatch severity" />
            </div>
            <span className="text-xs text-slate-500">Current mode: {mapMode === "mismatch" ? "mismatch severity" : "operational risk"}</span>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/5">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Top mismatch counties</div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {topMismatchCounties.length ? topMismatchCounties.map((county) => {
                  const lvl = severityFromMismatch(county.mismatch?.score);
                  return (
                    <Link
                      key={county.county.slug}
                      href={`/water?county=${county.county.slug}&mode=${mapMode}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 text-xs text-slate-200 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:ring-white/20"
                    >
                      <span aria-hidden="true" className={SEVERITY_TEXT_CLASS[lvl]}>{SEVERITY_GLYPH[lvl]}</span>
                      <span>{county.county.name}</span>
                      <span className="font-mono text-[11px] tabular-nums text-slate-400">{formatNumber(county.mismatch?.score)}</span>
                    </Link>
                  );
                }) : <span className="text-xs text-slate-500">No mismatch signals yet.</span>}
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/5">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{mapMode === "mismatch" ? "Mismatch mode" : "Mismatch legend"}</div>
              <ul className="mt-2.5 space-y-1.5 text-xs text-slate-300">
                {mapMode === "mismatch" ? (
                  <>
                    <LegendRow level={4} text="75+ severe contradiction" />
                    <LegendRow level={3} text="40–74 moderate contradiction" />
                    <LegendRow level={0} text="0 no mismatch signal" />
                  </>
                ) : (
                  <>
                    <LegendRow level={3} text="8+ high operational pressure" />
                    <LegendRow level={2} text="4–7 moderate" />
                    <LegendRow level={1} text="1–3 low" />
                    <LegendRow level={0} text="0 no signal" />
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="relative mt-5 overflow-hidden rounded-xl bg-slate-950 ring-1 ring-white/5">
            <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="h-[420px] w-full" role="img" aria-label="Texas county water risk map">
              <defs>
                <radialGradient id="mapVignette" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </radialGradient>
              </defs>
              <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#mapVignette)" />
              {countyMapPoints.map((county) => {
                const isSelected = county.county.slug === selectedSlug;
                const level = countySeverity(county.riskScore, county.mismatch?.score, mapMode);
                const fill = isSelected ? ACCENT_HEX : SEVERITY_HEX[level];
                return (
                  <g key={county.county.slug}>
                    {isSelected ? (
                      <circle
                        cx={county.point.x}
                        cy={county.point.y}
                        r={18}
                        fill="none"
                        stroke={ACCENT_HEX}
                        strokeOpacity={0.35}
                        strokeWidth={1.5}
                      />
                    ) : null}
                    <circle
                      cx={county.point.x}
                      cy={county.point.y}
                      r={isSelected ? 11 : level >= 3 ? 8 : 6}
                      fill={fill}
                      stroke={county.metrics.floodplainFeatureCount ? "#f8fafc" : "#0f172a"}
                      strokeWidth={county.metrics.floodplainFeatureCount ? 1.5 : 1}
                      data-county-slug={county.county.slug}
                      data-severity={level}
                      opacity={level === 0 && !isSelected ? 0.55 : 1}
                    >
                      <title>{`${county.county.name}: mismatch ${county.mismatch?.score ?? 0}, NFHL ${county.metrics.floodplainFeatureCount ?? 0}, alerts ${county.metrics.activeWaterAlertCount ?? 0}, gauges ${county.metrics.streamGaugeCount ?? 0}`}</title>
                    </circle>
                  </g>
                );
              })}
              {gaugeMapPoints.map((gauge) => (
                <g key={gauge.siteNumber} data-gauge-site={gauge.siteNumber}>
                  <circle cx={gauge.point.x} cy={gauge.point.y} r={4} fill="#f8fafc" stroke="#0f172a" strokeWidth={1.5} />
                  <circle cx={gauge.point.x} cy={gauge.point.y} r={11} fill="none" stroke={ACCENT_HEX} strokeWidth={1.25} strokeDasharray="3 3" opacity={0.7} />
                  <title>{`${gauge.stationName} — stream gauge`}</title>
                </g>
              ))}
            </svg>
          </div>

          <div className="mt-4 grid gap-px overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-3">
            <KpiTile label="Counties with NFHL footprint" value={formatNumber(countiesWithFloodplain)} />
            <KpiTile label="Selected county gauges" value={formatNumber(gaugeMapPoints.length)} />
            <KpiTile label="Selected NFHL footprint" value={formatNumber(breakdown?.county.metrics.floodplainFeatureCount)} />
          </div>
        </div>

        <aside className="rounded-2xl bg-white/[0.02] p-5 ring-1 ring-white/5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">{breakdown?.county.county.name ?? "County detail"}</h2>
              <p className="mt-1 text-xs text-slate-500">Selected county detail for the current water slice.</p>
            </div>
            {breakdown ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 text-xs ring-1 ring-white/10 ${selectedMismatchLevel >= 3 ? SEVERITY_TEXT_CLASS[selectedMismatchLevel] : "text-slate-300"}`}
                aria-label={`Mismatch ${SEVERITY_LABEL[selectedMismatchLevel]}`}
              >
                <span aria-hidden="true">{SEVERITY_GLYPH[selectedMismatchLevel]}</span>
                <span className="font-mono tabular-nums">Mismatch {formatNumber(breakdown.county.mismatch?.score)}</span>
              </span>
            ) : null}
          </div>
          {breakdown ? (
            <div className="mt-5 space-y-4">
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <DetailMetric label="NFHL footprint" value={formatNumber(breakdown.county.metrics.floodplainFeatureCount)} />
                <DetailMetric label="Active alerts" value={formatNumber(breakdown.county.metrics.activeWaterAlertCount)} />
                <DetailMetric label="Stream gauges" value={formatNumber(breakdown.county.metrics.streamGaugeCount)} />
                <DetailMetric label="Sewer overflows (30d)" value={formatNumber(breakdown.county.metrics.sewerOverflowCount30d)} />
                <DetailMetric label="General permits" value={formatNumber(breakdown.county.metrics.generalPermitCount)} />
                <DetailMetric label="Water districts" value={formatNumber(breakdown.county.metrics.waterDistrictCount)} />
                <DetailMetric label="Water utilities" value={formatNumber(breakdown.county.metrics.waterUtilityCount)} />
                <DetailMetric label="LCRA ARRP outfalls" value={formatNumber(breakdown.county.metrics.lcraArrpOutfallCount)} />
                <DetailMetric label="LCRA ARRP land permits" value={formatNumber(breakdown.county.metrics.lcraArrpLandPermitCount)} />
                <DetailMetric label="Active LCRA quality sites" value={formatNumber(breakdown.county.metrics.activeLcraQualitySiteCount)} />
                <DetailMetric label="Available LCRA parameters" value={formatNumber(breakdown.county.metrics.availableLcraParameterCount)} />
                <DetailMetric label="Impaired LCRA monitoring sites" value={formatNumber(breakdown.county.metrics.impairedLcraMonitoringSiteCount)} />
              </dl>

              <div className="rounded-xl bg-white/[0.02] px-4 py-3 text-xs leading-6 text-slate-400 ring-1 ring-white/5">
                <span className="font-mono uppercase tracking-[0.12em] text-slate-500">Latest LCRA observation</span>{" "}
                <span className="text-slate-200 break-all">{breakdown.county.metrics.latestLcraObservationAt ?? "—"}</span>
              </div>

              <div className="rounded-xl bg-white/[0.02] px-4 py-3 text-xs text-slate-400 ring-1 ring-white/5">
                Governance entities: <NumPill v={breakdown.layers.governance.length} />{" · "}
                Alerts: <NumPill v={breakdown.layers.alerts.length} />{" · "}
                Gauges: <NumPill v={breakdown.layers.gauges.length} />{" · "}
                Sewer overflows: <NumPill v={breakdown.layers.sewerOverflows.length} />{" · "}
                Permits: <NumPill v={breakdown.layers.permits.length} />{" · "}
                LCRA ARRP outfalls: <NumPill v={breakdown.layers.lcraArrpOutfalls.length} />{" · "}
                LCRA ARRP land permits: <NumPill v={breakdown.layers.lcraArrpLandPermits.length} />
              </div>

              {breakdown.notes.length ? (
                <div className="rounded-xl bg-white/[0.02] px-4 py-3 text-xs leading-6 text-slate-400 ring-1 ring-white/5">
                  {breakdown.notes.join(" · ")}
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>
      </section>

      <section>
        <div className="overflow-hidden rounded-2xl bg-white/[0.02] ring-1 ring-white/5">
          <div className="flex flex-wrap items-end justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">County water table</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Select a county to inspect alerts, gauges, sewer overflow activity, permit counts, governance density, and NFHL floodplain coverage.
              </p>
            </div>
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 tabular-nums">
              {overview.counties.length} counties
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-14 z-10 bg-slate-950/85 backdrop-blur">
                <tr className="text-left text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-5 py-3 sm:px-6">County</th>
                  <th className="px-3 py-3 text-right">NFHL footprint</th>
                  <th className="px-3 py-3 text-right">Alerts</th>
                  <th className="px-3 py-3 text-right">Gauges</th>
                  <th className="px-3 py-3 text-right">Sewer overflows</th>
                  <th className="px-3 py-3 text-right">General permits</th>
                  <th className="px-3 py-3 text-right">Water districts</th>
                  <th className="px-3 py-3 text-right">Water utilities</th>
                  <th className="px-3 py-3 text-right">LCRA outfalls</th>
                  <th className="px-3 py-3 text-right">LCRA land permits</th>
                  <th className="px-3 py-3 text-right">Active LCRA sites</th>
                  <th className="px-3 py-3 text-right">LCRA params</th>
                  <th className="px-3 py-3 text-right">Impaired LCRA sites</th>
                  <th className="px-5 py-3 text-right sm:px-6">Mismatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {overview.counties.map((county) => {
                  const mismatchLevel = severityFromMismatch(county.mismatch?.score);
                  const isActive = county.county.slug === selectedSlug;
                  return (
                    <tr
                      key={county.county.slug}
                      className={`transition-colors ${isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.025]"}`}
                    >
                      <td className="px-5 py-3 font-medium text-white sm:px-6">
                        <Link href={`/water?county=${county.county.slug}&mode=${mapMode}`} className="inline-flex items-center gap-2 hover:text-accent">
                          {isActive ? <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" /> : null}
                          {county.county.name}
                        </Link>
                      </td>
                      <NumCell v={county.metrics.floodplainFeatureCount} />
                      <NumCell v={county.metrics.activeWaterAlertCount} />
                      <NumCell v={county.metrics.streamGaugeCount} />
                      <NumCell v={county.metrics.sewerOverflowCount30d} />
                      <NumCell v={county.metrics.generalPermitCount} />
                      <NumCell v={county.metrics.waterDistrictCount} />
                      <NumCell v={county.metrics.waterUtilityCount} />
                      <NumCell v={county.metrics.lcraArrpOutfallCount} />
                      <NumCell v={county.metrics.lcraArrpLandPermitCount} />
                      <NumCell v={county.metrics.activeLcraQualitySiteCount} />
                      <NumCell v={county.metrics.availableLcraParameterCount} />
                      <NumCell v={county.metrics.impairedLcraMonitoringSiteCount} />
                      <td className="px-5 py-3 text-right sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 font-mono text-xs tabular-nums ${mismatchLevel >= 3 ? SEVERITY_TEXT_CLASS[mismatchLevel] : "text-slate-400"}`}
                          aria-label={`Mismatch ${SEVERITY_LABEL[mismatchLevel]}`}
                          title={`Mismatch ${SEVERITY_LABEL[mismatchLevel]}`}
                        >
                          <span aria-hidden="true">{SEVERITY_GLYPH[mismatchLevel]}</span>
                          {formatNumber(county.mismatch?.score)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function ApiPill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-slate-300 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white hover:ring-white/20"
    >
      <span aria-hidden="true" className="text-slate-500">{"{ }"}</span>
      {label}
    </Link>
  );
}

function RoutePill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-[11px] font-medium text-accent ring-1 ring-accent/20 transition-colors hover:bg-accent/15 hover:ring-accent/40"
    >
      <span aria-hidden="true">→</span>
      {label}
    </Link>
  );
}

function ModeToggle({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
      }`}
      aria-pressed={active}
    >
      {label}
    </Link>
  );
}

function LegendRow({ level, text }: { level: SeverityLevel; text: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span aria-hidden="true" className={`inline-block size-2.5 rounded-full ${SEV_DOT_CLASS[level]}`} />
      <span aria-hidden="true" className={SEVERITY_TEXT_CLASS[level]}>{SEVERITY_GLYPH[level]}</span>
      <span className="text-slate-300">{text}</span>
    </li>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-950/40 px-4 py-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-white">{value}</div>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.02] px-3.5 py-3 ring-1 ring-white/5">
      <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-white">{value}</dd>
    </div>
  );
}

function NumCell({ v }: { v: number | undefined }) {
  return <td className="px-3 py-3 text-right tabular-nums text-slate-300">{formatNumber(v)}</td>;
}

function NumPill({ v }: { v: number }) {
  return <span className="tabular-nums text-slate-200">{v}</span>;
}
