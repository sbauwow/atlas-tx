import Link from "next/link";

import { CountyHeadlinerMap } from "@/app/components/county-headliner-map";
import type { CountyMapRecord, CountyMetricMode } from "@/app/components/county-map-primitives";
import GlossaryTooltip from "@/app/components/glossary-tooltip";
import { countySlug } from "@/lib/counties";
import { getTceqPendingPermitsPageData } from "@/lib/tceq-permits";
import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";

const METRIC_MODES: CountyMetricMode[] = [
  {
    id: "permits",
    label: "Pending permit count",
    description: "Number of pending TCEQ water-quality individual permits per county.",
    legendTitle: "Pending permits",
    valueLabel: "permits",
    format: "integer",
    buckets: [
      { label: "0", fill: "rgba(15,23,42,0.35)", min: 0, max: 0 },
      { label: "1", fill: "rgba(56,189,248,0.45)", min: 1, max: 1 },
      { label: "2-3", fill: "rgba(34,211,238,0.6)", min: 2, max: 3 },
      { label: "4-7", fill: "rgba(249,168,212,0.75)", min: 4, max: 7 },
      { label: "8+", fill: "rgba(244,63,94,0.85)", min: 8 },
    ],
  },
  {
    id: "topOperatorShare",
    label: "Top operator share",
    description: "Percent of the county's pending permits held by the single largest operator. High share = concentrated permit pressure.",
    legendTitle: "Top-operator share",
    valueLabel: "% county pending",
    format: "percent",
    decimals: 0,
    buckets: [
      { label: "No data", fill: "rgba(15,23,42,0.35)" },
      { label: "<25%", fill: "rgba(56,189,248,0.4)", min: 0, max: 0.249 },
      { label: "25-49%", fill: "rgba(34,211,238,0.55)", min: 0.25, max: 0.4999 },
      { label: "50-74%", fill: "rgba(249,168,212,0.7)", min: 0.5, max: 0.7499 },
      { label: "75-100%", fill: "rgba(244,63,94,0.85)", min: 0.75, max: 1 },
    ],
  },
];

type CountyAggregate = {
  slug: string;
  name: string;
  permitCount: number;
  operatorCount: number;
  topOperator: { name: string; permitCount: number } | null;
};

export const metadata = {
  title: "Atlas TX — Maps · Operator footprint",
  description: "Where pending TCEQ permits and operator concentration land across Texas counties.",
};

