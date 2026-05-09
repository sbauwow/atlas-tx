import { NextResponse } from "next/server";
import { MVP_DATASETS } from "@/lib/mvp-datasets";

export async function GET() {
  return NextResponse.json({
    ok: true,
    project: "atlas-tx",
    dataset_count: MVP_DATASETS.length,
    timestamp: new Date().toISOString(),
  });
}
