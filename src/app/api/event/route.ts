import type { AtlasTelemetryEnvelope } from "@/lib/telemetry/schema";
import { parseAtlasClientTelemetryEvent } from "@/lib/telemetry/schema";
import { getTelemetryEnv, getTelemetryRelease } from "@/lib/telemetry/release";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = parseAtlasClientTelemetryEvent(json);

  if (!parsed) {
    return Response.json({ error: "invalid telemetry body" }, { status: 400 });
  }

  const envelope: AtlasTelemetryEnvelope = {
    app: "atlas-tx",
    env: getTelemetryEnv(),
    release: getTelemetryRelease(),
    user_id: null,
    session_id: parsed.session_id,
    event_name: parsed.event_name,
    props: parsed.props,
    ts: parsed.ts,
  };

  console.log(JSON.stringify({
    logged_at: new Date().toISOString(),
    level: "info",
    msg: "telemetry:event",
    ...envelope,
  }));

  return Response.json({ ok: true }, { status: 202 });
}
