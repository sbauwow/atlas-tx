import { NextResponse } from "next/server";
import { getDefaultAtlasWaterSummaryService } from "@/lib/water/water-summary-service";
import { buildWaterFreshness } from "@/lib/water/freshness";

export const dynamic = "force-dynamic";

export async function GET() {
  const service = getDefaultAtlasWaterSummaryService();
  const overview = await service.getWaterOverview();
  return NextResponse.json({
    ...overview,
    freshness: overview.freshness ?? buildWaterFreshness(overview.sourceIds),
  });
}
