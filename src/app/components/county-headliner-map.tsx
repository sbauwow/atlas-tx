"use client";

import { useId, useMemo, useState } from "react";

import { ChartEmptyState, ChartShell } from "@/app/components/charts/chart-shell";

import {
  ChoroplethTooltipLayer,
  type ChoroplethTooltipContent,
  type ChoroplethTooltipRow,
} from "./choropleth-tooltip-layer";
import {
  CountyChoroplethSvg,
  formatCountyMetricValue,
  rankCountiesForMetric,
  type CountyMapOverlay,
  type CountyMapRecord,
  type CountyMetricMode,
} from "./county-map-primitives";

export type CountyHeadlinerMapProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  counties: CountyMapRecord[];
  metricModes: CountyMetricMode[];
  defaultMetricId?: string;
  activeMetricId?: string;
  selectedCountySlug?: string | null;
  overlays?: CountyMapOverlay[];
  correlationPrompts?: string[];
  emptyTitle?: string;
  emptyMessage?: string;
  sourceLabel?: string;
  freshnessLabel?: string;
  caveat?: string;
  footer?: string;
  className?: string;
  ariaLabel?: string;
};

function renderOverlaySwatch(overlay: CountyMapOverlay) {
  if (overlay.tone === "hatch") {
    return <span className="h-3.5 w-3.5 rounded-[4px] border border-white/30 bg-[repeating-linear-gradient(135deg,rgba(248,250,252,0.95)_0,rgba(248,250,252,0.95)_2px,transparent_2px,transparent_5px)]" aria-hidden="true" />;
  }

  return <span className="h-3.5 w-3.5 rounded-[4px] border" style={{ borderColor: overlay.color ?? "rgba(248,250,252,0.8)", backgroundColor: "rgba(15,23,42,0.4)" }} aria-hidden="true" />;
}

