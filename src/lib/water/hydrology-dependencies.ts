import { normalizeCountyName } from "@/lib/counties";
import { TEXAS_COUNTY_CENTROIDS } from "@/lib/texas-county-centroids";
import { TEXAS_HYDROLOGY_SEED_EDGES, type HydrologySeedEdge } from "@/lib/water/hydrology-seed-edges";

export type HydrologyDependencyNode = {
  countySlug: string;
  countyName: string;
  lat: number | null;
  lon: number | null;
  upstreamContributionScore: number;
  downstreamDependencyScore: number;
  contagionScore: number;
};

export type HydrologyDependencyGraph = {
  generatedAt: string;
  schemaVersion: number;
  flowDirectionMethod: "seeded-river-network-v1";
  nodes: HydrologyDependencyNode[];
  edges: HydrologySeedEdge[];
};

export type CreateHydrologyDependencyServiceOptions = {
  loadSeedEdges?: () => Promise<HydrologySeedEdge[]>;
};

function countyNameFromSlug(slug: string): string {
  return normalizeCountyName(slug.replace(/-/g, " "));
}

export function createHydrologyDependencyService({
  loadSeedEdges = async () => TEXAS_HYDROLOGY_SEED_EDGES,
}: CreateHydrologyDependencyServiceOptions = {}) {
  return {
    async buildGraph(): Promise<HydrologyDependencyGraph> {
      const edges = await loadSeedEdges();

      const nodes = new Map<string, HydrologyDependencyNode>();

      const touchNode = (slug: string): HydrologyDependencyNode => {
        const existing = nodes.get(slug);
        if (existing) return existing;

        const centroid = TEXAS_COUNTY_CENTROIDS[slug];
        const created: HydrologyDependencyNode = {
          countySlug: slug,
          countyName: countyNameFromSlug(slug),
          lat: centroid?.lat ?? null,
          lon: centroid?.lon ?? null,
          upstreamContributionScore: 0,
          downstreamDependencyScore: 0,
          contagionScore: 0,
        };

        nodes.set(slug, created);
        return created;
      };

      edges.forEach((edge) => {
        const upstream = touchNode(edge.upstreamCountySlug);
        const downstream = touchNode(edge.downstreamCountySlug);
        upstream.upstreamContributionScore += edge.weight;
        downstream.downstreamDependencyScore += edge.weight;
      });

      const nodeList = Array.from(nodes.values()).map((node) => ({
        ...node,
        contagionScore: Math.round((node.downstreamDependencyScore * 0.7 + node.upstreamContributionScore * 0.3) * 10) / 10,
      }));

      return {
        generatedAt: new Date().toISOString(),
        schemaVersion: 1,
        flowDirectionMethod: "seeded-river-network-v1",
        nodes: nodeList.sort((a, b) => b.contagionScore - a.contagionScore || a.countySlug.localeCompare(b.countySlug)),
        edges,
      };
    },
  };
}

let defaultHydrologyDependencyService: ReturnType<typeof createHydrologyDependencyService> | undefined;

export function getDefaultHydrologyDependencyService() {
  if (!defaultHydrologyDependencyService) {
    defaultHydrologyDependencyService = createHydrologyDependencyService();
  }

  return defaultHydrologyDependencyService;
}
