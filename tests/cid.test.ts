import { describe, expect, it, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  fetchCidSearchOneHtml,
  fetchCidSearchTwoHtml,
  parseCidCasesHtml,
  parseCidProtestsHtml,
} from "@/lib/datasets/cid";

const here = path.dirname(fileURLToPath(import.meta.url));
const searchOneFixture = readFileSync(
  path.join(here, "fixtures", "cid", "search-one-sample.html"),
  "utf8",
);
const searchTwoFixture = readFileSync(
  path.join(here, "fixtures", "cid", "search-two-sample.html"),
  "utf8",
);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parseCidCasesHtml", () => {
  it("extracts normalized case metadata rows from Search One results", () => {
    const rows = parseCidCasesHtml(searchOneFixture);

    expect(rows).toEqual([
      {
        tceqId: "WQ0000447000",
        applicantName: "DOW HYDROCARBONS AND RESOURCES LLC",
        county: "Brazoria County",
        programArea: "WQ",
        itemStatus: "open",
        tceqDocketNumber: "2026-001234-WQ",
        soahDocketNumber: "582-26-1234",
        regulatedEntityNumber: "RN102345678",
        customerNumber: "CN600123456",
      },
      {
        tceqId: "APO0009876",
        applicantName: "BIG ROCK LLC",
        county: null,
        programArea: "APO",
        itemStatus: "closed",
        tceqDocketNumber: null,
        soahDocketNumber: null,
        regulatedEntityNumber: null,
        customerNumber: null,
      },
    ]);
  });
});

describe("parseCidProtestsHtml", () => {
  it("extracts protest filings and maps filing types", () => {
    const rows = parseCidProtestsHtml(searchTwoFixture);

    expect(rows).toEqual([
      {
        tceqId: "WQ0000447000",
        filingType: "public_meeting_request",
        filerOrganization: "Sierra Club Lone Star Chapter",
        filedAt: "2026-04-10",
      },
      {
        tceqId: "WQ0000447000",
        filingType: "hearing_request",
        filerOrganization: "Public Citizen",
        filedAt: "2026-04-11",
      },
      {
        tceqId: "APO0009876",
        filingType: "comment",
        filerOrganization: null,
        filedAt: "2026-04-12",
      },
    ]);
  });
});

describe("CID live fetch helpers", () => {
  it("warms a session cookie then posts Search One criteria with the expected payload", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("<html>search form</html>", { status: 200 }))
      .mockResolvedValueOnce(new Response("<html>results</html>", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const html = await fetchCidSearchOneHtml({
      actions: "open",
      sort: "county",
      county: "111111111111156",
      programArea: "APO;Aggregate Production Operation Registration;NO_PARENT",
      resultsPerPage: 25,
      includeProtestants: true,
    });

    expect(html).toContain("results");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://www14.tceq.texas.gov/epic/eCID/index.cfm",
    );

    const [, postInit] = fetchMock.mock.calls[1] ?? [];
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://www14.tceq.texas.gov/epic/eCID/index.cfm?fuseaction=main.reportResults",
    );
    expect(postInit?.method).toBe("POST");

    const body = String(postInit?.body);
    expect(body).toContain("Actions=open");
    expect(body).toContain("Sort=county");
    expect(body).toContain("County=111111111111156");
    expect(body).toContain(
      "ProgramArea=APO%3BAggregate+Production+Operation+Registration%3BNO_PARENT",
    );
    expect(body).toContain("Results=25");
    expect(body).toContain("Protestants=YES");
    expect(postInit?.headers).toMatchObject({
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: "https://www14.tceq.texas.gov/epic/eCID/index.cfm",
    });
  });

  it("posts Search Two criteria with the expected payload", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("<html>search form</html>", { status: 200 }))
      .mockResolvedValueOnce(new Response("<html>results</html>", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const html = await fetchCidSearchTwoHtml({
      itemStatus: "open",
      organizationName: "Sierra Club",
      permitNumber: "WQ0000447000",
      resultsPerPage: 10,
    });

    expect(html).toContain("results");
    const [, postInit] = fetchMock.mock.calls[1] ?? [];
    const body = String(postInit?.body);

    expect(body).toContain("ItemStatus=open");
    expect(body).toContain("org_name=Sierra+Club");
    expect(body).toContain("permit_num=WQ0000447000");
    expect(body).toContain("IpResults=10");
    expect(body).toContain("Searchip=Search");
  });
});
