import { NextResponse } from "next/server";
import {
  fetchLcraWaterQualitySiteObservations,
  filterLcraWaterQualityObservationsByStoretCode,
} from "@/lib/water/lcra-water-quality";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const { searchParams } = new URL(request.url);
  const storetCode = searchParams.get("storetCode");
  const includeProfile = searchParams.get("includeProfile") === "true";
  const observations = await fetchLcraWaterQualitySiteObservations(siteId, { includeProfile });

  return NextResponse.json({
    observations: storetCode ? filterLcraWaterQualityObservationsByStoretCode(observations, storetCode) : observations,
  });
}
