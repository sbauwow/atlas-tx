import Link from "next/link";

import { CountyHeadlinerMap } from "@/app/components/county-headliner-map";
import type { CountyMapRecord, CountyMetricMode } from "@/app/components/county-map-primitives";
import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";

export const dynamic = "force-dynamic";

const METRIC_MODES: CountyMetricMode[] = [
  {
    id: "observations",
    label: "Citizen observations",
    description: "Total observations submitted from a county since persistence started.",
    legendTitle: "Observations",
    valueLabel: "submissions",
    format: "integer",
    buckets: [
      { label: "0", fill: "rgba(15,23,42,0.35)", min: 0, max: 0 },
      { label: "1", fill: "rgba(56,189,248,0.45)", min: 1, max: 1 },
      { label: "2-4", fill: "rgba(34,211,238,0.6)", min: 2, max: 4 },
      { label: "5-9", fill: "rgba(125,211,252,0.75)", min: 5, max: 9 },
      { label: "10+", fill: "rgba(186,230,253,0.85)", min: 10 },
    ],
  },
  {
    id: "completed",
    label: "Completed observations",
    description: "Observations that have passed analysis (status = completed).",
    legendTitle: "Completed",
    valueLabel: "completed",
    format: "integer",
    buckets: [
      { label: "0", fill: "rgba(15,23,42,0.35)", min: 0, max: 0 },
      { label: "1", fill: "rgba(110,231,183,0.4)", min: 1, max: 1 },
      { label: "2-4", fill: "rgba(52,211,153,0.55)", min: 2, max: 4 },
      { label: "5+", fill: "rgba(16,185,129,0.7)", min: 5 },
    ],
  },
];

type CountyAggregate = {
  slug: string;
  name: string;
  observationCount: number;
  completedCount: number;
  pendingCount: number;
  latestAt: Date | null;
};

type ObservationSnapshot = {
  rows: Array<{
    id: string;
    countySlug: string | null;
    kind: string;
    status: string;
    createdAt: Date;
  }>;
  available: boolean;
  errorMessage: string | null;
};

