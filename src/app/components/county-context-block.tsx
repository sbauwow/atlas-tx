import type { CountyContextSnapshot } from "@/lib/county-context";

export type CountyContextBlockProps = {
  context: CountyContextSnapshot;
  alertsCount?: number;
  gaugeCount?: number;
  sewerOverflowCount?: number;
  countyName: string;
};

export function CountyContextBlock({
  context,
  alertsCount = 0,
  gaugeCount = 0,
  sewerOverflowCount = 0,
  countyName,
}: CountyContextBlockProps) {
  const { surfaceWater, hydrology } = context;
  const impairedShare = surfaceWater.totalSegments > 0
    ? Math.round((surfaceWater.impairedSegments / surfaceWater.totalSegments) * 100)
    : null;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300/80">Investigation context</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Weather + hydrology context for {countyName}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Composite operating context — active hazards, hydrologic features, surface-water condition, and infrastructure footprint — pulled from cached snapshots only.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ContextPanel
          tone="hazard"
          eyebrow="Active hazard footprint"
          title={`${alertsCount} active alert${alertsCount === 1 ? "" : "s"}`}
          body={alertsCount > 0
            ? "NWS or local alerts are currently active in the Atlas water-summary feed for this county."
            : "No NWS-driven alerts active in the cached water-summary feed. Drought + precipitation context land once those snapshots are committed."}
          footnote={sewerOverflowCount > 0 ? `${sewerOverflowCount} sewer overflow${sewerOverflowCount === 1 ? "" : "s"} in the last 30 days.` : "No sewer overflow rows in the 30-day window."}
        />

        <ContextPanel
          tone="hydrology"
          eyebrow="Hydrology features"
          title={`${hydrology.features.length} TWDB feature${hydrology.features.length === 1 ? "" : "s"}`}
          body={hydrology.features.length > 0
            ? hydrology.features.slice(0, 4).map((feature) => feature.name ?? feature.primaryCode).filter(Boolean).join(" · ") || "Hydrology features detected via TWDB centroid match."
            : "No TWDB hydrology features overlap this county centroid in the cached snapshot."}
          footnote={layerSummary(hydrology.layerCounts)}
        />

        <ContextPanel
          tone="surface"
          eyebrow="Surface water condition"
          title={surfaceWater.totalSegments > 0
            ? `${surfaceWater.impairedSegments} impaired / ${surfaceWater.totalSegments} segments`
            : "No segments cached"}
          body={surfaceWater.totalSegments > 0
            ? `${impairedShare}% of cached TCEQ surface segments in this county carry at least one impairment flag.`
            : "No TCEQ-classified surface segments in this county for the cached assessment year."}
          footnote={surfaceWater.basins.length > 0 ? `Basin: ${surfaceWater.basins.slice(0, 2).join(", ")}${surfaceWater.basins.length > 2 ? "+" : ""}` : null}
        />

        <ContextPanel
          tone="dwrs"
          eyebrow="Drinking-water exposure"
          title={context.drinkingWater.violationCount > 0
            ? `${context.drinkingWater.violationCount.toLocaleString("en-US")} SDWIS violations`
            : "No SDWIS violations cached"}
          body={context.drinkingWater.violationCount > 0
            ? `${context.drinkingWater.pwsCount} public water system${context.drinkingWater.pwsCount === 1 ? "" : "s"} with cached health-based violations since 2023-04-01. ${context.drinkingWater.populationExposed.toLocaleString("en-US")} people served by those systems.`
            : "No cached SDWIS health-based violation rows in this county since 2023-04-01."}
          footnote={dwrsFootnote(context.drinkingWater)}
        />

        <ContextPanel
          tone="infra"
          eyebrow="Stream gauge coverage"
          title={`${gaugeCount} active gauge${gaugeCount === 1 ? "" : "s"}`}
          body={gaugeCount > 0
            ? "USGS-fed gauges available in the Atlas water-summary feed for this county."
            : "No active stream gauges in the cached water-summary feed. Hydrologic stress signal lands once gauges fold in."}
          footnote="USGS streamflow anomaly + drought class join in next-up."
        />

        <ContextPanel
          tone="notice"
          eyebrow="Boil-water proxy · microbial rule"
          title={context.publicNotices.microbialViolations > 0
            ? `${context.publicNotices.microbialViolations.toLocaleString("en-US")} microbial violations`
            : "No microbial violations cached"}
          body={context.publicNotices.microbialViolations > 0
            ? `${context.publicNotices.microbialPwsImpacted} PWS${context.publicNotices.microbialPwsImpacted === 1 ? "" : "es"} carry SDWIS rule-group 100 (microbial) violations — the same rule that triggers Texas boil-water advisories.${context.publicNotices.tier1ViolationCount > 0 ? ` ${context.publicNotices.tier1ViolationCount} of those are Tier 1 (24-hour public notice).` : ""}`
            : "No SDWIS rule-group 100 microbial violations cached for this county. Tier-1 boil-water-equivalent events activate this lane when they post."}
          footnote={publicNoticeFootnote(context.publicNotices)}
        />
      </div>

      {surfaceWater.topImpairedSegments.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-5 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Impaired surface segments in this county</div>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300 md:grid-cols-2">
            {surfaceWater.topImpairedSegments.map((segment) => (
              <li key={`${segment.segmentId}-${segment.segmentName}`} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                <div className="font-medium text-white">{segment.segmentName ?? segment.segmentId ?? "Unnamed segment"}</div>
                <div className="mt-0.5 text-xs text-slate-400">{segment.basin ?? "—"} · {segment.flags.join(", ")}</div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-slate-500">Impairment is a legal-use-support classification, not a direct harm claim.</p>
        </div>
      ) : null}
    </section>
  );
}

function layerSummary(layerCounts: Record<string, number>): string | null {
  const entries = Object.entries(layerCounts).filter(([, count]) => count > 0);
  if (!entries.length) return null;
  return entries.slice(0, 3).map(([layer, count]) => `${count} ${layer}`).join(" · ");
}

function publicNoticeFootnote(pn: {
  topMicrobialPws: { pwsName: string; violationCount: number } | null;
  latestMicrobialViolation: string | null;
  tier1ViolationCount: number;
}): string | null {
  const parts: string[] = [];
  if (pn.topMicrobialPws) {
    parts.push(`Top PWS: ${pn.topMicrobialPws.pwsName} (${pn.topMicrobialPws.violationCount} viol.)`);
  }
  if (pn.latestMicrobialViolation) {
    parts.push(`Latest: ${pn.latestMicrobialViolation}`);
  }
  return parts.length ? parts.join(" · ") : null;
}

function dwrsFootnote(dw: { topViolatingPws: { pwsName: string; violationCount: number } | null; topContaminantCode: string | null; populationExposureRate: number | null; acsCountyPopulation: number | null }): string | null {
  const parts: string[] = [];
  if (dw.topViolatingPws) {
    parts.push(`Top PWS: ${dw.topViolatingPws.pwsName} (${dw.topViolatingPws.violationCount} viol.)`);
  }
  if (dw.topContaminantCode) {
    parts.push(`Top contaminant code: ${dw.topContaminantCode}`);
  }
  if (dw.populationExposureRate !== null && dw.acsCountyPopulation !== null) {
    parts.push(`${Math.round(dw.populationExposureRate * 100)}% of ACS county pop served by violating PWSs`);
  }
  return parts.length ? parts.join(" · ") : null;
}

const TONE_RING: Record<"hazard" | "hydrology" | "surface" | "infra" | "dwrs" | "notice", string> = {
  hazard: "ring-amber-400/15 bg-amber-400/[0.04]",
  hydrology: "ring-cyan-400/15 bg-cyan-400/[0.04]",
  surface: "ring-emerald-400/15 bg-emerald-400/[0.04]",
  infra: "ring-slate-300/10 bg-white/[0.03]",
  dwrs: "ring-fuchsia-400/15 bg-fuchsia-400/[0.04]",
  notice: "ring-rose-400/15 bg-rose-400/[0.04]",
};

const TONE_EYEBROW: Record<"hazard" | "hydrology" | "surface" | "infra" | "dwrs" | "notice", string> = {
  hazard: "text-amber-200",
  hydrology: "text-cyan-200",
  surface: "text-emerald-200",
  infra: "text-slate-300",
  dwrs: "text-fuchsia-200",
  notice: "text-rose-200",
};

function ContextPanel({
  tone,
  eyebrow,
  title,
  body,
  footnote,
}: {
  tone: "hazard" | "hydrology" | "surface" | "infra" | "dwrs" | "notice";
  eyebrow: string;
  title: string;
  body: string;
  footnote?: string | null;
}) {
  return (
    <article className={`rounded-2xl ring-1 ${TONE_RING[tone]} p-5`}>
      <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${TONE_EYEBROW[tone]}`}>{eyebrow}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-white">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
      {footnote ? <p className="mt-2 text-xs leading-5 text-slate-500">{footnote}</p> : null}
    </article>
  );
}
