import TrackedLink from "@/app/components/tracked-link";
import { MVP_DATASETS } from "@/lib/mvp-datasets";
import {
  CATEGORY_BORDER_CLASS,
  CATEGORY_TEXT_CLASS,
  DATASET_CATEGORY_GLYPH,
  DATASET_CATEGORY_LABEL,
  DATASET_CATEGORY_TOKEN,
} from "@/app/design/categories";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-12">
      <section className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
            Atlas TX · Texas water risk explorer
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white">
              Surface Texas drinking-water risk and environmental-justice burden.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Atlas TX joins Texas permit and water-system context with federal SDWIS, EJScreen, and ACS data.
              Journalists, policy analysts, and civic-tech teams can spot overlooked counties and Public Water Systems with sourced rows and explicit caveats.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <a href="/api/health" className="rounded-full bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300">
              API health
            </a>
            <TrackedLink
              event="outbound"
              eventTarget="repo:github.com/sbauwow/atlas-tx@home"
              href="https://github.com/sbauwow/atlas-tx"
              className="rounded-full border border-slate-700 px-5 py-3 font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
            >
              GitHub repo
            </TrackedLink>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/30">
          <h2 className="text-lg font-semibold text-white">Water-risk thesis</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            <li>• Start with DWRS + EJ overlap + cited permit context.</li>
            <li>• Primary user: Texas county-newsroom journalists.</li>
            <li>• Surface overlooked counties and Public Water Systems, not generic compare-counties chrome.</li>
            <li>• Ship the agent + MCP path first; the UI makes the output legible to humans.</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-3xl font-semibold text-white">12</div>
          <div className="mt-1 text-sm text-slate-400">Atlas TX dataset registry</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-3xl font-semibold text-white">3</div>
          <div className="mt-1 text-sm text-slate-400">Headline signals: DWRS, EJ overlap, protest density</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-3xl font-semibold text-white">2</div>
          <div className="mt-1 text-sm text-slate-400">Primary surfaces: MCP skill + judge-facing web UI</div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Atlas TX dataset registry</h2>
          <p className="text-sm text-slate-400">
            These are the public datasets Atlas TX will normalize, score, and cite across the water-risk workflow.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {MVP_DATASETS.map((dataset) => {
            const token = DATASET_CATEGORY_TOKEN[dataset.category];
            return (
              <article key={dataset.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div
                      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.2em] ${CATEGORY_BORDER_CLASS[token]} ${CATEGORY_TEXT_CLASS[token]}`}
                      aria-label={`Category: ${DATASET_CATEGORY_LABEL[dataset.category]}`}
                    >
                      <span aria-hidden="true">{DATASET_CATEGORY_GLYPH[dataset.category]}</span>
                      {DATASET_CATEGORY_LABEL[dataset.category]}
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
            );
          })}
        </div>
      </section>
    </main>
  );
}
