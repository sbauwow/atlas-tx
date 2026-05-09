import Link from "next/link";

import { CountyWorkspaceHeader } from "@/app/components/county-workspace-header";
import { TexasCountyChoropleth } from "@/app/components/texas-county-choropleth";
import { getAdjacentCountyRefs, getCountyBySlugOrName } from "@/lib/water/county-lookup";
import {
  buildPendingPermitCountyMapRows,
  formatCidSnapshotAgeBadge,
  getTceqPendingPermitsPageData,
  type CidSnapshotFreshnessBand,
} from "@/lib/tceq-permits";

export default async function PermitsPage({
  searchParams,
}: {
  searchParams: Promise<{ county?: string }>;
}) {
  const params = await searchParams;
  const data = await getTceqPendingPermitsPageData(params.county);
  const cidSnapshotBadge = formatCidSnapshotAgeBadge(data.cidSummary.generatedAt);
  const cidSnapshotTone = cidSnapshotBadge ? cidSnapshotBadgeTone(cidSnapshotBadge.freshnessBand) : null;
  const countyMapRows = buildPendingPermitCountyMapRows(data.permits, data.cidSummary.cases);
  const countyWorkspace = data.countyFilter ? getCountyBySlugOrName(data.countyFilter) : null;
  const adjacentCounties = countyWorkspace ? getAdjacentCountyRefs(countyWorkspace.slug) : null;

  return (
    <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,211,238,0.10),transparent_70%)]"
      />

      <section className="grid gap-10 lg:grid-cols-[1.35fr_0.95fr] lg:items-end">
        <div className="space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            TCEQ permits · Texas tracker
          </span>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
              TCEQ pending permits
            </h1>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">
              Pending permit tracker for Texas
            </p>
            <p className="max-w-3xl text-pretty text-lg leading-8 text-slate-400">
              Live view of pending TCEQ water-quality individual permits across Texas, with county concentration and permit roster context for newsroom, civic-tech, and policy workflows.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/water" className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-medium text-slate-950 transition-colors hover:bg-slate-200">
              Open water explorer
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link href="/" className="rounded-full border border-white/10 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
              Back to homepage
            </Link>
          </div>
        </div>

        <aside className="rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 ring-1 ring-white/10 backdrop-blur">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Tracking stance</div>
          <ul className="mt-4 space-y-3.5 text-sm leading-7 text-slate-300">
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-cat-3" />This page tracks pending water-quality individual permits, not every TCEQ program workflow.</li>
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-cat-2" />County clustering helps show where permit pressure is concentrating.</li>
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-cat-4" />Pending status is procedural context, not proof of harm or permit outcome.</li>
          </ul>
        </aside>
      </section>

      {countyWorkspace && adjacentCounties ? (
        <CountyWorkspaceHeader
          countyName={countyWorkspace.name}
          countySlug={countyWorkspace.slug}
          permitsHref={`/permits?county=${countyWorkspace.slug}`}
          waterHref={`/water/counties/${countyWorkspace.slug}`}
          previousCounty={adjacentCounties.previous ? { ...adjacentCounties.previous, href: `/permits?county=${adjacentCounties.previous.slug}` } : null}
          nextCounty={adjacentCounties.next ? { ...adjacentCounties.next, href: `/permits?county=${adjacentCounties.next.slug}` } : null}
        />
      ) : null}

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-4">
        <StatTile value={String(data.summary.pendingPermitCount)} label="Pending permits" />
        <StatTile value={String(data.summary.activePermitCount)} label="Active permits statewide" />
        <StatTile value={String(data.summary.countyCount)} label="Counties represented" />
        <StatTile value={String(data.summary.authorizationTypeCount)} label="Authorization types" />
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-4">
        <StatTile value={String(data.cidSummary.openCaseCount)} label="CID open cases" />
        <StatTile value={String(data.cidSummary.protestedCaseCount)} label="CID protested cases" />
        <StatTile value={String(data.cidSummary.hearingRequestCount)} label="CID hearing requests" />
        <StatTile value={String(data.cidSummary.publicMeetingRequestCount)} label="CID public meeting requests" />
      </section>

      <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">County permit map</h2>
            <p className="mt-2 text-sm text-slate-400">True county polygon view of pending permit pressure, with CID procedural activity hatched over counties carrying open cases.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300">
            <div className="font-medium uppercase tracking-[0.18em] text-slate-500">Legend</div>
            <div className="mt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-emerald-400" />1 permit</span>
              <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-cyan-400" />2 permits</span>
              <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-fuchsia-400" />3+ permits</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-2"><span className="size-3 rounded-sm border border-white/30 bg-[repeating-linear-gradient(135deg,rgba(248,250,252,0.75)_0,rgba(248,250,252,0.75)_1px,transparent_1px,transparent_4px)]" />CID open case / hearing activity</div>
          </div>
        </div>
        <div className="relative mt-6 overflow-hidden rounded-xl bg-slate-950 ring-1 ring-white/5">
          <TexasCountyChoropleth rows={countyMapRows} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
          <p>Click a highlighted county to open its filtered permit view.</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Open county pages</span>
            {countyMapRows.slice(0, 8).map((county) => (
              <span key={`links-${county.slug}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
                <span>{county.county}</span>
                <Link href={`/permits?county=${county.slug}`} className="text-cyan-300 hover:text-cyan-200">Permits</Link>
                <span className="text-slate-600">·</span>
                <Link href={`/water/counties/${county.slug}`} className="text-cyan-300 hover:text-cyan-200">Water</Link>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">Top counties by pending count</h2>
            {data.countyFilter ? (
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">County filter</div>
            ) : null}
          </div>
          {data.countyFilter ? <p className="mt-2 text-sm text-slate-400">{data.countyFilter}</p> : null}
          <div className="mt-5 space-y-3">
            {data.summary.topCounties.map((row) => (
              <div key={row.county} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div className="text-sm text-slate-200">{row.county}</div>
                <div className="rounded-full bg-white/5 px-3 py-1 text-sm font-medium text-cyan-300">{row.count}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Pending permit roster</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="pb-3 pr-4">Permit</th>
                  <th className="pb-3 pr-4">Permittee</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">County</th>
                  <th className="pb-3 pr-4">Nearest city</th>
                </tr>
              </thead>
              <tbody>
                {data.permits.slice(0, 100).map((permit) => (
                  <tr key={permit.permitNumber} className="border-t border-white/5 align-top">
                    <td className="py-3 pr-4 font-mono text-cyan-300">{permit.permitNumber}</td>
                    <td className="py-3 pr-4">{permit.permitteeName}</td>
                    <td className="py-3 pr-4">{permit.authorizationType}</td>
                    <td className="py-3 pr-4">{permit.county ?? "Unknown"}</td>
                    <td className="py-3 pr-4">{permit.nearestCity ?? "Unknown"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">CID open cases</h2>
              <p className="mt-2 text-sm text-slate-400">Cross-program TCEQ procedural lane layered in alongside the stable water-permit dataset.</p>
            </div>
            <div className={`rounded-full border px-3 py-1.5 text-right text-xs font-medium uppercase tracking-[0.18em] ${cidSnapshotTone?.containerClass ?? "border-white/10 bg-white/5 text-slate-300"}`}>
              <div>CID snapshot age</div>
              <div className={`mt-1 text-[11px] ${cidSnapshotTone?.detailClass ?? "text-slate-400"}`}>
                {cidSnapshotBadge ? `${cidSnapshotTone?.label ?? "Unavailable"} · ${cidSnapshotBadge.ageLabel} · ${cidSnapshotBadge.refreshedLabel}` : "Unavailable"}
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {data.cidSummary.topProgramAreas.length ? data.cidSummary.topProgramAreas.map((row) => (
              <div key={row.programArea} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div className="text-sm text-slate-200">{row.programArea}</div>
                <div className="rounded-full bg-white/5 px-3 py-1 text-sm font-medium text-cyan-300">{row.count}</div>
              </div>
            )) : <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">No CID snapshot rows available.</div>}
          </div>
          <ul className="mt-5 space-y-2 text-sm text-slate-400">
            {data.cidSummary.caveats.map((caveat) => (
              <li key={caveat}>• {caveat}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">CID case roster</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="pb-3 pr-4">TCEQ ID</th>
                  <th className="pb-3 pr-4">Applicant</th>
                  <th className="pb-3 pr-4">Program</th>
                  <th className="pb-3 pr-4">County</th>
                  <th className="pb-3 pr-4">Filings</th>
                </tr>
              </thead>
              <tbody>
                {data.cidSummary.cases.slice(0, 100).map((row) => (
                  <tr key={row.tceqId} className="border-t border-white/5 align-top">
                    <td className="py-3 pr-4 font-mono text-cyan-300">{row.tceqId}</td>
                    <td className="py-3 pr-4">{row.applicantName}</td>
                    <td className="py-3 pr-4">{row.programArea}</td>
                    <td className="py-3 pr-4">{row.county ?? "Unknown"}</td>
                    <td className="py-3 pr-4">{row.filingCounts.hearingRequests} HR / {row.filingCounts.publicMeetingRequests} PM / {row.filingCounts.comments} C</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
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

function cidSnapshotBadgeTone(freshnessBand: CidSnapshotFreshnessBand) {
  switch (freshnessBand) {
    case "fresh":
      return {
        label: "Fresh",
        containerClass: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
        detailClass: "text-emerald-100/90",
      };
    case "aging":
      return {
        label: "Aging",
        containerClass: "border-amber-400/20 bg-amber-400/10 text-amber-200",
        detailClass: "text-amber-100/90",
      };
    case "stale":
      return {
        label: "Stale",
        containerClass: "border-rose-400/20 bg-rose-400/10 text-rose-200",
        detailClass: "text-rose-100/90",
      };
  }
}
