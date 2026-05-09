import { describe, expect, it } from "vitest";

import { createAtlasTxMcpHandlers, runAtlasTxTool } from "../packages/mcp-server/src/index.js";

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
});
