import Link from "next/link";

export const metadata = {
  title: "Atlas TX — Maps · Satellite imagery",
  description: "Live aerial basemap embedded as the seed satellite layer for Atlas Texas.",
};

const TX_BBOX = {
  minLon: -106.65,
  minLat: 25.84,
  maxLon: -93.51,
  maxLat: 36.5,
};

const OSM_EMBED_URL = `https://www.openstreetmap.org/export/embed.html?bbox=${TX_BBOX.minLon}%2C${TX_BBOX.minLat}%2C${TX_BBOX.maxLon}%2C${TX_BBOX.maxLat}&layer=cyclosm`;

export default function SatelliteMapPage() {
  return (
    <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,211,238,0.10),transparent_70%)]"
      />

      <header className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            Atlas TX · Map · Satellite imagery
          </span>
          <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-200">
            Live cached layer
          </span>
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Aerial context for Texas water risk.
        </h1>
        <p className="max-w-3xl text-pretty text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          Seed basemap embedded so Atlas viewers can pan and zoom around Texas immediately. Once the MapLibre integration on the parallel <code className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-xs text-slate-300">web/interactive-map</code> branch lands, Atlas vector overlays will mount over a high-resolution Esri or NAIP imagery basemap on this surface.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-white/10 ring-1 ring-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 px-5 py-3 backdrop-blur">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-300/80">Seed basemap</div>
            <div className="mt-1 text-sm font-medium text-white">Texas extent · OpenStreetMap CyclOSM tile layer</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <a
              href={`https://www.openstreetmap.org/?bbox=${TX_BBOX.minLon}%2C${TX_BBOX.minLat}%2C${TX_BBOX.maxLon}%2C${TX_BBOX.maxLat}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 px-3 py-1 transition-colors hover:border-cyan-300/30 hover:bg-cyan-400/5 hover:text-cyan-200"
            >
              Open in OSM ↗
            </a>
            <a
              href="https://www.arcgis.com/home/webmap/viewer.html?useExisting=1&layers=10df2279f9684e4a9f6a7f08febac2a9"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 px-3 py-1 transition-colors hover:border-cyan-300/30 hover:bg-cyan-400/5 hover:text-cyan-200"
            >
              Esri World Imagery ↗
            </a>
          </div>
        </div>
        <iframe
          src={OSM_EMBED_URL}
          title="Texas extent — OpenStreetMap CyclOSM"
          className="block h-[520px] w-full border-0 bg-slate-950"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Planned live layers</div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <PlannedRow label="Esri World Imagery basemap" detail="High-resolution aerial tiles served via MapLibre once dependency adoption lands." />
            <PlannedRow label="NAIP Texas county clips" detail="USDA NAIP 1-meter imagery clipped to the active county footprint." />
            <PlannedRow label="Atlas vector overlays" detail="DWRS, EJ, permit, and citizen layers rendered on top of imagery for visual context." />
            <PlannedRow label="Time-slider for change detection" detail="Year-over-year imagery comparison around water bodies and permit hotspots." />
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Why this is scaffolded</div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            The Atlas demo path stays grounded to cached committed snapshots, so live imagery tiles run via embedded basemap rather than ad-hoc tile fetches inside the Atlas runtime. This keeps the failure surface contained: the Atlas pages keep rendering even if the embedded provider is briefly unavailable.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Once MapLibre integration ships from the parallel interactive-map branch, this surface adopts the same client renderer with Atlas overlays bound on top.
          </p>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/maps" className="rounded-full border border-white/10 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
          ← Back to maps
        </Link>
        <Link href="/water" className="rounded-full bg-white px-5 py-2.5 font-medium text-slate-950 transition-colors hover:bg-slate-200">
          Open the water explorer →
        </Link>
      </section>
    </main>
  );
}

function PlannedRow({ label, detail }: { label: string; detail: string }) {
  return (
    <li className="flex flex-col gap-0.5">
      <span className="font-medium text-white">{label}</span>
      <span className="text-xs text-slate-400">{detail}</span>
    </li>
  );
}
