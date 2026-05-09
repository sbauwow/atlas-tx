import Link from "next/link";

import { CountyWorkspaceHeader } from "@/app/components/county-workspace-header";
import { buildPermitProtestPrep, getPermitFilingDetailPageData, getTceqPendingPermitsPageData } from "@/lib/tceq-permits";
import { getAdjacentCountyRefs, getCountyBySlugOrName } from "@/lib/water/county-lookup";

export default async function PermitFilingDetailPage({
  params,
}: {
  params: Promise<{ tceqId: string }>;
}) {
  const { tceqId } = await params;
  const data = await getTceqPendingPermitsPageData();
  const detail = getPermitFilingDetailPageData({
    tceqId,
    permits: data.permits,
    cidSummary: data.cidSummary,
  });

  const countyRef = detail.caseRow.county ? getCountyBySlugOrName(detail.caseRow.county) : null;
  const adjacent = countyRef ? getAdjacentCountyRefs(countyRef.slug) : { previous: null, next: null };
  const protestPrep = buildPermitProtestPrep({
    caseRow: detail.caseRow,
    countyPermitCount: detail.countyPermitCount,
    redFlagReasons: detail.redFlagRow?.reasons.map((reason) => reason.text) ?? [],
    relatedPermitNumbers: detail.relatedPermits.map((permit) => permit.permitNumber),
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-16">
      {countyRef ? (
        <CountyWorkspaceHeader
          countyName={countyRef.name}
          countySlug={countyRef.slug}
          permitsHref={`/permits?county=${countyRef.slug}`}
          waterHref={`/water/counties/${countyRef.slug}`}
          previousCounty={adjacent.previous ? { ...adjacent.previous, href: `/permits?county=${adjacent.previous.slug}` } : null}
          nextCounty={adjacent.next ? { ...adjacent.next, href: `/permits?county=${adjacent.next.slug}` } : null}
        />
      ) : null}

      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {countyRef ? (
            <Link href={`/permits?county=${countyRef.slug}`} className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
              Back to county permit view
            </Link>
          ) : null}
          <Link href="/permits" className="rounded-full bg-white px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-slate-200">
            Back to statewide permits
          </Link>
        </div>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">{detail.caseRow.applicantName}</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Filing detail workspace for {detail.caseRow.tceqId}. Use this page as procedural context and triage, not a final legal determination.
          </p>
        </div>
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-4">
        <StatTile value={detail.caseRow.programArea} label="Program area" />
        <StatTile value={String(detail.caseRow.filingCounts.hearingRequests)} label="Hearing requests" />
        <StatTile value={String(detail.caseRow.filingCounts.publicMeetingRequests)} label="Public meeting requests" />
        <StatTile value={String(detail.countyPermitCount)} label="Pending permits in county" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Procedural status</h2>
          <dl className="mt-5 grid gap-3 text-sm text-slate-300">
            <DetailRow label="TCEQ ID" value={detail.caseRow.tceqId} mono />
            <DetailRow label="County" value={detail.caseRow.county ?? "Unknown"} />
            <DetailRow label="TCEQ docket" value={detail.caseRow.tceqDocketNumber ?? "None listed"} mono />
            <DetailRow label="SOAH docket" value={detail.caseRow.soahDocketNumber ?? "None listed"} mono />
            <DetailRow label="Latest filing" value={detail.caseRow.latestFiledAt ?? "No protest filings yet"} />
            <DetailRow
              label="Filings"
              value={`${detail.caseRow.filingCounts.hearingRequests} HR / ${detail.caseRow.filingCounts.publicMeetingRequests} PM / ${detail.caseRow.filingCounts.comments} C`}
            />
          </dl>
        </article>

        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Red-flag breakdown</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            {detail.redFlagRow ? detail.redFlagRow.reasons.map((reason) => (
              <div key={reason.text} className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div className="font-medium text-white">{reason.text}</div>
                <div className="mt-1 text-slate-500">{reason.category} · {reason.severity}</div>
              </div>
            )) : <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-slate-400">No filing-level red flags yet.</div>}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Related county permits</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="pb-3 pr-4">Permit</th>
                  <th className="pb-3 pr-4">Permittee</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">City</th>
                </tr>
              </thead>
              <tbody>
                {detail.relatedPermits.map((permit) => (
                  <tr key={permit.permitNumber} className="border-t border-white/5 align-top">
                    <td className="py-3 pr-4 font-mono text-cyan-300">{permit.permitNumber}</td>
                    <td className="py-3 pr-4">{permit.permitteeName}</td>
                    <td className="py-3 pr-4">{permit.authorizationType}</td>
                    <td className="py-3 pr-4">{permit.nearestCity ?? "Unknown"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Caveats</h2>
          <ul className="mt-5 space-y-2 text-sm text-slate-400">
            {(detail.redFlagRow?.caveats ?? []).concat(detail.cidSummary.caveats).map((caveat) => (
              <li key={caveat}>• {caveat}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Protest prep panel</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">Drafting support only. Atlas TX surfaces public-record context but does not provide legal advice or auto-submit anything.</p>
          </div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Editable prep</div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <h3 className="text-lg font-semibold text-white">Participation status</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {protestPrep.participationStatus.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <h3 className="text-lg font-semibold text-white">Evidence checklist</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {protestPrep.evidenceChecklist.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <h3 className="text-lg font-semibold text-white">Draft from facts</h3>
            <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-950/60 p-4 font-mono text-sm leading-7 text-slate-200">
              {protestPrep.draftText}
            </div>
          </article>

          <article className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <h3 className="text-lg font-semibold text-white">Submission pack</h3>
            <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-950/60 p-4 font-mono text-sm leading-7 text-slate-200">
              {protestPrep.exportText}
            </div>
          </article>
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

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</dt>
      <dd className={mono ? "font-mono text-cyan-300" : "text-slate-200"}>{value}</dd>
    </div>
  );
}
