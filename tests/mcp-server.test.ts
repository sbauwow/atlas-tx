import { describe, expect, it } from "vitest";

import { createAtlasTxMcpHandlers, runAtlasTxTool } from "../packages/mcp-server/src/index.js";

const ANALYTICS_FIXTURE = {
  countyHistory: {
    generatedAt: "2026-05-10T00:00:00.000Z",
    provenance: {
      method: "Committed county-history snapshot",
      notes: ["Pressure score is normalized from impaired segments."],
    },
    counties: [
      {
        county: { name: "Comal County", slug: "comal-county" },
        snapshots: [
          {
            snapshotAt: "2026-05-09T00:00:00.000Z",
            metrics: {
              countyRiskScore: 5.5,
              pressureScore: 2.5,
              systemCount: 10,
              violationCount: 100,
              impairedSegmentCount: 4,
              affectedPopulation: 150000,
              population: 180000,
              hydrologyLayerHitCount: 3,
              impairedSegmentShare: 0.4,
            },
            ranks: { risk: 12, pressure: 20 },
            highlights: {
              topSystems: [{ pwsId: "TX001", pwsName: "Comal PWS", score: 2.2, violationCount: 10 }],
            },
          },
          {
            snapshotAt: "2026-05-10T00:00:00.000Z",
            metrics: {
              countyRiskScore: 6.07,
              pressureScore: 3.09,
              systemCount: 17,
              violationCount: 309,
              impairedSegmentCount: 5,
              affectedPopulation: 180000,
              population: 180000,
              hydrologyLayerHitCount: 3,
              impairedSegmentShare: 0.5,
            },
            ranks: { risk: 9, pressure: 14 },
            highlights: {
              topSystems: [{ pwsId: "TX002", pwsName: "Canyon Lake Water", score: 3.5, violationCount: 14 }],
            },
          },
        ],
      },
      {
        county: { name: "Travis County", slug: "travis-county" },
        snapshots: [
          {
            snapshotAt: "2026-05-10T00:00:00.000Z",
            metrics: {
              countyRiskScore: 9.72,
              pressureScore: 0.43,
              systemCount: 28,
              violationCount: 136,
              impairedSegmentCount: 5,
              affectedPopulation: 1300000,
              population: 1300000,
              hydrologyLayerHitCount: 3,
              impairedSegmentShare: 0.2,
            },
            ranks: { risk: 2, pressure: 90 },
            highlights: {
              topSystems: [{ pwsId: "TX003", pwsName: "Austin Water", score: 4.1, violationCount: 12 }],
            },
          },
        ],
      },
    ],
  },
  countyMovers: {
    generatedAt: "2026-05-10T00:00:00.000Z",
    baselineSnapshotAt: "2026-05-09T00:00:00.000Z",
    comparisonSnapshotAt: "2026-05-10T00:00:00.000Z",
    notes: ["First comparison window uses the first two committed snapshots."],
    movers: [
      {
        county: { name: "Comal County", slug: "comal-county" },
        movement: "up",
        currentRank: 9,
        previousRank: 12,
        rankDelta: -3,
        currentRiskScore: 6.07,
        previousRiskScore: 5.5,
        scoreDelta: 0.57,
        currentPressureScore: 3.09,
        previousPressureScore: 2.5,
      },
      {
        county: { name: "Travis County", slug: "travis-county" },
        movement: "steady",
        currentRank: 2,
        previousRank: 2,
        rankDelta: 0,
        currentRiskScore: 9.72,
        previousRiskScore: 9.72,
        scoreDelta: 0,
        currentPressureScore: 0.43,
        previousPressureScore: 0.43,
      },
    ],
  },
  pressureRiskScatter: {
    generatedAt: "2026-05-10T00:00:00.000Z",
    axes: { x: "pressureScore", y: "countyRiskScore" },
    points: [
      {
        county: { name: "Comal County", slug: "comal-county" },
        x: 3.09,
        y: 6.07,
        population: 180000,
        impairedSegmentCount: 5,
        hydrologyLayerHitCount: 3,
        systemCount: 17,
        violationCount: 309,
        quadrant: "high-pressure-high-risk",
      },
      {
        county: { name: "Travis County", slug: "travis-county" },
        x: 0.43,
        y: 9.72,
        population: 1300000,
        impairedSegmentCount: 5,
        hydrologyLayerHitCount: 3,
        systemCount: 28,
        violationCount: 136,
        quadrant: "lower-pressure-high-risk",
      },
    ],
  },
  sourceFreshness: {
    generatedAt: "2026-05-10T00:00:00.000Z",
    sources: [
      {
        sourceId: "sdwis",
        generatedAt: "2026-05-09T01:50:21.429Z",
        rowCount: 11686,
        notes: ["SDWIS snapshot is filtered to recent health-based violations."],
      },
      {
        sourceId: "acs-county",
        generatedAt: "2026-05-08T00:00:00.000Z",
        rowCount: 3,
        notes: ["Population coverage is limited to the committed ACS county snapshot."],
      },
      {
        sourceId: "surface-water-quality",
        generatedAt: "2026-05-09T04:56:55.042Z",
        rowCount: 1523,
        notes: ["County pressure uses impaired segment counts from the cached surface-water snapshot."],
      },
      {
        sourceId: "twdb-hydrology",
        generatedAt: "2026-05-09T04:06:07.779Z",
        rowCount: 370,
        notes: ["Hydrology is centroid-based context, not full polygon overlap."],
      },
    ],
  },
};

