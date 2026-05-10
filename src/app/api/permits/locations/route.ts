import { NextResponse } from "next/server";
import { fetchTceqPendingPermits } from "@/lib/tceq-permits";
import { countySlug } from "@/lib/counties";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const permits = await fetchTceqPendingPermits();
  const features = permits
    .filter((p) => p.latitude !== null && p.longitude !== null)
    .map((p) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [p.longitude as number, p.latitude as number],
      },
      properties: {
        permitNumber: p.permitNumber,
        applicant: p.permitteeName,
        authorizationType: p.authorizationType,
        authorizationStatus: p.authorizationStatus,
        county: p.county,
        countySlug: p.county ? countySlug(p.county) : null,
        nearestCity: p.nearestCity,
      },
    }));

  return NextResponse.json({
    type: "FeatureCollection",
    features,
  });
}
