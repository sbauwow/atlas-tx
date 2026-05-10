import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CustomProjection } from "@visx/geo";
import { geoAlbers } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import Link from "next/link";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

import { DecompositionBarsPanel, MoversTable, ScatterplotPanel } from "@/app/components/charts";
import { ACCENT_HEX, SEVERITY_HEX, SEVERITY_LABEL, type SeverityLevel } from "@/app/design/states";
import { AddToWatchlistControl } from "@/app/watchlists/watchlist-client";
import { parseEnumQueryParam, resolveAllowedQueryParam } from "@/lib/query-params";
import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";
import { getDefaultHydrologyDependencyService } from "@/lib/water/hydrology-dependencies";
import { getDefaultCountyDependencyNetworkService } from "@/lib/water/source-network";
import { getDefaultAtlasWaterSummaryService } from "@/lib/water/water-summary-service";

import { formatNumber, formatTimestamp, loadStatewideAnalyticsViewModel } from "./analytics-data";

const MAP_WIDTH = 900;
const MAP_HEIGHT = 520;

type CountyProps = { name?: string; fips: string };
type CountyTopology = Topology<{ counties: GeometryCollection<{ name?: string }> }>;
type AnalyticsOverlayTone = "outline" | "hatch";
type AnalyticsMapOverlay = {
  id: string;
  label: string;
  description: string;
  tone: AnalyticsOverlayTone;
  color: string;
  countySlugs: Set<string>;
};

let cachedAnalyticsCountyFeatures: FeatureCollection<Geometry, CountyProps> | null = null;

function loadTexasCountyFeatures(): FeatureCollection<Geometry, CountyProps> {
  if (cachedAnalyticsCountyFeatures) return cachedAnalyticsCountyFeatures;
  const topoPath = join(process.cwd(), "public", "cache", "tx-counties-topo.json");
  const topo = JSON.parse(readFileSync(topoPath, "utf8")) as CountyTopology;
  const fc = feature(topo, topo.objects.counties) as unknown as FeatureCollection<Geometry, { name?: string }>;
  const geometries = topo.objects.counties.geometries;
  cachedAnalyticsCountyFeatures = {
    type: "FeatureCollection",
    features: fc.features.map((currentFeature, index) => ({
      ...currentFeature,
      properties: {
        fips: String(geometries[index]?.id ?? currentFeature.id ?? ""),
        name: currentFeature.properties?.name ?? "",
      },
    })),
  };
  return cachedAnalyticsCountyFeatures;
}

function projectionFor(width: number, height: number) {
  return geoAlbers().rotate([99, 0]).center([0, 31.3]).parallels([28, 36]).scale(Math.min(width, height) * 5.2).translate([width / 2, height / 2]);
}

function analyticsMapSeverity(value: number, mode: "risk" | "pressure" | "oil"): SeverityLevel {
  if (mode === "pressure") {
    if (value >= 50) return 4;
    if (value >= 20) return 3;
    if (value >= 10) return 2;
    if (value >= 1) return 1;
    return 0;
  }

  if (mode === "oil") {
    if (value >= 10) return 4;
    if (value >= 5) return 3;
    if (value >= 2) return 2;
    if (value >= 1) return 1;
    return 0;
  }

  if (value >= 50) return 4;
  if (value >= 15) return 3;
  if (value >= 8) return 2;
  if (value >= 1) return 1;
  return 0;
}

