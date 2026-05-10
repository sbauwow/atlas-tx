import Link from "next/link";

import { CountyHeadlinerMap } from "@/app/components/county-headliner-map";
import type { CountyMapRecord, CountyMetricMode } from "@/app/components/county-map-primitives";
import GlossaryTooltip from "@/app/components/glossary-tooltip";
import { countySlug } from "@/lib/counties";
import { loadSdwisSnapshot } from "@/lib/datasets/sdwis";
import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";

const METRIC_MODES: CountyMetricMode[] = [
  {
    id: "violations",
    label: "Health-based violations",
    description: "Cached SDWIS health-based violation rows per county since 2023-04-01.",
    legendTitle: "Violations",
    valueLabel: "violations",
    format: "integer",
    buckets: [
      { label: "0", fill: "rgba(15,23,42,0.35)", min: 0, max: 0 },
      { label: "1-9", fill: "rgba(56,189,248,0.45)", min: 1, max: 9 },
      { label: "10-29", fill: "rgba(34,211,238,0.6)", min: 10, max: 29 },
      { label: "30-99", fill: "rgba(249,168,212,0.75)", min: 30, max: 99 },
      { label: "100+", fill: "rgba(244,63,94,0.85)", min: 100 },
    ],
  },
  {
    id: "populationExposed",
    label: "Population served by violating PWSs",
    description: "Sum of populationServed across PWSs with at least one cached health-based violation in the snapshot window.",
    legendTitle: "People exposed",
    valueLabel: "people",
    format: "integer",
    buckets: [
      { label: "0", fill: "rgba(15,23,42,0.35)", min: 0, max: 0 },
      { label: "1-4,999", fill: "rgba(56,189,248,0.45)", min: 1, max: 4_999 },
      { label: "5k-49k", fill: "rgba(34,211,238,0.6)", min: 5_000, max: 49_999 },
      { label: "50k-499k", fill: "rgba(249,168,212,0.75)", min: 50_000, max: 499_999 },
      { label: "500k+", fill: "rgba(244,63,94,0.85)", min: 500_000 },
    ],
  },
];

type CountyAggregate = {
  slug: string;
  name: string;
  violationCount: number;
  populationExposed: number;
  pwsIds: Set<string>;
  topPws: { pwsName: string; populationServed: number; violationCount: number } | null;
};

export const metadata = {
  title: "Atlas TX — Maps · Environmental-justice burden",
  description: "SDWIS health-based violations aggregated to Texas counties as a drinking-water exposure layer.",
};

