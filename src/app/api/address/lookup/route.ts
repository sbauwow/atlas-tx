import { NextResponse } from "next/server";
import { lookupAddress } from "@/lib/address-lookup";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ERROR_STATUS: Record<string, number> = {
  "invalid-input": 400,
  "no-match": 404,
  "out-of-state": 422,
  timeout: 504,
  network: 502,
  internal: 500,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? searchParams.get("address") ?? "";

  if (!query.trim()) {
    return NextResponse.json(
      { ok: false, error: { kind: "invalid-input", message: "Missing ?q=<address>" } },
      { status: 400 },
    );
  }

  const envelope = await lookupAddress({ address: query });
  if (!envelope.ok) {
    return NextResponse.json(envelope, {
      status: ERROR_STATUS[envelope.error.kind] ?? 500,
    });
  }
  return NextResponse.json(envelope);
}
