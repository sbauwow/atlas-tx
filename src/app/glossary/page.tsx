import Link from "next/link";

import { GLOSSARY } from "@/lib/glossary";

const glossaryEntries = Object.entries(GLOSSARY).sort(([left], [right]) => left.localeCompare(right));

export default function GlossaryPage() {
  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-16">
      <section className="space-y-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          Atlas TX glossary
        </span>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Atlas TX glossary</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Plain-English definitions for the agencies, datasets, and regulatory acronyms used across Atlas Texas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/education" className="rounded-full bg-white px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-slate-200">
            Open education guide
          </Link>
          <Link href="/water" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
            Water map
          </Link>
          <Link href="/permits" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
            Permit tracker
          </Link>
        </div>
      </section>

      <section className="grid gap-3">
        {glossaryEntries.map(([key, entry]) => (
          <article key={key} className="rounded-xl border border-white/5 bg-white/[0.03] px-5 py-4">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="font-mono text-lg font-semibold text-cyan-300">{entry.short}</h2>
              <div className="text-white">{entry.long}</div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
