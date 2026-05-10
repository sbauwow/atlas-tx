import Link from "next/link";

import { MicroBar } from "@/app/components/data-viz";
import type { SeverityLevel } from "@/app/design/states";
import { getDefaultAtlasWaterSummaryService } from "@/lib/water/water-summary-service";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    key: "geography",
    label: "Geography",
    blurb: "What ground is exposed before any single event happens.",
    sources: ["FEMA NFHL", "USGS NWIS"],
  },
  {
    key: "conditions",
    label: "Conditions",
    blurb: "Active weather and stream signals that move on the day.",
    sources: ["NWS alerts", "USGS gauges"],
  },
  {
    key: "operational",
    label: "Operational",
    blurb: "Infrastructure incidents that push the system out of normal.",
    sources: ["TCEQ sewer overflows 30d", "LCRA ARRP"],
  },
  {
    key: "notice",
    label: "Public notice",
    blurb: "What got logged where the public can read it.",
    sources: ["TCEQ permits", "TCEQ surface-water-quality"],
  },
  {
    key: "people",
    label: "People",
    blurb: "Who lives downstream of all of this.",
    sources: ["TCEQ water districts", "TCEQ utilities"],
  },
] as const;

export default async function MechanismPage({
  searchParams,
}: {
  searchParams?: Promise<{ county?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const requestedCounty = Array.isArray(params?.county) ? params?.county[0] : params?.county;
  const service = getDefaultAtlasWaterSummaryService();
  const overview = await service.getWaterOverview();

  const candidate = overview.counties
    .filter((c) => (c.mismatch?.score ?? 0) > 0)
    .sort((a, b) => (b.mismatch?.score ?? 0) - (a.mismatch?.score ?? 0))[0]
    ?? overview.counties[0];
  const targetSlug = requestedCounty ?? candidate?.county.slug;
  const breakdown = targetSlug ? await service.getCountyWaterBreakdown(targetSlug) : null;

  if (!breakdown) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
        <h1 className="text-3xl font-semibold text-white">No counties available.</h1>
        <p className="text-slate-400">Refresh the water cache and try again.</p>
      </main>
    );
  }

  const m = breakdown.county.metrics;
  const stateMaxes = overview.counties.reduce(
    (acc, c) => {
      acc.floodplain = Math.max(acc.floodplain, c.metrics.floodplainFeatureCount ?? 0);
      acc.alerts = Math.max(acc.alerts, c.metrics.activeWaterAlertCount ?? 0);
      acc.gauges = Math.max(acc.gauges, c.metrics.streamGaugeCount ?? 0);
      acc.overflows = Math.max(acc.overflows, c.metrics.sewerOverflowCount30d ?? 0);
      acc.permits = Math.max(acc.permits, c.metrics.generalPermitCount ?? 0);
      acc.impaired = Math.max(acc.impaired, c.metrics.impairedSurfaceWaterSegmentCount ?? 0);
      acc.governance = Math.max(acc.governance, (c.metrics.waterDistrictCount ?? 0) + (c.metrics.waterUtilityCount ?? 0));
      return acc;
    },
    { floodplain: 1, alerts: 1, gauges: 1, overflows: 1, permits: 1, impaired: 1, governance: 1 },
  );

  const altCandidates = [...overview.counties]
    .filter((c) => (c.mismatch?.score ?? 0) > 0 && c.county.slug !== breakdown.county.county.slug)
    .sort((a, b) => (b.mismatch?.score ?? 0) - (a.mismatch?.score ?? 0))
    .slice(0, 6);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/water" className="rounded-full border border-white/15 px-3 py-1.5 text-slate-200 hover:bg-white/5">
            Back to water map
          </Link>
          <Link href={`/water/counties/${breakdown.county.county.slug}`} className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-cyan-200 hover:bg-cyan-400/15">
            Open {breakdown.county.county.name} page
          </Link>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          Evidence chain · one county
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {breakdown.county.county.name}: from ground to people.
        </h1>
        <p className="max-w-3xl text-pretty text-base leading-7 text-slate-400">
          Five stacked panels, one county, one direction of read. Geography first, people last. Every number traces to a public dataset. Nothing inferred.
        </p>
        {breakdown.county.mismatch?.flags?.length ? (
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            {breakdown.county.mismatch.flags.map((flag) => (
              <span key={flag} className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-amber-100">
                ⚠ {flag}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <ol className="relative space-y-6 border-l border-white/10 pl-6">
        {STEPS.map((step, idx) => (
          <li key={step.key} className="relative">
            <span aria-hidden="true" className="absolute -left-[31px] top-2 flex size-5 items-center justify-center rounded-full bg-slate-950 text-[10px] font-mono text-slate-500 ring-1 ring-white/15">
              {idx + 1}
            </span>
            <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 ring-1 ring-white/5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-semibold text-white">{step.label}</h2>
                <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{step.sources.join(" · ")}</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{step.blurb}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {step.key === "geography" ? (
                  <>
                    <ChainStat
                      label="NFHL floodplain features"
                      value={m.floodplainFeatureCount ?? 0}
                      max={stateMaxes.floodplain}
                      severity={3}
                    />
                    <ChainStat
                      label="Stream gauges"
                      value={m.streamGaugeCount ?? 0}
                      max={stateMaxes.gauges}
                      severity={2}
                    />
                  </>
                ) : null}
                {step.key === "conditions" ? (
                  <>
                    <ChainStat
                      label="Active NWS water alerts"
                      value={m.activeWaterAlertCount ?? 0}
                      max={stateMaxes.alerts}
                      severity={4}
                    />
                    <ChainStat
                      label="Latest LCRA observation"
                      value={m.latestLcraObservationAt ? 1 : 0}
                      max={1}
                      severity={2}
                      detail={m.latestLcraObservationAt ?? "—"}
                    />
                  </>
                ) : null}
                {step.key === "operational" ? (
                  <>
                    <ChainStat
                      label="Sewer overflows (30d)"
                      value={m.sewerOverflowCount30d ?? 0}
                      max={stateMaxes.overflows}
                      severity={3}
                      detail={m.sewerOverflowGallons30d ? `${m.sewerOverflowGallons30d.toLocaleString("en-US")} gal reported` : undefined}
                    />
                    <ChainStat
                      label="LCRA ARRP outfalls"
                      value={m.lcraArrpOutfallCount ?? 0}
                      max={Math.max(1, m.lcraArrpOutfallCount ?? 0)}
                      severity={2}
                    />
                  </>
                ) : null}
                {step.key === "notice" ? (
                  <>
                    <ChainStat
                      label="General permits"
                      value={m.generalPermitCount ?? 0}
                      max={stateMaxes.permits}
                      severity={2}
                    />
                    <ChainStat
                      label="Impaired surface-water segments"
                      value={m.impairedSurfaceWaterSegmentCount ?? 0}
                      max={stateMaxes.impaired}
                      severity={3}
                    />
                  </>
                ) : null}
                {step.key === "people" ? (
                  <>
                    <ChainStat
                      label="Water districts"
                      value={m.waterDistrictCount ?? 0}
                      max={stateMaxes.governance}
                      severity={1}
                    />
                    <ChainStat
                      label="Water utilities"
                      value={m.waterUtilityCount ?? 0}
                      max={stateMaxes.governance}
                      severity={1}
                    />
                  </>
                ) : null}
              </div>
            </article>
          </li>
        ))}
      </ol>

      {altCandidates.length ? (
        <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Walk another county</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {altCandidates.map((c) => (
              <Link
                key={c.county.slug}
                href={`/water/mechanism?county=${c.county.slug}`}
                className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5"
              >
                {c.county.name}
                <span className="ml-1.5 font-mono tabular-nums text-slate-500">m{c.mismatch?.score}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function ChainStat({
  label,
  value,
  max,
  severity,
  detail,
}: {
  label: string;
  value: number;
  max: number;
  severity: SeverityLevel;
  detail?: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{label}</span>
        <span className="font-mono tabular-nums text-base text-white">{value.toLocaleString("en-US")}</span>
      </div>
      <div className="mt-2">
        <MicroBar value={value} median={Math.round(max / 4)} max={max} severity={severity} width={220} height={8} />
      </div>
      {detail ? <div className="mt-2 text-xs text-slate-500">{detail}</div> : null}
    </div>
  );
}
