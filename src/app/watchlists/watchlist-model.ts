export const WATCHLIST_STORAGE_KEY = "atlas-tx-watchlists-v1";
export const DEFAULT_WATCHLIST_ID = "shared-triage";

export type WatchlistSurface = "analytics" | "operators" | "operator-detail" | "watchlists";

export type WatchlistItem = {
  id: string;
  kind: string;
  label: string;
  href: string;
  summary: string;
  detail: string;
  surface: WatchlistSurface;
  addedAt: string;
};

export type Watchlist = {
  id: string;
  name: string;
  description: string;
  scopeLabel: string;
  createdAt: string;
  updatedAt: string;
  items: WatchlistItem[];
};

export function nowIso() {
  return new Date().toISOString();
}

export function createDefaultWatchlist(timestamp = nowIso()): Watchlist {
  return {
    id: DEFAULT_WATCHLIST_ID,
    name: "Shared triage",
    description: "Default local/shared queue for counties, operators, and permit lanes until sign-in exists.",
    scopeLabel: "Local/shared in this browser",
    createdAt: timestamp,
    updatedAt: timestamp,
    items: [],
  };
}

export function normalizeWatchlists(value: unknown): Watchlist[] {
  const fallback = createDefaultWatchlist();

  if (!Array.isArray(value)) {
    return [fallback];
  }

  const watchlists = value
    .map((entry) => normalizeWatchlist(entry))
    .filter((entry): entry is Watchlist => entry !== null);

  const withDefault = watchlists.some((entry) => entry.id === DEFAULT_WATCHLIST_ID)
    ? watchlists
    : [fallback, ...watchlists];

  return withDefault.length ? withDefault : [fallback];
}

function normalizeWatchlist(value: unknown): Watchlist | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const timestamp = typeof record.updatedAt === "string" ? record.updatedAt : nowIso();
  const id = typeof record.id === "string" && record.id.trim() ? record.id.trim() : null;
  const name = typeof record.name === "string" && record.name.trim() ? record.name.trim() : null;

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    description: typeof record.description === "string" ? record.description : "",
    scopeLabel: typeof record.scopeLabel === "string" && record.scopeLabel.trim() ? record.scopeLabel : "Local/shared in this browser",
    createdAt: typeof record.createdAt === "string" ? record.createdAt : timestamp,
    updatedAt: timestamp,
    items: Array.isArray(record.items)
      ? record.items.map((item) => normalizeWatchlistItem(item)).filter((item): item is WatchlistItem => item !== null)
      : [],
  };
}

function normalizeWatchlistItem(value: unknown): WatchlistItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = typeof record.id === "string" && record.id.trim() ? record.id.trim() : null;
  const label = typeof record.label === "string" && record.label.trim() ? record.label.trim() : null;
  const href = typeof record.href === "string" && record.href.trim() ? record.href.trim() : null;

  if (!id || !label || !href) {
    return null;
  }

  return {
    id,
    kind: typeof record.kind === "string" && record.kind.trim() ? record.kind.trim() : "Item",
    label,
    href,
    summary: typeof record.summary === "string" ? record.summary : "",
    detail: typeof record.detail === "string" ? record.detail : "",
    surface: normalizeSurface(record.surface),
    addedAt: typeof record.addedAt === "string" ? record.addedAt : nowIso(),
  };
}

function normalizeSurface(value: unknown): WatchlistSurface {
  return value === "analytics" || value === "operators" || value === "operator-detail" || value === "watchlists"
    ? value
    : "watchlists";
}

export function loadWatchlistsFromStorage(storage?: Pick<Storage, "getItem"> | null): Watchlist[] {
  if (!storage) {
    return normalizeWatchlists([]);
  }

  try {
    const raw = storage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) {
      return normalizeWatchlists([]);
    }

    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return normalizeWatchlists(parsed);
    }

    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { watchlists?: unknown }).watchlists)) {
      return normalizeWatchlists((parsed as { watchlists: unknown[] }).watchlists);
    }

    return normalizeWatchlists([]);
  } catch {
    return normalizeWatchlists([]);
  }
}

export function saveWatchlistsToStorage(watchlists: Watchlist[], storage?: Pick<Storage, "setItem"> | null) {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify({ version: 1, watchlists }));
    return true;
  } catch {
    return false;
  }
}

export function createWatchlist(watchlists: Watchlist[], name: string, description: string, timestamp = nowIso()): Watchlist[] {
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();

  if (!trimmedName) {
    return watchlists;
  }

  const slugBase = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "watchlist";

  let slug = slugBase;
  let suffix = 2;
  while (watchlists.some((entry) => entry.id === slug)) {
    slug = `${slugBase}-${suffix}`;
    suffix += 1;
  }

  return [
    ...normalizeWatchlists(watchlists),
    {
      id: slug,
      name: trimmedName,
      description: trimmedDescription || "Custom local/shared watchlist.",
      scopeLabel: "Local/shared in this browser",
      createdAt: timestamp,
      updatedAt: timestamp,
      items: [],
    },
  ];
}

export function upsertWatchlistItem(
  watchlists: Watchlist[],
  watchlistId: string,
  item: Omit<WatchlistItem, "addedAt">,
  timestamp = nowIso(),
): { watchlists: Watchlist[]; alreadySaved: boolean; targetName: string } {
  const normalized = normalizeWatchlists(watchlists);
  const targetId = normalized.some((entry) => entry.id === watchlistId) ? watchlistId : DEFAULT_WATCHLIST_ID;
  const target = normalized.find((entry) => entry.id === targetId) ?? normalized[0];
  const alreadySaved = target.items.some((entry) => entry.id === item.id);

  const nextWatchlists = normalized.map((entry) => {
    if (entry.id !== target.id) {
      return entry;
    }

    const nextItems = alreadySaved
      ? entry.items
      : [{ ...item, addedAt: timestamp }, ...entry.items];

    return {
      ...entry,
      items: nextItems,
      updatedAt: timestamp,
    };
  });

  return {
    watchlists: nextWatchlists,
    alreadySaved,
    targetName: target.name,
  };
}

export function removeWatchlistItem(watchlists: Watchlist[], watchlistId: string, itemId: string, timestamp = nowIso()): Watchlist[] {
  return normalizeWatchlists(watchlists).map((entry) => {
    if (entry.id !== watchlistId) {
      return entry;
    }

    return {
      ...entry,
      items: entry.items.filter((item) => item.id !== itemId),
      updatedAt: timestamp,
    };
  });
}

export function removeWatchlist(watchlists: Watchlist[], watchlistId: string): Watchlist[] {
  if (watchlistId === DEFAULT_WATCHLIST_ID) {
    return normalizeWatchlists(watchlists);
  }

  return normalizeWatchlists(watchlists).filter((entry) => entry.id !== watchlistId);
}

export function buildWatchlistExport(items: WatchlistItem[]) {
  return items.map((item) => `${item.kind.toLowerCase()} | ${item.label} | ${item.href} | ${item.summary} | ${item.detail}`).join("\n");
}

export function formatWatchlistDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(parsed);
}