describe("Atlas TX MCP handlers", () => {
  it("scores drinking-water risk per PWS and returns the standard response envelope", async () => {
    const deps = {
      loadSdwisData: async () => ({
        rows: [
          {
            pwsid: "TX1234567",
            pwsName: "Alpha Water System",
            county: "Travis County",
            populationServed: 10000,
            violationId: "V1",
            violationCode: "MCL",
            violationCategory: "TT",
            isHealthBased: true,
            contaminantCode: "1005",
            complianceStatusCode: "open",
            complPerBeginDate: "2026-04-01",
            complPerEndDate: null,
            pwsTypeCode: "CWS",
            ruleCode: null,
            ruleGroupCode: null,
            publicNotificationTier: 1,
          },
          {
            pwsid: "TX7654321",
            pwsName: "Beta Rural Water",
            county: "Comal County",
            populationServed: 500,
            violationId: "V2",
            violationCode: "MON",
            violationCategory: "MRDL",
            isHealthBased: true,
            contaminantCode: "2000",
            complianceStatusCode: "open",
            complPerBeginDate: "2026-03-01",
            complPerEndDate: null,
            pwsTypeCode: "CWS",
            ruleCode: null,
            ruleGroupCode: null,
            publicNotificationTier: 2,
          },
        ],
        generatedAt: "2026-05-08T00:00:00.000Z",
        cacheState: "snapshot",
        caveats: ["Snapshot caveat"],
      }),
    };
    const handlers = createAtlasTxMcpHandlers(deps);

    const result = await handlers.score_pws_drinking_water_risk({ county: "Travis County", limit: 5 });

    expect(result.cache_state).toBe("snapshot");
    expect(result.generated_at).toBe("2026-05-08T00:00:00.000Z");
    expect(result.sources.map((s) => s.dataset_id)).toEqual(["epa-sdwis-violations"]);
    expect(result.data).toEqual([
      {
        pws_id: "TX1234567",
        pws_name: "Alpha Water System",
        county: "Travis County",
        population_served: 10000,
        score: 100,
        components: {
          violation_severity: 2,
          population_weight: 2,
          recency_weight: 1,
        },
        top_violations: [
          { code: "MCL", date: "2026-04-01" },
        ],
      },
    ]);

    const dispatched = await runAtlasTxTool("score_pws_drinking_water_risk", { county: "Travis County", limit: 5 }, deps);
    expect(dispatched.data[0]?.pws_id).toBe("TX1234567");
  });

  it("returns a county analytics summary from the committed analytics spine", async () => {
    const deps = {
      loadAnalyticsArtifacts: async () => ANALYTICS_FIXTURE,
    };
    const handlers = createAtlasTxMcpHandlers(deps);

    const result = await handlers.get_county_analytics_summary({ county: "Comal County", history_limit: 2 });

    expect(result.cache_state).toBe("snapshot");
    expect(result.generated_at).toBe("2026-05-10T00:00:00.000Z");
    expect(result.data.county_slug).toBe("comal-county");
    expect(result.data.current_snapshot?.county_risk_score).toBe(6.07);
    expect(result.data.previous_snapshot?.pressure_score).toBe(2.5);
    expect(result.data.deltas.county_risk_score).toBe(0.57);
    expect(result.data.movement?.movement).toBe("up");
    expect(result.data.scatter_context?.quadrant).toBe("high-pressure-high-risk");
    expect(result.sources.map((source) => source.dataset_id)).toContain("tceq-swq-segments");

    const dispatched = await runAtlasTxTool("get_county_analytics_summary", { county: "Comal County", history_limit: 1 }, deps);
    expect(dispatched.data.history).toHaveLength(1);
  });

  it("lists county movers from the committed analytics artifact", async () => {
    const handlers = createAtlasTxMcpHandlers({
      loadAnalyticsArtifacts: async () => ANALYTICS_FIXTURE,
    });

    const result = await handlers.list_county_movers({ movement: "up", limit: 5 });

    expect(result.cache_state).toBe("snapshot");
    expect(result.data.baseline_snapshot_at).toBe("2026-05-09T00:00:00.000Z");
    expect(result.data.movers).toEqual([
      {
        county: "Comal County",
        county_slug: "comal-county",
        movement: "up",
        current_rank: 9,
        previous_rank: 12,
        rank_delta: -3,
        current_risk_score: 6.07,
        previous_risk_score: 5.5,
        score_delta: 0.57,
        current_pressure_score: 3.09,
        previous_pressure_score: 2.5,
      },
    ]);
  });

  it("returns pressure-risk scatter context with quadrant filtering", async () => {
    const deps = {
      loadAnalyticsArtifacts: async () => ANALYTICS_FIXTURE,
    };
    const handlers = createAtlasTxMcpHandlers(deps);

    const result = await handlers.get_pressure_risk_scatter({ quadrant: "lower-pressure-high-risk", limit: 10 });

    expect(result.cache_state).toBe("snapshot");
    expect(result.data.axes).toEqual({ x: "pressureScore", y: "countyRiskScore" });
    expect(result.data.quadrant_summary.find((row) => row.quadrant === "high-pressure-high-risk")?.count).toBe(1);
    expect(result.data.points).toEqual([
      {
        county: "Travis County",
        county_slug: "travis-county",
        x: 0.43,
        y: 9.72,
        population: 1300000,
        impaired_segment_count: 5,
        hydrology_layer_hit_count: 3,
        system_count: 28,
        violation_count: 136,
        quadrant: "lower-pressure-high-risk",
        quadrant_label: "Lower pressure + high risk",
      },
    ]);

    const dispatched = await runAtlasTxTool("get_pressure_risk_scatter", { county: "Comal County" }, deps);
    expect(dispatched.data.points[0]?.county_slug).toBe("comal-county");
  });

  it("returns a county score decomposition from the committed analytics spine", async () => {
    const handlers = createAtlasTxMcpHandlers({
      loadAnalyticsArtifacts: async () => ANALYTICS_FIXTURE,
    });

    const result = await handlers.get_county_score_decomposition({ county: "Comal County" });

    expect(result.cache_state).toBe("snapshot");
    expect(result.data.decomposition).toEqual([
      {
        component_id: "county_risk_score",
        label: "County drinking-water risk axis",
        value: 6.07,
        rank: 9,
        statewide_county_count: 2,
        details: {
          violation_count: 309,
          system_count: 17,
          affected_population: 180000,
        },
      },
      {
        component_id: "pressure_score",
        label: "Surface-water pressure axis",
        value: 3.09,
        rank: 14,
        statewide_county_count: 2,
        details: {
          impaired_segment_count: 5,
          hydrology_layer_hit_count: 3,
          population: 180000,
          impaired_segment_share: 0.5,
        },
      },
    ]);
    expect(result.data.top_systems[0]).toEqual({
      pws_id: "TX002",
      pws_name: "Canyon Lake Water",
      score: 3.5,
      violation_count: 14,
    });
  });

  it("lists protested permits with aggregated filing counts and named orgs only", async () => {
    const handlers = createAtlasTxMcpHandlers({
      loadCidData: async () => ({
        cases: [
          {
            tceqId: "WQ0000447000",
            applicantName: "DOW HYDROCARBONS AND RESOURCES LLC",
            county: "Brazoria County",
            programArea: "WQ",
            itemStatus: "open",
            tceqDocketNumber: "2026-001234-WQ",
            soahDocketNumber: "582-26-1234",
            regulatedEntityNumber: null,
            customerNumber: null,
          },
        ],
        protests: [
          {
            tceqId: "WQ0000447000",
            filingType: "comment",
            filerOrganization: null,
            filedAt: "2026-04-01",
          },
          {
            tceqId: "WQ0000447000",
            filingType: "hearing_request",
            filerOrganization: "Public Citizen",
            filedAt: "2026-04-02",
          },
          {
            tceqId: "WQ0000447000",
            filingType: "public_meeting_request",
            filerOrganization: "Sierra Club Lone Star Chapter",
            filedAt: "2026-04-03",
          },
        ],
        generatedAt: "2026-05-08T00:00:00.000Z",
        cacheState: "snapshot",
      }),
    });

    const result = await handlers.list_protested_permits({ county: "Brazoria County" });

    expect(result.cache_state).toBe("snapshot");
    expect(result.data).toEqual([
      {
        tceq_id: "WQ0000447000",
        applicant_name: "DOW HYDROCARBONS AND RESOURCES LLC",
        county: "Brazoria County",
        program_area: "WQ",
        item_status: "open",
        tceq_docket_number: "2026-001234-WQ",
        soah_docket_number: "582-26-1234",
        filing_counts: {
          comments: 1,
          hearing_requests: 1,
          public_meeting_requests: 1,
        },
        named_filing_orgs: ["Public Citizen", "Sierra Club Lone Star Chapter"],
        latest_filed_at: "2026-04-03",
      },
    ]);
    expect(JSON.stringify(result.data)).not.toContain("EVGENIA");
  });

  it("scores protest density and returns the standard response envelope", async () => {
    const deps = {
      loadCidData: async () => ({
        cases: [
          {
            tceqId: "WQ1",
            applicantName: "Dow",
            county: "Brazoria County",
            programArea: "WQ",
            itemStatus: "open",
            tceqDocketNumber: null,
            soahDocketNumber: "582-26-1234",
            regulatedEntityNumber: null,
            customerNumber: null,
          },
          {
            tceqId: "WQ2",
            applicantName: "Big Rock",
            county: "Comal County",
            programArea: "APO",
            itemStatus: "open",
            tceqDocketNumber: null,
            soahDocketNumber: null,
            regulatedEntityNumber: null,
            customerNumber: null,
          },
        ],
        protests: [
          {
            tceqId: "WQ1",
            filingType: "hearing_request",
            filerOrganization: "Public Citizen",
            filedAt: "2026-04-03",
          },
          {
            tceqId: "WQ2",
            filingType: "comment",
            filerOrganization: null,
            filedAt: "2026-04-04",
          },
        ],
        generatedAt: "2026-05-08T00:00:00.000Z",
        cacheState: "snapshot",
      }),
    };
    const handlers = createAtlasTxMcpHandlers(deps);

    const result = await handlers.score_protest_density({ scope: "county", limit: 2 });

    expect(result.cache_state).toBe("snapshot");
    expect(result.generated_at).toBe("2026-05-08T00:00:00.000Z");
    expect(result.sources.map((s) => s.dataset_id)).toEqual([
      "tceq-cid-search-one",
      "tceq-cid-search-two",
      "census-acs5-2023-county",
    ]);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]?.county).toBe("Brazoria County");
    expect(result.data[0]?.components.soah_case_count).toBe(1);

    const dispatched = await runAtlasTxTool('score_protest_density', { scope: 'county', limit: 1 }, deps);
    expect(dispatched.data).toHaveLength(1);
    expect(dispatched.data[0]?.county).toBe('Brazoria County');
  });

  it("lists permit filing red flags with explainable reasons", async () => {
    const handlers = createAtlasTxMcpHandlers({
      loadPermitPageData: async () => ({
        generatedAt: "2026-05-10T00:00:00.000Z",
        cacheState: "snapshot",
        permits: [
          {
            permitNumber: "WQ0001",
            authorizationType: "IND WW",
            authorizationStatus: "PENDING",
            permitteeName: "Alpha Water LLC",
            county: "Travis County",
            nearestCity: "Austin",
            latitude: 30.27,
            longitude: -97.74,
          },
          {
            permitNumber: "WQ0002",
            authorizationType: "IND WW",
            authorizationStatus: "PENDING",
            permitteeName: "Alpha Water LLC",
            county: "Travis County",
            nearestCity: "Austin",
            latitude: 30.28,
            longitude: -97.75,
          },
        ],
        cidSummary: {
          available: true,
          generatedAt: "2026-05-09T00:00:00.000Z",
          openCaseCount: 1,
          protestedCaseCount: 1,
          hearingRequestCount: 1,
          publicMeetingRequestCount: 0,
          caveats: ["CID Search One is fragile; treat this lane as best-effort procedural context."],
          topProgramAreas: [{ programArea: "WQ", count: 1 }],
          cases: [
            {
              tceqId: "WQ0000447000",
              applicantName: "Alpha Water LLC",
              county: "Travis County",
              programArea: "WQ",
              itemStatus: "open",
              tceqDocketNumber: "2026-001",
              soahDocketNumber: "582-26-0001",
              regulatedEntityNumber: null,
              customerNumber: null,
              filingCounts: { comments: 1, hearingRequests: 1, publicMeetingRequests: 0 },
              latestFiledAt: "2026-04-04",
            },
          ],
        },
      }),
    });

    const result = await handlers.list_permit_filing_red_flags({ county: "Travis County" });

    expect(result.cache_state).toBe("snapshot");
    expect(result.data[0]?.tceq_id).toBe("WQ0000447000");
    expect(result.data[0]?.reasons).toContain("SOAH docket present");
    expect(result.data[0]?.reasons).toContain("1 hearing request filed");
    expect(result.data[0]?.reasons).toContain("2 pending permits in Travis County");
  });

  it("builds a permit protest prep pack without naming individual commenters", async () => {
    const deps = {
      loadPermitPageData: async () => ({
        generatedAt: "2026-05-10T00:00:00.000Z",
        cacheState: "snapshot",
        permits: [
          {
            permitNumber: "WQ0001",
            authorizationType: "IND WW",
            authorizationStatus: "PENDING",
            permitteeName: "Alpha Water LLC",
            county: "Travis County",
            nearestCity: "Austin",
            latitude: 30.27,
            longitude: -97.74,
          },
        ],
        cidSummary: {
          available: true,
          generatedAt: "2026-05-09T00:00:00.000Z",
          openCaseCount: 1,
          protestedCaseCount: 1,
          hearingRequestCount: 1,
          publicMeetingRequestCount: 0,
          caveats: ["CID Search One is fragile; treat this lane as best-effort procedural context."],
          topProgramAreas: [{ programArea: "WQ", count: 1 }],
          cases: [
            {
              tceqId: "WQ0000447000",
              applicantName: "Alpha Water LLC",
              county: "Travis County",
              programArea: "WQ",
              itemStatus: "open",
              tceqDocketNumber: "2026-001",
              soahDocketNumber: "582-26-0001",
              regulatedEntityNumber: null,
              customerNumber: null,
              filingCounts: { comments: 1, hearingRequests: 1, publicMeetingRequests: 0 },
              latestFiledAt: "2026-04-04",
            },
          ],
        },
      }),
    };
    const handlers = createAtlasTxMcpHandlers(deps);

    const result = await handlers.build_permit_protest_prep({ tceq_id: "WQ0000447000" });

    expect(result.data.tceq_id).toBe("WQ0000447000");
    expect(result.data.participation_status).toContain("Request a contested case hearing");
    expect(result.data.evidence_checklist).toContain("Describe how the filing affects Travis County or nearby neighborhoods.");
    expect(result.data.draft_text).toContain("I am submitting this comment regarding TCEQ ID WQ0000447000");
    expect(result.data.export_text).toContain("Top visible red flags:");

    const dispatched = await runAtlasTxTool("build_permit_protest_prep", { tceq_id: "WQ0000447000" }, deps);
    expect(dispatched.data.tceq_id).toBe("WQ0000447000");
  });

  it("returns pipeline health from the staged refresh report artifact", async () => {
    const deps = {
      loadPipelineHealthReport: async () => ({
        generatedAt: "2026-05-10T03:00:00.000Z",
        overallStatus: "degraded",
        steps: [
          {
            stepId: "refresh-twdb-hydrology",
            status: "ok",
            startedAt: "2026-05-10T03:00:00.000Z",
            endedAt: "2026-05-10T03:00:05.000Z",
            durationMs: 5000,
            outputPath: "public/cache/twdb-hydrology.json",
            notes: ["completed refresh-twdb-hydrology"],
          },
          {
            stepId: "refresh-cid",
            status: "failed",
            startedAt: "2026-05-10T03:05:00.000Z",
            endedAt: "2026-05-10T03:05:10.000Z",
            durationMs: 10000,
            outputPath: null,
            notes: ["CID browser fallback used after Search One error page", "CID Search One returned the upstream error page"],
          },
        ],
      }),
    };
    const handlers = createAtlasTxMcpHandlers(deps);

    const result = await handlers.get_pipeline_health();

    expect(result.cache_state).toBe("snapshot");
    expect(result.generated_at).toBe("2026-05-10T03:00:00.000Z");
    expect(result.data.overall_status).toBe("degraded");
    expect(result.data.last_successful_run_at).toBe("2026-05-10T03:00:00.000Z");
    expect(result.data.cid.browser_fallback_used).toBe(true);
    expect(result.data.cid.status).toBe("failed");
    expect(result.data.stale_steps).toEqual(["refresh-cid"]);
    expect(result.data.steps[1]?.notes).toContain("CID browser fallback used after Search One error page");

    const dispatched = await runAtlasTxTool("get_pipeline_health", {}, deps);
    expect(dispatched.data.cid.browser_fallback_used).toBe(true);
  });

  it("returns permit filing detail context for one tceq id", async () => {
    const deps = {
      loadPermitPageData: async () => ({
        generatedAt: "2026-05-10T00:00:00.000Z",
        cacheState: "snapshot",
        permits: [
          {
            permitNumber: "WQ0001",
            authorizationType: "IND WW",
            authorizationStatus: "PENDING",
            permitteeName: "Alpha Water LLC",
            county: "Travis County",
            nearestCity: "Austin",
            latitude: 30.27,
            longitude: -97.74,
          },
          {
            permitNumber: "WQ0002",
            authorizationType: "IND WW",
            authorizationStatus: "PENDING",
            permitteeName: "Alpha Water LLC",
            county: "Travis County",
            nearestCity: "Austin",
            latitude: 30.28,
            longitude: -97.75,
          },
        ],
        cidSummary: {
          available: true,
          generatedAt: "2026-05-09T00:00:00.000Z",
          openCaseCount: 1,
          protestedCaseCount: 1,
          hearingRequestCount: 1,
          publicMeetingRequestCount: 0,
          caveats: ["CID Search One is fragile; treat this lane as best-effort procedural context."],
          topProgramAreas: [{ programArea: "WQ", count: 1 }],
          cases: [
            {
              tceqId: "WQ0000447000",
              applicantName: "Alpha Water LLC",
              county: "Travis County",
              programArea: "WQ",
              itemStatus: "open",
              tceqDocketNumber: "2026-001",
              soahDocketNumber: "582-26-0001",
              regulatedEntityNumber: null,
              customerNumber: null,
              filingCounts: { comments: 1, hearingRequests: 1, publicMeetingRequests: 0 },
              latestFiledAt: "2026-04-04",
            },
          ],
        },
      }),
    };
    const handlers = createAtlasTxMcpHandlers(deps);

    const result = await handlers.get_permit_filing_detail({ tceq_id: "WQ0000447000" });

    expect(result.generated_at).toBe("2026-05-10T00:00:00.000Z");
    expect(result.data.tceq_id).toBe("WQ0000447000");
    expect(result.data.procedural_status.soah_docket_number).toBe("582-26-0001");
    expect(result.data.county_permit_count).toBe(2);
    expect(result.data.related_permits.map((row) => row.permit_number)).toEqual(["WQ0001", "WQ0002"]);
    expect(result.data.red_flag.reasons).toContain("SOAH docket present");
    expect(result.data.red_flag.reasons).toContain("2 pending permits in Travis County");

    const dispatched = await runAtlasTxTool("get_permit_filing_detail", { tceq_id: "WQ0000447000" }, deps);
    expect(dispatched.data.related_permits).toHaveLength(2);
  });

  it("lists county pending fights ranked by procedural pressure", async () => {
    const deps = {
      loadPermitPageData: async () => ({
        generatedAt: "2026-05-10T00:00:00.000Z",
        cacheState: "snapshot",
        permits: [
          {
            permitNumber: "WQ0001",
            authorizationType: "IND WW",
            authorizationStatus: "PENDING",
            permitteeName: "Alpha Water LLC",
            county: "Travis County",
            nearestCity: "Austin",
            latitude: 30.27,
            longitude: -97.74,
          },
          {
            permitNumber: "WQ0002",
            authorizationType: "IND WW",
            authorizationStatus: "PENDING",
            permitteeName: "Beta Ops",
            county: "Travis County",
            nearestCity: "Austin",
            latitude: 30.21,
            longitude: -97.70,
          },
          {
            permitNumber: "WQ0003",
            authorizationType: "IND WW",
            authorizationStatus: "PENDING",
            permitteeName: "Gamma Water",
            county: "Travis County",
            nearestCity: "Austin",
            latitude: 30.20,
            longitude: -97.71,
          },
        ],
        cidSummary: {
          available: true,
          generatedAt: "2026-05-09T00:00:00.000Z",
          openCaseCount: 2,
          protestedCaseCount: 2,
          hearingRequestCount: 2,
          publicMeetingRequestCount: 1,
          caveats: ["CID Search One is fragile; treat this lane as best-effort procedural context."],
          topProgramAreas: [{ programArea: "WQ", count: 2 }],
          cases: [
            {
              tceqId: "WQ0000447000",
              applicantName: "Alpha Water LLC",
              county: "Travis County",
              programArea: "WQ",
              itemStatus: "open",
              tceqDocketNumber: "2026-001",
              soahDocketNumber: "582-26-0001",
              regulatedEntityNumber: null,
              customerNumber: null,
              filingCounts: { comments: 1, hearingRequests: 1, publicMeetingRequests: 1 },
              latestFiledAt: "2026-04-04",
            },
            {
              tceqId: "WQ0000447001",
              applicantName: "Beta Ops",
              county: "Travis County",
              programArea: "WQ",
              itemStatus: "open",
              tceqDocketNumber: "2026-002",
              soahDocketNumber: null,
              regulatedEntityNumber: null,
              customerNumber: null,
              filingCounts: { comments: 0, hearingRequests: 1, publicMeetingRequests: 0 },
              latestFiledAt: "2026-04-03",
            },
          ],
        },
      }),
    };
    const handlers = createAtlasTxMcpHandlers(deps);

    const result = await handlers.list_county_pending_fights({ county: "Travis County", limit: 5 });

    expect(result.generated_at).toBe("2026-05-10T00:00:00.000Z");
    expect(result.data).toHaveLength(2);
    expect(result.data[0]?.tceq_id).toBe("WQ0000447000");
    expect(result.data[0]?.procedural_pressure_score).toBeGreaterThan(result.data[1]?.procedural_pressure_score ?? 0);
    expect(result.data[0]?.county_permit_count).toBe(3);
    expect(result.data[0]?.filing_counts.public_meeting_requests).toBe(1);
    expect(result.data[1]?.named_filing_orgs).toEqual([]);

    const dispatched = await runAtlasTxTool("list_county_pending_fights", { county: "Travis County", limit: 1 }, deps);
    expect(dispatched.data).toHaveLength(1);
    expect(dispatched.data[0]?.tceq_id).toBe("WQ0000447000");
  });

  it("composes a county water-risk summary with DWRS + analytics + optional APD", async () => {
    const sdwisRows = [
      {
        pwsid: "TX0000001",
        pwsName: "Comal Public Water",
        county: "Comal County",
        populationServed: 50000,
        violationId: "V1",
        violationCode: "MCL",
        violationCategory: "TT",
        isHealthBased: true,
        contaminantCode: "1005",
        complianceStatusCode: "open",
        complPerBeginDate: "2026-04-01",
        complPerEndDate: null,
        pwsTypeCode: "CWS",
        ruleCode: null,
        ruleGroupCode: null,
        publicNotificationTier: 1,
      },
      {
        pwsid: "TX0000002",
        pwsName: "Travis Water",
        county: "Travis County",
        populationServed: 1000,
        violationId: "V2",
        violationCode: "MON",
        violationCategory: "MRDL",
        isHealthBased: true,
        contaminantCode: "2000",
        complianceStatusCode: "open",
        complPerBeginDate: "2026-03-01",
        complPerEndDate: null,
        pwsTypeCode: "CWS",
        ruleCode: null,
        ruleGroupCode: null,
        publicNotificationTier: 2,
      },
    ];

    const cidFixture = {
      cases: [
        {
          tceqId: "WQ1",
          applicantName: "Comal Industrial",
          county: "Comal County",
          programArea: "WQ",
          itemStatus: "open",
          tceqDocketNumber: null,
          soahDocketNumber: "582-26-1234",
          regulatedEntityNumber: null,
          customerNumber: null,
        },
      ],
      protests: [
        {
          tceqId: "WQ1",
          filingType: "hearing_request",
          filerOrganization: "Public Citizen",
          filedAt: "2026-04-03",
        },
      ],
      generatedAt: "2026-05-09T00:00:00.000Z",
      cacheState: "snapshot" as const,
    };

    const deps = {
      loadSdwisData: async () => ({
        rows: sdwisRows,
        generatedAt: "2026-05-08T00:00:00.000Z",
        cacheState: "snapshot",
        caveats: [],
      }),
      loadAnalyticsArtifacts: async () => ANALYTICS_FIXTURE,
      loadCidData: async () => cidFixture,
      loadCountyPopulation: async () => ({ "Comal County": 180000 }),
    };
    const handlers = createAtlasTxMcpHandlers(deps);

    const result = await handlers.summarize_water_risk_for_county({
      county: "Comal County",
      include_protest_density: true,
      max_words: 80,
    });

    expect(result.cache_state).toBe("snapshot");
    expect(result.data.county).toBe("Comal County");
    expect(result.data.headline).toContain("risk 6.07");
    expect(result.data.headline).toContain("pressure 3.09");
    expect(result.data.top_pws[0]?.pws_id).toBe("TX0000001");
    expect(result.data.top_block_groups).toEqual([]);
    expect(result.data.protest_density?.open_case_count).toBe(1);
    expect(result.sources.map((s) => s.dataset_id)).toEqual(
      expect.arrayContaining([
        "epa-sdwis-violations",
        "tceq-swq-segments",
        "tceq-cid-search-one",
        "tceq-cid-search-two",
        "census-acs5-2023-county",
      ]),
    );
    expect(result.caveats.some((c) => c.includes("EJ"))).toBe(true);

    const noProtest = await handlers.summarize_water_risk_for_county({ county: "Comal County" });
    expect(noProtest.data).not.toHaveProperty("protest_density");

    const dispatched = await runAtlasTxTool(
      "summarize_water_risk_for_county",
      { county: "Comal County" },
      deps,
    );
    expect(dispatched.data.county).toBe("Comal County");
  });
});
