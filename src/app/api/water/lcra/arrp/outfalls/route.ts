import { NextResponse } from "next/server";
import { buildWaterFreshness } from "@/lib/water/freshness";
import { fetchLcraArrpOutfalls, filterLcraArrpOutfallsByCounty } from "@/lib/water/lcra-arrp";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const county = searchParams.get("county");
  const outfalls = await fetchLcraArrpOutfalls();

  return NextResponse.json({
    outfalls: county ? filterLcraArrpOutfallsByCounty(outfalls, county) : outfalls,
    freshness: buildWaterFreshness(["lcra-arrp-outfalls"]),
  });
}
