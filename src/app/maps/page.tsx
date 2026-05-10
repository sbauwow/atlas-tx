import Link from "next/link";

import { MAP_ENTRIES, MAP_STATUS_CHIP } from "@/lib/map-entries";

export const metadata = {
  title: "Atlas TX — Maps",
  description: "Themed map views across the Atlas Texas water-risk surface.",
};

export default function MapsIndexPage() {
  const liveCount = MAP_ENTRIES.filter((entry) => entry.status === "live").length;
  const scaffoldCount = MAP_ENTRIES.filter((entry) => entry.status === "scaffold").length;
  const comingSoonCount = MAP_ENTRIES.filter((entry) => entry.status === "coming-soon").length;

  return (
    <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,211,238,0.10),transparent_70%)]"
      />

      <header className="space-y-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          Atlas TX · Map collection
        </span>
        <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
          Themed maps across the Texas water-risk surface.
        </h1>
        <p className="max-w-3xl text-pretty text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          Each themed map opens with one cached live layer plus a roadmap of additional signals. The interactive multi-layer hub at <Link href="/map" className="text-cyan-300 transition-colors hover:text-cyan-200">/map</Link> stays the cross-cutting surface; these entries focus on a single thesis question.
        </p>
        <div className="flex flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          <span><span className="text-emerald-300 tabular-nums">{liveCount}</span> live</span>
          <span><span className="text-cyan-300 tabular-nums">{scaffoldCount}</span> scaffold</span>
          <span><span className="text-slate-300 tabular-nums">{comingSoonCount}</span> coming soon</span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MAP_ENTRIES.map((entry) => {
          const chip = MAP_STATUS_CHIP[entry.status];
          return (
            <Link
              key={entry.slug}
              href={`/maps/${entry.slug}`}
              className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-5 ring-1 ring-white/5 transition-colors hover:border-cyan-300/30 hover:bg-slate-950/70"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-300/80">{entry.eyebrow}</div>
                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] ${chip.classes}`}>
                  {chip.label}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white transition-colors group-hover:text-cyan-100">
                {entry.title}
                <span aria-hidden="true" className="ml-1.5 inline-block text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-300">→</span>
              </h2>
              <p className="text-sm leading-6 text-slate-400">{entry.description}</p>
              <div className="mt-auto rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
                <span className="font-medium uppercase tracking-[0.14em] text-slate-500">Live layer · </span>
                {entry.liveLayer}
              </div>
            </Link>
          );
        })}
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Working principles</div>
            <h2 className="mt-2 text-lg font-semibold text-white">How these maps stay honest</h2>
          </div>
        </div>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-300 md:grid-cols-2">
          <li className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3">Each live layer reads from a committed cached snapshot. No live external API calls on the demo path.</li>
          <li className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3">Burden, exposure, and procedural pressure are framed as indicators — never harm, diagnosis, or compliance verdicts.</li>
          <li className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3">County-aggregate views keep individual-PWS or filer details out of the headline lane unless the source page handles disclosure.</li>
          <li className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3">Coming-soon layers are announced and never fabricated. Empty-state language stays explicit when a layer has no data yet.</li>
        </ul>
      </section>
    </main>
  );
}
