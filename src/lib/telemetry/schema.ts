export type AtlasClientTelemetryEvent = {
  event_name: string;
  props: Record<string, unknown>;
  session_id: string | null;
  ts: string;
};

export type AtlasTelemetryEnvelope = {
  app: "atlas-tx";
  env: string;
  release: string | null;
  user_id: string | null;
  session_id: string | null;
  event_name: string;
  props: Record<string, unknown>;
  ts: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIsoDateTime(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

export function parseAtlasClientTelemetryEvent(input: unknown): AtlasClientTelemetryEvent | null {
  if (!isRecord(input)) return null;

  const eventName = typeof input.event_name === "string" ? input.event_name.trim().slice(0, 120) : "";
  if (!eventName) return null;

  const props = isRecord(input.props) ? input.props : {};
  const sessionIdRaw = input.session_id;
  const sessionId = typeof sessionIdRaw === "string"
    ? sessionIdRaw.trim().slice(0, 160) || null
    : sessionIdRaw == null
      ? null
      : null;

  const timestamp = typeof input.ts === "string" && isIsoDateTime(input.ts)
    ? input.ts
    : new Date().toISOString();

  return {
    event_name: eventName,
    props,
    session_id: sessionId,
    ts: timestamp,
  };
}
