import { readFileSync } from "node:fs";
import { join } from "node:path";

import Link from "next/link";

import { CountyHeadlinerMap } from "@/app/components/county-headliner-map";
import type { CountyMapRecord, CountyMetricMode } from "@/app/components/county-map-primitives";
import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";

type CuratedRow = {
  matchedThemes?: string[];
  formats?: string[];
};

type CuratedSource = {
  portalId: string;
  portalName: string;
  portalUrl: string;
  rowCount: number;
  rows: CuratedRow[];
};

type CuratedSnapshot = {
  generatedAt: string;
  summary: {
    sourceCount: number;
    totalDatasetCount: number;
    totalMatchedRowCount: number;
    matchedByTheme?: Record<string, number>;
  };
  sources: Record<string, CuratedSource>;
};

const CITY_TO_COUNTY: Record<string, { slug: string; name: string }> = {
  austin: { slug: "travis", name: "Travis County" },
  dallas: { slug: "dallas", name: "Dallas County" },
  houston: { slug: "harris", name: "Harris County" },
  "san-antonio": { slug: "bexar", name: "Bexar County" },
};

function loadSnapshot(): CuratedSnapshot {
  const path = join(process.cwd(), "public", "cache", "city-open-data-curated-tx.json");
  return JSON.parse(readFileSync(path, "utf8")) as CuratedSnapshot;
}

const METRIC_MODES: CountyMetricMode[] = [
  {
    id: "datasets",
    label: "Curated dataset count",
    description: "Datasets in the city portal that match Atlas's water / permits / infrastructure themes.",
    legendTitle: "Curated datasets",
    valueLabel: "datasets",
    format: "integer",
    buckets: [
      { label: "0", fill: "rgba(15,23,42,0.35)", min: 0, max: 0 },
      { label: "1-49", fill: "rgba(56,189,248,0.45)", min: 1, max: 49 },
      { label: "50-199", fill: "rgba(34,211,238,0.6)", min: 50, max: 199 },
      { label: "200-499", fill: "rgba(125,211,252,0.75)", min: 200, max: 499 },
      { label: "500+", fill: "rgba(186,230,253,0.9)", min: 500 },
    ],
  },
  {
    id: "waterDatasets",
    label: "Water-themed datasets",
    description: "Subset of the curated count whose themeMatches include 'water'.",
    legendTitle: "Water datasets",
    valueLabel: "water datasets",
    format: "integer",
    buckets: [
      { label: "0", fill: "rgba(15,23,42,0.35)", min: 0, max: 0 },
      { label: "1-49", fill: "rgba(56,189,248,0.4)", min: 1, max: 49 },
      { label: "50-149", fill: "rgba(34,211,238,0.55)", min: 50, max: 149 },
      { label: "150-299", fill: "rgba(110,231,183,0.6)", min: 150, max: 299 },
      { label: "300+", fill: "rgba(16,185,129,0.7)", min: 300 },
    ],
  },
];

type CityAggregate = {
  cityKey: string;
  city: string;
  countySlug: string;
  countyName: string;
  portalUrl: string;
  curated: number;
  themes: { water: number; permits: number; infrastructure: number };
};

export const metadata = {
  title: "Atlas TX — Maps · Texas open-data discovery",
  description: "What Texas city portals publish in the water, permits, and infrastructure themes.",
};

