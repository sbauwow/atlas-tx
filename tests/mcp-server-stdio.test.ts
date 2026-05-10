import { describe, expect, it } from "vitest";

import { createAtlasTxMcpServer } from "../packages/mcp-server/src/server.js";

describe("Atlas TX MCP stdio server", () => {
  it("registers the documented tool surface against the McpServer instance", async () => {
    const server = createAtlasTxMcpServer({
      loadSdwisData: async () => ({ rows: [], generatedAt: "2026-05-10T00:00:00.000Z", cacheState: "snapshot", caveats: [] }),
      loadAnalyticsArtifacts: async () => ({
        countyHistory: { generatedAt: "2026-05-10T00:00:00.000Z", counties: [], provenance: { method: null, notes: [] } },
        countyMovers: { generatedAt: "2026-05-10T00:00:00.000Z", baselineSnapshotAt: null, comparisonSnapshotAt: null, notes: [], movers: [] },
        pressureRiskScatter: { generatedAt: "2026-05-10T00:00:00.000Z", axes: { x: "pressureScore", y: "countyRiskScore" }, points: [] },
        sourceFreshness: { generatedAt: "2026-05-10T00:00:00.000Z", sources: [] },
      }),
      loadCidData: async () => ({ cases: [], protests: [], generatedAt: "2026-05-10T00:00:00.000Z", cacheState: "snapshot" }),
      loadCountyPopulation: async () => ({}),
      loadPermitPageData: async () => ({
        generatedAt: "2026-05-10T00:00:00.000Z",
        cacheState: "snapshot",
        permits: [],
        cidSummary: {
          available: true,
          generatedAt: "2026-05-10T00:00:00.000Z",
          openCaseCount: 0,
          protestedCaseCount: 0,
          hearingRequestCount: 0,
          publicMeetingRequestCount: 0,
          caveats: [],
          topProgramAreas: [],
          cases: [],
        },
      }),
      loadPipelineHealthReport: async () => ({
        generatedAt: "2026-05-10T00:00:00.000Z",
        overallStatus: "ok",
        steps: [],
      }),
    });

    expect(server).toBeDefined();
    const internal = server as unknown as { _registeredTools: Record<string, unknown> };
    const registered = Object.keys(internal._registeredTools);
    expect(registered).toEqual(
      expect.arrayContaining([
        "discover_datasets",
        "get_dataset_schema",
        "score_pws_drinking_water_risk",
        "get_county_analytics_summary",
        "list_county_movers",
        "get_pressure_risk_scatter",
        "get_county_score_decomposition",
        "list_protested_permits",
        "score_protest_density",
        "list_permit_filing_red_flags",
        "build_permit_protest_prep",
        "get_permit_filing_detail",
        "list_county_pending_fights",
        "get_pipeline_health",
        "summarize_water_risk_for_county",
      ]),
    );
  });
});
