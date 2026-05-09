import { describe, expect, it } from "vitest";

import {
  buildDefaultCidRefreshPlan,
  buildCidRefreshSearchTwoParams,
  executeCidRefresh,
  summarizeCidRefreshPlan,
  writeCidRefreshSnapshots,
} from "../scripts/refresh-cid";

describe("refresh-cid planning", () => {
  it("builds a default statewide Search One chunk plan across counties and program areas", () => {
    const plan = buildDefaultCidRefreshPlan({
      counties: ["111111111111156", "111111111111211"],
      programAreas: [
        "APO;Aggregate Production Operation Registration;NO_PARENT",
        "WQ;Water Quality;PARENT",
      ],
      resultsPerPage: 25,
    });

    expect(plan).toHaveLength(4);
    expect(plan[0]).toMatchObject({
      county: "111111111111156",
      programArea: "APO;Aggregate Production Operation Registration;NO_PARENT",
      resultsPerPage: 25,
    });
    expect(plan[3]).toMatchObject({
      county: "111111111111211",
      programArea: "WQ;Water Quality;PARENT",
      resultsPerPage: 25,
    });
  });

  it("builds the broad Search Two params used for statewide protest refreshes", () => {
    expect(buildCidRefreshSearchTwoParams()).toEqual({
      itemStatus: "open",
      organizationName: "",
      permitNumber: "",
      firstName: "",
      lastName: "",
      resultsPerPage: 25,
    });
  });

  it("summarizes the refresh plan for operator visibility", () => {
    const summary = summarizeCidRefreshPlan({
      searchOnePlan: buildDefaultCidRefreshPlan({
        counties: ["111111111111156", "111111111111211"],
        programAreas: [
          "APO;Aggregate Production Operation Registration;NO_PARENT",
          "WQ;Water Quality;PARENT",
        ],
        resultsPerPage: 25,
      }),
      searchTwoParams: buildCidRefreshSearchTwoParams(),
    });

    expect(summary).toEqual({
      searchOneRequests: 4,
      uniqueCounties: 2,
      uniqueProgramAreas: 2,
      searchTwoResultsPerPage: 25,
    });
  });

  it("executes the refresh plan, dedupes rows, and builds snapshot payloads", async () => {
    const result = await executeCidRefresh({
      counties: ["111111111111156", "111111111111211"],
      programAreas: [
        "APO;Aggregate Production Operation Registration;NO_PARENT",
        "WQ;Water Quality;PARENT",
      ],
      resultsPerPage: 25,
      generatedAt: "2026-05-09T03:00:00.000Z",
      fetchSearchOneHtml: async (params) =>
        params.county === "111111111111156"
          ? "<html>search-one-comal</html>"
          : "<html>search-one-harris</html>",
      fetchSearchTwoHtml: async () => "<html>search-two</html>",
      parseSearchOneHtml: (html) =>
        html.includes("comal")
          ? [
              {
                tceqId: "APO0009876",
                applicantName: "BIG ROCK LLC",
                county: "Comal County",
                programArea: "APO",
                itemStatus: "open",
                tceqDocketNumber: null,
                soahDocketNumber: null,
                regulatedEntityNumber: null,
                customerNumber: null,
              },
            ]
          : [
              {
                tceqId: "WQ0000447000",
                applicantName: "DOW HYDROCARBONS AND RESOURCES LLC",
                county: "Harris County",
                programArea: "WQ",
                itemStatus: "open",
                tceqDocketNumber: "2026-001234-WQ",
                soahDocketNumber: "582-26-1234",
                regulatedEntityNumber: null,
                customerNumber: null,
              },
              {
                tceqId: "WQ0000447000",
                applicantName: "DOW HYDROCARBONS AND RESOURCES LLC",
                county: "Harris County",
                programArea: "WQ",
                itemStatus: "open",
                tceqDocketNumber: "2026-001234-WQ",
                soahDocketNumber: "582-26-1234",
                regulatedEntityNumber: null,
                customerNumber: null,
              },
            ],
      parseSearchTwoHtml: () => [
        {
          tceqId: "WQ0000447000",
          filingType: "hearing_request",
          filerOrganization: "Public Citizen",
          filedAt: "2026-04-03",
        },
        {
          tceqId: "WQ0000447000",
          filingType: "hearing_request",
          filerOrganization: "Public Citizen",
          filedAt: "2026-04-03",
        },
      ],
    });

    expect(result.caseRows).toHaveLength(2);
    expect(result.protestRows).toHaveLength(1);
    expect(result.caseSnapshot.rowCount).toBe(2);
    expect(result.protestSnapshot.rowCount).toBe(1);
    expect(result.caseSnapshot.rows[0]?.tceqId).toBe("APO0009876");
    expect(result.protestSnapshot.rows[0]?.tceqId).toBe("WQ0000447000");
    expect(result.summary).toEqual({
      searchOneRequests: 4,
      uniqueCounties: 2,
      uniqueProgramAreas: 2,
      searchTwoResultsPerPage: 25,
    });
  });

  it("writes case and protest snapshots to the requested paths", async () => {
    const writes: Array<{ path: string; content: string }> = [];

    await writeCidRefreshSnapshots(
      {
        caseSnapshot: {
          generatedAt: "2026-05-09T03:00:00.000Z",
          source: "search-one",
          rowCount: 1,
          rows: [{ tceqId: "APO1" }],
          caveats: ["case caveat"],
        },
        protestSnapshot: {
          generatedAt: "2026-05-09T03:00:00.000Z",
          source: "search-two",
          rowCount: 1,
          rows: [{ tceqId: "APO1" }],
          caveats: ["protest caveat"],
        },
      },
      {
        casePath: "public/cache/cid-cases-tx.json",
        protestPath: "public/cache/cid-protests-tx.json",
        writeFile: async (path, content) => {
          writes.push({ path, content });
        },
      },
    );

    expect(writes).toHaveLength(2);
    expect(writes[0]?.path).toBe("public/cache/cid-cases-tx.json");
    expect(writes[1]?.path).toBe("public/cache/cid-protests-tx.json");
    expect(JSON.parse(writes[0]?.content ?? "{}")).toMatchObject({ rowCount: 1 });
    expect(JSON.parse(writes[1]?.content ?? "{}")).toMatchObject({ rowCount: 1 });
  });
});