export function CountyHeadlinerMap({
  title,
  subtitle,
  eyebrow,
  counties,
  metricModes,
  defaultMetricId,
  activeMetricId,
  selectedCountySlug,
  overlays = [],
  correlationPrompts = [],
  emptyTitle = "Map unavailable",
  emptyMessage = "County geometry is ready, but the requested metric layer is empty.",
  sourceLabel,
  freshnessLabel,
  caveat,
  footer,
  className,
  ariaLabel,
}: CountyHeadlinerMapProps) {
  const [internalMetricId, setInternalMetricId] = useState(defaultMetricId ?? metricModes[0]?.id ?? "");
  const metricId = activeMetricId ?? internalMetricId;
  const metricMode = metricModes.find((mode) => mode.id === metricId) ?? metricModes[0] ?? null;
  const topCounties = useMemo(() => (metricMode ? rankCountiesForMetric(counties, metricMode).slice(0, 5) : []), [counties, metricMode]);
  const svgIdPrefix = useId().replace(/[:]/g, "_");

  const overlaySlugSets = useMemo(
    () => overlays.map((overlay) => ({ overlay, slugSet: new Set(overlay.countySlugs) })),
    [overlays],
  );

  const tooltipsBySlug = useMemo<Array<[string, ChoroplethTooltipContent]>>(() => {
    if (!metricMode) return [];
    return counties.map((county) => {
      const value = county.metrics[metricMode.id];
      const formatted = formatCountyMetricValue(metricMode, value);
      const rows: ChoroplethTooltipRow[] = [
        {
          label: metricMode.valueLabel ?? metricMode.label,
          value: formatted,
          tone: value === null || value === undefined || Number.isNaN(value) ? "muted" : "accent",
        },
      ];
      if (county.context) {
        rows.push({ value: county.context, tone: "muted" });
      }
      for (const { overlay, slugSet } of overlaySlugSets) {
        if (slugSet.has(county.slug)) {
          rows.push({ value: overlay.label, tone: "warn" });
        }
      }
      return [
        county.slug,
        {
          title: county.name,
          subtitle: metricMode.label,
          rows,
          footer: county.href ? "Click for county detail." : undefined,
        },
      ];
    });
  }, [counties, metricMode, overlaySlugSets]);

  if (!metricMode) {
    return (
      <ChartShell
        title={title}
        subtitle={subtitle}
        eyebrow={eyebrow}
        sourceLabel={sourceLabel}
        freshnessLabel={freshnessLabel}
        caveat={caveat}
        footer={footer}
        className={className}
      >
        <ChartEmptyState title={emptyTitle} message={emptyMessage} />
      </ChartShell>
    );
  }

  const hasMetricData = counties.some((county) => {
    const value = county.metrics[metricMode.id];
    return value !== null && value !== undefined && !Number.isNaN(value);
  });

  const controls = metricModes.length > 1 ? (
    <div className="flex flex-wrap justify-end gap-2">
      {metricModes.map((mode) => {
        const isActive = mode.id === metricMode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => setInternalMetricId(mode.id)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-medium tracking-[0.16em] uppercase transition-colors",
              isActive
                ? "border-cyan-300/70 bg-cyan-300/15 text-cyan-100"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200",
            ].join(" ")}
            aria-pressed={isActive}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <ChartShell
      title={title}
      subtitle={subtitle}
      eyebrow={eyebrow}
      sourceLabel={sourceLabel}
      freshnessLabel={freshnessLabel}
      caveat={caveat}
      footer={footer}
      className={className}
      aside={controls}
    >
      {hasMetricData ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,0.9fr)]">
          <div className="space-y-4">
            <div className="rounded-[1.6rem] border border-white/8 bg-slate-950/80 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <ChoroplethTooltipLayer tooltips={tooltipsBySlug}>
                <CountyChoroplethSvg
                  counties={counties}
                  metricMode={metricMode}
                  overlays={overlays}
                  selectedCountySlug={selectedCountySlug}
                  ariaLabel={ariaLabel ?? `${title} county map`}
                  idPrefix={`county-headliner-${svgIdPrefix}`}
                />
              </ChoroplethTooltipLayer>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
              <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Legend</div>
                <div className="mt-3 space-y-2">
                  <div className="text-sm font-medium text-white">{metricMode.legendTitle ?? metricMode.label}</div>
                  {metricMode.description ? <p className="text-sm leading-6 text-slate-400">{metricMode.description}</p> : null}
                </div>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {metricMode.buckets.map((bucket) => (
                    <li key={bucket.label} className="flex items-center gap-3">
                      <span className="h-3.5 w-3.5 rounded-[4px] border border-white/10" style={{ backgroundColor: bucket.fill }} aria-hidden="true" />
                      <span>{bucket.label}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-3">
                    <span className="h-3.5 w-3.5 rounded-[4px] border border-white/10 bg-slate-600/60" aria-hidden="true" />
                    <span>{metricMode.noDataLabel ?? "No data"}</span>
                  </li>
                </ul>
                {overlays.length ? (
                  <div className="mt-5 border-t border-white/8 pt-4">
                    <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Overlays</div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                      {overlays.map((overlay) => (
                        <li key={overlay.id} className="flex items-start gap-3">
                          {renderOverlaySwatch(overlay)}
                          <div>
                            <div className="text-slate-200">{overlay.label}</div>
                            {overlay.description ? <div className="text-slate-500">{overlay.description}</div> : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
              <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Correlation prompts</div>
                <div className="mt-3 text-sm font-medium text-white">Read this layer like a lead, not a leaderboard.</div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
                  {(correlationPrompts.length
                    ? correlationPrompts
                    : [
                        "Flip between metric modes to see which counties stay bright across unrelated burdens versus which only flare in one layer.",
                        "Use overlays to isolate counties where the highlighted pattern may explain why a metric spikes or refuses to move.",
                        "Check the top list for repeat names, then trace whether they cluster geographically or break the regional pattern.",
                      ]
                  ).map((prompt) => (
                    <li key={prompt} className="flex gap-2">
                      <span className="mt-1 text-cyan-300">•</span>
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
          <aside className="space-y-4">
            <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Top counties</div>
              <div className="mt-3 text-sm font-medium text-white">{metricMode.valueLabel ?? metricMode.label}</div>
              <ol className="mt-4 space-y-3">
                {topCounties.map((county, index) => (
                  <li key={`${metricMode.id}-${county.slug}`} className="flex items-start justify-between gap-3 border-b border-white/6 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <div className="text-sm font-medium text-slate-100">
                        {index + 1}. {county.href ? <a href={county.href} className="transition-colors hover:text-cyan-200">{county.name}</a> : county.name}
                      </div>
                      {county.context ? <div className="mt-1 text-xs leading-5 text-slate-500">{county.context}</div> : null}
                    </div>
                    <div className="text-sm font-semibold text-cyan-100">{formatCountyMetricValue(metricMode, county.metrics[metricMode.id])}</div>
                  </li>
                ))}
              </ol>
            </section>
            <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Mode notes</div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
                <p>{metricMode.description ?? "Each mode re-colors the same county base layer so analysts can hunt for persistence, divergence, and spatial spillover."}</p>
                <p>Use the mode chips to swap the numerator without losing geographic memory.</p>
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <ChartEmptyState title={emptyTitle} message={emptyMessage} />
      )}
    </ChartShell>
  );
}
