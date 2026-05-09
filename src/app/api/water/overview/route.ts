import { NextResponse } from "next/server";
import { getDefaultAtlasWaterSummaryService } from "@/lib/water/water-summary-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const service = getDefaultAtlasWaterSummaryService();
  return NextResponse.json(await service.getWaterOverview());
}
