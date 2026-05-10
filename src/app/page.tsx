import Link from "next/link";
import TrackedLink from "@/app/components/tracked-link";
import GlossaryTooltip, { GlossaryInlineList } from "@/app/components/glossary-tooltip";
import { CATEGORY_BORDER_CLASS, CATEGORY_TEXT_CLASS, DATASET_CATEGORY_GLYPH, DATASET_CATEGORY_LABEL, DATASET_CATEGORY_TOKEN } from "@/app/design/categories";
import { surfaceVsGroundwater, texasWaterDiagram, waterPrimerCards } from "@/app/education/content";
import { getDefaultAtlasCountyExplorerService } from "@/lib/atlas-county-explorer";
import { MVP_DATASETS } from "@/lib/mvp-datasets";
import { getTceqPendingPermitsPageData } from "@/lib/tceq-permits";
import { getDefaultAtlasWaterSummaryService } from "@/lib/water/water-summary-service";

export default async function Home() {
  const countyService = getDefaultAtlasCountyExplorerService();
  const waterService = getDefaultAtlasWaterSummaryService();
  const [countyOverview, waterOverview, permitData] = await Promise.all([
    countyService.getCountyOverview(),
    waterService.getWaterOverview(),
    getTceqPendingPermitsPageData(),
  ]);
  const activeAlertCount = waterOverview.counties.reduce((sum, county) => sum + (county.metrics.activeWaterAlertCount ?? 0), 0);
  const gaugeCount = waterOverview.counties.reduce((sum, county) => sum + (county.metrics.streamGaugeCount ?? 0), 0);

  return (
    <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,211,238,0.10),transparent_70%)]"
      />

      <section className="grid gap-10 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
        <div className="space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            Atlas TX · Texas water risk explorer
          </span>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
              How the Texas water system works — and why county water risk is uneven.
            </h1>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">
              Surface Texas drinking-water risk and environmental-justice burden.
            </p>
            <p className="max-w-3xl text-pretty text-lg leading-8 text-slate-400">
              Atlas TX joins Texas permit and water-system context with federal <GlossaryTooltip term="SDWIS" expand />, <GlossaryTooltip term="EJScreen" expand />, and <GlossaryTooltip term="ACS" expand /> data. Journalists, policy analysts, and civic-tech teams can use this governed decision-support surface to start with where water comes from, who manages it, and why some counties carry more water stress than others.
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
              href="/education"
              className="rounded-full border border-white/10 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5"
            >
              Water system primer
            </Link>
            <Link
              href="/counties"
              className="rounded-full border border-white/10 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5"
            >
              County workspace overview
            </Link>
            <Link
              href="/analytics"
              className="rounded-full border border-white/10 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5"
            >
              Statewide analytics terminal
            </Link>
            <Link
              href="/operators"
              className="rounded-full border border-white/10 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5"
            >
              Operator directory
            </Link>
            <TrackedLink
              event="outbound"
              eventTarget="repo:github.com/sbauwow/atlas-tx@home"
              href="https://github.com/sbauwow/atlas-tx"
              className="rounded-full border border-white/10 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5"
            >
              GitHub repo
            </TrackedLink>
          </div>
        </div>

        <aside className="rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 ring-1 ring-white/10 backdrop-blur">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Water-risk thesis</div>
          <ul className="mt-4 space-y-3.5 text-sm leading-7 text-slate-300">
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-cat-1" />Start with <GlossaryTooltip term="DWRS" expand /> + environmental-justice overlap (<GlossaryTooltip term="EJ" />) + cited permit context.</li>
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-cat-2" />Primary user: Texas county-newsroom journalists.</li>
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-cat-4" />Environmental burden, fiscal/infrastructure capacity, and governance explain uneven county risk.</li>
            <li className="flex gap-3"><span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-cat-6" />Atlas taxonomy keeps source systems, burden, capacity, and community context legible.</li>
          </ul>
        </aside>
      </section>

      <GlossaryInlineList label="Common terms" terms={["TCEQ", "DWRS", "EJ", "SDWIS", "ACS"]} />

      <section className="grid gap-4 lg:grid-cols-3">
        <EntryPathCard
          eyebrow="Entry paths"
          title="Water explorer"
          description="Open statewide water context, alerts, gauges, and public-water governance layers."
          metric={`${activeAlertCount} active alerts · ${gaugeCount} gauges`}
          statusHref="/water?mode=mismatch"
          statusLabel="View live status"
          href="/water"
          cta="Open water explorer"
        />
        <EntryPathCard
          eyebrow="Entry paths"
          title="County workspace overview"
          description="Jump into ranked counties, then branch into county intelligence, permits, or water profiles."
          metric={`${countyOverview.countyCount} ranked counties`}
          statusHref="/counties#top-counties"
          statusLabel="View top counties"
          href="/counties"
          cta="Open county workspace"
        />
        <EntryPathCard
          eyebrow="Entry paths"
          title="Permit tracker"
          description="Watch pending TCEQ permit pressure and procedural activity by county."
          metric={`${permitData.summary.pendingPermitCount} pending permits`}
          statusHref="/permits#top-counties"
          statusLabel="View permit hotspots"
          href="/permits"
          cta="Open permit tracker"
        />
      </section>

      <section className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-5 ring-1 ring-cyan-400/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">New statewide screen</div>
            <h2 className="text-2xl font-semibold text-white">Analytics terminal</h2>
            <p className="max-w-3xl text-sm leading-7 text-slate-300">
              Open statewide movers, pressure-versus-risk screening, and direct county jump links from one fast terminal-style surface.
            </p>
          </div>
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-slate-950/60 px-5 py-2.5 text-sm font-medium text-cyan-200 transition-colors hover:border-cyan-300/50 hover:bg-slate-950"
          >
            Open analytics
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 ring-1 ring-white/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Entity navigation</div>
            <h2 className="text-2xl font-semibold text-white">Operator directory</h2>
            <p className="max-w-3xl text-sm leading-7 text-slate-300">
              Review permittee and applicant footprints, case counts, and county concentration from the current public-record snapshots.
            </p>
          </div>
          <Link
            href="/operators"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-5 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:border-white/20 hover:bg-slate-950"
          >
            Open operators
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-3">
        <StatTile value="2" label="Primary Texas water sources: surface water and groundwater" />
        <StatTile value="4" label="Headline signals: Drinking Water Risk Score (DWRS), environmental-justice (EJ) overlap, protest density" />
        <StatTile value={`${MVP_DATASETS.length}`} label="Atlas TX dataset registry" />
      </section>

      <section id="education-primer" className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-white">Texas water system primer</h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-400">
            Texas gets water from above-ground rivers and reservoirs and below-ground aquifers. The hard part is not just finding water — it is managing treatment, delivery, drought pressure, flood shocks, and county-to-county imbalance.
          </p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Education preview</div>
          <Link href="/education" className="text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200">
            Open full guide →
          </Link>
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
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/5 bg-slate-950/30 p-5">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Visual explainer</div>
            <h3 className="mt-2 text-lg font-semibold text-white">Surface water</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">{surfaceVsGroundwater.surfaceWater.body}</p>
          </article>
          <article className="rounded-2xl border border-white/5 bg-slate-950/30 p-5">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Visual explainer</div>
            <h3 className="mt-2 text-lg font-semibold text-white">Groundwater</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">{surfaceVsGroundwater.groundwater.body}</p>
          </article>
        </div>
        <div className="rounded-2xl border border-white/5 bg-slate-950/30 p-5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">System diagram</div>
          <div className="mt-3 grid gap-3 md:grid-cols-5">
            {texasWaterDiagram.map((step) => (
              <div key={step.title} className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 text-sm text-slate-300">
                <div className="text-cyan-300">{step.glyph}</div>
                <div className="mt-2 font-medium text-white">{step.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="dataset-registry" className="space-y-6">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-white">Atlas TX dataset registry</h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-400">
              Public datasets Atlas TX normalizes, scores, and cites across the water-risk workflow.
            </p>
          </div>
          <span className="hidden text-xs font-medium uppercase tracking-[0.18em] text-slate-500 sm:block">{MVP_DATASETS.length} sources</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {MVP_DATASETS.map((dataset) => {
            const token = DATASET_CATEGORY_TOKEN[dataset.category];
            return (
              <article
                key={dataset.id}
                className="group relative overflow-hidden rounded-2xl bg-slate-900/40 p-5 ring-1 ring-white/5 transition-all duration-200 hover:bg-slate-900/70 hover:ring-white/15"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-2.5">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] ${CATEGORY_BORDER_CLASS[token]} ${CATEGORY_TEXT_CLASS[token]}`}
                      aria-label={`Category: ${DATASET_CATEGORY_LABEL[dataset.category]}`}
                    >
                      <span aria-hidden="true">{DATASET_CATEGORY_GLYPH[dataset.category]}</span>
                      {DATASET_CATEGORY_LABEL[dataset.category]}
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
            );
          })}
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

function EntryPathCard({
  eyebrow,
  title,
  description,
  metric,
  statusHref,
  statusLabel,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  metric: string;
  statusHref: string;
  statusLabel: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/30 p-5 ring-1 ring-white/5">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{eyebrow}</div>
      <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <div className="font-medium text-cyan-300">{metric}</div>
        <Link href={statusHref} className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400 transition-colors hover:text-cyan-300">
          {statusLabel}
        </Link>
      </div>
      <Link href={href} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200">
        {cta}
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
