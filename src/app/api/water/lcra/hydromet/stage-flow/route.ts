import { NextResponse } from "next/server";
import { buildWaterFreshness } from "@/lib/water/freshness";
import { fetchLcraStageFlowReadings, filterLcraStageFlowBySite } from "@/lib/water/lcra-hydromet";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteNumber = searchParams.get("siteNumber");
  const readings = await fetchLcraStageFlowReadings();

  return NextResponse.json({
    readings: siteNumber ? filterLcraStageFlowBySite(readings, siteNumber) : readings,
    freshness: buildWaterFreshness(["lcra-hydromet-stageflow"]),
  });
}
