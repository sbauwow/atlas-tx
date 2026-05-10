import { NextResponse } from "next/server";
import { getDefaultCountyWaterSourceProfileService } from "@/lib/water/source-provenance";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getDefaultCountyWaterSourceProfileService();

  try {
    const profile = await service.getCountyProfile(slug);
    const month = new URL(request.url).searchParams.get("month");
    if (!month) return NextResponse.json(profile);

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Invalid month format. Use YYYY-MM." }, { status: 400 });
    }

    const timelinePoint = profile.timeline.find((row) => row.month === month) ?? null;
    const communitySamples = profile.communitySamples.filter((sample) => sample.createdAt.slice(0, 7) === month);

    return NextResponse.json({
      ...profile,
      evidenceWindow: {
        month,
        timelinePoint,
        communitySamples,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
