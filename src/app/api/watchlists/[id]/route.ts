import { NextResponse, type NextRequest } from "next/server";

import { serializeWatchlistDetail } from "@/lib/watchlists/helpers";
import { getWatchlistDetail } from "@/lib/watchlists/persistence";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const row = await getWatchlistDetail(id);

  if (!row) {
    return NextResponse.json({ error: "watchlist not found" }, { status: 404 });
  }

  return NextResponse.json({ watchlist: serializeWatchlistDetail(row) });
}
