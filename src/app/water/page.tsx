import Link from "next/link";
import PulseDot from "@/app/components/pulse-dot";
import TopographicBackground from "@/app/components/topographic-background";
import { GlossaryInlineList } from "@/app/components/glossary-tooltip";
import { countySlug } from "@/lib/counties";
import { parseEnumQueryParam, resolveAllowedQueryParam } from "@/lib/query-params";
import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";
import { getDefaultAtlasWaterSummaryService } from "@/lib/water/water-summary-service";
import TexasChoropleth, { type ChoroplethCounty, type ChoroplethGauge } from "@/app/water/components/texas-choropleth";
import { MismatchStrip, TileCartogram, type TileCartogramCounty } from "@/app/components/data-viz";
import UncertaintyBadge from "@/app/components/uncertainty-badge";
import {
  freshnessFromCacheMeta,
  FRESHNESS_TEXT_CLASS,
  SEVERITY_LABEL,
  SEVERITY_TEXT_CLASS,
  severityFromMismatch,
  severityFromRiskScore,
  type SeverityLevel,
} from "@/app/design/states";
import { FRESHNESS_GLYPH, SEVERITY_GLYPH } from "@/app/design/glyphs";

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

function permitDensitySeverity(count: number | undefined): SeverityLevel {
  if (!count) return 0;
  if (count >= 10) return 4;
  if (count >= 5) return 3;
  if (count >= 2) return 2;
  return 1;
}

function permitCountByStatus(
  permits: Array<{ permitLane?: string | null; permitStatus?: string | null }>,
  permitLane: string,
  status?: string,
) {
  return permits.filter((permit) => {
    if (permit.permitLane !== permitLane) return false;
    return status ? (permit.permitStatus ?? "").toUpperCase() === status : true;
  }).length;
}

function uncertaintyLevelForCounty(county: {
  metrics: {
    activeWaterAlertCount?: number;
    streamGaugeCount?: number;
    sewerOverflowCount30d?: number;
    generalPermitCount?: number;
    waterDistrictCount?: number;
    waterUtilityCount?: number;
  };
  mismatch?: { score?: number };
}): "measured" | "seeded" | "modeled" | "sparse" {
  const measuredSignals =
    (county.metrics.activeWaterAlertCount ?? 0) +
    (county.metrics.streamGaugeCount ?? 0) +
    (county.metrics.sewerOverflowCount30d ?? 0);
  const registrySignals =
    (county.metrics.generalPermitCount ?? 0) +
    (county.metrics.waterDistrictCount ?? 0) +
    (county.metrics.waterUtilityCount ?? 0);
  const mismatch = county.mismatch?.score ?? 0;

  if (measuredSignals === 0 && registrySignals === 0) return "sparse";
  if (measuredSignals > 0) return "measured";
  if (mismatch >= 40) return "modeled";
  return "seeded";
}