function AnalyticsWorkflowToggle({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${active ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
      aria-pressed={active}
    >
      {label}
    </Link>
  );
}

function AnalyticsAnchorPill({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5">
      {label}
    </Link>
  );
}

function AnalyticsLegendRow({ level, text }: { level: SeverityLevel; text: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span aria-hidden="true" className="inline-block size-2.5 rounded-full" style={{ backgroundColor: SEVERITY_HEX[level] }} />
      <span className="text-slate-300">{text}</span>
    </li>
  );
}

function AnalyticsCountyCorrelationMap({
  counties,
  selectedSlug,
  mode,
  overlays,
}: {
  counties: Array<{
    slug: string;
    name: string;
    fips?: string;
    pressureScore: number;
    riskScore: number;
    oilScore: number;
    movementLabel: string;
    quadrantDetail: string;
    href: string;
  }>;
  selectedSlug: string | null;
  mode: "risk" | "pressure" | "oil";
  overlays: AnalyticsMapOverlay[];
}) {
  const features = loadTexasCountyFeatures();
  const bySlug = new Map(counties.map((county) => [county.slug, county]));
  const byFips = new Map(counties.filter((county) => county.fips).map((county) => [county.fips as string, county]));
  const projection = projectionFor(MAP_WIDTH, MAP_HEIGHT);
  const selectedCounty = selectedSlug ? bySlug.get(selectedSlug) ?? null : null;
  const selectedFips = selectedCounty?.fips;
  const overlayPatterns = overlays.filter((overlay) => overlay.tone === "hatch");

  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-950 ring-1 ring-white/5">
      <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="h-[420px] w-full" role="img" aria-label="Texas county analytics correlation map">
        <defs>
          <radialGradient id="analyticsMapVignette" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
          {overlayPatterns.map((overlay) => (
            <pattern key={overlay.id} id={`analytics-overlay-${overlay.id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
              <line x1="0" y1="0" x2="0" y2="6" stroke={overlay.color} strokeWidth="2" />
            </pattern>
          ))}
        </defs>
        <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#analyticsMapVignette)" />

        <CustomProjection<Feature<Geometry, CountyProps>> projection={() => projection} data={features.features}>
          {(map) => (
            <g>
              {map.features.map(({ feature: currentFeature, path }) => {
                const county = byFips.get(currentFeature.properties.fips);
                if (!path) return null;
                const focusValue = mode === "pressure" ? county?.pressureScore ?? 0 : mode === "oil" ? county?.oilScore ?? 0 : county?.riskScore ?? 0;
                const severity = analyticsMapSeverity(focusValue, mode);
                const isSelected = county?.slug === selectedSlug;
                const countyOverlays = county ? overlays.filter((overlay) => overlay.countySlugs.has(county.slug)) : [];
                const outlineOverlay = countyOverlays.find((overlay) => overlay.tone === "outline");
                const titleSuffix = countyOverlays.length ? ` — ${countyOverlays.map((overlay) => overlay.label).join(" — ")}` : "";
                const countyShape = (
                  <g data-county-slug={county?.slug ?? `fips-${currentFeature.properties.fips}`} data-mode={mode}>
                    <path
                      d={path}
                      fill={isSelected ? ACCENT_HEX : SEVERITY_HEX[severity]}
                      stroke={county ? (outlineOverlay?.color ?? "#f8fafc") : "#0f172a"}
                      strokeWidth={county ? (isSelected ? 1.55 : outlineOverlay ? 1.15 : 0.9) : 0.55}
                      fillOpacity={county ? 1 : 0.28}
                    />
                    {countyOverlays
                      .filter((overlay) => overlay.tone === "hatch")
                      .map((overlay) => (
                        <path key={`${county?.slug}-${overlay.id}`} d={path} fill={`url(#analytics-overlay-${overlay.id})`} opacity={0.82} />
                      ))}
                    <title>
                      {county
                        ? `${county.name}: risk ${formatNumber(county.riskScore)}, pressure ${formatNumber(county.pressureScore)}, oil ${formatNumber(county.oilScore)} — ${county.movementLabel}. ${county.quadrantDetail}${titleSuffix}`
                        : `${currentFeature.properties.name} County (no statewide analytics point)`}
                    </title>
                  </g>
                );
                return county ? (
                  <a key={county.slug} href={county.href} aria-label={`Open ${county.name}`}>
                    {countyShape}
                  </a>
                ) : (
                  <g key={currentFeature.properties.fips}>{countyShape}</g>
                );
              })}

              {selectedCounty && selectedFips
                ? (() => {
                    const selectedFeature = map.features.find((entry) => entry.feature.properties.fips === selectedFips);
                    if (!selectedFeature?.path) return null;
                    return <path d={selectedFeature.path} fill="none" stroke={ACCENT_HEX} strokeOpacity={0.75} strokeWidth={2} pointerEvents="none" />;
                  })()
                : null}
            </g>
          )}
        </CustomProjection>
      </svg>
    </div>
  );
}

 function StatTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-300/80">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{detail}</div>
    </div>
  );
}

