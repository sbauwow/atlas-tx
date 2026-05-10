export const WATCHLIST_STORAGE_KEY = "atlas-tx-watchlists-v1";
export const DEFAULT_WATCHLIST_ID = "shared-triage";

export type WatchlistSurface = "analytics" | "operators" | "operator-detail" | "permits" | "watchlists";
export type PersistedWatchlistItemType = "county" | "operator" | "permit";

export type WatchlistItem = {
  id: string;
  kind: string;
  label: string;
  href: string;
  summary: string;
  detail: string;
  surface: WatchlistSurface;
  addedAt: string;
  persistedItemId?: string;
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

export type ApiWatchlistSummary = {
  id: string;
  label: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
};

export type ApiWatchlistItem = {
  id: string;
  watchlistId: string;
  itemType: PersistedWatchlistItemType;
  itemKey: string;
  displayLabel: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiWatchlistDetail = ApiWatchlistSummary & {
  items: ApiWatchlistItem[];
};

type PersistedWatchlistItemMetadata = {
  version: 1;
  sourceId: string;
  kind: string;
  href: string;
  summary: string;
  detail: string;
  surface: WatchlistSurface;
};

export function nowIso() {
  return new Date().toISOString();
}

export function createDefaultWatchlist(timestamp = nowIso()): Watchlist {
  return {
    id: DEFAULT_WATCHLIST_ID,
    name: "Shared triage",
    description: "Default shared workspace queue for counties, operators, and permit lanes. Atlas persists to the watchlists API when available and falls back to this browser when it is not.",
    scopeLabel: "Shared workspace",
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
    scopeLabel: typeof record.scopeLabel === "string" && record.scopeLabel.trim() ? record.scopeLabel : "Shared workspace",
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
    persistedItemId: typeof record.persistedItemId === "string" ? record.persistedItemId : undefined,
  };
}

function normalizeSurface(value: unknown): WatchlistSurface {
  return value === "analytics" || value === "operators" || value === "operator-detail" || value === "permits" || value === "watchlists"
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
      description: trimmedDescription || "Local fallback watchlist.",
      scopeLabel: "Shared workspace",
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

export function updateWatchlistDetails(
  watchlists: Watchlist[],
  watchlistId: string,
  updates: { name: string; description: string },
  timestamp = nowIso(),
): Watchlist[] {
  const trimmedName = updates.name.trim();
  const trimmedDescription = updates.description.trim();
  if (!trimmedName) {
    return normalizeWatchlists(watchlists);
  }

  return normalizeWatchlists(watchlists).map((entry) => {
    if (entry.id !== watchlistId) {
      return entry;
    }

    return {
      ...entry,
      name: trimmedName,
      description: trimmedDescription || entry.description,
      updatedAt: timestamp,
    };
  });
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

export function buildPersistedWatchlistItemInput(item: Omit<WatchlistItem, "addedAt" | "persistedItemId">) {
  const itemType = inferPersistedWatchlistItemType(item);
  if (!itemType) {
    return null;
  }

  return {
    itemType,
    itemKey: inferPersistedWatchlistItemKey(item, itemType),
    displayLabel: item.label,
    notes: JSON.stringify({
      version: 1,
      sourceId: item.id,
      kind: item.kind,
      href: item.href,
      summary: item.summary,
      detail: item.detail,
      surface: item.surface,
    } satisfies PersistedWatchlistItemMetadata),
  };
}

export function hydrateWatchlistFromApi(watchlist: ApiWatchlistDetail): Watchlist {
  return {
    id: watchlist.id,
    name: watchlist.label,
    description: watchlist.notes ?? "Persisted Atlas watchlist.",
    scopeLabel: "Shared workspace",
    createdAt: watchlist.createdAt,
    updatedAt: watchlist.updatedAt,
    items: watchlist.items.map(hydrateWatchlistItemFromApi),
  };
}

export function buildWatchlistFromSummary(summary: ApiWatchlistSummary): Watchlist {
  return {
    id: summary.id,
    name: summary.label,
    description: summary.notes ?? "Persisted Atlas watchlist.",
    scopeLabel: "Shared workspace",
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt,
    items: [],
  };
}

function hydrateWatchlistItemFromApi(item: ApiWatchlistItem): WatchlistItem {
  const metadata = parsePersistedWatchlistItemMetadata(item.notes);
  const label = item.displayLabel ?? item.itemKey;
  const kind = metadata?.kind ?? defaultKindForItemType(item.itemType);
  const href = metadata?.href ?? defaultHrefForItemType(item.itemType, item.itemKey);

  return {
    id: metadata?.sourceId ?? `${item.itemType}:${item.itemKey}`,
    kind,
    label,
    href,
    summary: metadata?.summary ?? `${label} is saved in the shared workspace watchlist.`,
    detail: metadata?.detail ?? "Persisted via the Atlas watchlists API.",
    surface: metadata?.surface ?? "watchlists",
    addedAt: item.createdAt,
    persistedItemId: item.id,
  };
}

function parsePersistedWatchlistItemMetadata(value: string | null): PersistedWatchlistItemMetadata | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    if (
      record.version !== 1 ||
      typeof record.sourceId !== "string" ||
      typeof record.kind !== "string" ||
      typeof record.href !== "string" ||
      typeof record.summary !== "string" ||
      typeof record.detail !== "string"
    ) {
      return null;
    }

    return {
      version: 1,
      sourceId: record.sourceId,
      kind: record.kind,
      href: record.href,
      summary: record.summary,
      detail: record.detail,
      surface: normalizeSurface(record.surface),
    };
  } catch {
    return null;
  }
}

function inferPersistedWatchlistItemType(item: Pick<WatchlistItem, "id" | "kind" | "href">): PersistedWatchlistItemType | null {
  const kind = item.kind.toLowerCase();
  if (kind.includes("county") || item.id.startsWith("county:") || item.id.startsWith("county-") || item.href.startsWith("/counties/")) {
    return "county";
  }

  if (kind.includes("operator") || item.id.startsWith("operator:") || item.href.startsWith("/operators/")) {
    return "operator";
  }

  if (kind.includes("permit") || item.id.startsWith("permit:") || item.href.startsWith("/permits")) {
    return "permit";
  }

  return null;
}

function inferPersistedWatchlistItemKey(item: Pick<WatchlistItem, "id" | "href" | "label">, itemType: PersistedWatchlistItemType) {
  const hrefMatch = itemType === "county"
    ? item.href.match(/^\/counties\/([^/?#]+)/)
    : itemType === "operator"
      ? item.href.match(/^\/operators\/([^/?#]+)/)
      : item.href.match(/^\/permits\/([^/?#]+)/);
  if (hrefMatch?.[1]) {
    return decodeURIComponent(hrefMatch[1]);
  }

  const idMatch = item.id.match(/^[^:]+:(.+)$/);
  if (idMatch?.[1]) {
    return idMatch[1];
  }

  if (itemType === "county" && item.id.startsWith("county-")) {
    return item.id.slice("county-".length);
  }

  return item.label;
}

function defaultKindForItemType(itemType: PersistedWatchlistItemType) {
  return itemType === "county" ? "County" : itemType === "operator" ? "Operator" : "Permit";
}

function defaultHrefForItemType(itemType: PersistedWatchlistItemType, itemKey: string) {
  return itemType === "county"
    ? `/counties/${itemKey}`
    : itemType === "operator"
      ? `/operators/${itemKey}`
      : `/permits/${itemKey}`;
}
