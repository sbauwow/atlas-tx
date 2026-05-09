import { NextResponse } from "next/server";
import { fetchTexasNfhlLeveesByCounty } from "@/lib/water/fema-nfhl";
import { buildWaterFreshness } from "@/lib/water/freshness";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await fetchTexasNfhlLeveesByCounty();
  return NextResponse.json({
    ...data,
    freshness: buildWaterFreshness(["fema-nfhl-levees"]),
  });
}
