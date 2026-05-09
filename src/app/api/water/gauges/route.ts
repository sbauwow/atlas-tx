import { NextResponse } from "next/server";
import { fetchTexasStreamGauges, filterGaugesForCounty } from "@/lib/water/usgs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const county = searchParams.get("county");
  const gauges = await fetchTexasStreamGauges();
  return NextResponse.json({
    gauges: county ? filterGaugesForCounty(gauges, county) : gauges,
  });
}
