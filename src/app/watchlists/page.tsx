import Link from "next/link";

import { WatchlistsDashboard } from "./watchlist-client";

export default function WatchlistsPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-16">
      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/analytics" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
            Analytics
          </Link>
          <Link href="/operators" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
            Operators
          </Link>
        </div>
        <div className="space-y-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-cyan-300/80">Wave 6B · Watchlists</div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Saved watchlists</h1>
          <p className="max-w-4xl text-base leading-7 text-slate-400">
            Atlas now lets you save counties, operators, and permit lanes into local/shared watchlists. Until auth exists, these lists stay in this browser and act like a shared workstation queue rather than a synced personal account.
          </p>
        </div>
      </section>

      <WatchlistsDashboard />
    </main>
  );
}
