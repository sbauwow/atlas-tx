import Link from "next/link";

import { getOperatorIntelligencePageData } from "@/app/operators/operator-page-data";
import { AddToWatchlistControl } from "@/app/watchlists/watchlist-client";

function WatchQueueSection({
  title,
  description,
  entries,
}: {
  title: string;
  description: string;
  entries: Array<{
    slug: string;
    operatorName: string;
    headline: string;
    detail: string;
    queueLine: string;
  }>;
}) {
  const exportValue = entries.map((entry) => entry.queueLine).join("\n");

  return (
    <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">Watchlist-ready lane</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Atlas now saves these operator lanes into local/shared browser watchlists. If browser storage is unavailable, you can still copy the queue into notes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/watchlists" className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5">
            Open saved watchlists
          </Link>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Copy into notes</div>
        </div>
      </div>

      {entries.length ? (
        <>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {entries.map((entry, index) => (
              <article key={entry.slug} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{entry.operatorName}</div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100">
                    Queue #{index + 1}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-200">{entry.headline}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{entry.detail}</p>
                <AddToWatchlistControl
                  className="mt-4"
                  item={{
                    id: `operator:${entry.slug}`,
                    kind: "Operator",
                    label: entry.operatorName,
                    href: `/operators/${entry.slug}`,
                    summary: entry.headline,
                    detail: entry.detail,
                    surface: "operators",
                  }}
                />
                <Link href={`/operators/${entry.slug}`} className="mt-4 inline-flex text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200">
                  Open operator detail →
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Copyable queue</div>
            <textarea
              readOnly
              value={exportValue}
              aria-label={`${title} copyable queue`}
              className="mt-3 min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm leading-6 text-slate-200"
            />
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm leading-6 text-slate-400">
          No operator rows are visible in the current snapshot yet, so Atlas cannot build an open-next watch queue.
        </div>
      )}
    </section>
  );
}

export default async function OperatorsDirectoryPage() {
  const dataset = await getOperatorIntelligencePageData();
  const spotlightRows = dataset.detailRows.slice(0, 24);
  const watchQueueEntries = [...dataset.detailRows]
    .sort((left, right) => {
      return (
        right.proceduralPressureScore - left.proceduralPressureScore ||
        right.caseCount - left.caseCount ||
        right.permitCount - left.permitCount ||
        left.operatorName.localeCompare(right.operatorName)
      );
    })
    .slice(0, 6)
    .map((row) => ({
      slug: row.slug,
      operatorName: row.operatorName,
      headline: `${row.permitCount} permits · ${row.caseCount} cases · ${row.proceduralPressureScore} pressure`,
      detail:
        row.counties.length > 0
          ? `${row.counties.slice(0, 2).map((county) => county.county).join(" · ")} ${row.counties.length > 2 ? `+${row.counties.length - 2} more counties` : ""}`.trim()
          : "No county footprint attached in the current snapshot.",
      queueLine: `operator | ${row.operatorName} | /operators/${row.slug} | permits ${row.permitCount} | cases ${row.caseCount} | pressure ${row.proceduralPressureScore}`,
    }));

  return (
    <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,211,238,0.10),transparent_70%)]"
      />

      <section className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
        <div className="space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            Public-record operator directory
          </span>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
              Operators in pending permit and CID records
            </h1>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">
              Permittee and applicant drill-down for Texas public records
            </p>
            <p className="max-w-3xl text-pretty text-lg leading-8 text-slate-400">
              Atlas groups permittee and applicant names from pending permit and CID records so you can review public-record operator footprints, case counts, filing activity, and county concentration without inventing corporate relationships.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/permits" className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-medium text-slate-950 transition-colors hover:bg-slate-200">
              Open permit tracker
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link href="/counties" className="rounded-full border border-white/10 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
              Browse counties
            </Link>
            <Link href="/watchlists" className="rounded-full border border-white/10 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
              Saved watchlists
            </Link>
          </div>
        </div>

        <aside className="rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 ring-1 ring-white/10 backdrop-blur">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Grounding</div>
          <ul className="mt-4 space-y-3.5 text-sm leading-7 text-slate-300">
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-cat-3" />Names stay as they appear in permittee and applicant records after whitespace normalization only.</li>
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-cat-2" />Procedural pressure reflects visible comments, hearing requests, and public meeting requests tied to CID cases.</li>
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-cat-4" />This directory is entity navigation, not a claim about ownership, control, or legal outcome.</li>
          </ul>
        </aside>
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-4">
        <StatTile value={String(dataset.statewide.operatorCount)} label="Operators in records" />
        <StatTile value={String(dataset.statewide.permitCount)} label="Pending permits" />
        <StatTile value={String(dataset.statewide.caseCount)} label="CID open cases" />
        <StatTile value={String(dataset.statewide.proceduralPressureScore)} label="Procedural pressure score" />
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-4">
        <StatTile value={String(dataset.statewide.filingCounts.comments)} label="Comments" />
        <StatTile value={String(dataset.statewide.filingCounts.hearingRequests)} label="Hearing requests" />
        <StatTile value={String(dataset.statewide.filingCounts.publicMeetingRequests)} label="Public meeting requests" />
        <StatTile value={String(dataset.statewide.protestedCaseCount)} label="Cases with visible filings" />
      </section>

      <WatchQueueSection
        title="Operators to monitor next"
        description="A lightweight open-next queue ranked from the same operator rows already on this page. Use it as a handoff or copyable watchlist seed while saved screens are still out of scope."
        entries={watchQueueEntries}
      />

      <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Operator leaderboard</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Ranked by pending permit count first, then CID case count and procedural pressure. County footprint and latest filing dates come directly from the current public-record snapshots.
            </p>
          </div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            {spotlightRows.length} operators shown
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {spotlightRows.map((row, index) => (
            <article key={row.slug} className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                      #{index + 1}
                    </span>
                    <Link href={`/operators/${row.slug}`} className="text-lg font-medium text-white transition-colors hover:text-cyan-300">
                      {row.operatorName}
                    </Link>
                  </div>
                  <p className="text-sm text-slate-400">
                    {row.caseCount > 0
                      ? `Visible as both permittee and applicant context across ${row.countyCount} counties.`
                      : `Visible as a permittee footprint across ${row.countyCount} counties.`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Pill label={`${row.permitCount} permits`} tone="cyan" />
                  <Pill label={`${row.caseCount} cases`} tone="slate" />
                  <Pill label={`${row.proceduralPressureScore} pressure`} tone="amber" />
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
                <MetricCard
                  label="County footprint"
                  value={row.counties.length ? row.counties.slice(0, 3).map((county) => county.county).join(" · ") : "No county attached"}
                  detail={row.counties.length > 3 ? `+${row.counties.length - 3} more counties` : "Public-record footprint only"}
                />
                <MetricCard
                  label="Latest filing"
                  value={formatDate(row.latestFiledAt)}
                  detail={row.latestFiledAt ? "Most recent visible CID filing" : "No protest filing visible yet"}
                />
                <MetricCard
                  label="Top counties"
                  value={buildTopCountiesLabel(row)}
                  detail={buildShareLabel(row)}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span>
                  Filings: {row.filingCounts.hearingRequests} hearing requests · {row.filingCounts.publicMeetingRequests} public meeting requests · {row.filingCounts.comments} comments
                </span>
                <span className="text-slate-600">•</span>
                <Link href={`/operators/${row.slug}`} className="font-medium text-cyan-300 transition-colors hover:text-cyan-200">
                  Open operator detail
                </Link>
              </div>
              <AddToWatchlistControl
                className="mt-4"
                item={{
                  id: `operator:${row.slug}`,
                  kind: "Operator",
                  label: row.operatorName,
                  href: `/operators/${row.slug}`,
                  summary: `${row.permitCount} permits · ${row.caseCount} cases · ${row.proceduralPressureScore} pressure`,
                  detail:
                    row.counties.length > 0
                      ? `${row.counties.slice(0, 2).map((county) => county.county).join(" · ")} ${row.counties.length > 2 ? `+${row.counties.length - 2} more counties` : ""}`.trim()
                      : "No county footprint attached in the current snapshot.",
                  surface: "operators",
                }}
              />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-slate-950/40 p-6">
      <div className="text-4xl font-semibold tabular-nums tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{label}</div>
    </div>
  );
}

function Pill({ label, tone }: { label: string; tone: "cyan" | "amber" | "slate" }) {
  const className =
    tone === "cyan"
      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
      : tone === "amber"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
        : "border-white/10 bg-white/5 text-slate-200";

  return <span className={`rounded-full border px-3 py-1 ${className}`}>{label}</span>;
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-950/40 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{detail}</div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "No filing visible";
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function buildTopCountiesLabel(row: Awaited<ReturnType<typeof getOperatorIntelligencePageData>>["detailRows"][number]) {
  const permitCounty = row.concentration.topPermitCounty;
  const caseCounty = row.concentration.topCaseCounty;

  if (permitCounty && caseCounty) {
    return `${permitCounty.county} permits · ${caseCounty.county} cases`;
  }

  if (permitCounty) {
    return `${permitCounty.county} permits`;
  }

  if (caseCounty) {
    return `${caseCounty.county} cases`;
  }

  return "No county ranking yet";
}

function buildShareLabel(row: Awaited<ReturnType<typeof getOperatorIntelligencePageData>>["detailRows"][number]) {
  const permitCounty = row.concentration.topPermitCounty;
  const caseCounty = row.concentration.topCaseCounty;
  const segments: string[] = [];

  if (permitCounty) {
    segments.push(`${formatPercent(permitCounty.share)} of permits`);
  }

  if (caseCounty) {
    segments.push(`${formatPercent(caseCounty.share)} of cases`);
  }

  return segments.join(" · ") || "Share unavailable";
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
