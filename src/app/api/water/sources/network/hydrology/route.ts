import { NextResponse } from "next/server";
import { getDefaultHydrologyDependencyService } from "@/lib/water/hydrology-dependencies";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const graph = await getDefaultHydrologyDependencyService().buildGraph();
    return NextResponse.json(graph);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
