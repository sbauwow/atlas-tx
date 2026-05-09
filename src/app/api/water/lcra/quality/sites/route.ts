import { NextResponse } from "next/server";
import { buildWaterFreshness } from "@/lib/water/freshness";
import { fetchLcraWaterQualitySites } from "@/lib/water/lcra-water-quality";

export const dynamic = "force-dynamic";

export async function GET() {
  const sites = await fetchLcraWaterQualitySites();
  return NextResponse.json({
    sites,
    freshness: buildWaterFreshness(["lcra-water-quality-sites"]),
  });
}
