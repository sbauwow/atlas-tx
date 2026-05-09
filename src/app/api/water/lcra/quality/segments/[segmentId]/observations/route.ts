import { NextResponse } from "next/server";
import {
  fetchLcraWaterQualitySegmentObservations,
  filterLcraWaterQualityObservationsByStoretCode,
} from "@/lib/water/lcra-water-quality";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ segmentId: string }> }) {
  const { segmentId } = await params;
  const { searchParams } = new URL(request.url);
  const storetCode = searchParams.get("storetCode");
  const includeProfile = searchParams.get("includeProfile") === "true";
  const observations = await fetchLcraWaterQualitySegmentObservations(segmentId, { includeProfile });

  return NextResponse.json({
    observations: storetCode ? filterLcraWaterQualityObservationsByStoretCode(observations, storetCode) : observations,
  });
}
