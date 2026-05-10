import { NextResponse } from "next/server";

import { getAtlasBotnetState } from "@/lib/atlas-botnet-state";

export async function GET() {
  const state = await getAtlasBotnetState();

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    pipelineHealth: state.pipelineHealth,
    roadmapQueue: state.roadmapQueue,
    executionRegistrySummary: state.executionRegistrySummary,
  });
}
