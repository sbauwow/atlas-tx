import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 86400;

const UPSTREAM = (z: string, x: string, y: string) =>
  `https://basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params;
  if (!/^\d{1,2}$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
    return new NextResponse("bad tile coords", { status: 400 });
  }
  const upstream = await fetch(UPSTREAM(z, x, y), {
    headers: { "User-Agent": "atlas-tx-map/1.0 (+https://github.com/sbauwow/atlas-tx)" },
  });
  if (!upstream.ok) {
    return new NextResponse(`upstream ${upstream.status}`, { status: upstream.status });
  }
  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "image/png",
      "cache-control": "public, max-age=86400, s-maxage=604800, immutable",
    },
  });
}
