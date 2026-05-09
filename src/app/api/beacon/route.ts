import { NextRequest, NextResponse } from "next/server";

const PIXEL = Uint8Array.from(
  Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"),
);

const SESSION_COOKIE = "atlas_tx_sid";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const SESSION_ID_RE = /^[a-z0-9-]{16,64}$/i;
const ALLOWED_EVENTS = new Set(["pageview", "click", "outbound", "search", "submit", "render_404", "render_500"]);

function sanitizeEvent(raw: string | null): string {
  if (!raw) return "pageview";
  const value = raw.toLowerCase().slice(0, 32);
  return ALLOWED_EVENTS.has(value) ? value : "pageview";
}

function sanitizeTarget(raw: string | null): string {
  if (!raw) return "";
  return raw.replace(/[^\w./:@\-]/g, "").slice(0, 200);
}

function sanitizeUtm(raw: string | null): string {
  if (!raw) return "";
  return raw.toLowerCase().replace(/[^a-z0-9_\-.:]/g, "").slice(0, 80);
}

function sanitizeReferrerHost(raw: string | null): string {
  if (!raw) return "";
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const host = url.hostname.toLowerCase();
    return host.includes("atlastexas") || host.includes("atlastx") ? "" : host.slice(0, 120);
  } catch {
    return raw.toLowerCase().replace(/[^a-z0-9.\-]/g, "").slice(0, 120);
  }
}

function stripTrackingParams(pathWithQuery: string): {
  cleanPath: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
} {
  try {
    const url = new URL(pathWithQuery, "https://atlastexas.org");
    const utmSource = sanitizeUtm(url.searchParams.get("utm_source"));
    const utmMedium = sanitizeUtm(url.searchParams.get("utm_medium"));
    const utmCampaign = sanitizeUtm(url.searchParams.get("utm_campaign"));

    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid", "msclkid"].forEach((key) => {
      url.searchParams.delete(key);
    });

    const query = url.searchParams.toString();
    return {
      cleanPath: query ? `${url.pathname}?${query}` : url.pathname,
      utmSource,
      utmMedium,
      utmCampaign,
    };
  } catch {
    return { cleanPath: pathWithQuery, utmSource: "", utmMedium: "", utmCampaign: "" };
  }
}

export async function GET(request: NextRequest) {
  try {
    const explicitPath = request.nextUrl.searchParams.get("p") || "/";
    const rawPath = explicitPath.startsWith("/") ? explicitPath : "/";
    const { cleanPath, utmSource, utmMedium, utmCampaign } = stripTrackingParams(rawPath);
    const referrer = sanitizeReferrerHost(request.headers.get("referer"));
    const eventType = sanitizeEvent(request.nextUrl.searchParams.get("e"));
    const eventTarget = sanitizeTarget(request.nextUrl.searchParams.get("t"));
    const existingSessionId = request.cookies.get(SESSION_COOKIE)?.value;
    const sessionId = existingSessionId && SESSION_ID_RE.test(existingSessionId)
      ? existingSessionId
      : globalThis.crypto.randomUUID();

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      level: "info",
      msg: "telemetry",
      event_type: eventType,
      event_target: eventTarget || undefined,
      path: cleanPath,
      referrer: referrer || undefined,
      utm_source: utmSource || undefined,
      utm_medium: utmMedium || undefined,
      utm_campaign: utmCampaign || undefined,
      session_id: sessionId,
      ua: (request.headers.get("user-agent") || "").slice(0, 200) || undefined,
    }));

    const response = new NextResponse(PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Content-Length": PIXEL.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: sessionId,
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
    });

    return response;
  } catch {
    return new NextResponse(PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Content-Length": PIXEL.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  }
}
