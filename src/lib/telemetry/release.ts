export function getTelemetryEnv(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_ENV?.trim() || process.env.ATLAS_TELEMETRY_ENV?.trim();
  if (explicit) return explicit;
  const nodeEnv = process.env.NODE_ENV?.trim();
  return nodeEnv || "development";
}

export function getTelemetryRelease(): string | null {
  const explicit = process.env.NEXT_PUBLIC_APP_RELEASE?.trim() || process.env.ATLAS_RELEASE?.trim();
  return explicit || null;
}
