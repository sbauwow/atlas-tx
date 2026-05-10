import { NextResponse } from "next/server";
import { getDefaultCountyDependencyNetworkService } from "@/lib/water/source-network";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const network = await getDefaultCountyDependencyNetworkService().buildNetwork();
    return NextResponse.json(network);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