function LaneCard({ title, badge, href, primary, secondary }: { title: string; badge: string; href: string; primary: string; secondary: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 transition-colors hover:border-cyan-300/40 hover:bg-slate-950">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{title}</div>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100">{badge}</span>
      </div>
      <div className="mt-3 text-sm text-slate-200">{primary}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{secondary}</div>
    </Link>
  );
}

function WatchQueuePanel({
  title,
  description,
  sourceLabel,
  entries,
  emptyMessage,
}: {
  title: string;
  description: string;
  sourceLabel: string;
  entries: Array<{
    id: string;
    label: string;
    href: string;
    kind: string;
    headline: string;
    detail: string;
    queueLine: string;
  }>;
  emptyMessage: string;
}) {
  const exportValue = entries.map((entry) => entry.queueLine).join("\n");

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-300/80">Watchlist-ready lane</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Atlas now saves these lanes into local/shared browser watchlists. If storage is blocked or you need a handoff outside this machine, the copyable queue still works as a fallback.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/watchlists" className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5">
            Open saved watchlists
          </Link>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">{sourceLabel}</div>
        </div>
      </div>

      {entries.length ? (
        <>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {entries.map((entry, index) => (
              <article key={entry.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{entry.label}</div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100">
                    {entry.kind} #{index + 1}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-200">{entry.headline}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{entry.detail}</p>
                <AddToWatchlistControl
                  className="mt-4"
                  item={{
                    id: entry.id,
                    kind: entry.kind,
                    label: entry.label,
                    href: entry.href,
                    summary: entry.headline,
                    detail: entry.detail,
                    surface: "analytics",
                  }}
                />
                <Link href={entry.href} className="mt-4 inline-flex text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200">
                  Open next →
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Copyable queue</div>
            <textarea
              readOnly
              value={exportValue}
              aria-label={`${title} copyable queue`}
              className="mt-3 min-h-36 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm leading-6 text-slate-200"
            />
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-sm leading-6 text-slate-400">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string | string[]; county?: string | string[] }>;
} = {}) {
  const analytics = await loadStatewideAnalyticsViewModel();
  const waterOverview = await getDefaultAtlasWaterSummaryService().getWaterOverview().catch(() => null);
  const params = searchParams ? await searchParams : undefined;
  const mapMode = parseEnumQueryParam(params?.mode, ["risk", "pressure", "oil"] as const, "risk");

  const chipToneClassName: Record<"accent" | "warning" | "neutral", string> = {
    accent: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
    warning: "border-amber-400/20 bg-amber-400/10 text-amber-100",
    neutral: "border-white/10 bg-white/[0.03] text-slate-200",
  };

  const countyWatchEntries = [...analytics.whatChangedLanes, ...analytics.screeningLanes]
    .filter((lane) => lane.href.startsWith("/counties/"))
    .reduce<Array<{ id: string; label: string; href: string; kind: string; headline: string; detail: string; queueLine: string }>>((accumulator, lane) => {
      if (accumulator.some((entry) => entry.href === lane.href)) {
        return accumulator;
      }

      accumulator.push({
        id: lane.href,
        label: lane.title,
        href: lane.href,
        kind: "County",
        headline: lane.primary,
        detail: lane.secondary,
        queueLine: `county | ${lane.title} | ${lane.href} | ${lane.badge} | ${lane.primary} | ${lane.secondary}`,
      });

      return accumulator;
    }, [])
    .slice(0, 4);

  const operatorWatchEntries = analytics.operatorConcentrationLanes.slice(0, 2).map((lane) => ({
    id: lane.href,
    label: lane.title,
    href: lane.href,
    kind: "Operator",
    headline: lane.primary,
    detail: lane.secondary,
    queueLine: `operator | ${lane.title} | ${lane.href} | ${lane.badge} | ${lane.primary} | ${lane.secondary}`,
  }));

  const statewideWatchEntries = [...countyWatchEntries, ...operatorWatchEntries].slice(0, 6);

  const moversBySlug = new Map(analytics.moversRows.map((row) => [row.href.replace("/counties/", ""), row]));
  const oilBySlug = new Map(
    (waterOverview?.counties ?? []).map((county) => [county.county.slug, county.metrics.oilAndGasExtractionPermitCount ?? 0]),
  );
  const countyMapRows = analytics.scatterPoints
    .map((point) => ({
      slug: point.href.replace("/counties/", ""),
      name: point.label,
      fips: TEXAS_COUNTY_CENTROIDS[point.href.replace("/counties/", "")]?.fips,
      pressureScore: point.x,
      riskScore: point.y,
      oilScore: oilBySlug.get(point.href.replace("/counties/", "")) ?? 0,
      movementLabel: moversBySlug.get(point.href.replace("/counties/", ""))?.movementLabel ?? "Present in the current statewide scatter",
      quadrantDetail: point.detail,
      href: point.href,
    }))
    .filter((county) => county.fips);
  const selectedCountySlug = resolveAllowedQueryParam(
    params?.county,
    countyMapRows.map((county) => county.slug),
  );
  const selectedCounty = countyMapRows.find((county) => county.slug === selectedCountySlug) ?? countyMapRows[0] ?? null;
  const comparisonCounties = [...countyMapRows]
    .sort((left, right) => (
      mapMode === "pressure"
        ? right.pressureScore - left.pressureScore
        : mapMode === "oil"
          ? right.oilScore - left.oilScore
          : right.riskScore - left.riskScore
    ))
    .slice(0, 3);

  const [sourceNetwork, hydrologyGraph] = await Promise.all([
    getDefaultCountyDependencyNetworkService().buildNetwork().catch(() => null),
    getDefaultHydrologyDependencyService().buildGraph().catch(() => null),
  ]);
  const sourceLinkedCountySlugs = new Set(
    (sourceNetwork?.nodes ?? []).filter((node) => node.multiCountySourceCount > 0).map((node) => node.countySlug),
  );
  const downstreamDependencyCountySlugs = new Set(
    (hydrologyGraph?.nodes ?? []).filter((node) => node.downstreamDependencyScore > 0).map((node) => node.countySlug),
  );
  const mapOverlays: AnalyticsMapOverlay[] = [
    {
      id: "source-network",
      label: "Shared source network",
      description: "Hatched counties participate in the multi-county shared-source graph from Atlas water-source dependency data.",
      tone: "hatch" as const,
      color: "rgba(248,250,252,0.85)",
      countySlugs: sourceLinkedCountySlugs,
    },
    {
      id: "downstream-hydrology",
      label: "Downstream hydrology dependency",
      description: "Outlined counties currently register downstream dependency in the seeded hydrology graph.",
      tone: "outline" as const,
      color: "#f59e0b",
      countySlugs: downstreamDependencyCountySlugs,
    },
  ].filter((overlay) => overlay.countySlugs.size > 0);
  const selectedOverlayLabels = selectedCounty
    ? mapOverlays.filter((overlay) => overlay.countySlugs.has(selectedCounty.slug)).map((overlay) => overlay.label)
    : [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-16">
      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/counties" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
            County workspace
          </Link>
          <Link href="/water" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
            Water explorer
          </Link>
          <Link href="/watchlists" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
            Saved watchlists
          </Link>
        </div>
        <div className="space-y-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-cyan-300/80">Wave 2 · Stream F</div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Texas statewide analytics terminal</h1>
          <p className="max-w-4xl text-base leading-7 text-slate-400">
            Start on the county map, hunt your own statewide correlations, then use the ranked lanes and scatter to verify what you see. Atlas only uses committed Wave 1 analytics artifacts and does not invent missing history.
          </p>
          <div className="text-sm text-slate-500">Latest statewide analytics refresh: {formatTimestamp(analytics.generatedAt)}</div>
        </div>
      </section>

      <section id="analytics-map" className="rounded-3xl border border-white/10 bg-slate-950/85 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-300/80">Map-first correlation workflow</div>
            <h2 className="mt-2 text-3xl font-semibold text-white">County map is the statewide headliner</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Start with the map, switch between county risk, permit-pressure, and oil extraction emphasis, then jump into movers, scatter, and county pages to prove or reject the pattern. This keeps the workflow anchored to counties instead of making charts the first stop.
            </p>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Scatter-backed counties: {analytics.scatterCount}</div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Map emphasis</span>
          <div className="inline-flex rounded-full bg-white/[0.04] p-1 ring-1 ring-white/5" role="group" aria-label="Analytics map emphasis">
            <AnalyticsWorkflowToggle href={`/analytics?mode=risk${selectedCounty ? `&county=${selectedCounty.slug}` : ""}#analytics-map`} active={mapMode === "risk"} label="County risk" />
            <AnalyticsWorkflowToggle href={`/analytics?mode=pressure${selectedCounty ? `&county=${selectedCounty.slug}` : ""}#analytics-map`} active={mapMode === "pressure"} label="Permit pressure" />
            <AnalyticsWorkflowToggle href={`/analytics?mode=oil${selectedCounty ? `&county=${selectedCounty.slug}` : ""}#analytics-map`} active={mapMode === "oil"} label="Oil view" />
          </div>
          <span className="text-xs text-slate-500">Current emphasis: {mapMode === "pressure" ? "permit pressure" : mapMode === "oil" ? "oil extraction" : "county risk"}</span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <AnalyticsAnchorPill href="#analytics-map" label="1. Start on the map" />
          <AnalyticsAnchorPill href="#county-movers" label="2. Check ranked movers" />
          <AnalyticsAnchorPill href="#statewide-scatter" label="3. Validate in scatter" />
          {selectedCounty ? <AnalyticsAnchorPill href={selectedCounty.href} label={`4. Open ${selectedCounty.name}`} /> : null}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <AnalyticsCountyCorrelationMap counties={countyMapRows} selectedSlug={selectedCounty?.slug ?? null} mode={mapMode} overlays={mapOverlays} />

          <aside className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Selected county</div>
              <h3 className="mt-2 text-2xl font-semibold text-white">{selectedCounty?.name ?? "County detail"}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {selectedCounty
                  ? `${selectedCounty.movementLabel}. ${selectedCounty.quadrantDetail}`
                  : "The county map will activate once pressure-risk-scatter.json exposes counties with mappable FIPS coverage."}
              </p>
              {selectedOverlayLabels.length ? (
                <div className="mt-3 space-y-2 text-xs text-slate-300">
                  <div>{selectedOverlayLabels.join(" — ")}</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedOverlayLabels.map((label) => (
                      <span key={label} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {selectedCounty ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">County risk score</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{formatNumber(selectedCounty.riskScore)}</div>
                    <div className="mt-1 text-xs text-slate-500">Severity {SEVERITY_LABEL[analyticsMapSeverity(selectedCounty.riskScore, "risk")]}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Permit pressure</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{formatNumber(selectedCounty.pressureScore)}</div>
                    <div className="mt-1 text-xs text-slate-500">Severity {SEVERITY_LABEL[analyticsMapSeverity(selectedCounty.pressureScore, "pressure")]}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:col-span-2 xl:col-span-1">
                    <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Oil &amp; gas extraction</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{formatNumber(selectedCounty.oilScore)}</div>
                    <div className="mt-1 text-xs text-slate-500">Severity {SEVERITY_LABEL[analyticsMapSeverity(selectedCounty.oilScore, "oil")]}</div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Source-linked counties</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{sourceLinkedCountySlugs.size}</div>
                    <div className="mt-1 text-xs text-slate-500">Counties currently present in the shared source network overlay.</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Downstream dependency counties</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{downstreamDependencyCountySlugs.size}</div>
                    <div className="mt-1 text-xs text-slate-500">Counties currently outlined by the hydrology dependency overlay.</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Open this county next</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={selectedCounty.href} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 transition-colors hover:border-cyan-300/40 hover:bg-cyan-400/15">
                      County intelligence page
                    </Link>
                    <Link href={`/analytics?mode=${mapMode}&county=${selectedCounty.slug}#county-movers`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5">
                      Compare in movers
                    </Link>
                    <Link href={`/analytics?mode=${mapMode}&county=${selectedCounty.slug}#statewide-scatter`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5">
                      Compare in scatter
                    </Link>
                    <Link href={`/water?county=${selectedCounty.slug}#oil-gas-footprint`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5">
                      Open oil footprint
                    </Link>
                  </div>
                </div>
              </>
            ) : null}

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Top counties in this view</div>
              <div className="mt-3 space-y-2">
                {comparisonCounties.length ? comparisonCounties.map((county) => (
                  <Link
                    key={county.slug}
                    href={`/analytics?mode=${mapMode}&county=${county.slug}#analytics-map`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5"
                  >
                    <span>{county.name}</span>
                    <span className="font-mono text-xs text-slate-400">
                      {mapMode === "pressure"
                        ? `Pressure ${formatNumber(county.pressureScore)}`
                        : mapMode === "oil"
                          ? `Oil ${formatNumber(county.oilScore)}`
                          : `Risk ${formatNumber(county.riskScore)}`}
                    </span>
                  </Link>
                )) : <div className="text-sm leading-6 text-slate-500">No statewide scatter counties are available yet.</div>}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Map legend</div>
              <ul className="mt-3 space-y-2 text-xs text-slate-300">
                {mapMode === "pressure" ? (
                  <>
                    <AnalyticsLegendRow level={4} text="50+ highest permit pressure in the statewide scatter" />
                    <AnalyticsLegendRow level={3} text="20–49 strong pressure" />
                    <AnalyticsLegendRow level={2} text="10–19 visible pressure" />
                    <AnalyticsLegendRow level={0} text="No mapped statewide point" />
                  </>
                ) : mapMode === "oil" ? (
                  <>
                    <AnalyticsLegendRow level={4} text="10+ TXG31 oil and gas extraction permits" />
                    <AnalyticsLegendRow level={3} text="5–9 TXG31 permits" />
                    <AnalyticsLegendRow level={2} text="2–4 TXG31 permits" />
                    <AnalyticsLegendRow level={1} text="1 TXG31 permit" />
                    <AnalyticsLegendRow level={0} text="No mapped statewide point or no TXG31 permits" />
                  </>
                ) : (
                  <>
                    <AnalyticsLegendRow level={4} text="50+ highest statewide county risk" />
                    <AnalyticsLegendRow level={3} text="15–49 elevated county risk" />
                    <AnalyticsLegendRow level={2} text="8–14 visible county risk" />
                    <AnalyticsLegendRow level={0} text="No mapped statewide point" />
                  </>
                )}
              </ul>
              {mapOverlays.length ? (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Map overlays</div>
                  <ul className="mt-3 space-y-3 text-xs text-slate-300">
                    {mapOverlays.map((overlay) => (
                      <li key={overlay.id} className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className={overlay.tone === "hatch" ? "mt-0.5 inline-block h-3.5 w-3.5 rounded-[4px] border border-white/30 bg-[repeating-linear-gradient(135deg,rgba(248,250,252,0.95)_0,rgba(248,250,252,0.95)_2px,transparent_2px,transparent_5px)]" : "mt-0.5 inline-block h-3.5 w-3.5 rounded-[4px] border bg-transparent"}
                          style={overlay.tone === "outline" ? { borderColor: overlay.color } : undefined}
                        />
                        <div>
                          <div className="text-slate-100">{overlay.label}</div>
                          <div className="text-slate-500">{overlay.description}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <StatTile label="Mover rows" value={String(analytics.moversCount)} detail={analytics.moversComparisonSummary} />
        <StatTile label="Scatter counties" value={String(analytics.scatterCount)} detail="Counties currently represented in the pressure versus risk cache." />
        <StatTile label="Fresh sources" value={String(analytics.freshSourceCount)} detail="Committed source snapshots marked fresh in source-freshness.json." />
        <StatTile label="Artifacts" value={analytics.generatedAt ? "Online" : "Partial"} detail="Page degrades to empty-state panels if any artifact is missing." />
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-300/80">What changed</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Recent movement across committed snapshots</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{analytics.whatChangedHeadline}</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{analytics.whatChangedDetail}</p>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Window {analytics.whatChangedWindowLabel}</div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {analytics.whatChangedChips.map((chip) => (
            <div key={chip.label} className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em] ${chipToneClassName[chip.tone]}`}>
              {chip.label}: {chip.value}
            </div>
          ))}
        </div>

        {analytics.whatChangedLanes.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            {analytics.whatChangedLanes.map((lane) => (
              <LaneCard key={`what-changed-${lane.badge}-${lane.href}`} {...lane} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-sm leading-6 text-slate-400">
            Atlas only shows this lane when committed artifacts support a real comparison window. When there is a single snapshot or no mover rows, the statewide table and provenance panels below stay grounded to current-state data only.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-fuchsia-300/80">Screening lanes</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Counties to open next</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              A ranked lane for quick triage: movement flags when available, otherwise the highest current-risk counties from county-movers.
            </p>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Source: county-movers.json</div>
        </div>
        {analytics.screeningLanes.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {analytics.screeningLanes.map((lane) => (
              <LaneCard key={`${lane.badge}-${lane.href}`} {...lane} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-sm leading-6 text-slate-400">
            Wave 1 did not produce enough mover rows for screening lanes yet. The table and scatter panels below will activate automatically when caches land.
          </div>
        )}
      </section>

      <WatchQueuePanel
        title="Statewide open-next queue"
        description="A watchlist-ready handoff lane grounded to counties already surfacing in mover and screening cards, plus the most concentrated operators already visible on this page."
        sourceLabel="Current session only"
        entries={statewideWatchEntries}
        emptyMessage="Atlas has not exposed enough county or operator lanes to build a watch queue yet. Once committed statewide rows appear above, this export-ready queue will populate automatically."
      />

      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-300/80">Operator concentration</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Who dominates permit pressure statewide</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{analytics.operatorConcentrationSummary}</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Atlas uses the permit roster plus current CID applicant names when available, and avoids extra operator claims when the dataset is sparse.
            </p>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Links open operator pages</div>
        </div>
        {analytics.operatorConcentrationLanes.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {analytics.operatorConcentrationLanes.map((lane) => (
              <LaneCard key={`operator-${lane.href}`} {...lane} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-sm leading-6 text-slate-400">
            Atlas will surface operator concentration here once the permit roster or CID lane exposes enough named operators to compare shares.
          </div>
        )}
      </section>

      <section id="county-movers" className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <MoversTable
          title="County movers"
          eyebrow="Ranked movers lane"
          subtitle="Current county risk rank, prior snapshot value, and delta from the committed comparison window. Every row links to the county intelligence page."
          rows={analytics.moversRows}
          currentColumnLabel="Risk now"
          previousColumnLabel="Risk prior"
          sourceLabel="Wave 1 county-movers artifact"
          freshnessLabel={formatTimestamp(analytics.moversGeneratedAt)}
          caveat={analytics.moversNotes[0] ?? "No mover methodology note was available in the cache."}
          footer={
            analytics.moversNotes.length > 1 ? (
              <ul className="space-y-1 text-[11px] leading-5 text-slate-500">
                {analytics.moversNotes.slice(1, 3).map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            ) : null
          }
        />

        <DecompositionBarsPanel
          title="Pressure outliers"
          eyebrow="Comparative lane"
          subtitle="Use these bars after the map to see which counties pair the strongest current pressure scores with their current risk baseline."
          bars={analytics.pressureBars}
          formatValue={(value) => formatNumber(value)}
          emptyMessage="Pressure outlier bars will appear when pressure-risk-scatter.json contains points."
          sourceLabel="Wave 1 pressure-risk scatter artifact"
          freshnessLabel={formatTimestamp(analytics.scatterGeneratedAt)}
          caveat={analytics.scatterNotes[0] ?? "Pressure bars depend on the latest scatter snapshot only."}
        />
      </section>

      <section id="statewide-scatter" className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <ScatterplotPanel
          title="Pressure vs risk statewide scatter"
          eyebrow="Scatter analysis"
          subtitle="Use the scatter after the map to validate whether a county sits alone or inside a broader statewide cluster. Each point links into its county page."
          points={analytics.scatterPoints}
          xLabel="Pressure score"
          yLabel="County risk score"
          formatX={(value) => formatNumber(value)}
          formatY={(value) => formatNumber(value)}
          emptyMessage="The statewide scatter will appear once pressure-risk-scatter.json is committed."
          sourceLabel="Wave 1 pressure-risk-scatter artifact"
          freshnessLabel={formatTimestamp(analytics.scatterGeneratedAt)}
          caveat={analytics.scatterNotes[0] ?? "No scatter methodology note was available in the cache."}
          footer={
            analytics.scatterNotes.length > 1 ? (
              <ul className="space-y-1 text-[11px] leading-5 text-slate-500">
                {analytics.scatterNotes.slice(1, 3).map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            ) : null
          }
        />

        <DecompositionBarsPanel
          title="Quadrant monitor"
          eyebrow="Median split"
          subtitle="How the current scatter snapshot distributes counties across the statewide pressure and risk quadrants."
          bars={analytics.quadrantBars.map((item) => ({
            id: item.id,
            label: item.label,
            value: item.count,
            note: item.note,
            tone: item.tone,
          }))}
          formatValue={(value) => `${value} ${value === 1 ? "county" : "counties"}`}
          emptyMessage="Quadrant counts need at least one scatter point."
          sourceLabel="Wave 1 pressure-risk-scatter artifact"
          freshnessLabel={formatTimestamp(analytics.scatterGeneratedAt)}
          caveat="Quadrants are assigned by the scatter artifact itself; this page does not recompute median splits."
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/90 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-amber-300/80">Provenance + freshness</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Committed source inventory</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Freshness comes from public/cache/analytics/source-freshness.json so the statewide screen stays explicit about what was cached, when, and with which caveats.
            </p>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Generated {formatTimestamp(analytics.generatedAt)}</div>
        </div>

        {analytics.sourceSummary.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {analytics.sourceSummary.map((source) => (
              <article key={source.sourceId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{source.label}</h3>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{source.sourceId}</div>
                  </div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">{source.freshness}</span>
                </div>
                <dl className="mt-4 space-y-2 text-sm text-slate-300">
                  <div>
                    <dt className="text-slate-500">Artifact</dt>
                    <dd>{source.artifactPath}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Snapshot time</dt>
                    <dd>{formatTimestamp(source.generatedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Coverage</dt>
                    <dd>{source.rowCountLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Origin</dt>
                    <dd className="break-all text-slate-400">{source.source}</dd>
                  </div>
                </dl>
                {source.notes.length ? (
                  <ul className="mt-4 space-y-1 text-sm leading-6 text-slate-400">
                    {source.notes.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-sm leading-6 text-slate-400">
            No source-freshness artifact was available. Movers and scatter panels can still render if their dedicated artifacts exist, but provenance cards stay blank until source-freshness.json is committed.
          </div>
        )}
      </section>
    </main>
  );
}
