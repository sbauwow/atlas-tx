import Link from "next/link";
import { notFound } from "next/navigation";

import { getOperatorDetailPageData } from "@/app/operators/operator-page-data";

function DetailWatchQueueSection({
  title,
  description,
  entries,
}: {
  title: string;
  description: string;
  entries: Array<{
    id: string;
    label: string;
    href: string;
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
            This queue is built from the current public-record operator snapshot only. Atlas does not save personal watchlists yet.
          </p>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Current session only</div>
      </div>

      {entries.length ? (
        <>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {entries.map((entry, index) => (
              <article key={entry.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{entry.label}</div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100">
                    Queue #{index + 1}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-200">{entry.headline}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{entry.detail}</p>
                <Link href={entry.href} className="mt-4 inline-flex text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200">
                  Open next →
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
          No county, case, or permit records are attached to this operator yet, so Atlas cannot build a watch queue from the current snapshot.
        </div>
      )}
    </section>
  );
}

export default async function OperatorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { dataset, operator } = await getOperatorDetailPageData(slug);

  if (!operator) {
    notFound();
  }

  const countyQueueEntries = [...operator.counties]
    .sort((left, right) => {
      return (
        right.proceduralPressureScore - left.proceduralPressureScore ||
        right.caseCount - left.caseCount ||
        right.permitCount - left.permitCount ||
        left.county.localeCompare(right.county)
      );
    })
    .slice(0, 3)
    .map((county) => ({
      id: `county-${county.countySlug}`,
      label: county.county,
      href: `/counties/${county.countySlug}`,
      headline: `${county.permitCount} permits · ${county.caseCount} cases · ${county.proceduralPressureScore} pressure`,
      detail: `County intelligence plus permit and water drill-downs are already linked from this operator footprint. Latest filing: ${formatDate(county.latestFiledAt)}.`,
      queueLine: `county | ${county.county} | /counties/${county.countySlug} | permits ${county.permitCount} | cases ${county.caseCount} | pressure ${county.proceduralPressureScore}`,
    }));

  const countySlugLookup = new Map(operator.counties.map((county) => [county.county, county.countySlug]));

  const permitQueueEntries = operator.permits
    .map((permit) => {
      const countySlug = permit.county ? countySlugLookup.get(permit.county) ?? null : null;
      return {
        id: `permit-${permit.permitNumber}`,
        label: permit.permitNumber,
        href: countySlug ? `/permits?county=${countySlug}` : "/permits",
        headline: `${permit.authorizationType} · ${permit.county ?? "Unknown county"}`,
        detail: `${permit.nearestCity ?? "Unknown city"} is the nearest city in the current public-record row for this operator permit.`,
        queueLine: `permit-lane | ${permit.permitNumber} | ${countySlug ? `/permits?county=${countySlug}` : "/permits"} | ${permit.authorizationType} | ${permit.county ?? "Unknown county"}`,
      };
    })
    .slice(0, 2);

  const watchQueueEntries = [...countyQueueEntries, ...permitQueueEntries].slice(0, 5);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16">
      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/operators" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
            Back to operator directory
          </Link>
          <Link href="/permits" className="rounded-full bg-white px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-slate-200">
            Open statewide permits
          </Link>
        </div>
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            Operator detail from public records
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{operator.operatorName}</h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            Atlas groups this operator from permittee and applicant names visible in pending permit and CID records. The page shows public-record footprint and procedural activity only; it does not infer a broader corporate hierarchy.
          </p>
        </div>
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-4">
        <StatTile value={String(operator.permitCount)} label="Pending permits" />
        <StatTile value={String(operator.caseCount)} label="CID open cases" />
        <StatTile value={String(operator.countyCount)} label="Counties represented" />
        <StatTile value={String(operator.proceduralPressureScore)} label="Procedural pressure score" />
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-4">
        <StatTile value={String(operator.filingCounts.comments)} label="Comments" />
        <StatTile value={String(operator.filingCounts.hearingRequests)} label="Hearing requests" />
        <StatTile value={String(operator.filingCounts.publicMeetingRequests)} label="Public meeting requests" />
        <StatTile value={formatDate(operator.latestFiledAt)} label="Latest filing" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Record profile</h2>
          <dl className="mt-5 grid gap-3 text-sm text-slate-300">
            <DetailRow label="Directory slug" value={operator.slug} mono />
            <DetailRow label="Aliases in current records" value={operator.aliases.join(" · ")} />
            <DetailRow label="Top permit county" value={operator.concentration.topPermitCounty ? `${operator.concentration.topPermitCounty.county} (${operator.concentration.topPermitCounty.permitCount} permits)` : "No permit county visible"} />
            <DetailRow label="Top case county" value={operator.concentration.topCaseCounty ? `${operator.concentration.topCaseCounty.county} (${operator.concentration.topCaseCounty.caseCount} cases)` : "No case county visible"} />
            <DetailRow label="Statewide permit share" value={formatPercent(operator.concentration.permitShareStatewide)} />
            <DetailRow label="Statewide case share" value={formatPercent(operator.concentration.caseShareStatewide)} />
          </dl>
        </article>

        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Interpretation</h2>
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-cyan-100">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/80">Procedural pressure</div>
              <p className="mt-2 text-base font-medium text-white">
                {buildPressureHeadline(operator.proceduralPressureScore)}
              </p>
            </div>
            <p>
              {operator.caseCount > 0
                ? `${operator.operatorName} appears in ${operator.caseCount} CID case ${operator.caseCount === 1 ? "record" : "records"} and ${operator.permitCount} pending permit ${operator.permitCount === 1 ? "record" : "records"}.`
                : `${operator.operatorName} currently appears in pending permit records without a visible CID case in this snapshot.`}
            </p>
            <p className="text-slate-400">
              County concentration helps show whether this operator’s current public-record footprint is spread across multiple counties or concentrated in a smaller geography.
            </p>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-slate-400">
              Statewide context: {formatPercent(operator.concentration.proceduralPressureShareStatewide)} of visible procedural pressure across {dataset.statewide.caseCount} open CID cases in the current dataset.
            </div>
          </div>
        </article>
      </section>

      <DetailWatchQueueSection
        title="Watch next from this operator"
        description="A lightweight queue of county and permit lanes already visible from this operator record. Use it to open the next geography or permit workspace without pretending there is a saved watchlist backend tonight."
        entries={watchQueueEntries}
      />

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">County intelligence surfaces</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Route back into county context</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <p>
              Operator detail is only one lens. Follow the strongest county crosslinks to see how this footprint sits inside county rank, water, and permit context.
            </p>
            <div className="space-y-3">
              {operator.counties.slice(0, 3).map((county) => (
                <div key={county.countySlug} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{county.county}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        {county.permitCount} permits · {county.caseCount} cases · {county.proceduralPressureScore} procedural pressure
                      </div>
                    </div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Latest {formatDate(county.latestFiledAt)}</div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <Link href={`/counties/${county.countySlug}`} className="rounded-full bg-white px-3 py-1.5 font-medium text-slate-950 transition-colors hover:bg-slate-200">
                      County intelligence
                    </Link>
                    <Link href={`/permits?county=${county.countySlug}`} className="rounded-full border border-white/10 px-3 py-1.5 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
                      County permits
                    </Link>
                    <Link href={`/water/counties/${county.countySlug}`} className="rounded-full border border-white/10 px-3 py-1.5 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
                      Water context
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">County footprint</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-400">
                Counties where this operator appears in pending permit or CID case records, with direct links into county and permit workflows.
              </p>
            </div>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{operator.counties.length} counties</div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {operator.counties.map((county) => (
              <article key={county.countySlug} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-medium text-white">{county.county}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {county.permitCount} permits · {county.caseCount} cases · {county.proceduralPressureScore} pressure
                    </div>
                  </div>
                  <div className="rounded-full bg-white/5 px-3 py-1 text-sm font-medium text-cyan-300">
                    Latest: {formatDate(county.latestFiledAt)}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <Link href={`/counties/${county.countySlug}`} className="rounded-full border border-white/10 px-3 py-1.5 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
                    County intelligence
                  </Link>
                  <Link href={`/permits?county=${county.countySlug}`} className="rounded-full border border-white/10 px-3 py-1.5 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
                    County permits
                  </Link>
                  <Link href={`/water/counties/${county.countySlug}`} className="rounded-full border border-white/10 px-3 py-1.5 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
                    Water
                  </Link>
                </div>
                <div className="mt-4 text-xs text-slate-500">
                  Filings: {county.filingCounts.hearingRequests} hearing requests · {county.filingCounts.publicMeetingRequests} public meeting requests · {county.filingCounts.comments} comments
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">CID case roster</h2>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{operator.cases.length} rows</div>
          </div>
          {operator.cases.length ? (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4">TCEQ ID</th>
                    <th className="pb-3 pr-4">Program</th>
                    <th className="pb-3 pr-4">County</th>
                    <th className="pb-3 pr-4">Filings</th>
                    <th className="pb-3 pr-4">Latest filing</th>
                  </tr>
                </thead>
                <tbody>
                  {operator.cases.map((row) => (
                    <tr key={row.tceqId} className="border-t border-white/5 align-top">
                      <td className="py-3 pr-4 font-mono text-cyan-300">{row.tceqId}</td>
                      <td className="py-3 pr-4">{row.programArea}</td>
                      <td className="py-3 pr-4">
                        {row.county && countySlugLookup.get(row.county) ? (
                          <Link href={`/counties/${countySlugLookup.get(row.county)}`} className="text-slate-200 underline decoration-white/10 underline-offset-4 transition-colors hover:text-white hover:decoration-white/40">
                            {row.county}
                          </Link>
                        ) : (
                          row.county ?? "Unknown"
                        )}
                      </td>
                      <td className="py-3 pr-4">{row.filingCounts.hearingRequests} HR / {row.filingCounts.publicMeetingRequests} PM / {row.filingCounts.comments} C</td>
                      <td className="py-3 pr-4">{formatDate(row.latestFiledAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-400">
              No open CID case rows are visible for this operator in the current snapshot.
            </div>
          )}
        </article>

        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">Pending permit roster</h2>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{operator.permits.length} rows</div>
          </div>
          {operator.permits.length ? (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4">Permit</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">County</th>
                    <th className="pb-3 pr-4">Nearest city</th>
                  </tr>
                </thead>
                <tbody>
                  {operator.permits.map((permit) => (
                    <tr key={permit.permitNumber} className="border-t border-white/5 align-top">
                      <td className="py-3 pr-4 font-mono text-cyan-300">{permit.permitNumber}</td>
                      <td className="py-3 pr-4">{permit.authorizationType}</td>
                      <td className="py-3 pr-4">
                        {permit.county && countySlugLookup.get(permit.county) ? (
                          <Link href={`/counties/${countySlugLookup.get(permit.county)}`} className="text-slate-200 underline decoration-white/10 underline-offset-4 transition-colors hover:text-white hover:decoration-white/40">
                            {permit.county}
                          </Link>
                        ) : (
                          permit.county ?? "Unknown"
                        )}
                      </td>
                      <td className="py-3 pr-4">{permit.nearestCity ?? "Unknown"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-400">
              No pending permit rows are visible for this operator in the current snapshot.
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-slate-950/40 p-6">
      <div className="text-4xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{label}</div>
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</dt>
      <dd className={mono ? "font-mono text-cyan-300" : "text-slate-200"}>{value}</dd>
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

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function buildPressureHeadline(score: number) {
  if (score >= 12) return "High visible procedural pressure in current CID filings.";
  if (score >= 5) return "Elevated procedural pressure is visible in current CID filings.";
  if (score > 0) return "Some procedural pressure is visible in current CID filings.";
  return "No protest filing pressure is visible in the current CID snapshot.";
}
