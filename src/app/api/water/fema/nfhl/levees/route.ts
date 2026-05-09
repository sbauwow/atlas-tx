import { NextResponse } from "next/server";
import { fetchTexasNfhlCountyLevees, fetchTexasNfhlLevees } from "@/lib/water/fema-nfhl";
import { buildWaterFreshness } from "@/lib/water/freshness";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const county = searchParams.get("county");
  const limitValue = searchParams.get("limit");
  const limit = limitValue ? Number(limitValue) : undefined;
  const data = county
    ? await fetchTexasNfhlCountyLevees(county, Number.isFinite(limit) ? limit : undefined)
    : await fetchTexasNfhlLevees(Number.isFinite(limit) ? limit : undefined);
  return NextResponse.json({
    ...data,
    freshness: buildWaterFreshness(["fema-nfhl-levees"]),
  });
}
