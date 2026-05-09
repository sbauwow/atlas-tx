import { NextResponse } from "next/server";
import { fetchLcraWaterQualitySiteParameters } from "@/lib/water/lcra-water-quality";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  return NextResponse.json({
    parameters: await fetchLcraWaterQualitySiteParameters(siteId),
  });
}
