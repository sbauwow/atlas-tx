const SESSION_STORAGE_KEY = "atlas-tx.telemetry.session";

function ensureSessionId(): string | null {
  if (typeof window === "undefined") return null;
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY)?.trim();
  if (existing) return existing;
  const next = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}

export async function trackTelemetryEvent(eventName: string, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const body = {
    event_name: eventName,
    props,
    session_id: ensureSessionId(),
    ts: new Date().toISOString(),
  };

  try {
    await fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // fail open
  }
}
