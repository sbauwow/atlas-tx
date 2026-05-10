import Link from "next/link";

export type MapScaffoldStatus = "coming-soon" | "scaffolded";

export type MapScaffoldDataset = {
  label: string;
  source: string;
  registryId?: string;
};

export type MapScaffoldPlannedSignal = {
  label: string;
  description: string;
};

export type MapScaffoldPlanLink = {
  href: string;
  label: string;
};

export type MapScaffoldPageProps = {
  volumeLabel: string;
  title: string;
  oneLiner: string;
  status: MapScaffoldStatus;
  eta?: string;
  plannedDatasets: MapScaffoldDataset[];
  plannedSignals: MapScaffoldPlannedSignal[];
  planLink?: MapScaffoldPlanLink;
  contractAnchor?: { href: string; label: string };
};

const STATUS_LABEL: Record<MapScaffoldStatus, string> = {
  "coming-soon": "Coming soon",
  "scaffolded": "Planned",
};

const STATUS_TONE: Record<MapScaffoldStatus, string> = {
  "coming-soon": "border-cyan-300/30 bg-cyan-300/10 text-cyan-200",
  "scaffolded": "border-white/15 bg-white/5 text-slate-300",
};

export default function MapScaffoldPage(props: MapScaffoldPageProps) {
  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,211,238,0.08),transparent_70%)]"
      />

      <header className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            {props.volumeLabel}
          </span>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${STATUS_TONE[props.status]}`}>
            {STATUS_LABEL[props.status]}
          </span>
          {props.eta ? (
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">ETA · {props.eta}</span>
          ) : null}
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">{props.title}</h1>
        <p className="max-w-3xl text-pretty text-base leading-7 text-slate-400">{props.oneLiner}</p>
      </header>

      <section
        aria-label="Map placeholder"
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 p-10 ring-1 ring-white/5"
      >
        <div className="absolute inset-0 -z-10 opacity-40 [background-image:repeating-linear-gradient(135deg,rgba(148,163,184,0.10)_0_1px,transparent_1px_10px)]" />
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Map surface</div>
          <p className="max-w-xl text-sm leading-6 text-slate-400">
            Once the data layers below are bound, this surface renders the live map for {props.title.toLowerCase()}. Until then, the planned datasets and signals are listed.
          </p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Planned datasets</div>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            {props.plannedDatasets.map((dataset) => (
              <li key={`${dataset.label}-${dataset.source}`} className="flex flex-col gap-0.5">
                <span className="font-medium text-white">{dataset.label}</span>
                <span className="text-xs text-slate-400">
                  {dataset.source}
                  {dataset.registryId ? (
                    <>
                      <span aria-hidden="true"> · </span>
                      <code className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">{dataset.registryId}</code>
                    </>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Planned signals</div>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            {props.plannedSignals.map((signal) => (
              <li key={signal.label} className="flex flex-col gap-0.5">
                <span className="font-medium text-white">{signal.label}</span>
                <span className="text-xs text-slate-400">{signal.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {props.planLink || props.contractAnchor ? (
        <section className="rounded-2xl border border-white/10 bg-slate-950/30 p-5 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Public roadmap</div>
          <div className="mt-3 flex flex-wrap gap-3">
            {props.planLink ? (
              <Link href={props.planLink.href} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:border-white/20 hover:bg-slate-950">
                {props.planLink.label}
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}
            {props.contractAnchor ? (
              <Link href={props.contractAnchor.href} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:border-white/20 hover:bg-slate-950">
                {props.contractAnchor.label}
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/" className="rounded-full border border-white/10 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
          Back to atlas overview
        </Link>
        <Link href="/water" className="rounded-full bg-white px-5 py-2.5 font-medium text-slate-950 transition-colors hover:bg-slate-200">
          Open Map I — Water
          <span aria-hidden="true" className="ml-2">→</span>
        </Link>
      </section>
    </main>
  );
}
