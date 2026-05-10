import { NextResponse, type NextRequest } from "next/server";

import { getWatchlistFeed } from "@/lib/watchlists/feed";
import { WatchlistNotFoundError } from "@/lib/watchlists/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const watchlistId = request.nextUrl.searchParams.get("watchlistId");

  try {
    const feed = await getWatchlistFeed(watchlistId);
    return NextResponse.json(feed);
  } catch (error) {
    if (error instanceof WatchlistNotFoundError || hasErrorName(error, "WatchlistNotFoundError")) {
      return NextResponse.json({ error: "watchlist not found" }, { status: 404 });
    }

    throw error;
  }
}

function hasErrorName(error: unknown, name: string): boolean {
  return !!error && typeof error === "object" && "name" in error && error.name === name;
}