export default async function OperatorsMapPage() {
  const data = await getTceqPendingPermitsPageData();

  const countyBuckets = new Map<string, { name: string; operatorMap: Map<string, number> }>();
  for (const permit of data.permits) {
    const rawCounty = permit.county;
    if (!rawCounty) continue;
    const slug = countySlug(rawCounty);
    if (!slug) continue;
    let bucket = countyBuckets.get(slug);
    if (!bucket) {
      const cleaned = rawCounty.replace(/\s+County$/i, "").trim();
      bucket = { name: `${cleaned} County`, operatorMap: new Map<string, number>() };
      countyBuckets.set(slug, bucket);
    }
    const operator = permit.permitteeName ?? "Unknown operator";
    bucket.operatorMap.set(operator, (bucket.operatorMap.get(operator) ?? 0) + 1);
  }

  const aggregates: CountyAggregate[] = [...countyBuckets.entries()]
    .map(([slug, bucket]) => {
      const operators = [...bucket.operatorMap.entries()].sort((a, b) => b[1] - a[1]);
      const total = operators.reduce((sum, [, count]) => sum + count, 0);
      return {
        slug,
        name: bucket.name,
        permitCount: total,
        operatorCount: operators.length,
        topOperator: operators[0] ? { name: operators[0][0], permitCount: operators[0][1] } : null,
      };
    })
    .sort((a, b) => b.permitCount - a.permitCount || (b.topOperator?.permitCount ?? 0) - (a.topOperator?.permitCount ?? 0));

  const counties: CountyMapRecord[] = aggregates.map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    fips: TEXAS_COUNTY_CENTROIDS[entry.slug]?.fips,
    href: `/permits?county=${entry.slug}`,
    metrics: {
      permits: entry.permitCount,
      topOperatorShare: entry.permitCount > 0 && entry.topOperator
        ? entry.topOperator.permitCount / entry.permitCount
        : null,
    },
    context: entry.topOperator
      ? `Top operator: ${entry.topOperator.name} (${entry.topOperator.permitCount} of ${entry.permitCount})`
      : `${entry.operatorCount} operators`,
  }));

  const statewideOperatorMap = new Map<string, { name: string; permitCount: number; counties: Set<string> }>();
  for (const permit of data.permits) {
    const operator = permit.permitteeName ?? "Unknown operator";
    let entry = statewideOperatorMap.get(operator);
    if (!entry) {
      entry = { name: operator, permitCount: 0, counties: new Set<string>() };
      statewideOperatorMap.set(operator, entry);
    }
    entry.permitCount += 1;
    if (permit.county) {
      const slug = countySlug(permit.county);
      if (slug) entry.counties.add(slug);
    }
  }
  const topStatewideOperators = [...statewideOperatorMap.values()].sort((a, b) => b.permitCount - a.permitCount).slice(0, 8);
  const totalPermits = data.permits.length;

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
            Atlas TX · Map · Operator footprint
          </span>
          <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-200">
            Live cached layer
          </span>
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Where Texas water-permit pressure concentrates.
        </h1>
        <p className="max-w-3xl text-pretty text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          Pending <GlossaryTooltip term="TCEQ" expand /> water-quality individual permits aggregated to county footprints, with the top single-operator share per county exposed as a concentration indicator. Drill into any county to inspect the filtered permit roster.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-3">
        <StatTile label="Counties with pending permits" value={aggregates.length} />
        <StatTile label="Pending permits statewide" value={totalPermits} />
        <StatTile label="Distinct operators" value={statewideOperatorMap.size} />
      </section>

      <CountyHeadlinerMap
        title="Operator concentration choropleth"
        subtitle="Toggle between raw permit count and top-operator share. High top-operator share signals concentrated permit pressure on a single applicant inside a county."
        eyebrow="TCEQ pending permits · cached"
        counties={counties}
        metricModes={METRIC_MODES}
        defaultMetricId="permits"
        sourceLabel="TCEQ pending permit roster (cached)"
        caveat="Pending status is procedural context, not proof of harm or permit outcome. Operator names are public-record permittee strings; minor formatting differences are not normalized into a canonical operator graph here."
      />

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Top-share counties</div>
          <ol className="mt-4 space-y-2.5 text-sm leading-6 text-slate-300">
            {aggregates.slice(0, 10).map((entry, index) => {
              const share = entry.permitCount > 0 && entry.topOperator
                ? Math.round((entry.topOperator.permitCount / entry.permitCount) * 100)
                : null;
              return (
                <li key={entry.slug} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-semibold tabular-nums text-slate-200 ring-1 ring-white/10">{index + 1}</span>
                    <div className="min-w-0">
                      <Link href={`/permits?county=${entry.slug}`} className="block truncate font-medium text-white transition-colors hover:text-cyan-300">{entry.name}</Link>
                      {entry.topOperator ? (
                        <div className="truncate text-[11px] uppercase tracking-[0.14em] text-slate-500">Top · {entry.topOperator.name}</div>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs tabular-nums text-cyan-200">{entry.permitCount.toLocaleString("en-US")}</div>
                    {share !== null ? <div className="text-[11px] text-slate-500">{share}% top</div> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Statewide operator concentration</div>
          <ol className="mt-4 space-y-2.5 text-sm leading-6 text-slate-300">
            {topStatewideOperators.map((operator, index) => (
              <li key={operator.name} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-semibold tabular-nums text-slate-200 ring-1 ring-white/10">{index + 1}</span>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-white">{operator.name}</div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{operator.counties.size} counties</div>
                  </div>
                </div>
                <div className="font-mono text-xs tabular-nums text-cyan-200">{operator.permitCount.toLocaleString("en-US")}</div>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs leading-5 text-slate-500">Counts include all pending permits in the current cache — not just those visible in any single county view.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/30 p-5 ring-1 ring-white/5">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Planned follow-on layers</div>
        <ul className="mt-3 grid gap-3 text-sm leading-6 text-slate-300 md:grid-cols-2">
          <PlannedRow label="CID procedural overlay" detail="Hatch counties carrying open CID cases per the existing /permits choropleth pattern." />
          <PlannedRow label="Operator name canonicalization" detail="Merge minor formatting variations into stable operator graph nodes via the operator-intelligence builder." />
          <PlannedRow label="Repeat-pressure flag" detail="Highlight operators with both pending permits and CID cases in the same county window." />
          <PlannedRow label="Operator drill-in tooltip" detail="Click the choropleth to surface the operator roster panel without leaving the map." />
        </ul>
      </section>

      <section className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/maps" className="rounded-full border border-white/10 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
          ← Back to maps
        </Link>
        <Link href="/permits" className="rounded-full bg-white px-5 py-2.5 font-medium text-slate-950 transition-colors hover:bg-slate-200">
          Open the permit tracker →
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
    <li className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3">
      <div className="font-medium text-white">{label}</div>
      <div className="mt-0.5 text-xs text-slate-400">{detail}</div>
    </li>
  );
}
