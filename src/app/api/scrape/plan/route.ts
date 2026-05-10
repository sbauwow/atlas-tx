import { NextRequest, NextResponse } from "next/server";
import {
  buildAtlasParallelScrapePlan,
  type ScrapeAggressiveness,
} from "@/lib/atlas-scrape-planner";

export const dynamic = "force-dynamic";

function parseAggressiveness(value: string | null): ScrapeAggressiveness {
  if (value === "conservative" || value === "balanced" || value === "aggressive") {
    return value;
  }

  return "balanced";
}

export async function GET(request: NextRequest) {
  const aggressiveness = parseAggressiveness(request.nextUrl.searchParams.get("aggressiveness"));
  const plan = buildAtlasParallelScrapePlan({ aggressiveness });

  return NextResponse.json(plan);
}
