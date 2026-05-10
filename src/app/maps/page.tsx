import Link from "next/link";

import { MAP_ENTRIES } from "@/lib/map-entries";

export const metadata = {
  title: "Atlas TX — Maps",
  description: "Themed map views across the Atlas Texas water-risk surface.",
};

export default function MapsIndexPage() {
  return (
    <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,211,238,0.10),transparent_70%)]"
      />

      <header className="max-w-3xl space-y-4">
        <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
          Themed maps.
        </h1>
        <p className="text-pretty text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          One question per view. <Link href="/map" className="text-cyan-300 transition-colors hover:text-cyan-200">The interactive map</Link> stacks them together.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MAP_ENTRIES.map((entry) => (
          <Link
            key={entry.slug}
            href={`/maps/${entry.slug}`}
            className="group flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-slate-950/40 p-5 ring-1 ring-white/5 transition-colors hover:border-cyan-300/30 hover:bg-slate-950/70"
          >
            <h2 className="text-xl font-semibold text-white transition-colors group-hover:text-cyan-100">
              {entry.title}
              <span aria-hidden="true" className="ml-1.5 inline-block text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-300">→</span>
            </h2>
            <p className="text-sm leading-6 text-slate-400">{entry.description}</p>
            <div className="mt-auto pt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">{entry.eyebrow}</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
