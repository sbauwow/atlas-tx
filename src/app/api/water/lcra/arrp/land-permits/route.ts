import { NextResponse } from "next/server";
import { buildWaterFreshness } from "@/lib/water/freshness";
import { fetchLcraArrpLandPermits, filterLcraArrpLandPermitsByCounty } from "@/lib/water/lcra-arrp";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const county = searchParams.get("county");
  const permits = await fetchLcraArrpLandPermits();

  return NextResponse.json({
    permits: county ? filterLcraArrpLandPermitsByCounty(permits, county) : permits,
    freshness: buildWaterFreshness(["lcra-arrp-land-permits"]),
  });
}
