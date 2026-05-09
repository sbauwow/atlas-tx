import { NextResponse } from "next/server";
import { buildWaterFreshness } from "@/lib/water/freshness";
import { fetchLcraLakeLevelReadings, filterLcraLakeLevelsBySite } from "@/lib/water/lcra-hydromet";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteNumber = searchParams.get("siteNumber");
  const readings = await fetchLcraLakeLevelReadings();

  return NextResponse.json({
    readings: siteNumber ? filterLcraLakeLevelsBySite(readings, siteNumber) : readings,
    freshness: buildWaterFreshness(["lcra-hydromet-lakelevels"]),
  });
}
