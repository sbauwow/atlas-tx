import { NextResponse } from "next/server";
import { getDefaultAtlasWaterSummaryService } from "@/lib/water/water-summary-service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const service = getDefaultAtlasWaterSummaryService();
  const { slug } = await params;
  try {
    return NextResponse.json(await service.getCountyWaterBreakdown(slug));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("County not found:") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
