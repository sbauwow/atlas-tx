import { describe, expect, it } from "vitest";

import {
  buildDefaultCidRefreshPlan,
  buildCidRefreshSearchTwoParams,
  summarizeCidRefreshPlan,
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
});
