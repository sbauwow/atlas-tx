import { NextResponse } from "next/server";
import { getDefaultAtlasCountyExplorerService } from "@/lib/atlas-county-explorer";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const service = getDefaultAtlasCountyExplorerService();
  const { slug } = await params;

  try {
    const breakdown = await service.getCountyBreakdown(slug);
    return NextResponse.json(breakdown);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("County not found:") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
