import { describe, expect, it } from "vitest";

import { createAtlasTxMcpHandlers, runAtlasTxTool } from "../packages/mcp-server/src/index.js";

describe("Atlas TX MCP handlers", () => {
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
});
