import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { findById } from "@/lib/observations/persistence";
import type { ObservationRow, QaFlag } from "@/lib/observations/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const row = await findById(id);
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ observation: toPublicView(row) });
}

function toPublicView(row: ObservationRow) {
  return {
    id: row.id,
    createdAt: row.createdAt,
    kind: row.kind,
    countySlug: row.countySlug,
    stripBrand: row.stripBrand,
    clientReading: row.clientReading,
    llmReading: row.llmReading,
    llmModel: row.llmModel,
    agreement: row.agreement,
    qaFlags: row.qaFlags as readonly QaFlag[],
    status: row.status,
  };
}
