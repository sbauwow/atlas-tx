import { NextResponse } from "next/server";

import { serializeWatchlistSummary } from "@/lib/watchlists/helpers";
import { createWatchlist, listWatchlists } from "@/lib/watchlists/persistence";
import { normalizeWatchlistText } from "@/lib/watchlists/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listWatchlists();
  return NextResponse.json({
    items: rows.map(serializeWatchlistSummary),
    workspace: { slug: "default" },
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const label = normalizeWatchlistText(readString(body, "label"));
  const notes = normalizeWatchlistText(readString(body, "notes"));

  if (!label) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const row = await createWatchlist({ label, notes });
  return NextResponse.json({ watchlist: serializeWatchlistSummary(row) }, { status: 201 });
}

function readString(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  return typeof value === "string" ? value : null;
}
