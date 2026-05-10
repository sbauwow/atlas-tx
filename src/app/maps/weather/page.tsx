import { readFileSync } from "node:fs";
import { join } from "node:path";

import Link from "next/link";

import { CountyHeadlinerMap } from "@/app/components/county-headliner-map";
import type { CountyMapRecord, CountyMetricMode } from "@/app/components/county-map-primitives";
import { countySlug } from "@/lib/counties";
import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";

type SwqRow = {
  countyName?: string | null;
  isImpaired: boolean;
  impairmentFlags?: {
    aquaticLife?: boolean;
    contactRecreation?: boolean;
    generalUse?: boolean;
    fishConsumption?: boolean;
    publicWaterSupply?: boolean;
    oysterWaters?: boolean;
  };
  basinName?: string | null;
};

type SwqSnapshot = {
  generatedAt: string;
  source: string;
  rows: SwqRow[];
};

function loadSnapshot(): SwqSnapshot {
  const path = join(process.cwd(), "public", "cache", "surface-water-quality-tx.json");
  return JSON.parse(readFileSync(path, "utf8")) as SwqSnapshot;
}

const METRIC_MODES: CountyMetricMode[] = [
  {
    id: "impaired",
    label: "Impaired surface segments",
    description: "Count of TCEQ-classified water bodies flagged as impaired in the latest assessment year.",
    legendTitle: "Impaired segments",
    valueLabel: "impaired segments",
    format: "integer",
    buckets: [
      { label: "0", fill: "rgba(15,23,42,0.35)", min: 0, max: 0 },
      { label: "1", fill: "rgba(56,189,248,0.45)", min: 1, max: 1 },
      { label: "2-3", fill: "rgba(34,211,238,0.6)", min: 2, max: 3 },
      { label: "4-7", fill: "rgba(249,168,212,0.7)", min: 4, max: 7 },
      { label: "8+", fill: "rgba(244,63,94,0.85)", min: 8 },
    ],
  },
  {
    id: "segments",
    label: "All assessed segments",
    description: "Total count of TCEQ-classified surface water segments per county.",
    legendTitle: "Assessed segments",
    valueLabel: "segments",
    format: "integer",
    buckets: [
      { label: "0", fill: "rgba(15,23,42,0.35)", min: 0, max: 0 },
      { label: "1-3", fill: "rgba(56,189,248,0.4)", min: 1, max: 3 },
      { label: "4-9", fill: "rgba(34,211,238,0.55)", min: 4, max: 9 },
      { label: "10-19", fill: "rgba(125,211,252,0.7)", min: 10, max: 19 },
      { label: "20+", fill: "rgba(186,230,253,0.85)", min: 20 },
    ],
  },
];

type CountyAggregate = {
  slug: string;
  name: string;
  segments: number;
  impaired: number;
  basins: Set<string>;
};

function aggregate(rows: SwqRow[]): CountyAggregate[] {
  const bySlug = new Map<string, CountyAggregate>();
  for (const row of rows) {
    if (!row.countyName) continue;
    const slug = countySlug(row.countyName);
    if (!slug) continue;
    let entry = bySlug.get(slug);
    if (!entry) {
      entry = { slug, name: row.countyName.replace(/\s+County$/i, "").trim() + " County", segments: 0, impaired: 0, basins: new Set<string>() };
      bySlug.set(slug, entry);
    }
    entry.segments += 1;
    if (row.isImpaired) entry.impaired += 1;
    if (row.basinName) entry.basins.add(row.basinName);
  }
  return [...bySlug.values()].sort((a, b) => b.impaired - a.impaired || b.segments - a.segments);
}

export const metadata = {
  title: "Atlas TX — Maps · Weather context",
  description: "Surface water condition layered as a stand-in for active weather context across Texas counties.",
};

export default function WeatherMapPage() {
  const snapshot = loadSnapshot();
  const aggregated = aggregate(snapshot.rows);

  const counties: CountyMapRecord[] = aggregated.map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    fips: TEXAS_COUNTY_CENTROIDS[entry.slug]?.fips,
    href: `/water/counties/${entry.slug}`,
    metrics: {
      impaired: entry.impaired,
      segments: entry.segments,
    },
    context: `${entry.basins.size} basin${entry.basins.size === 1 ? "" : "s"} · ${entry.segments} assessed`,
  }));

  const totalSegments = aggregated.reduce((sum, entry) => sum + entry.segments, 0);
  const totalImpaired = aggregated.reduce((sum, entry) => sum + entry.impaired, 0);
  const countiesWithImpaired = aggregated.filter((entry) => entry.impaired > 0).length;

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
            Atlas TX · Map · Weather context
          </span>
          <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-200">
            Scaffold + 1 layer
          </span>
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Weather context for Texas water risk.
        </h1>
        <p className="max-w-3xl text-pretty text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          The headline live layer here is the TCEQ surface-water-quality assessment (cached statewide). Active hazard alerts, drought class, precipitation totals, and temperature anomalies are wired into the data lib but not yet committed as cached snapshots — they are listed below as planned signals so demo viewers can see the roadmap.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-3">
        <StatTile label="Counties with impaired segments" value={countiesWithImpaired} />
        <StatTile label="Impaired segments statewide" value={totalImpaired} />
        <StatTile label="Total assessed segments" value={totalSegments} />
      </section>

      <CountyHeadlinerMap
        title="Surface water condition by county"
        subtitle="Cached TCEQ surface water quality assessment shown as the seed weather-context layer until the planned NWS, drought, precipitation, and temperature snapshots land."
        eyebrow="Live cached layer"
        counties={counties}
        metricModes={METRIC_MODES}
        defaultMetricId="impaired"
        sourceLabel="TCEQ surface water quality (cached)"
        freshnessLabel={generatedAt ? `Snapshot ${generatedAt}` : undefined}
        caveat="Impairment status is a legal-use-support classification, not a direct harm claim. Counties with zero rows have no classified surface segments in this snapshot — not necessarily zero water condition concerns."
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Planned live layers</div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <PlannedRow label="NWS active alerts" detail="Flood, flash flood, severe storm, heat — counted per county and color-banded." />
            <PlannedRow label="USGS streamflow anomaly" detail="Low-flow / high-flow flags from active Texas stream gauges." />
            <PlannedRow label="U.S. Drought Monitor class" detail="Weekly D0–D4 drought severity per county with trend." />
            <PlannedRow label="NOAA precipitation context" detail="24h / 72h / 7d totals to explain notice and overflow events." />
            <PlannedRow label="NOAA temperature anomaly" detail="Daily summaries flagging heatwave windows and seasonal water-stress." />
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Top counties by impaired segment count</div>
          <ol className="mt-4 space-y-2.5 text-sm leading-6 text-slate-300">
            {aggregated.slice(0, 8).map((entry, index) => (
              <li key={entry.slug} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-white/5 text-xs font-semibold tabular-nums text-slate-200 ring-1 ring-white/10">{index + 1}</span>
                  <Link href={`/water/counties/${entry.slug}`} className="font-medium text-white transition-colors hover:text-cyan-300">{entry.name}</Link>
                </div>
                <span className="font-mono text-xs tabular-nums text-cyan-200">{entry.impaired} / {entry.segments}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs leading-5 text-slate-500">Format: impaired / total assessed segments.</p>
        </div>
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
