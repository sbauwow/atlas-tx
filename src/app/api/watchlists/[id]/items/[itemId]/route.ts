import { NextResponse, type NextRequest } from "next/server";

import { removeWatchlistItem } from "@/lib/watchlists/persistence";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await ctx.params;
  const row = await removeWatchlistItem(id, itemId);

  if (!row) {
    return NextResponse.json({ error: "watchlist item not found" }, { status: 404 });
  }

  return NextResponse.json({ removed: { id: row.id, watchlistId: row.watchlistId } });
}
