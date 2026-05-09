import { countySlug, normalizeCountyName } from "@/lib/counties";
import { getGlobalWaterDataCache } from "@/lib/water/cache";
import type { WaterAlert } from "@/lib/water/types";

const WATER_EVENTS = new Set([
  "Flood Warning",
  "Flash Flood Warning",
  "Flood Advisory",
  "Hydrologic Outlook",
  "Coastal Flood Warning",
  "Flood Watch",
  "Flash Flood Statement",
]);
const NWS_ALERTS_TTL_MS = 15 * 60 * 1000;

type NwsFeature = {
  id?: string;
  geometry?: unknown;
  properties?: Record<string, unknown>;
};

function normalizeCountyToken(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return normalizeCountyName(trimmed.replace(/\s+parish$/i, " County"));
}

export function normalizeNwsAlert(feature: NwsFeature): WaterAlert {
  const properties = feature.properties ?? {};
  const areaDesc = typeof properties.areaDesc === "string" ? properties.areaDesc : "";
  const countyNames = areaDesc
    .split(/[;,]/)
    .map(normalizeCountyToken)
    .filter((value): value is string => Boolean(value));

  return {
    sourceId: "nws-alerts",
    alertId: String(feature.id ?? properties.id ?? "unknown-alert"),
    event: String(properties.event ?? "Unknown event"),
    severity: typeof properties.severity === "string" ? properties.severity : null,
    certainty: typeof properties.certainty === "string" ? properties.certainty : null,
    urgency: typeof properties.urgency === "string" ? properties.urgency : null,
    headline: typeof properties.headline === "string" ? properties.headline : null,
    sentAt: typeof properties.sent === "string" ? properties.sent : null,
    expiresAt: typeof properties.expires === "string" ? properties.expires : null,
    countyNames,
    geometryType: feature.geometry ? "polygon" : "none",
    raw: feature as Record<string, unknown>,
  };
}

export function filterTexasWaterAlerts(alerts: WaterAlert[]): WaterAlert[] {
  return alerts.filter((alert) => WATER_EVENTS.has(alert.event));
}

export function filterAlertsForCounty(alerts: WaterAlert[], county: string): WaterAlert[] {
  const target = countySlug(county);
  return alerts.filter((alert) => (alert.countyNames ?? []).some((name) => countySlug(name) === target));
}

async function fetchTexasWaterAlertsUncached(signal?: AbortSignal): Promise<WaterAlert[]> {
  const response = await fetch("https://api.weather.gov/alerts/active?area=TX", {
    headers: { Accept: "application/geo+json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`NWS alerts request failed: ${response.status}`);
  }
  const payload = (await response.json()) as { features?: NwsFeature[] };
  return filterTexasWaterAlerts((payload.features ?? []).map(normalizeNwsAlert));
}

export async function fetchTexasWaterAlerts(signal?: AbortSignal): Promise<WaterAlert[]> {
  if (signal) {
    return fetchTexasWaterAlertsUncached(signal);
  }
  return getGlobalWaterDataCache().getOrLoad("nws-alerts", NWS_ALERTS_TTL_MS, () => fetchTexasWaterAlertsUncached());
}
