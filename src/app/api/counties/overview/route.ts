import { NextResponse } from "next/server";
import { getDefaultAtlasCountyExplorerService } from "@/lib/atlas-county-explorer";

export const dynamic = "force-dynamic";

export async function GET() {
  const service = getDefaultAtlasCountyExplorerService();
  const overview = await service.getCountyOverview();
  return NextResponse.json(overview);
}
