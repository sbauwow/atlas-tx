import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

import {
  DEFAULT_WATCHLIST_WORKSPACE_SLUG,
  DuplicateWatchlistItemError,
  type AddWatchlistItemInput,
  type CreateWatchlistInput,
  type UpdateWatchlistInput,
  type WatchlistDetailRow,
  type WatchlistItemRow,
  type WatchlistSummaryRow,
  type WatchlistWorkspaceRow,
  WatchlistNotFoundError,
  normalizeWatchlistItemKey,
  normalizeWatchlistText,
} from "./types";

const DEFAULT_WORKSPACE_LABEL = "Default workspace";

export async function ensureDefaultWatchlistWorkspace(): Promise<WatchlistWorkspaceRow> {
  const row = await prisma.watchlistWorkspace.upsert({
    where: { slug: DEFAULT_WATCHLIST_WORKSPACE_SLUG },
    update: {},
    create: {
      slug: DEFAULT_WATCHLIST_WORKSPACE_SLUG,
      label: DEFAULT_WORKSPACE_LABEL,
    },
  });

  return row;
}

export async function listWatchlists(): Promise<readonly WatchlistSummaryRow[]> {
  const workspace = await ensureDefaultWatchlistWorkspace();
  const rows = await prisma.watchlist.findMany({
    where: { workspaceId: workspace.id },
    include: {
      _count: {
        select: { items: true },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return rows.map(rehydrateSummary);
}

export async function createWatchlist(input: CreateWatchlistInput): Promise<WatchlistSummaryRow> {
  const workspace = await ensureDefaultWatchlistWorkspace();
  const row = await prisma.watchlist.create({
    data: {
      workspaceId: workspace.id,
      label: input.label.trim(),
      notes: normalizeWatchlistText(input.notes),
    },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  return rehydrateSummary(row);
}

export async function updateWatchlist(id: string, input: UpdateWatchlistInput): Promise<WatchlistSummaryRow> {
  const existingWatchlist = await prisma.watchlist.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingWatchlist) {
    throw new WatchlistNotFoundError();
  }

  const row = await prisma.watchlist.update({
    where: { id },
    data: {
      ...(typeof input.label === "string" ? { label: input.label.trim() } : {}),
      ...("notes" in input ? { notes: normalizeWatchlistText(input.notes) } : {}),
    },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  return rehydrateSummary(row);
}

export async function deleteWatchlist(id: string): Promise<WatchlistSummaryRow | null> {
  const row = await prisma.watchlist.findUnique({
    where: { id },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  if (!row) {
    return null;
  }

  await prisma.watchlist.delete({ where: { id } });

  return rehydrateSummary(row);
}

export async function getWatchlistDetail(id: string): Promise<WatchlistDetailRow | null> {
  const row = await prisma.watchlist.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: [{ itemType: "asc" }, { displayLabel: "asc" }, { itemKey: "asc" }],
      },
      _count: {
        select: { items: true },
      },
    },
  });

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    workspaceId: row.workspaceId,
    label: row.label,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    itemCount: row._count.items,
    items: row.items.map(rehydrateItem),
  };
}

export async function addWatchlistItem(input: AddWatchlistItemInput): Promise<WatchlistItemRow> {
  const existingWatchlist = await prisma.watchlist.findUnique({
    where: { id: input.watchlistId },
    select: { id: true },
  });

  if (!existingWatchlist) {
    throw new WatchlistNotFoundError();
  }

  try {
    const row = await prisma.watchlistItem.create({
      data: {
        watchlistId: input.watchlistId,
        itemType: input.itemType,
        itemKey: normalizeWatchlistItemKey(input.itemKey),
        displayLabel: normalizeWatchlistText(input.displayLabel),
        notes: normalizeWatchlistText(input.notes),
      },
    });

    await prisma.watchlist.update({
      where: { id: input.watchlistId },
      data: { updatedAt: new Date() },
    });

    return rehydrateItem(row);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new DuplicateWatchlistItemError();
    }

    throw error;
  }
}

export async function removeWatchlistItem(
  watchlistId: string,
  itemId: string,
): Promise<WatchlistItemRow | null> {
  const row = await prisma.watchlistItem.findFirst({
    where: { id: itemId, watchlistId },
  });

  if (!row) {
    return null;
  }

  await prisma.watchlistItem.delete({ where: { id: itemId } });
  await prisma.watchlist.update({
    where: { id: watchlistId },
    data: { updatedAt: new Date() },
  });

  return rehydrateItem(row);
}

function rehydrateItem(
  row: Awaited<ReturnType<typeof prisma.watchlistItem.create>>,
): WatchlistItemRow {
  return {
    id: row.id,
    watchlistId: row.watchlistId,
    itemType: row.itemType as WatchlistItemRow["itemType"],
    itemKey: row.itemKey,
    displayLabel: row.displayLabel,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rehydrateSummary(
  row: Awaited<ReturnType<typeof prisma.watchlist.create>> & { _count: { items: number } },
): WatchlistSummaryRow {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    label: row.label,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    itemCount: row._count.items,
  };
}
