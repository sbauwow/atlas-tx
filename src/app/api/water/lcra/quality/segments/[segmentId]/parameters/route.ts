import { NextResponse } from "next/server";
import { fetchLcraWaterQualitySegmentParameters } from "@/lib/water/lcra-water-quality";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ segmentId: string }> }) {
  const { segmentId } = await params;
  return NextResponse.json({
    parameters: await fetchLcraWaterQualitySegmentParameters(segmentId),
  });
}
