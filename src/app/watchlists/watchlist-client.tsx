"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import {
  DEFAULT_WATCHLIST_ID,
  Watchlist,
  WatchlistItem,
  WatchlistSurface,
  buildWatchlistExport,
  createWatchlist,
  formatWatchlistDate,
  loadWatchlistsFromStorage,
  removeWatchlist,
  removeWatchlistItem,
  saveWatchlistsToStorage,
  upsertWatchlistItem,
} from "./watchlist-model";

export function AddToWatchlistControl({
  item,
  className = "",
}: {
  item: Omit<WatchlistItem, "addedAt">;
  className?: string;
}) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(getInitialWatchlists);
  const [selectedId, setSelectedId] = useState(() => getInitialWatchlists()[0]?.id ?? DEFAULT_WATCHLIST_ID);
  const [message, setMessage] = useState("Saved locally in this browser until sign-in exists.");
  const [tone, setTone] = useState<"idle" | "success" | "error">("idle");

  const alreadySavedInSelected = useMemo(() => {
    return watchlists.find((entry) => entry.id === selectedId)?.items.some((entry) => entry.id === item.id) ?? false;
  }, [item.id, selectedId, watchlists]);

  function handleAdd() {
    if (typeof window === "undefined") {
      setTone("error");
      setMessage("Watchlists need browser storage. You can still copy this lane into notes.");
      return;
    }

    const result = upsertWatchlistItem(watchlists, selectedId, item);
    const saved = saveWatchlistsToStorage(result.watchlists, window.localStorage);

    if (!saved) {
      setTone("error");
      setMessage("Atlas could not write to local storage. Copy the lane manually for now.");
      return;
    }

    setWatchlists(result.watchlists);
    setTone("success");
    setMessage(
      result.alreadySaved
        ? `Already in ${result.targetName}.`
        : `Saved to ${result.targetName}. Local/shared only until auth exists.`,
    );
  }

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`watchlist-${item.id}`}>
          Choose watchlist
        </label>
        <select
          id={`watchlist-${item.id}`}
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="min-w-44 rounded-full border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-200"
        >
          {watchlists.map((watchlist) => (
            <option key={watchlist.id} value={watchlist.id}>
              {watchlist.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 transition-colors hover:bg-cyan-400/20"
        >
          {alreadySavedInSelected ? "Saved in watchlist" : "Add to watchlist"}
        </button>
        <Link href="/watchlists" className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5">
          View watchlists
        </Link>
      </div>
      <p className={tone === "error" ? "text-xs text-amber-200" : "text-xs text-slate-500"}>{message}</p>
    </div>
  );
}

export function WatchlistsDashboard() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(getInitialWatchlists);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("Local/shared in this browser only. Atlas will not sync these lists across devices until auth exists.");

  const totalItems = watchlists.reduce((sum, watchlist) => sum + watchlist.items.length, 0);

  function persist(nextWatchlists: Watchlist[], successMessage: string) {
    if (typeof window === "undefined") {
      setMessage("Watchlists need browser storage. This page can still show the default empty state.");
      return;
    }

    const saved = saveWatchlistsToStorage(nextWatchlists, window.localStorage);
    if (!saved) {
      setMessage("Atlas could not update local storage. Keep a manual copy of critical lanes for now.");
      return;
    }

    setWatchlists(nextWatchlists);
    setMessage(successMessage);
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextWatchlists = createWatchlist(watchlists, name, description);
    persist(nextWatchlists, `Created ${name.trim() || "watchlist"}. Local/shared only until sign-in exists.`);
    setName("");
    setDescription("");
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-300/80">Saved watchlists</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Local/shared until auth exists</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Save counties, operators, and permit lanes from analytics and operator surfaces. These watchlists live in this browser for now, so treat them like a shared workstation queue instead of a personal synced inbox.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <Link href="/analytics" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
              Back to analytics
            </Link>
            <Link href="/operators" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
              Back to operators
            </Link>
          </div>
        </div>

        <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <MiniStat label="Watchlists" value={String(watchlists.length)} />
          <MiniStat label="Saved lanes" value={String(totalItems)} />
          <MiniStat label="Scope" value="Browser" />
          <MiniStat label="Sync" value="Local only" />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-fuchsia-300/80">Create a watchlist</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Add a named queue</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Keep the default shared triage list, or create a more specific queue like &quot;South Texas permits&quot; or &quot;Operators to brief next week.&quot;
            </p>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">No backend required</div>
        </div>

        <form onSubmit={handleCreate} className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr_auto] lg:items-end">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Weekly county triage"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Description</span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Shared browser queue for likely follow-up counties and operators"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500"
            />
          </label>
          <button type="submit" className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-200">
            Create watchlist
          </button>
        </form>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-300/80">Current queues</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Review, open, and trim saved lanes</h2>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Graceful when no API exists</div>
        </div>

        {watchlists.map((watchlist) => {
          const exportValue = buildWatchlistExport(watchlist.items);

          return (
            <article key={watchlist.id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-semibold text-white">{watchlist.name}</h3>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100">
                      {watchlist.scopeLabel}
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{watchlist.description}</p>
                  <p className="mt-2 text-xs text-slate-500">Updated {formatWatchlistDate(watchlist.updatedAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                    {watchlist.items.length} saved {watchlist.items.length === 1 ? "lane" : "lanes"}
                  </span>
                  {watchlist.id !== DEFAULT_WATCHLIST_ID ? (
                    <button
                      type="button"
                      onClick={() => persist(removeWatchlist(watchlists, watchlist.id), `Removed ${watchlist.name}.`)}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5"
                    >
                      Delete list
                    </button>
                  ) : null}
                </div>
              </div>

              {watchlist.items.length ? (
                <>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {watchlist.items.map((item) => (
                      <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.kind}</div>
                            <h4 className="mt-1 text-lg font-semibold text-white">{item.label}</h4>
                          </div>
                          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                            {surfaceLabel(item.surface)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-200">{item.summary}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{item.detail}</p>
                        <p className="mt-3 text-xs text-slate-500">Saved {formatWatchlistDate(item.addedAt)}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                          <Link href={item.href} className="rounded-full bg-white px-3 py-1.5 font-medium text-slate-950 transition-colors hover:bg-slate-200">
                            Open lane
                          </Link>
                          <button
                            type="button"
                            onClick={() => persist(removeWatchlistItem(watchlists, watchlist.id, item.id), `Removed ${item.label} from ${watchlist.name}.`)}
                            className="rounded-full border border-white/10 px-3 py-1.5 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5"
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Copyable export</div>
                    <textarea
                      readOnly
                      value={exportValue}
                      aria-label={`${watchlist.name} export`}
                      className="mt-3 min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm leading-6 text-slate-200"
                    />
                  </div>
                </>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-sm leading-6 text-slate-400">
                  Nothing is saved in this watchlist yet. Add counties or operators from <Link href="/analytics" className="text-cyan-300 hover:text-cyan-200">analytics</Link> or <Link href="/operators" className="text-cyan-300 hover:text-cyan-200">operators</Link> and they will show up here.
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}

function getInitialWatchlists() {
  if (typeof window === "undefined") {
    return loadWatchlistsFromStorage(null);
  }

  return loadWatchlistsFromStorage(window.localStorage);
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-950/40 p-6">
      <div className="text-3xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{label}</div>
    </div>
  );
}

function surfaceLabel(surface: WatchlistSurface) {
  if (surface === "analytics") return "Analytics";
  if (surface === "operators") return "Operators";
  if (surface === "operator-detail") return "Operator detail";
  return "Watchlists";
}
