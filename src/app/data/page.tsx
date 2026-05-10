import Link from "next/link";

import PulseDot from "@/app/components/pulse-dot";
import {
  CATEGORY_BORDER_CLASS,
  CATEGORY_TEXT_CLASS,
  DATASET_CATEGORY_GLYPH,
  DATASET_CATEGORY_LABEL,
  DATASET_CATEGORY_TOKEN,
} from "@/app/design/categories";
import { MVP_DATASETS } from "@/lib/mvp-datasets";

export const metadata = {
  title: "Atlas TX — open datasets behind the maps",
  description:
    "Public Texas + federal datasets Atlas TX normalizes, scores, and cites across the water-risk workflow. Every map cell traces back to one of these.",
};

export default function DataPage() {
  const byCategory = new Map<string, typeof MVP_DATASETS>();
  for (const dataset of MVP_DATASETS) {
    const list = byCategory.get(dataset.category) ?? [];
    list.push(dataset);
    byCategory.set(dataset.category, list);
  }

  const categories = [...byCategory.entries()].sort(([a], [b]) =>
    DATASET_CATEGORY_LABEL[a as keyof typeof DATASET_CATEGORY_LABEL].localeCompare(
      DATASET_CATEGORY_LABEL[b as keyof typeof DATASET_CATEGORY_LABEL],
    ),
  );

  return (
    <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-12">
      <header className="space-y-5 atlas-fade-rise">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
          <PulseDot size={6} />
          {MVP_DATASETS.length} open datasets · 0 proprietary feeds
        </span>
        <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          <span className="atlas-hero-gradient">Open datasets behind the maps.</span>
        </h1>
        <p className="max-w-3xl text-pretty text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          Every Atlas TX map cell traces back to one of these public sources. State and federal — TCEQ, TWDB, EPA, Census, USGS, NOAA, FEMA. No scraped-then-resold data. The wiki at <Link href="/wiki" className="text-cyan-300 hover:text-cyan-200">docs/wiki/</Link> documents schemas, gotchas, and lineage in depth.
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          {categories.map(([categoryRaw, list]) => {
            const category = categoryRaw as keyof typeof DATASET_CATEGORY_LABEL;
            const token = DATASET_CATEGORY_TOKEN[category];
            return (
              <a
                key={category}
                href={`#cat-${category}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors hover:bg-white/5 ${CATEGORY_BORDER_CLASS[token]} ${CATEGORY_TEXT_CLASS[token]}`}
              >
                <span aria-hidden="true">{DATASET_CATEGORY_GLYPH[category]}</span>
                {DATASET_CATEGORY_LABEL[category]}
                <span className="font-mono tabular-nums text-slate-400">{list.length}</span>
              </a>
            );
          })}
        </div>
      </header>

      {categories.map(([categoryRaw, list]) => {
        const category = categoryRaw as keyof typeof DATASET_CATEGORY_LABEL;
        const token = DATASET_CATEGORY_TOKEN[category];
        return (
          <section key={category} id={`cat-${category}`} className="space-y-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                <span className={CATEGORY_TEXT_CLASS[token]}>{DATASET_CATEGORY_GLYPH[category]}</span>{" "}
                {DATASET_CATEGORY_LABEL[category]}
              </h2>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{list.length} {list.length === 1 ? "dataset" : "datasets"}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {list.map((dataset) => (
                <article
                  key={dataset.id}
                  className="atlas-card-shimmer group relative overflow-hidden rounded-2xl bg-slate-900/40 p-5 ring-1 ring-white/5 transition-all duration-200 hover:bg-slate-900/70 hover:ring-white/15"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2.5">
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] ${CATEGORY_BORDER_CLASS[token]} ${CATEGORY_TEXT_CLASS[token]}`}
                        aria-label={`Category: ${DATASET_CATEGORY_LABEL[category]}`}
                      >
                        <span aria-hidden="true">{DATASET_CATEGORY_GLYPH[category]}</span>
                        {DATASET_CATEGORY_LABEL[category]}
                      </div>
                      <h3 className="text-lg font-semibold leading-snug text-white">{dataset.name}</h3>
                    </div>
                    <code className="shrink-0 rounded-md bg-white/5 px-2 py-1 font-mono text-[11px] text-slate-400">
                      {dataset.id}
                    </code>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{dataset.summary}</p>
                  <dl className="mt-5 grid gap-2 text-sm">
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Publisher</dt>
                      <dd className="text-slate-300">{dataset.publisher}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Use case</dt>
                      <dd className="text-slate-200">{dataset.useCase}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {dataset.keyFields.slice(0, 4).map((field) => (
                      <span key={field} className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-slate-300 ring-1 ring-white/5">
                        {field}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