export default function OpenDataMapPage() {
  const snapshot = loadSnapshot();
  const aggregates: CityAggregate[] = Object.entries(snapshot.sources).map(([cityKey, source]) => {
    const themes = { water: 0, permits: 0, infrastructure: 0 };
    for (const row of source.rows) {
      const matched = row.matchedThemes ?? [];
      if (matched.includes("water")) themes.water += 1;
      if (matched.includes("permits")) themes.permits += 1;
      if (matched.includes("infrastructure")) themes.infrastructure += 1;
    }
    const map = CITY_TO_COUNTY[cityKey] ?? { slug: cityKey, name: cityKey };
    return {
      cityKey,
      city: source.portalName,
      countySlug: map.slug,
      countyName: map.name,
      portalUrl: source.portalUrl,
      curated: source.rowCount,
      themes,
    };
  }).sort((a, b) => b.curated - a.curated);

  const counties: CountyMapRecord[] = aggregates.map((entry) => ({
    slug: entry.countySlug,
    name: entry.countyName,
    fips: TEXAS_COUNTY_CENTROIDS[entry.countySlug]?.fips,
    href: entry.portalUrl,
    metrics: {
      datasets: entry.curated,
      waterDatasets: entry.themes.water,
    },
    context: `${entry.city}`,
  }));

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
            Atlas TX · Map · Open-data discovery
          </span>
          <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-200">
            Live cached layer
          </span>
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Texas open-data discovery surface.
        </h1>
        <p className="max-w-3xl text-pretty text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          Curated catalog across Austin, Dallas, Houston, and San Antonio open-data portals — surfaced on the host counties (Travis, Dallas, Harris, Bexar) so demo viewers can spot which Texas cities publish the most water, permit, and infrastructure data.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-3">
        <StatTile label="City portals" value={snapshot.summary.sourceCount} />
        <StatTile label="Total datasets indexed" value={snapshot.summary.totalDatasetCount} />
        <StatTile label="Curated to Atlas themes" value={snapshot.summary.totalMatchedRowCount} />
      </section>

      <CountyHeadlinerMap
        title="City portal coverage choropleth"
        subtitle="The four host counties color-band by curated dataset count or by water-themed datasets only. Empty counties simply have no city open-data portal yet — not zero open data."
        eyebrow="Curated catalog · cached"
        counties={counties}
        metricModes={METRIC_MODES}
        defaultMetricId="datasets"
        sourceLabel="city-open-data-curated-tx.json"
        freshnessLabel={generatedAt ? `Snapshot ${generatedAt}` : undefined}
        caveat="The choropleth uses host-county centroids only — it does not imply that the dataset coverage is geographically scoped to that county alone. Many city datasets cover their broader metro footprint."
      />

      <section className="grid gap-5 lg:grid-cols-2">
        {aggregates.map((entry) => (
          <article key={entry.cityKey} className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300/80">{entry.countyName}</div>
                <h2 className="mt-1 text-xl font-semibold text-white">{entry.city}</h2>
              </div>
              <Link
                href={entry.portalUrl}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-300/30 hover:bg-cyan-400/5 hover:text-cyan-200"
              >
                Open portal →
              </Link>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-2 text-sm">
              <ThemeStat label="Curated total" value={entry.curated} />
              <ThemeStat label="Water" value={entry.themes.water} />
              <ThemeStat label="Permits" value={entry.themes.permits} />
              <ThemeStat label="Infrastructure" value={entry.themes.infrastructure} />
            </dl>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/30 p-5 ring-1 ring-white/5">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Planned follow-on layers</div>
        <ul className="mt-3 grid gap-3 text-sm leading-6 text-slate-300 md:grid-cols-2">
          <PlannedRow label="Per-dataset Atlas ingestion lane" detail="Surface which curated datasets have an Atlas refresh script attached vs. which are still discovery-only." />
          <PlannedRow label="County / regional portal coverage" detail="Pull TCEQ regional, GBRA, LCRA, and Texas state agency portals into the same curated discovery view." />
          <PlannedRow label="Recency overlay" detail="Color portals by their most-recently updated water-themed dataset to flag stale catalogs." />
          <PlannedRow label="Format mix bars" detail="Bar charts for JSON / CSV / Shapefile / API formats per portal so analysts know what they can pipe straight into Atlas." />
        </ul>
      </section>

      <section className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/maps" className="rounded-full border border-white/10 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
          ← Back to maps
        </Link>
        <Link href="/" className="rounded-full bg-white px-5 py-2.5 font-medium text-slate-950 transition-colors hover:bg-slate-200">
          Atlas overview →
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

function ThemeStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white">{value.toLocaleString("en-US")}</dd>
    </div>
  );
}

function PlannedRow({ label, detail }: { label: string; detail: string }) {
  return (
    <li className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3">
      <div className="font-medium text-white">{label}</div>
      <div className="mt-0.5 text-xs text-slate-400">{detail}</div>
    </li>
  );
}
