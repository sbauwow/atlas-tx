import { NextResponse } from "next/server";
import { fetchTexasNfhlLevees } from "@/lib/water/fema-nfhl";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitValue = searchParams.get("limit");
  const limit = limitValue ? Number(limitValue) : undefined;
  return NextResponse.json(await fetchTexasNfhlLevees(Number.isFinite(limit) ? limit : undefined));
}
