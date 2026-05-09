import { countySlug } from "@/lib/counties";
import { getCountyByFips, getCountyBySlugOrName } from "@/lib/water/county-lookup";
import { getGlobalWaterDataCache } from "@/lib/water/cache";
import type { StreamGauge } from "@/lib/water/types";

const USGS_GAUGES_TTL_MS = 6 * 60 * 60 * 1000;

type UsgsRow = Record<string, string>;

function splitTabLine(value: string): string[] {
  return value.split("\t").map((part) => part.trim());
}

export function parseUsgsRdbText(text: string): StreamGauge[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const dataLines = lines.filter((line) => !line.startsWith("#"));
  if (dataLines.length < 3) {
    return [];
  }

  const headers = splitTabLine(dataLines[0]);
  const rows = dataLines.slice(2);
  return rows.map((line) => {
    const values = splitTabLine(line);
    const raw = headers.reduce<UsgsRow>((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
    const countyFips = raw.county_cd ? `48${raw.county_cd.padStart(3, "0")}` : null;
    const county = countyFips ? getCountyByFips(countyFips) : undefined;

    return {
      sourceId: "usgs-stream-sites",
      siteNumber: raw.site_no,
      stationName: raw.station_nm,
      countyName: county?.name ?? null,
      countyFips,
      latitude: Number(raw.dec_lat_va),
      longitude: Number(raw.dec_long_va),
      siteType: raw.site_tp_cd || null,
      status: "active",
      raw,
    } satisfies StreamGauge;
  });
}

export function filterGaugesForCounty(gauges: StreamGauge[], county: string): StreamGauge[] {
  const target = getCountyBySlugOrName(county);
  if (!target) return [];
  return gauges.filter((gauge) => gauge.countyName === target.name || gauge.countyFips === target.fips || countySlug(gauge.countyName ?? "") === target.slug);
}

async function fetchTexasStreamGaugesUncached(signal?: AbortSignal): Promise<StreamGauge[]> {
  const response = await fetch("https://waterservices.usgs.gov/nwis/site/?format=rdb&stateCd=tx&siteType=ST&siteStatus=active", { signal });
  if (!response.ok) {
    throw new Error(`USGS stream gauge request failed: ${response.status}`);
  }
  return parseUsgsRdbText(await response.text());
}

export async function fetchTexasStreamGauges(signal?: AbortSignal): Promise<StreamGauge[]> {
  if (signal) {
    return fetchTexasStreamGaugesUncached(signal);
  }
  return getGlobalWaterDataCache().getOrLoad("usgs-stream-sites", USGS_GAUGES_TTL_MS, () => fetchTexasStreamGaugesUncached());
}
