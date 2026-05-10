import type { WatchlistDetailRow, WatchlistItemRow, WatchlistSummaryRow } from "./types";

export function serializeWatchlistSummary(row: WatchlistSummaryRow) {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    label: row.label,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    itemCount: row.itemCount,
  };
}

export function serializeWatchlistItem(row: WatchlistItemRow) {
  return {
    id: row.id,
    watchlistId: row.watchlistId,
    itemType: row.itemType,
    itemKey: row.itemKey,
    displayLabel: row.displayLabel,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeWatchlistDetail(row: WatchlistDetailRow) {
  return {
    ...serializeWatchlistSummary(row),
    items: row.items.map(serializeWatchlistItem),
  };
}