export default async function WaterPage({
  searchParams,
}: {
  searchParams?: Promise<{ county?: string | string[]; mode?: string | string[] }>;
}) {
  const service = getDefaultAtlasWaterSummaryService();
  const overviewPromise = service.getWaterOverview();
  const params = searchParams ? await searchParams : undefined;
  const mapMode = parseEnumQueryParam(params?.mode, ["risk", "mismatch"] as const, "risk");
  const requestedRaw = Array.isArray(params?.county) ? params?.county[0] : params?.county;
  const speculativeSlug = requestedRaw ? countySlug(requestedRaw) : null;
  const speculativeBreakdownPromise = speculativeSlug
    ? service.getCountyWaterBreakdown(speculativeSlug).catch(() => null)
    : null;

  const overview = await overviewPromise;
  const selectedSlug = resolveAllowedQueryParam(
    params?.county,
    overview.counties.map((county) => county.county.slug),
    countySlug,
  ) ?? overview.counties[0]?.county.slug;

  let breakdown: Awaited<ReturnType<typeof service.getCountyWaterBreakdown>> | null = null;
  if (speculativeBreakdownPromise && speculativeSlug === selectedSlug) {
    breakdown = await speculativeBreakdownPromise;
  }
  if (!breakdown && selectedSlug) {
    breakdown = await service.getCountyWaterBreakdown(selectedSlug);
  }

  const sourceFreshness = Object.values(overview.freshness?.sources ?? {});
  const anySourceStale = sourceFreshness.some((source) => freshnessFromCacheMeta(source) === "stale");
  const anySourceMissing = sourceFreshness.length === 0 || sourceFreshness.every((source) => freshnessFromCacheMeta(source) === "missing");
  const freshnessFor = (county: typeof overview.counties[number]) => {
    const hasAnySignal =
      (county.metrics.floodplainFeatureCount ?? 0) > 0 ||
      (county.metrics.activeWaterAlertCount ?? 0) > 0 ||
      (county.metrics.streamGaugeCount ?? 0) > 0 ||
      (county.metrics.sewerOverflowCount30d ?? 0) > 0;
    return !hasAnySignal && anySourceMissing ? "missing" : anySourceStale ? "stale" : "fresh";
  };

  const choroplethCounties: ChoroplethCounty[] = overview.counties.map((county) => {
    const riskScore = countyRiskScore(county);
    const mismatchScore = county.mismatch?.score ?? 0;
    const severity = countySeverity(riskScore, county.mismatch?.score, mapMode);
    return {
      slug: county.county.slug,
      name: county.county.name,
      fips: county.county.fips ?? TEXAS_COUNTY_CENTROIDS[county.county.slug]?.fips,
      severity,
      riskScore,
      mismatchScore,
      metrics: {
        floodplainFeatureCount: county.metrics.floodplainFeatureCount,
        activeWaterAlertCount: county.metrics.activeWaterAlertCount,
        streamGaugeCount: county.metrics.streamGaugeCount,
        oilAndGasExtractionPermitCount: county.metrics.oilAndGasExtractionPermitCount,
        petroleumBulkStationPermitCount: county.metrics.petroleumBulkStationPermitCount,
        otherGeneralPermitCount: county.metrics.otherGeneralPermitCount,
      },
      freshness: freshnessFor(county),
    };
  });

  const oilAndGasChoroplethCounties: ChoroplethCounty[] = overview.counties.map((county) => {
    const oilAndGasCount = county.metrics.oilAndGasExtractionPermitCount ?? 0;
    return {
      slug: county.county.slug,
      name: county.county.name,
      fips: county.county.fips ?? TEXAS_COUNTY_CENTROIDS[county.county.slug]?.fips,
      severity: permitDensitySeverity(oilAndGasCount),
      riskScore: oilAndGasCount,
      mismatchScore: 0,
      metrics: {
        oilAndGasExtractionPermitCount: oilAndGasCount,
        petroleumBulkStationPermitCount: county.metrics.petroleumBulkStationPermitCount,
        otherGeneralPermitCount: county.metrics.otherGeneralPermitCount,
      },
      freshness: freshnessFor(county),
    };
  });

  const choroplethGauges: ChoroplethGauge[] = (breakdown?.layers.gauges ?? [])
    .filter((gauge) => Number.isFinite(gauge.latitude) && Number.isFinite(gauge.longitude))
    .map((gauge) => ({
      siteNumber: gauge.siteNumber,
      stationName: gauge.stationName,
      latitude: gauge.latitude,
      longitude: gauge.longitude,
    }));

  const topMismatchCounties = [...overview.counties]
    .filter((county) => (county.mismatch?.score ?? 0) > 0)
    .sort((left, right) => (right.mismatch?.score ?? 0) - (left.mismatch?.score ?? 0))
    .slice(0, 3);
  const topOilAndGasCounties = [...overview.counties]
    .filter((county) => (county.metrics.oilAndGasExtractionPermitCount ?? 0) > 0)
    .sort(
      (left, right) =>
        (right.metrics.oilAndGasExtractionPermitCount ?? 0) - (left.metrics.oilAndGasExtractionPermitCount ?? 0) ||
        left.county.name.localeCompare(right.county.name),
    )
    .slice(0, 5);

  // Two-bar mismatch rows: "compliance side" vs "world side"
  const mismatchRows = overview.counties
    .map((county) => {
      const compliance =
        (county.metrics.impairedSurfaceWaterSegmentCount ?? 0) +
        (county.metrics.sewerOverflowCount30d ?? 0);
      const world =
        (county.metrics.activeWaterAlertCount ?? 0) +
        (county.metrics.floodplainFeatureCount ?? 0);
      const divergence = Math.abs(compliance - world);
      return { county, compliance, world, divergence };
    })
    .filter((row) => row.compliance > 0 || row.world > 0)
    .sort((a, b) => b.divergence - a.divergence)
    .slice(0, 12);
  const mismatchScaleMax = mismatchRows.reduce(
    (acc, row) => Math.max(acc, row.compliance, row.world),
    1,
  );

  // Tile cartogram: full state in small multiples, severity = current map mode
  const cartogramCounties: TileCartogramCounty[] = overview.counties.map((county) => {
    const riskScore = countyRiskScore(county);
    const severity = countySeverity(riskScore, county.mismatch?.score, mapMode);
    const flag = mapMode === "mismatch" ? (county.mismatch?.score ?? 0) >= 40 : (county.metrics.activeWaterAlertCount ?? 0) > 0;
    return {
      slug: county.county.slug,
      name: county.county.name,
      severity,
      flag,
      title: `${county.county.name}: risk ${riskScore}, mismatch ${county.mismatch?.score ?? 0}, alerts ${county.metrics.activeWaterAlertCount ?? 0}`,
      href: `/water?county=${county.county.slug}&mode=${mapMode}#water-map`,
    };
  });

  const countiesWithFloodplain = overview.counties.filter((county) => (county.metrics.floodplainFeatureCount ?? 0) > 0).length;
  const activeAlertCount = overview.counties.reduce((sum, county) => sum + (county.metrics.activeWaterAlertCount ?? 0), 0);
  const countiesWithOilAndGasExtraction = overview.counties.filter((county) => (county.metrics.oilAndGasExtractionPermitCount ?? 0) > 0).length;
  const statewideOilAndGasPermits = overview.counties.reduce((sum, county) => sum + (county.metrics.oilAndGasExtractionPermitCount ?? 0), 0);
  const selectedMismatchLevel = severityFromMismatch(breakdown?.county.mismatch?.score);
  const selectedPermitLaneCards = breakdown
    ? [
        {
          label: "TXG31 active",
          value: permitCountByStatus(breakdown.layers.permits, "oil-gas-extraction", "ACTIVE"),
          note: "Oil and gas extraction authorizations currently active in the selected county.",
        },
        {
          label: "TXG31 pending",
          value: permitCountByStatus(breakdown.layers.permits, "oil-gas-extraction", "PENDING"),
          note: "Pending oil and gas extraction authorizations in the county pipeline.",
        },
        {
          label: "TXG34 petroleum bulk",
          value: permitCountByStatus(breakdown.layers.permits, "petroleum-bulk-stations"),
          note: "Petroleum bulk station and terminal authorizations split out from the same general permit inventory.",
        },
        {
          label: "Other general permits",
          value: permitCountByStatus(breakdown.layers.permits, "other-general-permit"),
          note: "Residual general permits outside the TXG31/TXG34 lanes.",
        },
      ]
    : [];
  const selectedOilAndGasPermits = breakdown?.layers.permits.filter((permit) => permit.permitLane === "oil-gas-extraction") ?? [];

  return (
    <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-6 py-12">
      <TopographicBackground />

      <section className="space-y-6 atlas-fade-rise">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
          <PulseDot size={6} />
          Live water lane · {activeAlertCount} active alerts
        </span>
        <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          <span className="atlas-hero-gradient">Texas water, by county.</span>
        </h1>
        <p className="max-w-3xl text-pretty text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          Floodplain footprint, alerts, gauges, sewer overflows, permits, and who runs the public water system — joined at the county level from federal and Texas open data.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <RoutePill href="/permits" label="Pending permits" />
          <RoutePill href="/water/network" label="County dependency map" />
          <RoutePill href="/water/mechanism" label="Evidence chain" />
        </div>
        <details className="group rounded-xl border border-white/5 bg-white/[0.02] open:bg-white/[0.03]">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-slate-500 transition-colors hover:text-slate-300">
            <span aria-hidden="true" className="text-slate-600 transition-transform group-open:rotate-90">›</span>
            Source APIs · developer reference
            <span className="text-[10px] text-slate-600">(9 endpoints)</span>
          </summary>
          <div className="flex flex-wrap gap-2 px-4 pb-4 pt-1 text-xs">
            <ApiPill href="/api/water/overview" label="Overview API" />
            <ApiPill href="/api/water/alerts" label="Alerts API" />
            <ApiPill href="/api/water/gauges" label="Gauges API" />
            <ApiPill href="/api/water/oil-gas-extraction" label="Oil & gas extraction API" />
            <ApiPill href="/api/water/fema/nfhl/counties" label="FEMA counties API" />
            <ApiPill href="/api/water/lcra/hydromet/stage-flow" label="LCRA Hydromet stage-flow API" />
            <ApiPill href="/api/water/lcra/arrp/outfalls" label="LCRA ARRP outfalls API" />
            <ApiPill href="/api/water/gbra/hydrology/gvhs-lakes" label="GBRA GVHS lakes API" />
            <ApiPill href="/api/water/gbra/hydrology/watersheds" label="GBRA watersheds API" />
            <ApiPill href="/api/water/gbra/quality/sites" label="GBRA quality sites API" />
          </div>
        </details>
      </section>

      <GlossaryInlineList label="Common water terms" terms={["NFHL", "LCRA", "GBRA", "TWDB", "PWS"]} />

      <section id="water-map" className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl bg-white/[0.02] p-5 ring-1 ring-white/5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm leading-6 text-slate-400">
                {mapMode === "mismatch"
                  ? "Mismatch lens — counties shaded where official signals don’t line up."
                  : "Operational pressure — counties shaded by floodplain footprint, alerts, overflows, and gauge coverage."}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Map mode</span>
            <div className="inline-flex rounded-full bg-white/[0.04] p-1 ring-1 ring-white/5" role="group" aria-label="Map mode">
              <ModeToggle href={`/water?county=${selectedSlug ?? ""}&mode=risk#water-map`} active={mapMode === "risk"} label="Operational risk" />
              <ModeToggle href={`/water?county=${selectedSlug ?? ""}&mode=mismatch#water-map`} active={mapMode === "mismatch"} label="Mismatch severity" />
            </div>
            <span className="text-xs text-slate-500">Current mode: {mapMode === "mismatch" ? "mismatch severity" : "operational risk"}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <WorkflowToggle href="#water-map" label="1. Start on the map" />
            <WorkflowToggle href="#water-county-detail" label="2. Inspect county detail" />
            <WorkflowToggle href="#water-county-table" label="3. Compare in county table" />
            {selectedSlug ? <WorkflowToggle href={`/water/counties/${selectedSlug}`} label="4. Open county page" /> : null}
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
                      href={`/water?county=${county.county.slug}&mode=${mapMode}#water-map`}
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
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{mapMode === "mismatch" ? "Mismatch mode" : "Operational legend"}</div>
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

          <div className="mt-5">
            <TexasChoropleth counties={choroplethCounties} gauges={choroplethGauges} selectedSlug={selectedSlug ?? null} />
          </div>

          <div className="mt-5 rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/5">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Tile cartogram · all 254 counties</div>
              <div className="text-[11px] text-slate-500">Equal-area tiles, geographic layout. Outliers don&rsquo;t hide behind small counties.</div>
            </div>
            <div className="mt-3">
              <TileCartogram counties={cartogramCounties} selectedSlug={selectedSlug ?? null} />
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Mismatch strips · compliance vs world</div>
              <div className="text-[11px] text-slate-500">
                Left bar: impairments + sewer overflows. Right bar: alerts + floodplain footprint. Imbalance = follow-up lead.
              </div>
            </div>
            {mismatchRows.length ? (
              <div className="mt-3 grid gap-1.5">
                <div className="grid grid-cols-[140px_180px_1fr] items-center gap-3 px-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">
                  <span>County</span>
                  <span className="flex items-center justify-between"><span>Compliance ◀</span><span>▶ World</span></span>
                  <span>Flags</span>
                </div>
                {mismatchRows.map(({ county, compliance, world }) => (
                  <Link
                    key={county.county.slug}
                    href={`/water?county=${county.county.slug}&mode=${mapMode}#water-map`}
                    className="grid grid-cols-[140px_180px_1fr] items-center gap-3 rounded-md px-1.5 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/5"
                  >
                    <span className="truncate text-slate-200">{county.county.name}</span>
                    <MismatchStrip
                      complianceValue={compliance}
                      worldValue={world}
                      scaleMax={mismatchScaleMax}
                      ariaLabel={`${county.county.name}: compliance ${compliance}, world ${world}`}
                    />
                    <span className="truncate text-[11px] text-slate-400">
                      {county.mismatch?.flags?.[0] ?? `compliance ${compliance} · world ${world}`}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">No counties with paired compliance/world signals yet.</p>
            )}
          </div>

          <div className="mt-4 grid gap-px overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-3">
            <KpiTile label="Counties with NFHL footprint" value={formatNumber(countiesWithFloodplain)} />
            <KpiTile label="Selected county gauges" value={formatNumber(choroplethGauges.length)} />
            <KpiTile label="Selected NFHL footprint" value={formatNumber(breakdown?.county.metrics.floodplainFeatureCount)} />
          </div>
        </div>

        <aside id="water-county-detail" className="rounded-2xl bg-white/[0.02] p-5 ring-1 ring-white/5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Selected county detail</div>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">{breakdown?.county.county.name ?? "County detail"}</h2>
              <p className="mt-1 text-xs text-slate-500">Map-driven county detail for the current water slice.</p>
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
                <DetailMetric label="Oil & gas extraction" value={formatNumber(breakdown.county.metrics.oilAndGasExtractionPermitCount)} />
                <DetailMetric label="Petroleum bulk stations" value={formatNumber(breakdown.county.metrics.petroleumBulkStationPermitCount)} />
                <DetailMetric label="Other general permits" value={formatNumber(breakdown.county.metrics.otherGeneralPermitCount)} />
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

              <div className="grid gap-2 sm:grid-cols-2">
                {selectedPermitLaneCards.map((card) => (
                  <div key={card.label} className="rounded-xl bg-white/[0.02] px-4 py-3 ring-1 ring-white/5">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{card.label}</div>
                    <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-white">{formatNumber(card.value)}</div>
                    <p className="mt-1.5 text-xs leading-5 text-slate-400">{card.note}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-white/[0.02] px-4 py-3 ring-1 ring-white/5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">TXG31 county drilldown</div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">Selected county extraction authorizations with permit number and status pulled from the TCEQ general permits lane.</p>
                  </div>
                  {selectedSlug ? <ApiPill href={`/api/water/oil-gas-extraction?county=${selectedSlug}`} label="Selected county TXG31 API" /> : null}
                </div>
                <div className="mt-3 space-y-2">
                  {selectedOilAndGasPermits.length ? selectedOilAndGasPermits.slice(0, 5).map((permit) => (
                    <div key={permit.permitNumber} className="rounded-lg bg-slate-950/40 px-3 py-2 text-xs text-slate-300 ring-1 ring-white/5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-slate-200">{permit.permitNumber}</span>
                        <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-400">{permit.permitStatus ?? "unknown status"}</span>
                      </div>
                      <div className="mt-1 text-slate-400">{permit.siteName ?? "Unnamed site"}</div>
                    </div>
                  )) : <p className="text-xs text-slate-500">No TXG31 permits matched the selected county.</p>}
                </div>
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

      <section className="rounded-2xl bg-white/[0.02] p-5 ring-1 ring-white/5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-300/80">Permit lane split</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Oil and gas extraction footprint</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              TXG31 extraction authorizations are broken out from TXG34 petroleum bulk stations and the rest of the general permit inventory, so the statewide map and county drilldown can isolate actual oilfield extraction pressure.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <ApiPill href="/api/water/oil-gas-extraction" label="Statewide TXG31 API" />
            {selectedSlug ? <ApiPill href={`/api/water/oil-gas-extraction?county=${selectedSlug}`} label="Selected county TXG31 API" /> : null}
          </div>
        </div>

        <div className="mt-5 grid gap-px overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-3">
          <KpiTile label="Counties with TXG31" value={formatNumber(countiesWithOilAndGasExtraction)} />
          <KpiTile label="Statewide TXG31 permits" value={formatNumber(statewideOilAndGasPermits)} />
          <KpiTile label="Selected county TXG31" value={formatNumber(breakdown?.county.metrics.oilAndGasExtractionPermitCount)} />
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <TexasChoropleth counties={oilAndGasChoroplethCounties} gauges={[]} selectedSlug={selectedSlug ?? null} variant="oil-gas" />
          </div>
          <div className="space-y-4">
            <div className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/5">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Top TXG31 counties</div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {topOilAndGasCounties.length ? topOilAndGasCounties.map((county) => (
                  <Link
                    key={county.county.slug}
                    href={`/water?county=${county.county.slug}&mode=${mapMode}#oil-gas-footprint`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 text-xs text-slate-200 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:ring-white/20"
                  >
                    <span>{county.county.name}</span>
                    <span className="font-mono text-[11px] tabular-nums text-slate-400">{formatNumber(county.metrics.oilAndGasExtractionPermitCount)}</span>
                  </Link>
                )) : <span className="text-xs text-slate-500">No TXG31 counties in the current cache snapshot.</span>}
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/5">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Permit density legend</div>
              <ul className="mt-2.5 space-y-1.5 text-xs text-slate-300">
                <LegendRow level={4} text="10+ TXG31 permits" />
                <LegendRow level={3} text="5–9 TXG31 permits" />
                <LegendRow level={2} text="2–4 TXG31 permits" />
                <LegendRow level={1} text="1 TXG31 permit" />
                <LegendRow level={0} text="0 TXG31 permits" />
              </ul>
            </div>

            <div id="oil-gas-footprint" className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/5">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Selected county permit lanes</div>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                TXG31 extraction, TXG34 petroleum bulk stations, and other general permits are separated into distinct operational lanes for the selected county.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <PermitLaneMini label="TXG31" value={formatNumber(breakdown?.county.metrics.oilAndGasExtractionPermitCount)} />
                <PermitLaneMini label="TXG34" value={formatNumber(breakdown?.county.metrics.petroleumBulkStationPermitCount)} />
                <PermitLaneMini label="Other" value={formatNumber(breakdown?.county.metrics.otherGeneralPermitCount)} />
              </div>
            </div>
          </div>
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

      <section id="water-county-table">
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
                  <th className="px-3 py-3 text-right">Confidence</th>
                  <th className="px-3 py-3 text-right">NFHL footprint</th>
                  <th className="px-3 py-3 text-right">Alerts</th>
                  <th className="px-3 py-3 text-right">Gauges</th>
                  <th className="px-3 py-3 text-right">Sewer overflows</th>
                  <th className="px-3 py-3 text-right">General permits</th>
                  <th className="px-3 py-3 text-right">Oil &amp; gas extraction</th>
                  <th className="px-3 py-3 text-right">Petroleum bulk</th>
                  <th className="px-3 py-3 text-right">Other permits</th>
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
                      <td className="px-3 py-3 text-right"><UncertaintyBadge level={uncertaintyLevelForCounty(county)} /></td>
                      <NumCell v={county.metrics.floodplainFeatureCount} />
                      <NumCell v={county.metrics.activeWaterAlertCount} />
                      <NumCell v={county.metrics.streamGaugeCount} />
                      <NumCell v={county.metrics.sewerOverflowCount30d} />
                      <NumCell v={county.metrics.generalPermitCount} />
                      <NumCell v={county.metrics.oilAndGasExtractionPermitCount} />
                      <NumCell v={county.metrics.petroleumBulkStationPermitCount} />
                      <NumCell v={county.metrics.otherGeneralPermitCount} />
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

function WorkflowToggle({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
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

function PermitLaneMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-950/40 px-3 py-3 ring-1 ring-white/5">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight text-white">{value}</div>
    </div>
  );
}
