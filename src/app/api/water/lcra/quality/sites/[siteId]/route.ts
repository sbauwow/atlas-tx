import { NextResponse } from "next/server";
import { fetchLcraWaterQualitySite } from "@/lib/water/lcra-water-quality";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  return NextResponse.json({
    site: await fetchLcraWaterQualitySite(siteId),
  });
}
