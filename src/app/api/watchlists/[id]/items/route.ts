import { NextResponse, type NextRequest } from "next/server";

import { serializeWatchlistItem } from "@/lib/watchlists/helpers";
import { addWatchlistItem } from "@/lib/watchlists/persistence";
import {
  DuplicateWatchlistItemError,
  WatchlistNotFoundError,
  isWatchlistItemType,
  normalizeWatchlistText,
} from "@/lib/watchlists/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const itemType = readString(body, "itemType");
  const itemKey = normalizeWatchlistText(readString(body, "itemKey"));
  const displayLabel = normalizeWatchlistText(readString(body, "displayLabel"));
  const notes = normalizeWatchlistText(readString(body, "notes"));

  if (!itemType || !isWatchlistItemType(itemType)) {
    return NextResponse.json({ error: "itemType must be county or operator" }, { status: 400 });
  }

  if (!itemKey) {
    return NextResponse.json({ error: "itemKey is required" }, { status: 400 });
  }

  try {
    const row = await addWatchlistItem({
      watchlistId: id,
      itemType,
      itemKey,
      displayLabel,
      notes,
    });

    return NextResponse.json({ item: serializeWatchlistItem(row) }, { status: 201 });
  } catch (error) {
    if (error instanceof WatchlistNotFoundError || hasErrorName(error, "WatchlistNotFoundError")) {
      return NextResponse.json({ error: "watchlist not found" }, { status: 404 });
    }

    if (error instanceof DuplicateWatchlistItemError || hasErrorName(error, "DuplicateWatchlistItemError")) {
      return NextResponse.json({ error: "watchlist item already exists" }, { status: 409 });
    }

    throw error;
  }
}

function readString(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  return typeof value === "string" ? value : null;
}

function hasErrorName(error: unknown, name: string): boolean {
  return !!error && typeof error === "object" && "name" in error && error.name === name;
}
