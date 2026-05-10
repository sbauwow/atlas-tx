export const DEFAULT_WATCHLIST_WORKSPACE_SLUG = "default";

export type WatchlistItemType = "county" | "operator";

export interface WatchlistWorkspaceRow {
  readonly id: string;
  readonly slug: string;
  readonly label: string;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WatchlistItemRow {
  readonly id: string;
  readonly watchlistId: string;
  readonly itemType: WatchlistItemType;
  readonly itemKey: string;
  readonly displayLabel: string | null;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WatchlistSummaryRow {
  readonly id: string;
  readonly workspaceId: string;
  readonly label: string;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly itemCount: number;
}

export interface WatchlistDetailRow extends WatchlistSummaryRow {
  readonly items: readonly WatchlistItemRow[];
}

export interface CreateWatchlistInput {
  readonly label: string;
  readonly notes?: string | null;
}

export interface AddWatchlistItemInput {
  readonly watchlistId: string;
  readonly itemType: WatchlistItemType;
  readonly itemKey: string;
  readonly displayLabel?: string | null;
  readonly notes?: string | null;
}

export class DuplicateWatchlistItemError extends Error {
  constructor(message = "watchlist item already exists") {
    super(message);
    this.name = "DuplicateWatchlistItemError";
  }
}

export class WatchlistNotFoundError extends Error {
  constructor(message = "watchlist not found") {
    super(message);
    this.name = "WatchlistNotFoundError";
  }
}

export function isWatchlistItemType(value: string): value is WatchlistItemType {
  return value === "county" || value === "operator";
}

export function normalizeWatchlistText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeWatchlistItemKey(value: string): string {
  return value.trim().toLowerCase();
}
