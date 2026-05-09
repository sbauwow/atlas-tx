import { NextResponse } from "next/server";
import { fetchTexasWaterAlerts, filterAlertsForCounty } from "@/lib/water/nws";
import { buildWaterFreshness } from "@/lib/water/freshness";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const county = searchParams.get("county");
  const alerts = await fetchTexasWaterAlerts();
  return NextResponse.json({
    alerts: county ? filterAlertsForCounty(alerts, county) : alerts,
    freshness: buildWaterFreshness(["nws-alerts"]),
  });
}
