import { NextResponse } from "next/server";

import { countySlug } from "@/lib/counties";
import { buildWaterFreshness } from "@/lib/water/freshness";
import {
  fetchGeneralWaterPermits,
  filterOilAndGasExtractionPermits,
  summarizeOilAndGasExtractionPermitsByCounty,
} from "@/lib/water/tceq-general-permits";
import type { OilAndGasExtractionCountySummary } from "@/lib/water/types";

export const dynamic = "force-dynamic";

function topCountyRows(summary: Map<string, { count: number; countyName: string }>): OilAndGasExtractionCountySummary[] {
  return Array.from(summary.entries())
    .map(([slug, value]) => ({ countySlug: slug, countyName: value.countyName, count: value.count }))
    .sort((left, right) => right.count - left.count || left.countyName.localeCompare(right.countyName));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const county = searchParams.get("county");
  const permits = filterOilAndGasExtractionPermits(await fetchGeneralWaterPermits());
  const filteredPermits = county ? permits.filter((record) => record.countyName && countySlug(record.countyName) === countySlug(county)) : permits;
  const summary = summarizeOilAndGasExtractionPermitsByCounty(filteredPermits);
  const topCounties = topCountyRows(summary);

  return NextResponse.json({
    permits: filteredPermits,
    summary: {
      totalPermits: filteredPermits.length,
      countyCount: topCounties.length,
      topCounties,
    },
    freshness: buildWaterFreshness(["tceq-oil-gas-extraction-permits"]),
  });
}
