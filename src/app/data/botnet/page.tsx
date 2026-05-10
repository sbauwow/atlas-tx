import Link from "next/link";

import { getAtlasBotnetState } from "@/lib/atlas-botnet-state";

export const metadata = {
  title: "Atlas TX — ingest botnet status",
  description: "Operator-facing visibility into Atlas TX refresh health, roadmap queue state, and county-ingest execution waves.",
};

export const dynamic = "force-dynamic";

export default async function DataBotnetPage() {
  const state = await getAtlasBotnetState();
  const failedSteps = state.pipelineHealth?.steps.filter((step) => step.status !== "ok") ?? [];

  return (
    <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/data" className="rounded-full border border-white/15 px-3 py-1.5 text-slate-200 hover:bg-white/5">
            Back to datasets
          </Link>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-cyan-200">
            Internal operator view
          </span>
        </div>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Atlas ingest botnet status.
        </h1>
        <p className="max-w-3xl text-pretty text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          One surface for refresh health, future-source queue state, and the county execution registry. This is the operator spine for weather history, roadmap open data, and later public-interest verification lanes.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Pipeline status"
          value={state.pipelineHealth?.overallStatus ?? "missing"}
          detail={state.pipelineHealth?.generatedAt ?? "No pipeline-health artifact yet."}
        />
        <StatCard
          label="Execution units"
          value={String(state.executionRegistrySummary.totalUnits)}
          detail={`${state.executionRegistrySummary.activeUnitCount} active · ${state.executionRegistrySummary.plannedUnitCount} planned`}
        />
        <StatCard
          label="Roadmap queue"
          value={String(state.roadmapQueue?.candidateCount ?? 0)}
          detail={state.roadmapQueue?.generatedAt ?? "No roadmap-open-data queue artifact yet."}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 ring-1 ring-white/5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Refresh health</h2>
            <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
              {state.pipelineHealth?.steps.length ?? 0} steps
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Core water, weather/history, catalog, roadmap, then fragile compliance work.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(state.pipelineHealth?.steps ?? []).map((step) => (
              <div key={step.stepId} className="rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white">{step.stepId}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] ${badgeClass(step.status)}`}>
                    {step.status}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {step.outputPath ?? "No artifact path recorded"}
                </div>
              </div>
            ))}
            {!state.pipelineHealth ? (
              <div className="rounded-xl bg-white/[0.02] p-4 text-sm text-slate-400 ring-1 ring-white/5 sm:col-span-2">
                No `pipeline-health.json` artifact yet. Run `npm run refresh:botnet`.
              </div>
            ) : null}
          </div>
          {failedSteps.length ? (
            <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
              <div className="font-medium">Attention needed</div>
              <ul className="mt-2 space-y-1 text-amber-50/90">
                {failedSteps.map((step) => (
                  <li key={step.stepId}>• {step.stepId}: {step.notes.at(-1) ?? "failed"}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 ring-1 ring-white/5">
          <h2 className="text-xl font-semibold text-white">Execution waves</h2>
          <p className="mt-1 text-sm text-slate-400">What Atlas can run now versus what still needs source verification or productization.</p>
          <div className="mt-4 space-y-3">
            {Object.entries(state.executionRegistrySummary.byWave).map(([wave, count]) => (
              <div key={wave} className="rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white">{wave}</span>
                  <span className="font-mono text-sm text-slate-300">{count}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-white/[0.02] p-4 text-sm text-slate-300 ring-1 ring-white/5">
            <div className="font-medium text-white">Operator commands</div>
            <ul className="mt-2 space-y-1 font-mono text-[12px] text-slate-400">
              <li>npm run refresh:botnet</li>
              <li>npm run refresh:weather</li>
              <li>npm run refresh:roadmap-open-data</li>
              <li>npm run mcp -- get_pipeline_health</li>
              <li>npm run mcp -- get_roadmap_open_data_queue</li>
            </ul>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 ring-1 ring-white/5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Future-source queue</h2>
          <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
            {state.queueCandidates.length} candidates
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          The next public-data lanes the botnet should verify, join, and promote.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {state.queueCandidates.map((candidate) => (
            <article key={candidate.executionUnitId} className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{candidate.name}</h3>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    {candidate.roadmapWave} · {candidate.evidenceClass}
                  </div>
                </div>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-300 ring-1 ring-white/10">
                  {candidate.strategicPriority}
                </span>
              </div>
              <dl className="mt-3 space-y-1 text-sm text-slate-300">
                <div><dt className="inline text-slate-500">Lane:</dt> <dd className="inline">{candidate.thesisLane}</dd></div>
                <div><dt className="inline text-slate-500">Join:</dt> <dd className="inline">{candidate.geographicJoinStrategy}</dd></div>
                <div><dt className="inline text-slate-500">Next:</dt> <dd className="inline">{candidate.nextAction}</dd></div>
              </dl>
            </article>
          ))}
          {!state.queueCandidates.length ? (
            <div className="rounded-xl bg-white/[0.02] p-4 text-sm text-slate-400 ring-1 ring-white/5 md:col-span-2 xl:col-span-3">
              No roadmap queue artifact yet. Run `npm run refresh:roadmap-open-data`.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 ring-1 ring-white/5">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{detail}</div>
    </div>
  );
}

function badgeClass(status: string) {
  if (status === "ok") return "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/20";
  if (status === "failed") return "bg-rose-400/10 text-rose-200 ring-1 ring-rose-300/20";
  return "bg-white/5 text-slate-300 ring-1 ring-white/10";
}
