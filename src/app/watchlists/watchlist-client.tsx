"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  ApiWatchlistDetail,
  ApiWatchlistSummary,
  DEFAULT_WATCHLIST_ID,
  Watchlist,
  WatchlistItem,
  WatchlistSurface,
  buildPersistedWatchlistItemInput,
  buildWatchlistExport,
  buildWatchlistFromSummary,
  createDefaultWatchlist,
  createWatchlist,
  formatWatchlistDate,
  hydrateWatchlistFromApi,
  loadWatchlistsFromStorage,
  removeWatchlist,
  removeWatchlistItem,
  saveWatchlistsToStorage,
  updateWatchlistDetails,
  upsertWatchlistItem,
} from "./watchlist-model";

type WatchlistStoreMode = "api" | "fallback-local";

export function AddToWatchlistControl({
  item,
  className = "",
}: {
  item: Omit<WatchlistItem, "addedAt" | "persistedItemId">;
  className?: string;
}) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([createDefaultWatchlist()]);
  const [selectedId, setSelectedId] = useState(DEFAULT_WATCHLIST_ID);
  const [mode, setMode] = useState<WatchlistStoreMode>("api");
  const [message, setMessage] = useState("Saving to the shared watchlist workspace.");
  const [tone, setTone] = useState<"idle" | "success" | "error">("idle");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void hydrateWatchlists().then((result) => {
      if (cancelled) {
        return;
      }

      setWatchlists(result.watchlists);
      setMode(result.mode);
      setSelectedId((current) => chooseSelectedId(result.watchlists, current));
      setTone("idle");
      setMessage(
        result.mode === "api"
          ? "Saving to the shared watchlist workspace."
          : "Watchlist API unavailable. Atlas will save to this browser until the API comes back.",
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const alreadySavedInSelected = useMemo(() => {
    return watchlists.find((entry) => entry.id === selectedId)?.items.some((entry) => entry.id === item.id) ?? false;
  }, [item.id, selectedId, watchlists]);

  async function handleAdd() {
    setBusy(true);

    try {
      if (mode === "api") {
        const persistedInput = buildPersistedWatchlistItemInput(item);
        if (!persistedInput) {
          setTone("error");
          setMessage("This lane could not be prepared for the shared watchlist workspace. Try again or keep a browser fallback copy for now.");
          return;
        }

        const targetWatchlist = await ensurePersistedTargetWatchlist(selectedId, watchlists);
        const response = await fetch(`/api/watchlists/${targetWatchlist.id}/items`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(persistedInput),
        });

        if (response.status === 409) {
          const refreshedWatchlist = await fetchWatchlistDetail(targetWatchlist.id);
          setWatchlists((current) => replaceWatchlist(current, refreshedWatchlist));
          setSelectedId(targetWatchlist.id);
          setTone("success");
          setMessage(`Already in ${targetWatchlist.name}.`);
          return;
        }

        if (!response.ok) {
          throw new Error(`watchlist item create failed: ${response.status}`);
        }

        const updatedWatchlist = await fetchWatchlistDetail(targetWatchlist.id);
        setWatchlists((current) => replaceWatchlist(current, updatedWatchlist));
        setSelectedId(targetWatchlist.id);
        setTone("success");
        setMessage(`Saved to ${updatedWatchlist.name}. Persisted to the shared workspace.`);
        return;
      }

      const result = persistLocalAdd(watchlists, selectedId, item);
      setWatchlists(result.watchlists);
      setSelectedId((current) => chooseSelectedId(result.watchlists, current));
      setTone("success");
      setMessage(
        result.alreadySaved
          ? `Already in ${result.targetName}.`
          : `Saved to ${result.targetName}. Browser fallback is active until the API comes back.`,
      );
    } catch {
      const fallbackResult = persistLocalAdd(watchlists, selectedId, item);
      setMode("fallback-local");
      setWatchlists(fallbackResult.watchlists);
      setSelectedId((current) => chooseSelectedId(fallbackResult.watchlists, current));
      setTone("success");
      setMessage("Watchlist API unavailable. Atlas saved this lane in browser fallback storage on this device.");
    } finally {
      setBusy(false);
    }
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
          onClick={() => {
            void handleAdd();
          }}
          disabled={busy}
          className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 transition-colors hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Saving…" : alreadySavedInSelected ? "Saved in watchlist" : "Add to watchlist"}
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
  const [watchlists, setWatchlists] = useState<Watchlist[]>([createDefaultWatchlist()]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [mode, setMode] = useState<WatchlistStoreMode>("api");
  const [message, setMessage] = useState("Loading shared watchlists…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void hydrateWatchlists().then((result) => {
      if (cancelled) {
        return;
      }

      setWatchlists(result.watchlists);
      setMode(result.mode);
      setMessage(
        result.mode === "api"
          ? result.watchlists.some((entry) => entry.id !== DEFAULT_WATCHLIST_ID)
            ? "Shared watchlists loaded from the Atlas API."
            : "No shared watchlists are persisted yet. Create one or keep using the shared triage queue."
          : "Watchlist API unavailable. Atlas is showing browser fallback data saved on this device.",
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalItems = watchlists.reduce((sum, watchlist) => sum + watchlist.items.length, 0);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setMessage("Give the watchlist a name first.");
      return;
    }

    setBusy(true);

    try {
      if (mode === "api") {
        const response = await fetch("/api/watchlists", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ label: trimmedName, notes: description.trim() || null }),
        });

        if (!response.ok) {
          throw new Error(`watchlist create failed: ${response.status}`);
        }

        const body = (await response.json()) as { watchlist?: ApiWatchlistSummary };
        const created = body.watchlist ? buildWatchlistFromSummary(body.watchlist) : null;

        if (!created) {
          throw new Error("watchlist create response missing payload");
        }

        setWatchlists((current) => replaceSyntheticDefault([...current], created));
        setMessage(`Created ${created.name}. Persisted to the shared workspace.`);
        setName("");
        setDescription("");
        return;
      }

      const nextWatchlists = createWatchlist(watchlists, trimmedName, description);
      if (!persistWatchlistsToLocalStorage(nextWatchlists)) {
        setMessage("Atlas could not update browser fallback storage. Keep a manual copy of critical lanes for now.");
        return;
      }

      setWatchlists(nextWatchlists);
      setMessage(`Created ${trimmedName}. Browser fallback is active until the API comes back.`);
      setName("");
      setDescription("");
    } catch {
      const nextWatchlists = createWatchlist(watchlists, trimmedName, description);
      if (!persistWatchlistsToLocalStorage(nextWatchlists)) {
        setMessage("Watchlist API unavailable, and browser fallback storage could not be updated.");
        return;
      }

      setMode("fallback-local");
      setWatchlists(nextWatchlists);
      setMessage(`Watchlist API unavailable. Created ${trimmedName} in browser fallback storage on this device.`);
      setName("");
      setDescription("");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveItem(watchlistId: string, item: WatchlistItem, watchlistName: string) {
    setBusy(true);

    try {
      if (mode === "api" && item.persistedItemId) {
        const response = await fetch(`/api/watchlists/${watchlistId}/items/${item.persistedItemId}`, { method: "DELETE" });
        if (!response.ok && response.status !== 404) {
          throw new Error(`watchlist item delete failed: ${response.status}`);
        }

        setWatchlists((current) => removeWatchlistItem(current, watchlistId, item.id));
        setMessage(`Removed ${item.label} from ${watchlistName}.`);
        return;
      }

      const nextWatchlists = removeWatchlistItem(watchlists, watchlistId, item.id);
      if (!persistWatchlistsToLocalStorage(nextWatchlists)) {
        setMessage("Atlas could not update browser fallback storage. Keep a manual copy of critical lanes for now.");
        return;
      }

      setWatchlists(nextWatchlists);
      setMessage(`Removed ${item.label} from ${watchlistName}.`);
    } catch {
      const nextWatchlists = removeWatchlistItem(watchlists, watchlistId, item.id);
      if (!persistWatchlistsToLocalStorage(nextWatchlists)) {
        setMessage("Watchlist API unavailable, and browser fallback storage could not be updated.");
        return;
      }

      setMode("fallback-local");
      setWatchlists(nextWatchlists);
      setMessage(`Watchlist API unavailable. Removed ${item.label} from browser fallback storage on this device.`);
    } finally {
      setBusy(false);
    }
  }

  function startEditingWatchlist(watchlist: Watchlist) {
    setEditingId(watchlist.id);
    setDraftName(watchlist.name);
    setDraftDescription(watchlist.description);
  }

  function cancelEditingWatchlist() {
    setEditingId(null);
    setDraftName("");
    setDraftDescription("");
  }

  async function handleSaveWatchlist(watchlistId: string, originalName: string) {
    const trimmedName = draftName.trim();
    const trimmedDescription = draftDescription.trim();
    if (!trimmedName) {
      setMessage("Give the watchlist a name first.");
      return;
    }

    setBusy(true);

    try {
      if (mode === "api" && watchlistId !== DEFAULT_WATCHLIST_ID) {
        const response = await fetch(`/api/watchlists/${watchlistId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ label: trimmedName, notes: trimmedDescription || null }),
        });

        if (!response.ok) {
          throw new Error(`watchlist update failed: ${response.status}`);
        }

        const updatedWatchlist = await fetchWatchlistDetail(watchlistId);
        setWatchlists((current) => replaceWatchlist(current, updatedWatchlist));
        setMessage(`Updated ${trimmedName}.`);
        cancelEditingWatchlist();
        return;
      }

      const nextWatchlists = updateWatchlistDetails(watchlists, watchlistId, {
        name: trimmedName,
        description: trimmedDescription,
      });
      if (!persistWatchlistsToLocalStorage(nextWatchlists)) {
        setMessage("Atlas could not update browser fallback storage. Keep a manual copy of critical lanes for now.");
        return;
      }

      setWatchlists(nextWatchlists);
      setMessage(`Updated ${trimmedName}. Browser fallback is active until the API comes back.`);
      cancelEditingWatchlist();
    } catch {
      const nextWatchlists = updateWatchlistDetails(watchlists, watchlistId, {
        name: trimmedName,
        description: trimmedDescription,
      });
      if (!persistWatchlistsToLocalStorage(nextWatchlists)) {
        setMessage(`Atlas could not save local fallback edits for ${originalName}.`);
        return;
      }

      setMode("fallback-local");
      setWatchlists(nextWatchlists);
      setMessage(`Watchlist API unavailable. Saved ${trimmedName} in browser fallback storage on this device.`);
      cancelEditingWatchlist();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveWatchlist(watchlistId: string, watchlistName: string) {
    setBusy(true);

    try {
      if (mode === "api" && watchlistId !== DEFAULT_WATCHLIST_ID) {
        const response = await fetch(`/api/watchlists/${watchlistId}`, { method: "DELETE" });
        if (!response.ok && response.status !== 404) {
          throw new Error(`watchlist delete failed: ${response.status}`);
        }

        const nextWatchlists = removeWatchlist(watchlists, watchlistId);
        setWatchlists(nextWatchlists);
        setMessage(`Deleted ${watchlistName}.`);
        if (editingId === watchlistId) {
          cancelEditingWatchlist();
        }
        return;
      }

      const nextWatchlists = removeWatchlist(watchlists, watchlistId);
      if (!persistWatchlistsToLocalStorage(nextWatchlists)) {
        setMessage("Atlas could not update browser fallback storage. Keep a manual copy of critical lanes for now.");
        return;
      }

      setWatchlists(nextWatchlists);
      setMessage(`Removed ${watchlistName} from browser fallback storage.`);
      if (editingId === watchlistId) {
        cancelEditingWatchlist();
      }
    } catch {
      const nextWatchlists = removeWatchlist(watchlists, watchlistId);
      if (!persistWatchlistsToLocalStorage(nextWatchlists)) {
        setMessage(`Watchlist API unavailable, and browser fallback storage could not remove ${watchlistName}.`);
        return;
      }

      setMode("fallback-local");
      setWatchlists(nextWatchlists);
      setMessage(`Watchlist API unavailable. Removed ${watchlistName} from browser fallback storage on this device.`);
      if (editingId === watchlistId) {
        cancelEditingWatchlist();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-300/80">Saved watchlists</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Shared workspace with browser fallback</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Save counties, operators, and permit lanes into the shared Atlas workspace. When the watchlist API is unreachable, Atlas falls back to this browser so the queue still stays usable.
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
          <MiniStat label="Storage" value={mode === "api" ? "Atlas API" : "Browser fallback"} />
          <MiniStat label="Scope" value={mode === "api" ? "Shared workspace" : "This device"} />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-fuchsia-300/80">Create a watchlist</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Add a named queue</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Keep the shared triage list, or create a more specific queue like &quot;South Texas permits&quot; or &quot;Operators to brief next week.&quot;
            </p>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
            {mode === "api" ? "Persisted to /api/watchlists" : "Browser fallback active"}
          </div>
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
              placeholder="Shared queue for likely follow-up counties and operators"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500"
            />
          </label>
          <button type="submit" disabled={busy} className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Working…" : "Create watchlist"}
          </button>
        </form>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-300/80">Current queues</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Review, open, and trim saved lanes</h2>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
            {mode === "api" ? "API-backed with edit and delete controls" : "Graceful browser fallback mode"}
          </div>
        </div>

        {watchlists.map((watchlist) => {
          const exportValue = buildWatchlistExport(watchlist.items);
          const isEditing = editingId === watchlist.id;
          const canDelete = watchlist.id !== DEFAULT_WATCHLIST_ID;

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
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => startEditingWatchlist(watchlist)}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Edit details
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        void handleRemoveWatchlist(watchlist.id, watchlist.name);
                      }}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete list
                    </button>
                  ) : null}
                </div>
              </div>

              {isEditing ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSaveWatchlist(watchlist.id, watchlist.name);
                  }}
                  className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:grid-cols-[0.8fr_1.2fr_auto] lg:items-end"
                >
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Name</span>
                    <input
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Description</span>
                    <input
                      value={draftDescription}
                      onChange={(event) => setDraftDescription(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" disabled={busy} className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60">
                      {busy ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={cancelEditingWatchlist}
                      className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}

              {watchlist.items.length ? (
                <>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {watchlist.items.map((item) => (
                      <article key={item.persistedItemId ?? item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
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
                            disabled={busy}
                            onClick={() => {
                              void handleRemoveItem(watchlist.id, item, watchlist.name);
                            }}
                            className="rounded-full border border-white/10 px-3 py-1.5 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
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
                  Nothing is saved in this watchlist yet. Add counties from <Link href="/analytics" className="text-cyan-300 hover:text-cyan-200">analytics</Link>, operators from <Link href="/operators" className="text-cyan-300 hover:text-cyan-200">operators</Link>, or permit lanes from <Link href="/permits" className="text-cyan-300 hover:text-cyan-200">permits</Link> and they will show up here.
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}

async function hydrateWatchlists(): Promise<{ watchlists: Watchlist[]; mode: WatchlistStoreMode }> {
  try {
    const watchlists = await fetchWatchlistsFromApi();
    return {
      watchlists: watchlists.length ? watchlists : [createDefaultWatchlist()],
      mode: "api",
    };
  } catch {
    return {
      watchlists: getLocalWatchlists(),
      mode: "fallback-local",
    };
  }
}

async function fetchWatchlistsFromApi() {
  const response = await fetch("/api/watchlists", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`watchlists fetch failed: ${response.status}`);
  }

  const body = (await response.json()) as { items?: ApiWatchlistSummary[] };
  const summaries = Array.isArray(body.items) ? body.items : [];

  const detailedWatchlists = await Promise.all(
    summaries.map(async (summary) => {
      try {
        return await fetchWatchlistDetail(summary.id);
      } catch {
        return buildWatchlistFromSummary(summary);
      }
    }),
  );

  return detailedWatchlists;
}

async function fetchWatchlistDetail(id: string) {
  const response = await fetch(`/api/watchlists/${id}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`watchlist detail fetch failed: ${response.status}`);
  }

  const body = (await response.json()) as { watchlist?: ApiWatchlistDetail };
  if (!body.watchlist) {
    throw new Error("watchlist detail response missing payload");
  }

  return hydrateWatchlistFromApi(body.watchlist);
}

async function ensurePersistedTargetWatchlist(selectedId: string, watchlists: Watchlist[]) {
  const selectedWatchlist = watchlists.find((entry) => entry.id === selectedId) ?? watchlists[0] ?? createDefaultWatchlist();
  if (selectedWatchlist.id !== DEFAULT_WATCHLIST_ID) {
    return selectedWatchlist;
  }

  const response = await fetch("/api/watchlists", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      label: selectedWatchlist.name,
      notes: selectedWatchlist.description,
    }),
  });

  if (!response.ok) {
    throw new Error(`default watchlist create failed: ${response.status}`);
  }

  const body = (await response.json()) as { watchlist?: ApiWatchlistSummary };
  if (!body.watchlist) {
    throw new Error("default watchlist response missing payload");
  }

  return buildWatchlistFromSummary(body.watchlist);
}

function chooseSelectedId(watchlists: Watchlist[], currentId: string) {
  return watchlists.some((entry) => entry.id === currentId) ? currentId : (watchlists[0]?.id ?? DEFAULT_WATCHLIST_ID);
}

function replaceWatchlist(watchlists: Watchlist[], replacement: Watchlist) {
  const withoutSyntheticDefault = watchlists.filter((entry) => entry.id !== DEFAULT_WATCHLIST_ID || replacement.id === DEFAULT_WATCHLIST_ID);
  const index = withoutSyntheticDefault.findIndex((entry) => entry.id === replacement.id);

  if (index === -1) {
    return [...withoutSyntheticDefault, replacement];
  }

  return withoutSyntheticDefault.map((entry) => (entry.id === replacement.id ? replacement : entry));
}

function replaceSyntheticDefault(watchlists: Watchlist[], replacement: Watchlist) {
  const nonSynthetic = watchlists.filter((entry) => entry.id !== DEFAULT_WATCHLIST_ID);
  return [...nonSynthetic, replacement];
}

function persistLocalAdd(watchlists: Watchlist[], selectedId: string, item: Omit<WatchlistItem, "addedAt" | "persistedItemId">) {
  const result = upsertWatchlistItem(watchlists, selectedId, item);
  if (!persistWatchlistsToLocalStorage(result.watchlists)) {
    throw new Error("local storage save failed");
  }

  return result;
}

function getLocalWatchlists() {
  if (typeof window === "undefined") {
    return loadWatchlistsFromStorage(null);
  }

  return loadWatchlistsFromStorage(window.localStorage);
}

function persistWatchlistsToLocalStorage(nextWatchlists: Watchlist[]) {
  if (typeof window === "undefined") {
    return false;
  }

  return saveWatchlistsToStorage(nextWatchlists, window.localStorage);
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
  if (surface === "permits") return "Permits";
  if (surface === "operators") return "Operators";
  if (surface === "operator-detail") return "Operator detail";
  return "Watchlists";
}