async function loadObservationSnapshot(): Promise<ObservationSnapshot> {
  try {
    const { prisma } = await import("@/lib/db");
    const rows = await prisma.waterObservation.findMany({
      select: { id: true, countySlug: true, kind: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return { rows, available: true, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { rows: [], available: false, errorMessage: message };
  }
}

function deriveCountyName(slug: string): string {
  const tokens = slug.split("-");
  const cased = tokens.map((token) => (token.length ? token[0].toUpperCase() + token.slice(1) : token)).join(" ");
  return /county$/i.test(cased) ? cased : `${cased} County`;
}

export const metadata = {
  title: "Atlas TX — Maps · Citizen observations",
  description: "Recent grassroots water-strip observations aggregated to Texas counties.",
};

export default async function CitizenMapPage() {
  const snapshot = await loadObservationSnapshot();

  const aggregates = new Map<string, CountyAggregate>();
  for (const row of snapshot.rows) {
    if (!row.countySlug) continue;
    let entry = aggregates.get(row.countySlug);
    if (!entry) {
      entry = {
        slug: row.countySlug,
        name: deriveCountyName(row.countySlug),
        observationCount: 0,
        completedCount: 0,
        pendingCount: 0,
        latestAt: null,
      };
      aggregates.set(row.countySlug, entry);
    }
    entry.observationCount += 1;
    if (row.status === "completed") entry.completedCount += 1;
    if (row.status === "pending") entry.pendingCount += 1;
    if (!entry.latestAt || row.createdAt > entry.latestAt) entry.latestAt = row.createdAt;
  }

  const ranked = [...aggregates.values()].sort((a, b) => b.observationCount - a.observationCount);

  const counties: CountyMapRecord[] = ranked.map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    fips: TEXAS_COUNTY_CENTROIDS[entry.slug]?.fips,
    href: `/counties/${entry.slug}`,
    metrics: {
      observations: entry.observationCount,
      completed: entry.completedCount,
    },
    context: entry.latestAt ? `Latest ${entry.latestAt.toISOString().slice(0, 10)}` : `${entry.observationCount} submissions`,
  }));

  const totalObservations = snapshot.rows.length;
  const totalCounties = aggregates.size;
  const completedTotal = snapshot.rows.filter((row) => row.status === "completed").length;
  const recent = snapshot.rows.slice(0, 8);

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
            Atlas TX · Map · Citizen observations
          </span>
          <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-200">
            Scaffold + 1 layer
          </span>
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Citizen water-strip observations across Texas.
        </h1>
        <p className="max-w-3xl text-pretty text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          Recent grassroots strip submissions aggregated to county footprints. The map activates per county as community data lands via the public observation API and the in-progress Android capture client.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-3">
        <StatTile label="Counties with observations" value={totalCounties} />
        <StatTile label="Total observations" value={totalObservations} />
        <StatTile label="Completed analyses" value={completedTotal} />
      </section>

      {snapshot.available ? (
        <CountyHeadlinerMap
          title="Citizen observation choropleth"
          subtitle="County color reflects submission count, with a secondary mode for completed-analysis count. Submissions are framed as community signals — never compliance verdicts."
          eyebrow="Citizen API · live"
          counties={counties}
          metricModes={METRIC_MODES}
          defaultMetricId="observations"
          sourceLabel="WaterObservation table via Prisma"
          caveat="Citizen submissions are non-regulatory community signals. Use them as additional context alongside the SDWIS, EJ, and TCEQ lanes — never as standalone proof of harm."
          emptyTitle="Submissions catching up"
          emptyMessage="No counties have submissions in the current observation table yet. The map activates the moment the first /citizen submission lands."
        />
      ) : (
        <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Local observation store unavailable</div>
          <h2 className="mt-2 text-lg font-semibold text-white">Citizen DB not provisioned in this build</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            The choropleth wiring is in place but the local <code className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-xs text-slate-300">prisma/dev.db</code> SQLite file has not been provisioned in this environment. Run <code className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-xs text-slate-300">npx prisma migrate dev</code> in the worktree to enable live submissions, then refresh this page.
          </p>
          {snapshot.errorMessage ? (
            <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950/60 p-3 text-[11px] leading-5 text-rose-200 ring-1 ring-rose-500/20">{snapshot.errorMessage}</pre>
          ) : null}
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Recent submissions</div>
          {recent.length ? (
            <ol className="mt-4 space-y-2.5 text-sm leading-6 text-slate-300">
              {recent.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-xs uppercase tracking-[0.16em] text-slate-500">{row.kind}</div>
                    <div className="truncate font-medium text-white">{row.countySlug ? deriveCountyName(row.countySlug) : "County not attached"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{row.status}</div>
                    <div className="font-mono text-[11px] tabular-nums text-cyan-200">{row.createdAt.toISOString().slice(0, 10)}</div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm leading-6 text-slate-400">
              No citizen submissions in the current observation store. The first /citizen capture will activate this lane.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Planned follow-on layers</div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <PlannedRow label="Per-observation pin layer" detail="Plot individual GPS-attached submissions when the Android client starts attaching coordinates." />
            <PlannedRow label="Strip-class disagreement signal" detail="Flag counties where citizen-reported analyte values disagree with regulatory data." />
            <PlannedRow label="QA flag overlay" detail="Surface qaFlags so reviewers can spot suspicious submissions before they hit the public lane." />
            <PlannedRow label="Volume vs. burden cross-plot" detail="Pair grassroots submission density with SDWIS/EJ burden to find under-monitored counties." />
          </ul>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/maps" className="rounded-full border border-white/10 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
          ← Back to maps
        </Link>
        <Link href="/citizen" className="rounded-full bg-white px-5 py-2.5 font-medium text-slate-950 transition-colors hover:bg-slate-200">
          Submit an observation →
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
