import { NextResponse } from "next/server";

import {
  COUNTY_VIEW_IDS,
  getCountyViewPayload,
  isCountyViewId,
  type CountyViewId,
} from "@/lib/maps/county-views";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ view: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { view } = await params;
  if (!isCountyViewId(view)) {
    return NextResponse.json(
      { error: "unknown view", supported: COUNTY_VIEW_IDS },
      { status: 404 },
    );
  }
  try {
    const payload = await getCountyViewPayload(view as CountyViewId);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
