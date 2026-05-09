import { NextResponse } from "next/server";
import { fetchTexasNfhlCountyCoverage } from "@/lib/water/fema-nfhl";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await fetchTexasNfhlCountyCoverage());
}
