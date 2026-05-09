import Link from "next/link";
import { CATEGORY_BORDER_CLASS, CATEGORY_TEXT_CLASS } from "@/app/design/categories";
import { countyRiskSignals, governanceLayers, surfaceVsGroundwater, texasWaterDiagram, texasWaterFlow, waterPrimerCards } from "@/app/education/content";

export default function EducationPage() {
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
            Atlas TX · education
          </span>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
              Texas water system guide.
            </h1>
            <p className="max-w-3xl text-pretty text-lg leading-8 text-slate-400">
              A grounded primer on where Texas water comes from, how it moves, who governs it, and why county-level water risk is uneven. This page stays aligned with Atlas TX taxonomy: source systems, environmental burden, infrastructure/fiscal capacity, and community context.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/water"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-medium text-slate-950 transition-colors hover:bg-slate-200"
            >
              Open the water explorer
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/10 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5"
            >
              Back to homepage
            </Link>
          </div>
        </div>

        <aside className="rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 ring-1 ring-white/10 backdrop-blur">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Why Atlas TX teaches this first</div>
          <ul className="mt-4 space-y-3.5 text-sm leading-7 text-slate-300">
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-cat-1" />Texas does not have one water system. It has overlapping basin, aquifer, utility, and district systems.</li>
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-cat-2" />Water risk is shaped by both supply and environmental condition.</li>
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-cat-4" />Treatment, storage, and pipe capacity can fail even when water is physically nearby.</li>
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-cat-6" />County outcomes depend on who is served, who is exposed, and who can adapt.</li>
          </ul>
        </aside>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-white">The four core questions</h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-400">
            Start here before looking at county rankings, PWS risk, or basin overlays.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {waterPrimerCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-2xl border bg-slate-950/40 p-5 ring-1 ring-white/5 ${CATEGORY_BORDER_CLASS[card.token]}`}
            >
              <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${CATEGORY_BORDER_CLASS[card.token]} ${CATEGORY_TEXT_CLASS[card.token]}`}>
                <span aria-hidden="true">{card.glyph}</span>
                {card.title}
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Texas water system at a glance</h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-400">
            A simple map of the flow: rainfall and recharge feed both surface water and groundwater, utilities treat and deliver that water, and wastewater systems return or reuse it.
          </p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[repeat(5,minmax(0,1fr))]">
          {texasWaterDiagram.map((step, index) => (
            <div key={step.title} className="relative rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 text-base text-cyan-300">
                  {step.glyph}
                </div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Step {index + 1}</div>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{step.body}</p>
              {index < texasWaterDiagram.length - 1 ? (
                <div aria-hidden="true" className="mt-4 text-center text-cyan-300/70 lg:absolute lg:-right-3 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2">→</div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {([surfaceVsGroundwater.surfaceWater, surfaceVsGroundwater.groundwater] as const).map((source) => (
          <article key={source.title} className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-lg text-cyan-300">
                {source.glyph}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">{source.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">{source.body}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Examples</div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                  {source.examples.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Strengths</div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                  {source.strengths.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Watchouts</div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                  {source.watchouts.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">How water moves through Texas</h2>
          <ol className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
            {texasWaterFlow.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/5 font-mono text-xs text-cyan-300 ring-1 ring-white/10">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </article>

        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Who governs it</h2>
          <div className="mt-5 space-y-4">
            {governanceLayers.map((layer, index) => (
              <div key={layer.title} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Layer {index + 1}</span>
                  <h3 className="text-sm font-semibold text-white">{layer.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-300">{layer.body}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Why county water risk is uneven</h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-400">
            A county can sit near rivers, reservoirs, or major aquifers and still face water stress. Atlas TX treats these as interacting signals rather than a single supply score.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {countyRiskSignals.map((signal) => (
            <div key={signal} className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              {signal}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
