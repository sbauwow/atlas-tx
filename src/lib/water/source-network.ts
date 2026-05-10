import { countySlug, normalizeCountyName } from "@/lib/counties";
import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";
import { fetchGeneralWaterPermits } from "@/lib/water/tceq-general-permits";
import { fetchWaterGovernance } from "@/lib/water/water-governance";
import type { WaterGovernanceEntity, WaterPermitRecord } from "@/lib/water/types";

export type CountyDependencyNode = {
  countySlug: string;
  countyName: string;
  lat: number | null;
  lon: number | null;
  multiCountySourceCount: number;
  contagionScore: number;
};

export type CountyDependencyEdge = {
  fromCountySlug: string;
  toCountySlug: string;
  sharedSourceCount: number;
  sharedSources: string[];
};

export type CountyDirectedDependencyEdge = {
  upstreamCountySlug: string;
  downstreamCountySlug: string;
  sharedSourceCount: number;
  sharedSources: string[];
};

export type CountyDependencyNetwork = {
  generatedAt: string;
  schemaVersion: number;
  flowDirectionMethod: "centroid-gulf-proxy-v1";
  nodes: CountyDependencyNode[];
  edges: CountyDependencyEdge[];
  directedEdges: CountyDirectedDependencyEdge[];
};

export type CreateCountyDependencyNetworkServiceOptions = {
  fetchGovernance?: () => Promise<WaterGovernanceEntity[]>;
  fetchPermits?: () => Promise<WaterPermitRecord[]>;
};

function normalizeProviderKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function createCountyDependencyNetworkService({
  fetchGovernance = fetchWaterGovernance,
  fetchPermits = fetchGeneralWaterPermits,
}: CreateCountyDependencyNetworkServiceOptions = {}) {
  return {
    async buildNetwork(): Promise<CountyDependencyNetwork> {
      const [governance, permits] = await Promise.all([fetchGovernance(), fetchPermits()]);

      const providerToCounties = new Map<string, Set<string>>();
      const countyNames = new Map<string, string>();

      const register = (providerKey: string, countyName: string | null | undefined) => {
        if (!countyName) return;
        const slug = countySlug(countyName);
        const canonicalName = normalizeCountyName(countyName);
        countyNames.set(slug, canonicalName);
        const existing = providerToCounties.get(providerKey) ?? new Set<string>();
        existing.add(slug);
        providerToCounties.set(providerKey, existing);
      };

      governance.forEach((entity) => {
        const name = normalizeProviderKey(entity.entityName);
        register(`gov:${name}`, entity.countyName);
      });

      permits.forEach((permit) => {
        const sourceName = permit.siteName ?? permit.permitNumber;
        if (!sourceName) return;
        register(`permit:${normalizeProviderKey(sourceName)}`, permit.countyName);
      });

      const countyProviderCount = new Map<string, number>();
      const edgeMap = new Map<string, { count: number; sources: string[] }>();

      for (const [provider, countiesSet] of providerToCounties.entries()) {
        const counties = Array.from(countiesSet);
        if (counties.length < 2) continue;

        counties.forEach((slug) => {
          countyProviderCount.set(slug, (countyProviderCount.get(slug) ?? 0) + 1);
        });

        for (let i = 0; i < counties.length; i += 1) {
          for (let j = i + 1; j < counties.length; j += 1) {
            const left = counties[i]!;
            const right = counties[j]!;
            const [from, to] = [left, right].sort();
            const key = `${from}::${to}`;
            const existing = edgeMap.get(key) ?? { count: 0, sources: [] };
            existing.count += 1;
            if (existing.sources.length < 5) existing.sources.push(provider);
            edgeMap.set(key, existing);
          }
        }
      }

      const nodes: CountyDependencyNode[] = Array.from(countyNames.entries()).map(([slug, name]) => {
        const centroid = TEXAS_COUNTY_CENTROIDS[slug];
        const multiCountySourceCount = countyProviderCount.get(slug) ?? 0;
        const connectedEdgeWeight = Array.from(edgeMap.entries())
          .filter(([key]) => key.startsWith(`${slug}::`) || key.endsWith(`::${slug}`))
          .reduce((acc, [, value]) => acc + value.count, 0);
        const contagionScore = Math.round((multiCountySourceCount * 0.6 + connectedEdgeWeight * 0.4) * 10) / 10;

        return {
          countySlug: slug,
          countyName: name,
          lat: centroid?.lat ?? null,
          lon: centroid?.lon ?? null,
          multiCountySourceCount,
          contagionScore,
        };
      });

      const edges: CountyDependencyEdge[] = Array.from(edgeMap.entries()).map(([key, value]) => {
        const [fromCountySlug, toCountySlug] = key.split("::");
        return {
          fromCountySlug: fromCountySlug ?? "",
          toCountySlug: toCountySlug ?? "",
          sharedSourceCount: value.count,
          sharedSources: value.sources,
        };
      });

      const directedEdges: CountyDirectedDependencyEdge[] = edges.map((edge) => {
        const fromCentroid = TEXAS_COUNTY_CENTROIDS[edge.fromCountySlug];
        const toCentroid = TEXAS_COUNTY_CENTROIDS[edge.toCountySlug];

        // Proxy for downstream direction until reach-level hydrology lands:
        // more northern county is treated as upstream; if latitude ties, more western county is upstream.
        const fromLat = fromCentroid?.lat ?? 0;
        const toLat = toCentroid?.lat ?? 0;
        const fromLon = fromCentroid?.lon ?? 0;
        const toLon = toCentroid?.lon ?? 0;

        const fromIsUpstream = fromLat > toLat || (fromLat === toLat && fromLon < toLon);

        return {
          upstreamCountySlug: fromIsUpstream ? edge.fromCountySlug : edge.toCountySlug,
          downstreamCountySlug: fromIsUpstream ? edge.toCountySlug : edge.fromCountySlug,
          sharedSourceCount: edge.sharedSourceCount,
          sharedSources: edge.sharedSources,
        };
      });

      return {
        generatedAt: new Date().toISOString(),
        schemaVersion: 1,
        flowDirectionMethod: "centroid-gulf-proxy-v1",
        nodes: nodes.sort((a, b) => b.contagionScore - a.contagionScore || a.countySlug.localeCompare(b.countySlug)),
        edges: edges.sort((a, b) => b.sharedSourceCount - a.sharedSourceCount),
        directedEdges: directedEdges.sort((a, b) => b.sharedSourceCount - a.sharedSourceCount),
      };
    },
  };
}

let defaultCountyDependencyNetworkService: ReturnType<typeof createCountyDependencyNetworkService> | undefined;

export function getDefaultCountyDependencyNetworkService() {
  if (!defaultCountyDependencyNetworkService) {
    defaultCountyDependencyNetworkService = createCountyDependencyNetworkService();
  }
  return defaultCountyDependencyNetworkService;
}
