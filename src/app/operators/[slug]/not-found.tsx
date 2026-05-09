import Link from "next/link";

export default function OperatorNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-20">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 ring-1 ring-white/5">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          Operator not found
        </span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">No operator detail matched that slug</h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Try the operator directory to reopen a public-record entity page. Atlas only shows operators present in the current pending permit and CID snapshots.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <Link href="/operators" className="rounded-full bg-white px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-slate-200">
            Back to operator directory
          </Link>
          <Link href="/permits" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
            Open permit tracker
          </Link>
        </div>
      </div>
    </main>
  );
}