export default async function EjMapPage() {
  const snapshot = await loadSdwisSnapshot();

  const aggregates = new Map<string, CountyAggregate>();
  const pwsTracker = new Map<string, { county: string; pwsName: string; populationServed: number; violationCount: number }>();

  for (const row of snapshot.rows) {
    if (!row.county) continue;
    const slug = countySlug(row.county);
    if (!slug) continue;

    let entry = aggregates.get(slug);
    if (!entry) {
      const cleaned = row.county.replace(/\s+County$/i, "").trim();
      entry = {
        slug,
        name: `${cleaned} County`,
        violationCount: 0,
        populationExposed: 0,
        pwsIds: new Set<string>(),
        topPws: null,
      };
      aggregates.set(slug, entry);
    }
    entry.violationCount += 1;

    const pwsKey = `${slug}::${row.pwsid}`;
    const tracker = pwsTracker.get(pwsKey);
    if (tracker) {
      tracker.violationCount += 1;
    } else {
      pwsTracker.set(pwsKey, {
        county: slug,
        pwsName: row.pwsName ?? row.pwsid,
        populationServed: row.populationServed ?? 0,
        violationCount: 1,
      });
      entry.pwsIds.add(row.pwsid);
      entry.populationExposed += row.populationServed ?? 0;
    }
  }

  for (const tracker of pwsTracker.values()) {
    const entry = aggregates.get(tracker.county);
    if (!entry) continue;
    if (!entry.topPws || tracker.violationCount > entry.topPws.violationCount) {
      entry.topPws = {
        pwsName: tracker.pwsName,
        populationServed: tracker.populationServed,
        violationCount: tracker.violationCount,
      };
    }
  }

  const ranked = [...aggregates.values()].sort(
    (a, b) => b.violationCount - a.violationCount || b.populationExposed - a.populationExposed,
  );

  const counties: CountyMapRecord[] = ranked.map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    fips: TEXAS_COUNTY_CENTROIDS[entry.slug]?.fips,
    href: `/counties/${entry.slug}`,
    metrics: {
      violations: entry.violationCount,
      populationExposed: entry.populationExposed,
    },
    context: entry.topPws ? `Top PWS: ${entry.topPws.pwsName} (${entry.topPws.violationCount} viol.)` : `${entry.pwsIds.size} PWS impacted`,
  }));

  const totalViolations = ranked.reduce((sum, entry) => sum + entry.violationCount, 0);
  const totalPopulationExposed = ranked.reduce((sum, entry) => sum + entry.populationExposed, 0);
  const countiesWithViolations = ranked.filter((entry) => entry.violationCount > 0).length;

  const generatedAt = snapshot.generatedAt
    ? new Date(snapshot.generatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })
    : null;

  return (
    <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,211,238,0.10),transparent_70%)]"
      />

      <header className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            Atlas TX · Map · Environmental-justice burden
          </span>
          <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-200">
            Live cached layer
          </span>
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Drinking-water exposure across Texas counties.
        </h1>
        <p className="max-w-3xl text-pretty text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          Health-based <GlossaryTooltip term="SDWIS" expand /> violations and the population served by affected public water systems, aggregated to county footprints. This is the seed layer for a full <GlossaryTooltip term="DWRS" expand /> + <GlossaryTooltip term="EJ" /> overlay; <GlossaryTooltip term="EJScreen" /> burden index integration is wired in the data lib but lives behind the next-up queue.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-3">
        <StatTile label="Counties with violations" value={countiesWithViolations} />
        <StatTile label="Total cached violations" value={totalViolations} />
        <StatTile label="People served by violating PWSs" value={totalPopulationExposed} />
      </section>

      <CountyHeadlinerMap
        title="EJ exposure choropleth"
        subtitle="Toggle between violation count (procedural pressure) and people served (exposure footprint). Atlas frames both as burden / exposure indicators, not harm."
        eyebrow="SDWIS · health-based · 2023-04-01 onward"
        counties={counties}
        metricModes={METRIC_MODES}
        defaultMetricId="violations"
        sourceLabel="EPA SDWIS via cached snapshot"
        freshnessLabel={generatedAt ? `Snapshot ${generatedAt}` : undefined}
        caveat="SDWIS rows are self-reported by primacy agencies; recent quarters lag. Snapshot is filtered to TX health-based violations after 2023-04-01. EJ outputs derived from this should be framed as exposure / burden, not harm."
      />

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Top counties by exposure</div>
          <ol className="mt-4 space-y-2.5 text-sm leading-6 text-slate-300">
            {ranked.slice(0, 10).map((entry, index) => (
              <li key={entry.slug} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-white/5 text-xs font-semibold tabular-nums text-slate-200 ring-1 ring-white/10">{index + 1}</span>
                  <div>
                    <Link href={`/counties/${entry.slug}`} className="font-medium text-white transition-colors hover:text-cyan-300">
                      {entry.name}
                    </Link>
                    {entry.topPws ? (
                      <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Top PWS · {entry.topPws.pwsName}</div>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs tabular-nums text-cyan-200">{entry.violationCount.toLocaleString("en-US")}</div>
                  <div className="text-[11px] text-slate-500">{entry.populationExposed.toLocaleString("en-US")} ppl</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Planned follow-on layers</div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <PlannedRow label="EJScreen burden index" detail="EPA EJScreen by block group with buffer geocoding around PWS service areas." />
            <PlannedRow label="ACS demographic context" detail="Block-group race / income / language overlays beyond the current 3-county snapshot." />
            <PlannedRow label="DWRS composite scoring" detail="populationServed × recency × violation severity tier per `docs/contracts/dataset-registry.md`." />
            <PlannedRow label="EJ overlap signal" detail="Mismatch detection between burden density and procedural responsiveness." />
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/30 p-5 ring-1 ring-white/5">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Source caveats</div>
        <ul className="mt-3 space-y-1.5 text-sm leading-6 text-slate-400">
          {snapshot.caveats.map((caveat) => (
            <li key={caveat}>• {caveat}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/maps" className="rounded-full border border-white/10 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
          ← Back to maps
        </Link>
        <Link href="/water" className="rounded-full bg-white px-5 py-2.5 font-medium text-slate-950 transition-colors hover:bg-slate-200">
          Open the water explorer →
        </Link>
      </section>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-950/40 p-6">
      <div className="text-4xl font-semibold tabular-nums tracking-tight text-white">{value.toLocaleString("en-US")}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{label}</div>
    </div>
  );
}

function PlannedRow({ label, detail }: { label: string; detail: string }) {
  return (
    <li className="flex flex-col gap-0.5">
      <span className="font-medium text-white">{label}</span>
      <span className="text-xs text-slate-400">{detail}</span>
    </li>
  );
}
