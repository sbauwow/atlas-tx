import { NextResponse } from "next/server";
import { fetchNfhlDiscoveryBundle } from "@/lib/water/fema-nfhl";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await fetchNfhlDiscoveryBundle());
}
