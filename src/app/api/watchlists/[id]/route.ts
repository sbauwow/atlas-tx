import { NextResponse, type NextRequest } from "next/server";

import { serializeWatchlistDetail, serializeWatchlistSummary } from "@/lib/watchlists/helpers";
import { deleteWatchlist, getWatchlistDetail, updateWatchlist } from "@/lib/watchlists/persistence";
import { WatchlistNotFoundError, normalizeWatchlistText } from "@/lib/watchlists/types";

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

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const hasLabel = hasOwn(body, "label");
  const hasNotes = hasOwn(body, "notes");

  if (!hasLabel && !hasNotes) {
    return NextResponse.json({ error: "label or notes is required" }, { status: 400 });
  }

  if (hasLabel && typeof body.label !== "string") {
    return NextResponse.json({ error: "label must be a string" }, { status: 400 });
  }

  const label = hasLabel ? normalizeWatchlistText(readString(body, "label")) : undefined;
  if (hasLabel && !label) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  if (hasNotes && body.notes !== null && typeof body.notes !== "string") {
    return NextResponse.json({ error: "notes must be a string or null" }, { status: 400 });
  }

  try {
    const row = await updateWatchlist(id, {
      ...(typeof label === "string" ? { label } : {}),
      ...(hasNotes ? { notes: readNullableString(body, "notes") } : {}),
    });

    return NextResponse.json({ watchlist: serializeWatchlistSummary(row) });
  } catch (error) {
    if (error instanceof WatchlistNotFoundError || hasErrorName(error, "WatchlistNotFoundError")) {
      return NextResponse.json({ error: "watchlist not found" }, { status: 404 });
    }

    throw error;
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const row = await deleteWatchlist(id);

  if (!row) {
    return NextResponse.json({ error: "watchlist not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: { id: row.id, workspaceId: row.workspaceId } });
}

function readString(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  return typeof value === "string" ? value : null;
}

function readNullableString(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  return typeof value === "string" ? value : null;
}

function hasErrorName(error: unknown, name: string): boolean {
  return !!error && typeof error === "object" && "name" in error && error.name === name;
}

function hasOwn(body: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, key);
}
