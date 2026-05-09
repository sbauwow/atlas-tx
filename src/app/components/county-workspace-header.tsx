import Link from "next/link";

export type CountyWorkspaceHeaderProps = {
  countyName: string;
  countySlug: string;
  permitsHref: string;
  waterHref: string;
  previousCounty?: { name: string; slug: string; href: string } | null;
  nextCounty?: { name: string; slug: string; href: string } | null;
};

export function CountyWorkspaceHeader({
  countyName,
  countySlug,
  permitsHref,
  waterHref,
  previousCounty,
  nextCounty,
}: CountyWorkspaceHeaderProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300 ring-1 ring-white/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">County workspace</div>
          <div className="text-lg font-semibold text-white">{countyName}</div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{countySlug}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={permitsHref} className="rounded-full bg-white px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-slate-200">
            Permit view
          </Link>
          <Link href={waterHref} className="rounded-full border border-white/10 px-4 py-2 font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
            Water profile
          </Link>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        {previousCounty ? (
          <Link href={previousCounty.href} className="rounded-full border border-white/10 px-3 py-1.5 transition-colors hover:border-white/20 hover:bg-white/5">
            ← {previousCounty.name}
          </Link>
        ) : null}
        {nextCounty ? (
          <Link href={nextCounty.href} className="rounded-full border border-white/10 px-3 py-1.5 transition-colors hover:border-white/20 hover:bg-white/5">
            {nextCounty.name} →
          </Link>
        ) : null}
      </div>
    </section>
  );
}
