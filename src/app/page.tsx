import { MVP_DATASETS } from "@/lib/mvp-datasets";

const categoryLabels = {
  environment: "Environment",
  infrastructure: "Infrastructure",
  social: "Social strain",
  fiscal: "Fiscal context",
  debt: "Debt",
} as const;

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-12">
      <section className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
            Atlas TX · Texas county intelligence
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white">
              Explore Texas counties across environment, social strain, and local fiscal capacity.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Atlas TX is an open-source research and decision-support layer over Texas public data.
              The MVP starts with county comparison, explicit citations, and a safe expansion path into municipal debt analysis.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <a href="/api/health" className="rounded-full bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300">
              API health
            </a>
            <a href="https://github.com/sbauwow/atlas-tx" className="rounded-full border border-slate-700 px-5 py-3 font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900">
              GitHub repo
            </a>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/30">
          <h2 className="text-lg font-semibold text-white">MVP thesis</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            <li>• Compare counties with bounded, attributable public data.</li>
            <li>• Start with environmental burden + social strain + fiscal context.</li>
            <li>• Expand into municipal debt via Bond Review Board and Comptroller layers.</li>
            <li>• Ship both a visual interface and agent/MCP scaffolding.</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-3xl font-semibold text-white">8</div>
          <div className="mt-1 text-sm text-slate-400">MVP data sources locked</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-3xl font-semibold text-white">3</div>
          <div className="mt-1 text-sm text-slate-400">Initial lenses: environment, social, fiscal</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-3xl font-semibold text-white">2</div>
          <div className="mt-1 text-sm text-slate-400">Technical lanes: MCP server + agent skill</div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Locked MVP dataset shortlist</h2>
          <p className="text-sm text-slate-400">
            These are the first datasets Atlas TX will normalize, compare, and cite.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {MVP_DATASETS.map((dataset) => (
            <article key={dataset.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                    {categoryLabels[dataset.category]}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-white">{dataset.name}</h3>
                </div>
                <div className="rounded-full border border-slate-700 px-3 py-1 font-mono text-xs text-slate-300">
                  {dataset.id}
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{dataset.summary}</p>
              <div className="mt-4 text-xs text-slate-400">Publisher: {dataset.publisher}</div>
              <div className="mt-4 text-sm text-slate-200">Use case: {dataset.useCase}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {dataset.keyFields.slice(0, 4).map((field) => (
                  <span key={field} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {field}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
